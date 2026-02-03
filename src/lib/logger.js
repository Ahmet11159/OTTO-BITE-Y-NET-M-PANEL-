import fs from 'fs'
import path from 'path'

const LOG_FILE = '/tmp/ottobite-app.log'

class Logger {
    constructor() {
        this.logFile = LOG_FILE
    }

    _formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString()
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
        return `[${timestamp}] [${level}] ${message}${metaStr}\n`
    }

    _write(level, message, meta) {
        const formatted = this._formatMessage(level, message, meta)
        
        // Always log to console in a format Next.js/Vercel can pick up
        if (level === 'ERROR') {
            console.error(formatted)
        } else if (level === 'WARN') {
            console.warn(formatted)
        } else {
            console.log(formatted)
        }

        // In development, also write to file for easy debugging
        if (process.env.NODE_ENV !== 'production') {
            try {
                fs.appendFileSync(this.logFile, formatted)
            } catch (e) {
                console.error('Failed to write to log file', e)
            }
        }
    }

    info(message, meta) {
        this._write('INFO', message, meta)
    }

    warn(message, meta) {
        this._write('WARN', message, meta)
    }

    error(message, meta) {
        this._write('ERROR', message, meta)
    }

    debug(message, meta) {
        if (process.env.NODE_ENV !== 'production') {
            this._write('DEBUG', message, meta)
        }
    }
}

export const logger = new Logger()
