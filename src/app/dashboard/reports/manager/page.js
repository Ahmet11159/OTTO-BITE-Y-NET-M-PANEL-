import { getAllReports } from '@/app/actions/report'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DashboardStats from './stats'
import FilterBar from './filter-bar'
import CategorizedView from './categorized-view'

export const dynamic = 'force-dynamic'

export default async function ManagerDashboard({ searchParams }) {
    const session = await getSession()
    if (!session) redirect('/login')
    if (session.role !== 'ADMIN') redirect('/dashboard/reports/chef')
    // Pass searchParams to getAllReports for filtering
    const res = await getAllReports({
        department: searchParams?.department,
        shiftType: searchParams?.shiftType,
        startDate: searchParams?.startDate,
        endDate: searchParams?.endDate
    })
    const reports = res.success ? res.data : []

    // Departments that only report technical issues (Manager roles)
    // These should NOT be shown in the main grid, but ARE counted in stats
    const managerRoles = ['Müdür', 'Müdür Yardımcısı', 'Müşteri İlişkileri Yöneticisi']

    // Filter out manager reports for the main view
    const displayReports = reports.filter(r => !managerRoles.includes(r.department))
    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Yönetici Paneli v2</h1>
                    <p className="text-gray-400 text-sm mt-1">Günlük Operasyonel Genel Bakış</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/dashboard/reports/chef/new" className="btn btn-danger text-sm gap-2 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">
                        <span>⚠️</span> Teknik Arıza Bildir
                    </Link>
                    <Link href="/dashboard/reports/manager/users" className="btn btn-secondary text-sm gap-2">
                        <span>👥</span> Personel Yönetimi
                    </Link>
                </div>
            </div>

            <DashboardStats reports={reports} currentUserId={session?.id} />

            <FilterBar />

            <div className="mt-8">
                {reports.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-800 rounded-lg">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-white font-bold text-xl mb-2">Sonuç Bulunamadı</h3>
                        <p className="text-gray-500">Seçili kriterlere uygun rapor kaydı yoktur.</p>
                    </div>
                ) : (
                    <CategorizedView
                        reports={displayReports}
                        currentDepartment={searchParams?.department || 'all'}
                        currentUserId={session?.id}
                    />
                )}
            </div>
        </div>
    )
}
