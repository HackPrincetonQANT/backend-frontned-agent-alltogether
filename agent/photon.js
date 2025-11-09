import { IMessageSDK } from '@photon-ai/imessage-kit'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs/promises'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const PORT = process.env.AGENT_PORT || 3001
const TEST_NUMBER = process.env.TEST_NUMBER || '+15514049519'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

// Express server for API endpoints
const app = express()
app.use(cors())
app.use(express.json())

const sdk = new IMessageSDK({
    debug: true,
    maxConcurrent: 5,
    watcher: {
        pollInterval: 3000,
        unreadOnly: false,
        excludeOwnMessages: true
    }
})

// FUNCTION 1: Send message
async function sendMessage(recipient, message) {
    try {
        await sdk.send(recipient, message)
        console.log(`[SEND] Message sent to ${recipient}`)
        return { success: true }
    } catch (error) {
        console.error(`[SEND ERROR] ${error.message}`)
        return { success: false, error: error.message }
    }
}

// FUNCTION 2: Parse receipt image
async function parseReceiptImage(imagePath) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
        const imageData = await fs.readFile(imagePath)
        const base64Image = imageData.toString('base64')

        const prompt = `Extract transaction data from this receipt. Return JSON only: {"store":"","location":"","items":[{"name":"","quantity":1,"price":10.99}],"total":10.99}`

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
        ])

        const text = result.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
        const data = JSON.parse(text)

        console.log(`[PARSE] Success - Store: ${data.store}, Total: $${data.total}`)
        return { success: true, data }
    } catch (error) {
        console.error(`[PARSE ERROR] ${error.message}`)
        return { success: false, error: error.message }
    }
}

// FUNCTION 2B: Save receipt to backend database
async function saveReceiptToBackend(receiptData, userId = 'u_demo_min') {
    try {
        console.log(`[SAVE] Sending receipt to backend for ${userId}`)
        
        const response = await fetch(`${BACKEND_URL}/api/receipt/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                ...receiptData
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Backend error: ${response.status} - ${errorText}`)
        }

        const result = await response.json()
        console.log(`[SAVE] Success - Saved ${result.transactions?.length || 0} transactions`)
        return { success: true, data: result }
    } catch (error) {
        console.error(`[SAVE ERROR] ${error.message}`)
        return { success: false, error: error.message }
    }
}

// FUNCTION 3: Search nearby places using Gemini with Google Search grounding
async function searchNearbyPlaces(query, location) {
    try {
        console.log(`[SEARCH] ${query} near ${location}`)

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            tools: [{ googleSearch: {} }]
        })
        
        const prompt = `Find 3 cheap ${query} near ${location}. 

List them as:
1. [Name] - [Price] - [One sentence why]
2. [Name] - [Price] - [One sentence why]
3. [Name] - [Price] - [One sentence why]

Just the numbered list, nothing else.`

        const result = await model.generateContent(prompt)
        let responseText = result.response.text()
        
        // Remove markdown formatting
        responseText = responseText
            .replace(/\*\*/g, '')  // Remove bold **
            .replace(/\*/g, '')    // Remove italic *
            .replace(/#{1,6}\s/g, '')  // Remove headers
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')  // Remove links, keep text
        
        console.log(`[SEARCH] Cleaned result:`, responseText)

        // Parse the result - extract numbered lines
        const places = []
        const lines = responseText.split('\n')

        for (const line of lines) {
            const match = line.match(/^\s*(\d+)[\.\)]\s*(.+)/)
            if (match) {
                const rank = parseInt(match[1])
                const content = match[2].trim()
                
                places.push({
                    rank: rank,
                    name: content.split('-')[0]?.trim() || content.substring(0, 50),
                    description: content,
                    url: ''
                })
            }
        }

        if (places.length === 0) {
            // Fallback: return raw text
            return {
                success: true,
                places: [{
                    rank: 1,
                    name: `${query} near ${location}`,
                    description: responseText.replace(/\n+/g, ' ').substring(0, 200),
                    url: ''
                }]
            }
        }

        console.log(`[SEARCH] Found ${places.length} places`)
        return { success: true, places: places.slice(0, 3) }
    } catch (error) {
        console.error(`[SEARCH ERROR] ${error.message}`)
        return { success: false, error: error.message }
    }
}

