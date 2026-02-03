const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    console.log('Date Range:', start.toISOString(), 'to', end.toISOString());

    // Direct fetch as getInventory would
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    const aggregations = await prisma.stockTransaction.groupBy({
        by: ['productId', 'type'],
        _sum: { amount: true },
        where: { createdAt: { gte: start, lte: end } }
    });

    console.log('\nRaw aggregations:', JSON.stringify(aggregations, null, 2));

    const statsMap = {};
    aggregations.forEach(agg => {
        if (!statsMap[agg.productId]) statsMap[agg.productId] = { IN: 0, OUT: 0 };
        statsMap[agg.productId][agg.type] = agg._sum.amount || 0;
    });

    const result = products.map(product => {
        const stats = statsMap[product.id] || { IN: 0, OUT: 0 };
        return {
            id: product.id,
            name: product.name,
            addedThisMonth: stats.IN,
            removedThisMonth: stats.OUT,
            currentStock: product.currentStock
        };
    });

    console.log('\nFinal result (as getInventory would return):');
    console.log(JSON.stringify(result, null, 2));

    await prisma.$disconnect();
}
main();
