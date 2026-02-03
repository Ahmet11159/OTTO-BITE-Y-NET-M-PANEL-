const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Checking recent StockTransactions...')
    const transactions = await prisma.stockTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { product: true }
    })
    console.log(JSON.stringify(transactions, null, 2))

    console.log('\nChecking recent InventoryLogs...')
    const logs = await prisma.inventoryLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    })
    console.log(JSON.stringify(logs, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
