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
        
        let message = `Oink oink! I'm Piggy, your AI agent who monitors your money!\n\n`
        
        // Personalized messages based on category and item
        if (prediction.category === 'Coffee' || prediction.item.toLowerCase().includes('starbucks') || prediction.item.toLowerCase().includes('coffee')) {
            message += `I noticed you're likely getting coffee soon! Instead of chain coffee shops, check out these local Princeton spots that are cheaper:\n\n`
            
            // Get local cheaper coffee spots near Princeton
            const coffeeResult = await searchNearbyPlaces('local independent coffee shops cheaper than Starbucks', 'Princeton NJ')
            if (coffeeResult.success) {
                message += `Affordable local options:\n\n`
                coffeeResult.places.forEach(p => {
                    message += `${p.rank}. ${p.name}\n${p.description.trim()}\n\n`
                })
                message += `Supporting local = saving money + better community! 🐷`
            }
        } else if (prediction.category === 'Entertainment' || prediction.item.toLowerCase().includes('netflix') || prediction.item.toLowerCase().includes('hulu') || prediction.item.toLowerCase().includes('disney')) {
            message += `I see you're about to renew ${prediction.item}!\n\n`
            
            if (prediction.item.toLowerCase().includes('netflix')) {
                message += `Quick thought: Maybe consider canceling Netflix for this month if you've only watched a few episodes? You could save that subscription fee and re-subscribe when you have more time to watch!\n\n`
                message += `Or, bundle Disney+ and Hulu together to save money if you use both!`
            } else if (prediction.item.toLowerCase().includes('disney') || prediction.item.toLowerCase().includes('hulu')) {
                message += `Pro tip: Bundle Disney+ and Hulu together! You'll save about $43.97 per year compared to paying separately. That's like 6 free coffees!`
            } else {
                message += `Have you been using it much? If not, maybe pause this month and save some cash!`
            }
        } else if (prediction.category === 'Groceries' || prediction.item.toLowerCase().includes('trader') || prediction.item.toLowerCase().includes('grocery')) {
            message += `Time for grocery shopping soon! Skip the expensive stores and save BIG at these spots:\n\n`
            
            message += `🏪 Budget-Friendly Options:\n\n`
            message += `1. Aldi - Up to 50% cheaper than traditional supermarkets! Same quality, way less money. They have locations in Lawrenceville and Hamilton.\n\n`
            message += `2. Dollar Tree - Everything is $1.25! Great for pantry staples, snacks, cleaning supplies. Location in Princeton Shopping Center.\n\n`
            message += `3. Lidl - Similar to Aldi, awesome deals on fresh produce and dairy. Check out the Hamilton location.\n\n`
            message += `Pro tip: Aldi's private label brands are often made by the same manufacturers as name brands - you're literally paying for the packaging at other stores! 💰`
        } else if (prediction.category === 'Transport' || prediction.item.toLowerCase().includes('uber') || prediction.item.toLowerCase().includes('lyft')) {
            message += `I see you might be taking a ride soon!\n\n`
            message += `Quick tip: Compare Uber vs Lyft prices before booking - sometimes one can be significantly cheaper! Or consider NJ Transit if you're going into the city.`
        } else {
            message += `I'm ${(prediction.confidence * 100).toFixed(0)}% confident you'll be purchasing "${prediction.item}" around ${new Date(prediction.next_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.\n\n`
            message += `Want me to find you better deals or cheaper alternatives nearby? Just let me know!`
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
