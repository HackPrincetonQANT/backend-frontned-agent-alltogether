// Database API Client - connects to FastAPI backend
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const API_BASE_URL = process.env.DATABASE_API_URL || 'http://localhost:8000'

/**
 * Get recent transactions for a user
 * @param {string} userId - User ID
 * @param {number} limit - Max number of transactions (default: 20)
 */
export async function getRecentTransactions(userId, limit = 20) {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/user/${userId}/transactions`, {
            params: { limit }
        })
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('[DB CLIENT] getRecentTransactions error:', error.message)
        return {
            success: false,
            error: error.message,
            data: []
        }
    }
}

/**
 * Get category-level spending statistics
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back (default: 30)
 */
export async function getCategoryStats(userId, days = 30) {
    try {
        const response = await axios.get(`${API_BASE_URL}/stats/category`, {
            params: { user_id: userId, days }
        })
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('[DB CLIENT] getCategoryStats error:', error.message)
        return {
            success: false,
            error: error.message,
            data: []
        }
    }
}

/**
 * Get predictions for upcoming purchases
 * @param {string} userId - User ID
 * @param {number} limit - Max predictions (default: 5)
 */
export async function getPredictions(userId, limit = 5) {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/predict`, {
            params: { user_id: userId, limit }
        })
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('[DB CLIENT] getPredictions error:', error.message)
        return {
            success: false,
            error: error.message,
            data: []
        }
    }
}

/**
 * Get AI coach recommendations
 * @param {string} userId - User ID
 * @param {number} limit - Max predictions to consider (default: 3)
 */
export async function getAICoach(userId, limit = 3) {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/coach`, {
            params: { user_id: userId, limit }
        })
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('[DB CLIENT] getAICoach error:', error.message)
        return {
            success: false,
            error: error.message,
            data: null
        }
    }
}

/**
 * Get spending summary for a user
 * @param {string} userId - User ID
 * @param {number} days - Days to look back (default: 30)
 */
export async function getSpendingSummary(userId, days = 30) {
    try {
        // Combine transactions and category stats
        const [txResult, statsResult] = await Promise.all([
            getRecentTransactions(userId, 10),
            getCategoryStats(userId, days)
        ])

        if (!txResult.success && !statsResult.success) {
            throw new Error('Failed to fetch spending data')
        }

        // Calculate totals
        const transactions = txResult.data || []
        const categoryStats = statsResult.data || []

        const totalSpent = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
        const topCategory = categoryStats.length > 0
            ? categoryStats[0].CATEGORY
            : 'Unknown'

        return {
            success: true,
            data: {
                totalSpent,
                transactionCount: transactions.length,
                topCategory,
                recentTransactions: transactions.slice(0, 5),
                categoryBreakdown: categoryStats
            }
        }
    } catch (error) {
        console.error('[DB CLIENT] getSpendingSummary error:', error.message)
        return {
            success: false,
            error: error.message,
            data: null
        }
    }
}

/**
 * Health check for database API
 */
export async function healthCheck() {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`)
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('[DB CLIENT] Health check failed:', error.message)
        return {
            success: false,
            error: error.message
        }
    }
}