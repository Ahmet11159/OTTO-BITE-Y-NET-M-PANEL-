const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Checking Prisma models...')
    console.log('Order model exists:', !!prisma.order)
    console.log('OrderItem model exists:', !!prisma.orderItem)
    console.log('OrderNotification model exists:', !!prisma.orderNotification)

    if (prisma.order) {
        try {
            const count = await prisma.order.count()
            console.log('Order count:', count)
        } catch (e) {
            console.error('Error counting orders:', e.message)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