// FUNCTION 4: Send recommendation
async function sendRecommendation(recipient, query, location) {
    try {
        console.log(`[RECOMMENDATION] Searching for ${query} near ${location}`)
        
        const result = await searchNearbyPlaces(query, location)
        
        if (result.success) {
            let message = `Affordable ${query} near ${location}:\n\n`
            result.places.forEach(p => {
                message += `${p.rank}. ${p.name}\n${p.description.trim()}\n\n`
            })
            await sendMessage(recipient, message)
            console.log(`[RECOMMENDATION] Sent to ${recipient}`)
            return { success: true }
        } else {
            await sendMessage(recipient, `Sorry, couldn't find ${query} near ${location}`)
            return { success: false, error: result.error }
        }
    } catch (error) {
        console.error(`[RECOMMENDATION ERROR] ${error.message}`)
        return { success: false, error: error.message }
    }
}

// FUNCTION 5: Send prediction notification with personalized recommendations
async function sendPredictionNotification(recipient, prediction) {
    try {
        console.log(`[PREDICTION] Sending notification about ${prediction.item}`)
        
        let message = `Hey! Piggy here 🐷\n\n`
        
        // More human, conversational messages with cheaper alternatives
        if (prediction.category === 'Coffee' || prediction.item.toLowerCase().includes('starbucks') || prediction.item.toLowerCase().includes('coffee')) {
            message += `I noticed you usually grab coffee around this time. Quick idea - what if you hit up a cheaper spot instead?\n\n`
            message += `💰 Switch to these and save big:\n\n`
            message += `• Small World Coffee on Witherspoon - $3 lattes vs Starbucks' $5+\n`
            message += `• Whole Earth Center Cafe - great coffee, way cheaper\n`
            message += `• Even Dunkin is $2 cheaper per drink!\n\n`
            message += `Making this switch = getting one day closer to your savings goal! Every small change adds up 🎯`
            
        } else if (prediction.category === 'Entertainment' || prediction.item.toLowerCase().includes('netflix') || prediction.item.toLowerCase().includes('hulu') || prediction.item.toLowerCase().includes('spotify')) {
            
            if (prediction.item.toLowerCase().includes('netflix')) {
                message += `Your Netflix renewal is coming up soon!\n\n`
                message += `Real talk: if you've only watched 2-3 episodes this month, maybe skip it? You could save $23 right there.\n\n`
                message += `Or share an account with friends/family - split the cost = instant savings.\n\n`
                message += `That saved money = one day closer to your goal! 💪`
                
            } else if (prediction.item.toLowerCase().includes('disney') || prediction.item.toLowerCase().includes('hulu')) {
                message += `Subscription renewal coming up!\n\n`
                message += `Pro move: Get the Disney+Hulu bundle instead of separate subscriptions. You'll save like $12/month - that's $144/year!\n\n`
                message += `Switch now = get way closer to your savings target 🎯`
                
            } else if (prediction.item.toLowerCase().includes('spotify')) {
                message += `Spotify renewal coming!\n\n`
                message += `Student? Get Spotify Student - it's 50% off! That's $5.50/month instead of $10.99.\n\n`
                message += `Or split a Family plan with friends - works out to ~$3/person.\n\n`
                message += `Music is essential, but cheaper music is better music 🎵`
            }
            
        } else if (prediction.category === 'Food' || prediction.item.toLowerCase().includes('uber eats') || prediction.item.toLowerCase().includes('doordash')) {
            message += `Looks like you're about to order food delivery again!\n\n`
            message += `🍔 Here's the thing - delivery apps mark up prices AND charge fees. You're paying like 30-40% more.\n\n`
            message += `Try this instead:\n`
            message += `• Walk to Chipotle on Nassau St (5min)\n`
            message += `• Hit up Hoagie Haven (cash only, super cheap)\n`
            message += `• Or go crazy - cook at home with Aldi groceries\n\n`
            message += `Skip one delivery = $15 saved = one day closer to your goal! 💸`
            
        } else if (prediction.category === 'Groceries' || prediction.item.toLowerCase().includes('trader') || prediction.item.toLowerCase().includes('grocery')) {
            message += `Grocery shopping time!\n\n`
            message += `💡 Skip Trader Joe's and go to ALDI instead:\n\n`
            message += `Same quality stuff (literally same manufacturers), but 40-60% cheaper. Your $100 grocery bill becomes $60.\n\n`
            message += `Locations:\n`
            message += `• Aldi Lawrence (20min)\n`
            message += `• Aldi Hamilton (25min)\n\n`
            message += `One Aldi trip = $40 saved = getting WAY closer to your goal! 🎯`
            
        } else if (prediction.category === 'Transport' || prediction.item.toLowerCase().includes('uber') || prediction.item.toLowerCase().includes('lyft')) {
            message += `About to call an Uber?\n\n`
            message += `🚌 Real talk - try these cheaper options:\n\n`
            message += `• TigerTransit (FREE!) - goes all over campus\n`
            message += `• NJ Transit - like $8 to NYC vs $60+ Uber\n`
            message += `• Walk if it's under 15min (free + exercise!)\n\n`
            message += `Skip the Uber = $30 saved = one ride closer to your savings goal! 💪`
            
        } else {
            message += `I'm predicting you'll buy "${prediction.item}" soon.\n\n`
            message += `Want me to find you cheaper alternatives? Every dollar you save gets you one day closer to hitting your savings goal!\n\n`
            message += `Just reply and I'll find you the best deals 🎯`
        }

        await sendMessage(recipient, message)
        console.log(`[PREDICTION] Notification sent to ${recipient}`)
        return { success: true }
    } catch (error) {
        console.error(`[PREDICTION ERROR] ${error.message}`)
        return { success: false, error: error.message }
    }
}

