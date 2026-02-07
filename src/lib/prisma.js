import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const serverLogFile = '/tmp/server-debug.log'
function serverLog(msg) {
    const logMsg = `[PRISMA-DEBUG] [${new Date().toISOString()}] ${msg}\n`
    try { fs.appendFileSync(serverLogFile, logMsg) } catch (e) { }
}

const dbUrl = process.env.DATABASE_URL || ''
const badProtocol = dbUrl && !/^postgresql:\/\//.test(dbUrl) && !/^postgres:\/\//.test(dbUrl)
if (!dbUrl) serverLog('DATABASE_URL missing; Prisma will attempt lazy connections')
else if (badProtocol) serverLog(`DATABASE_URL protocol invalid: ${dbUrl.split('://')[0]}`)

const prismaClientSingleton = () => {
    return new PrismaClient()
}

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
