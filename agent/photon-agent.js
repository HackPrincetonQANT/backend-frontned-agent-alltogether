// Smart Piggy Agent - Combines OpenAI conversational AI with Gemini receipt parsing
import { IMessageSDK } from '@photon-ai/imessage-kit'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs/promises'
import dotenv from 'dotenv'
import { chat, clearHistory } from './aiAgent.js'
import { healthCheck } from './dbClient.js'

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const sdk = new IMessageSDK({
    debug: true,
    maxConcurrent: 5,
    watcher: {
        pollInterval: 3000,
        unreadOnly: false,
        excludeOwnMessages: true
    }
})

// User ID mapping - in production, this would be from Clerk or database
// For now, we'll use phone number as user ID
function getUserId(phoneNumber) {
    // Clean phone number to use as user ID
    return phoneNumber.replace(/[^0-9]/g, '')
}

// FUNCTION: Send message
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

// FUNCTION: Parse receipt image with Gemini
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

        console.log(`[PARSE] Success`)
        return { success: true, data }
    } catch (error) {
        console.error(`[PARSE ERROR] ${error.message}`)
        return { success: false, error: error.message }
    }
}

// FUNCTION: Handle text message with OpenAI conversational AI
async function handleTextMessage(text, sender) {
    try {
        const userId = getUserId(sender)

        // Special commands
        if (text.toLowerCase().includes('clear history') || text.toLowerCase().includes('reset')) {
            clearHistory(userId)
            return {
                success: true,
                message: 'Conversation history cleared! Let\'s start fresh.'
            }
        }

        // Use OpenAI conversational AI
        console.log(`[TEXT] Processing: "${text}"`)
        const response = await chat(text, userId)

        return response
    } catch (error) {
        console.error(`[TEXT ERROR] ${error.message}`)
        return {
            success: false,
            message: `Sorry, I encountered an error: ${error.message}`
        }
    }
}

// FUNCTION: Handle receipt image
async function handleReceiptImage(imagePath, sender) {
    try {
        console.log('[IMAGE] Processing receipt')
        const result = await parseReceiptImage(imagePath)

        if (result.success) {
            const d = result.data
            let resp = `[NOTE] Receipt Analysis\n\n`
            if (d.store) resp += `[STORE] Store: ${d.store}\n`
            if (d.location) resp += `[LOCATION] Location: ${d.location}\n\n`
            if (d.items?.length > 0) {
                resp += `[ITEMS] Items:\n`
                d.items.forEach((item, i) => {
                    resp += `${i + 1}. ${item.name} - Qty: ${item.quantity} x $${item.price.toFixed(2)}\n`
                })
                resp += `\n[MONEY] Total: $${d.total.toFixed(2)}\n\n`
                resp += `[TIP] Type "Is this a good deal?" to get my opinion!`
            }

            return {
                success: true,
                message: resp,
                data: d
            }
        } else {
            return {
                success: false,
                message: 'Sorry, I couldn\'t read that receipt. Could you try taking a clearer photo?'
            }
        }
    } catch (error) {
        console.error(`[IMAGE ERROR] ${error.message}`)
        return {
            success: false,
            message: `Sorry, I had trouble processing that image: ${error.message}`
        }
    }
}

// Start bot
console.log('[START] [PIGGY] Smart Piggy bot initializing...\n')

// Check database connection
console.log('[HEALTH] Checking database connection...')
const dbHealth = await healthCheck()
if (dbHealth.success) {
    console.log('[HEALTH] [OK] Database connected:', dbHealth.data)
} else {
    console.log('[HEALTH] [WARNING]  Database not available:', dbHealth.error)
    console.log('[HEALTH] Running in limited mode (receipt parsing only)')
}

const TEST_NUMBER = process.env.TEST_NUMBER || '+15514049519'

// Send welcome message
await sendMessage(TEST_NUMBER, `👋 Hi! I'm Smart Piggy, your AI financial assistant!

I can help you:
💬 Answer questions about your spending
[STATS] Show category breakdowns
[PREDICT] Predict future purchases
📸 Analyze receipts

Try asking me:
• "How much did I spend this month?"
• "What are my top categories?"
• "Any advice for me?"

Or send me a receipt photo!`)

// Start watching for messages
await sdk.startWatching({
    onNewMessage: async (msg) => {
        console.log(`\n[MSG] From: ${msg.sender}`)

        try {
            // Handle images (receipts)
            if (msg.attachments?.length > 0) {
                for (const att of msg.attachments) {
                    if (att.mimeType?.startsWith('image/')) {
                        const result = await handleReceiptImage(att.path, msg.sender)
                        if (result.message) {
                            await sendMessage(msg.sender, result.message)
                        }
                    }
                }
            }
            // Handle text messages
            else if (msg.text && msg.text.trim()) {
                const result = await handleTextMessage(msg.text.trim(), msg.sender)
                if (result.message) {
                    await sendMessage(msg.sender, result.message)
                }
            }
        } catch (error) {
            console.error('[MESSAGE HANDLER ERROR]', error)
            await sendMessage(
                msg.sender,
                'Sorry, I encountered an unexpected error. Please try again!'
            )
        }
    },

    onError: (error) => {
        console.error('[WATCHER ERROR]', error.message)
    }
})

console.log('\n[RUNNING] [PIGGY] Smart Piggy is now listening for messages...')
console.log('[INFO] Press Ctrl+C to stop\n')

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[STOP] Shutting down Smart Piggy...')
    sdk.stopWatching()
    await sdk.close()
    console.log('[STOP] Goodbye! 👋')
    process.exit(0)
})