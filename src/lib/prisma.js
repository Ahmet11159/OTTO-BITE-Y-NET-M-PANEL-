import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const serverLogFile = '/tmp/server-debug.log'
function serverLog(msg) {
    const logMsg = `[PRISMA-DEBUG] [${new Date().toISOString()}] ${msg}\n`
    try { fs.appendFileSync(serverLogFile, logMsg) } catch (e) { }
}

const prismaClientSingleton = () => {
    return new PrismaClient()
}

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
