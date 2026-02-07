
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ReportForm from '../../report-form'
import { getReportById } from '@/app/actions/report'

export const dynamic = 'force-dynamic'

export default async function EditReportPage({ params }) {
    const session = await getSession()
    if (!session) redirect('/login')

    const res = await getReportById({ id: params.id })
    const report = res && res.success ? res.data : null

    if (!report) {
        return <div className="text-white">Rapor bulunamadı.</div>
    }

    if (report.authorId !== session.id) {
        return <div className="text-white">Bu raporu düzenleme yetkiniz yok.</div>
    }

    // Manager role check for edit logic? 
    // Usually edit preserves role, but let's check current session role
    const managerRoles = ['Müdür', 'Müdür Yardımcısı', 'Müşteri İlişkileri Yöneticisi']
    const isManagerRole = session && (managerRoles.includes(session.department) || session.role === 'ADMIN')

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">Raporu Düzenle</h1>
                <Link href="/dashboard/reports/chef" className="text-gray-400 hover:text-white text-sm">
                    ⚠️ Vazgeç
                </Link>
            </div>

            <ReportForm initialData={report} isManagerRole={isManagerRole} />
        </div>
    )
}
