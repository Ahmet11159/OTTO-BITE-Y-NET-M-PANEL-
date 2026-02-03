const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- Product Deletion Test ---')
    const products = await prisma.product.findMany()
    console.log(`Current products: ${products.length}`)

    const kestane = products.find(p => p.name.includes('Kestane'))
    if (!kestane) {
        console.log('Kestane Su not found, showing all names:')
        console.log(products.map(p => p.name))
        return
    }

    console.log(`Found Kestane Su (ID: ${kestane.id}). Attempting delete...`)
    try {
        await prisma.product.delete({
            where: { id: kestane.id }
        })
        console.log('SUCCESS: Product deleted.')
    } catch (error) {
        console.error('ERROR during delete:', error)
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
