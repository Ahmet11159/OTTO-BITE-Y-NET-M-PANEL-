import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSettings } from '@/app/actions/settings'

export const dynamic = 'force-dynamic'

export async function GET(request) {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
        const requestSecret = request.headers.get('x-cron-secret')
        if (requestSecret !== cronSecret) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
    }

    try {
        const now = new Date()
        const settingsRes = await getSettings()
        const locale = settingsRes.success && settingsRes.data?.general?.locale ? String(settingsRes.data.general.locale) : 'tr-TR'
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const aggregations = await prisma.stockTransaction.groupBy({
            by: ['productId', 'type'],
            _sum: { amount: true },
            where: { createdAt: { gte: startOfMonth } }
        })

        const statsMap = {}
        aggregations.forEach(agg => {
            if (!statsMap[agg.productId]) statsMap[agg.productId] = { IN: 0, OUT: 0 }
            statsMap[agg.productId][agg.type] = agg._sum.amount || 0
        })

        const products = await prisma.product.findMany()

        const snapshot = products.map(p => ({
            id: p.id,
            name: p.name,
            currentStock: p.currentStock,
            unit: p.unit
        }))

        await prisma.stockReport.create({
            data: {
                period: now.toLocaleString(locale, { month: 'long', year: 'numeric' }),
                data: JSON.stringify(snapshot)
            }
        })

        for (const product of products) {
            const added = statsMap[product.id]?.IN || 0
            const removed = statsMap[product.id]?.OUT || 0

            const projectedStartStock = product.currentStock - added + removed

            await prisma.product.update({
                where: { id: product.id },
                data: {
                    startStock: projectedStartStock,
                    lastReset: now
                }
            })
        }

        return NextResponse.json({ success: true, message: "Inventory successfully reset for the new month." })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
