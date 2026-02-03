import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import LostFoundDashboard from './lost-found-dashboard'

export const metadata = {
    title: 'Kayıp Eşya Yönetimi | OTTOBITE ShiftLog',
    description: 'Kayıp eşya takibi ve yönetimi'
}

export default async function LostFoundPage() {
    const session = await getSession()
    if (!session) redirect('/login')

    // Tüm kayıp eşyaları getir
    const items = await prisma.lostItem.findMany({
        include: {
            reportedBy: {
                select: { id: true, fullName: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    // İstatistikler
    const stats = {
        total: items.length,
        found: items.filter(i => i.status === 'FOUND').length,
        returned: items.filter(i => i.status === 'RETURNED').length,
        disposed: items.filter(i => i.status === 'DISPOSED').length
    }

    return (
        <LostFoundDashboard
            initialItems={items}
            stats={stats}
            user={session}
        />
    )
}
