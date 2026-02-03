const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const logs = await prisma.inventoryLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
    })
    console.log('Recent Inventory Logs:')
    logs.forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] ${l.userName} - ${l.actionType} on ${l.productName}: ${l.details}`)
    })
}

main()
