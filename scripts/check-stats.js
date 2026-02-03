const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    const aggregations = await prisma.stockTransaction.groupBy({
        by: ['productId', 'type'],
        _sum: { amount: true },
        where: { createdAt: { gte: start, lte: end } }
    });

    const statsMap = {};
    aggregations.forEach(agg => {
        if (!statsMap[agg.productId]) statsMap[agg.productId] = { IN: 0, OUT: 0 };
        statsMap[agg.productId][agg.type] = agg._sum.amount || 0;
    });

    console.log('Products with stats:');
    products.forEach(p => {
        const stats = statsMap[p.id] || { IN: 0, OUT: 0 };
        console.log(`  ${p.name} (ID:${p.id}) | Added: ${stats.IN} | Removed: ${stats.OUT} | Current: ${p.currentStock}`);
    });

    await prisma.$disconnect();
}
main();
