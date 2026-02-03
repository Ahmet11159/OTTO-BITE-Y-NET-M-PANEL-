import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ReportForm from '../report-form'

export default async function NewReportPage() {
    const session = await getSession()
    if (!session) redirect('/login')

    // Departments that only report technical issues
    const managerRoles = ['Müdür', 'Müdür Yardımcısı', 'Müşteri İlişkileri Yöneticisi']
    const isManagerRole = session && (managerRoles.includes(session.department) || session.role === 'ADMIN')

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">Yeni Vardiya Raporu</h1>
                <Link href="/dashboard/reports/chef" className="text-gray-400 hover:text-white text-sm">
                    ⚠️ Vazgeç
                </Link>
            </div>

            <ReportForm isManagerRole={isManagerRole} />
        </div>
    )
}
