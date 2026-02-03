const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Attempting manual log creation...')
        const log = await prisma.inventoryLog.create({
            data: {
                actionType: 'TEST',
                productName: 'Test Product',
                details: 'Manual test log',
                userName: 'System Test',
                userId: 0
            }
        })
        console.log('SUCCESS! Log created with ID:', log.id)
    } catch (e) {
        console.error('FAILED TO CREATE LOG:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
