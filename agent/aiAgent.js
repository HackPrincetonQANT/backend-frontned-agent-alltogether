// AI Agent - OpenAI conversational interface with database access
import OpenAI from 'openai'
import dotenv from 'dotenv'
import * as db from './dbClient.js'

dotenv.config()

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

// Conversation memory - stores message history per user
const conversationHistory = new Map()

/**
 * OpenAI Function Tools - These allow the AI to call database functions
 */
const tools = [
    {
        type: 'function',
        function: {
            name: 'get_recent_transactions',
            description: 'Get the user\'s recent transaction history. Use this when the user asks about recent purchases, spending, or what they bought.',
            parameters: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Maximum number of transactions to return (default: 10)',
                        default: 10
                    }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_category_stats',
            description: 'Get spending statistics broken down by category. Use this when the user asks about spending by category, top categories, or comparisons between categories.',
            parameters: {
                type: 'object',
                properties: {
                    days: {
                        type: 'number',
                        description: 'Number of days to look back (default: 30)',
                        default: 30
                    }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_predictions',
            description: 'Get predictions for when the user will likely make their next purchases. Use this when the user asks about future spending, upcoming purchases, or predictions.',
            parameters: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Maximum number of predictions to return (default: 5)',
                        default: 5
                    }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_spending_summary',
            description: 'Get a comprehensive summary of the user\'s spending including total spent, transaction count, and top category. Use this for general spending questions or summaries.',
            parameters: {
                type: 'object',
                properties: {
                    days: {
                        type: 'number',
                        description: 'Number of days to look back (default: 30)',
                        default: 30
                    }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_ai_coach',
            description: 'Get AI-powered financial coaching and recommendations based on the user\'s spending patterns. Use this when the user asks for advice, tips, or recommendations.',
            parameters: {
                type: 'object',
                properties: {
                    limit: {
                        type: 'number',
                        description: 'Max predictions to consider for coaching (default: 3)',
                        default: 3
                    }
                }
            }
        }
    }
]

/**
 * Execute function calls made by OpenAI
 */
async function executeFunction(functionName, args, userId) {
    console.log(`[AI AGENT] Executing function: ${functionName} with args:`, args)

    switch (functionName) {
        case 'get_recent_transactions':
            return await db.getRecentTransactions(userId, args.limit || 10)

        case 'get_category_stats':
            return await db.getCategoryStats(userId, args.days || 30)

        case 'get_predictions':
            return await db.getPredictions(userId, args.limit || 5)

        case 'get_spending_summary':
            return await db.getSpendingSummary(userId, args.days || 30)

        case 'get_ai_coach':
            return await db.getAICoach(userId, args.limit || 3)

        default:
            return {
                success: false,
                error: `Unknown function: ${functionName}`
            }
    }
}

/**
 * Get conversation history for a user
 */
function getConversationHistory(userId) {
    if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, [
            {
                role: 'system',
                content: `You are Piggy, a friendly and helpful financial assistant. You help users understand their spending habits, make better financial decisions, and save money.

Key personality traits:
- Friendly and supportive (never judgmental)
- Concise (keep responses short and to the point)
- Helpful (proactively offer insights)
- Smart (use data to back up recommendations)

You have access to the user's:
- Recent transactions
- Spending by category
- Predictions for future purchases
- Overall spending patterns

When giving advice:
1. Use specific data from their transactions
2. Be encouraging about good habits
3. Gently suggest improvements for bad habits
4. Keep responses under 3 sentences when possible
5. Use emojis sparingly (only for emphasis)

Remember: You're their financial buddy, not a stern accountant!`
            }
        ])
    }
    return conversationHistory.get(userId)
}

/**
 * Add a message to conversation history
 */
function addToHistory(userId, role, content) {
    const history = getConversationHistory(userId)
    history.push({ role, content })

    // Keep only last 20 messages to avoid token limits
    if (history.length > 21) { // 1 system + 20 messages
        history.splice(1, history.length - 21)
    }
}

/**
 * Clear conversation history for a user
 */
export function clearHistory(userId) {
    conversationHistory.delete(userId)
    console.log(`[AI AGENT] Cleared history for ${userId}`)
}

/**
 * Main conversational function - handles user messages
 * @param {string} userMessage - The user's message
 * @param {string} userId - User ID for database queries
 */
export async function chat(userMessage, userId) {
    try {
        console.log(`[AI AGENT] Chat request from ${userId}: "${userMessage}"`)

        // Add user message to history
        addToHistory(userId, 'user', userMessage)

        const history = getConversationHistory(userId)

        // Call OpenAI with function calling enabled
        let response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: history,
            tools: tools,
            tool_choice: 'auto'
        })

        let responseMessage = response.choices[0].message

        // Handle function calls
        const maxIterations = 5
        let iterations = 0

        while (responseMessage.tool_calls && iterations < maxIterations) {
            iterations++
            console.log(`[AI AGENT] Function call iteration ${iterations}`)

            // Add assistant's response to history (must be object with tool_calls)
            history.push(responseMessage)

            // Execute all function calls
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name
                const functionArgs = JSON.parse(toolCall.function.arguments)

                // Execute the function
                const functionResult = await executeFunction(functionName, functionArgs, userId)

                // Add function result to history
                history.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(functionResult)
                })
            }

            // Get next response from OpenAI
            response = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: history,
                tools: tools,
                tool_choice: 'auto'
            })

            responseMessage = response.choices[0].message
        }

        // Add final response to history
        if (responseMessage.content) {
            addToHistory(userId, 'assistant', responseMessage.content)
        }

        console.log(`[AI AGENT] Response: "${responseMessage.content}"`)

        return {
            success: true,
            message: responseMessage.content || 'I apologize, I could not generate a response.',
            functionCalls: response.choices[0].message.tool_calls?.length || 0
        }

    } catch (error) {
        console.error('[AI AGENT] Chat error:', error.message)
        return {
            success: false,
            message: `Sorry, I encountered an error: ${error.message}`,
            error: error.message
        }
    }
}

/**
 * Quick queries for common questions
 */
export const quickQueries = {
    summary: (userId) => chat('Give me a quick summary of my spending this month', userId),
    topCategories: (userId) => chat('What are my top spending categories?', userId),
    predictions: (userId) => chat('When will I likely make my next purchases?', userId),
    advice: (userId) => chat('Any advice on how I can save money?', userId)
}