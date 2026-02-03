import { logger } from './logger'
import { ZodError } from 'zod'

/**
 * Standardized response format
 * @typedef {Object} ActionResponse
 * @property {boolean} success
 * @property {any} [data]
 * @property {string} [error]
 */

/**
 * Higher-order function to wrap server actions with error handling and logging
 * @param {Function} action - The async server action
 * @param {Object} [schema] - Optional Zod schema for input validation
 * @returns {Function} Wrapped action
 */
export function safeAction(action, schema = null) {
    return async (...args) => {
        const actionName = action.name || 'anonymous_action'

        try {
            // 1. Input Validation
            let safeArgs = args
            if (schema && args.length > 0) {
                // If the first argument is FormData, convert to object or handle appropriately
                // For simplicity, we assume schema is used when args[0] is a plain object or matchable
                // If args[0] is FormData, schema validation might need parsing logic
                // This is a basic implementation
                const input = args[0]
                if (input && typeof input === 'object' && !(input instanceof FormData)) {
                    const parsed = schema.parse(input)
                    // Use the parsed (coerced) data instead of the original input
                    safeArgs = [parsed, ...args.slice(1)]
                }
            }

            // 2. Execution
            const result = await action(...safeArgs)

            // 3. Success Logging (optional for high volume)
            // logger.info(`Action ${actionName} completed successfully`)

            return { success: true, data: result }

        } catch (error) {
            // Rethrow Next.js redirects
            if (error.message === 'NEXT_REDIRECT' || (error.digest && error.digest.startsWith('NEXT_REDIRECT'))) {
                throw error
            }

            // 4. Error Handling
            if (error instanceof ZodError) {
                const message = error.errors.map(e => e.message).join(', ')
                logger.warn(`Validation error in ${actionName}: ${message}`)
                return { success: false, error: message }
            }

            // Known "Expected" errors (e.g. "Unauthorized")
            if (error.message === 'Unauthorized' || error.message.includes('Unauthorized')) {
                logger.warn(`Unauthorized access attempt in ${actionName}`)
                return { success: false, error: 'Yetkisiz işlem.' }
            }

            // Unexpected errors
            logger.error(`Error in ${actionName}: ${error.message}`, { stack: error.stack })
            return { success: false, error: error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.' }
        }
    }
}
