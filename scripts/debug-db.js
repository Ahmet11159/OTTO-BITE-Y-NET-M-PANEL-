const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const products = await prisma.product.count()
    const logsCount = await prisma.inventoryLog.count()
    console.log('Database Stats:')
    console.log('- Total Products:', products)
    console.log('- Total Inventory Logs:', logsCount)

    if (logsCount > 0) {
      const logs = await prisma.inventoryLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      console.log('\nLast 10 Logs:')
      logs.forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] ${l.userName} (${l.actionType}): ${l.productName} -> ${l.details}`)
      })
    }
    
    const das = await prisma.product.findFirst({ where: { name: { contains: 'das' } } })
    console.log('\nSearch for "das":', das || 'Not found')

  } catch (e) {
    console.error('CRITICAL ERROR:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