// API ENDPOINTS
app.post('/api/ping-prediction', async (req, res) => {
    try {
        const { prediction, userId } = req.body
        
        if (!prediction) {
            return res.status(400).json({ error: 'Missing prediction data' })
        }

        console.log(`[API] Ping prediction request for ${prediction.item}`)
        
        // Send iMessage notification
        const result = await sendPredictionNotification(TEST_NUMBER, prediction)
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Notification sent via iMessage',
                prediction: prediction.item
            })
        } else {
            res.status(500).json({ 
                success: false, 
                error: result.error 
            })
        }
    } catch (error) {
        console.error('[API ERROR]', error)
        res.status(500).json({ error: error.message })
    }
})

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Piggy agent is running' })
})

// Start HTTP server
app.listen(PORT, () => {
    console.log(`[API] Piggy agent API listening on port ${PORT}`)
})

// Start bot
console.log('[START] Piggy bot initialized\n')

// Don't send intro messages automatically - only respond to user requests

await sdk.startWatching({
    onNewMessage: async (msg) => {
        console.log(`\n[MSG] From: ${msg.sender}`)
        console.log(`[MSG] Attachments: ${msg.attachments?.length || 0}`)
        
        // Only handle images (receipts)
        if (msg.attachments?.length > 0) {
            for (const att of msg.attachments) {
                if (att.mimeType?.startsWith('image/')) {
                    console.log('[IMAGE] Processing receipt')
                    const result = await parseReceiptImage(att.path)
                    
                    if (result.success) {
                        const d = result.data
                        
                        // Save to database
                        const saveResult = await saveReceiptToBackend(d)
                        
                        let resp = `Oink oink! I've analyzed your receipt!\n\n`
                        if (d.store) resp += `Store: ${d.store}\n`
                        if (d.location) resp += `Location: ${d.location}\n\n`
                        
                        if (saveResult.success) {
                            const saved = saveResult.data
                            resp += `Saved to your spending tracker!\n\n`
                            resp += `📊 Summary:\n`
                            resp += `- ${saved.transactions.length} item(s) added\n`
                            resp += `- Total: $${saved.total_amount.toFixed(2)}\n\n`
                            
                            if (saved.transactions.length > 0) {
                                resp += `Categories:\n`
                                saved.transactions.forEach((t, i) => {
                                    resp += `${i + 1}. ${t.item} - $${t.amount.toFixed(2)} (${t.category})\n`
                                })
                            }
                        } else {
                            // Fallback if save failed
                            if (d.items?.length > 0) {
                                resp += `Items:\n`
                                d.items.forEach((item, i) => {
                                    resp += `${i + 1}. ${item.name} - Qty: ${item.quantity} x $${item.price.toFixed(2)}\n`
                                })
                                resp += `\nTotal: $${d.total.toFixed(2)}\n\n`
                                resp += `Note: I had trouble saving this to your tracker. Try again later!`
                            }
                        }
                        
                        await sendMessage(msg.sender, resp)
                    } else {
                        await sendMessage(msg.sender, `Oink oink! I had trouble reading that receipt. Could you try taking a clearer photo?`)
                    }
                }
            }
        }
    },
    
    onError: (error) => {
        console.error('[ERROR]', error.message)
    }
})

process.on('SIGINT', async () => {
    console.log('\n[STOP] Shutting down')
    sdk.stopWatching()
    await sdk.close()
    process.exit(0)
})
