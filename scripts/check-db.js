const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const product = await prisma.product.findUnique({ where: { id: 1 } })
    const user = await prisma.user.findUnique({ where: { id: 14 } })

    console.log('Product 1:', product)
    console.log('User 14:', user)

    if (!product) console.log('ERROR: Product 1 is missing!')
    if (!user) console.log('ERROR: User 14 is missing!')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
