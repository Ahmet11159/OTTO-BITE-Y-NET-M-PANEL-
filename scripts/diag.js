const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('--- DATABASE DIAGNOSTICS ---')

        // 1. Check Product Table
        const products = await prisma.product.findMany({
            where: { name: { contains: 'das' } }
        })
        console.log('\nProducts containing "das":')
        if (products.length === 0) console.log('None found.')
        products.forEach(p => console.log(`- ID: ${p.id}, Name: "${p.name}", Category: ${p.category}`))

        // 2. Check ALL Logs
        const totalLogs = await prisma.inventoryLog.count()
        console.log('\nTotal Logs in DB:', totalLogs)

        if (totalLogs > 0) {
            const recentLogs = await prisma.inventoryLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5
            })
            console.log('\nLast 5 Logs:')
            recentLogs.forEach(l => {
                console.log(`[${l.createdAt.toISOString()}] ${l.userName} (${l.actionType}): ${l.productName} -> ${l.details}`)
            })
        }

        // 3. User Check
        const users = await prisma.user.findMany({ select: { id: true, fullName: true, role: true } })
        console.log('\nUsers in DB:', users)

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
