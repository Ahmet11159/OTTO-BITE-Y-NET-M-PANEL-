import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMyReports } from '@/app/actions/report'
import { getSession } from '@/lib/auth'
import ReportCard from '../manager/report-card'
import ChefStats from './stats'
import ChefFilterBar from './filter-bar'
import { getSettings } from '@/app/actions/settings'

export default async function ChefDashboard({ searchParams }) {
    const session = await getSession()
    if (!session) redirect('/login')
    if (session.role === 'ADMIN') redirect('/dashboard/reports/manager')
    const settingsRes = await getSettings()
    const locale = settingsRes.success && settingsRes.data?.general?.locale ? String(settingsRes.data.general.locale) : 'tr-TR'
    const res = await getMyReports({
        shiftType: searchParams?.shiftType,
        startDate: searchParams?.startDate,
        endDate: searchParams?.endDate
    })
    const reports = res.success ? res.data : []

    // Group reports by Month and Year
    const groupedReports = reports.reduce((groups, report) => {
        const date = new Date(report.createdAt);
        const key = date.toLocaleString(locale, { month: 'long', year: 'numeric' });

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(report);
        return groups;
    }, {});

    // Sort groups? The reports come sorted by date desc, so the keys naturally appear in that order (latest first) if we iterate properly.
    // However, Object.keys ordering isn't guaranteed perfectly, but for this simpler list usually fine. 
    // Ideally we iterate report list and create unique keys in order.

    // Better approach to keep order:
    const groups = [];
    const seenRequestKeys = new Set();

    reports.forEach(report => {
        const date = new Date(report.createdAt);
        const key = date.toLocaleString(locale, { month: 'long', year: 'numeric' });

        if (!seenRequestKeys.has(key)) {
            seenRequestKeys.add(key);
            groups.push({ title: key, items: [] });
        }

        groups.find(g => g.title === key).items.push(report);
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Raporlarım</h1>
                    <p className="text-gray-400 text-sm mt-1">Geçmiş Raporlarınızı İnceleyin</p>
                </div>
                <Link href="/dashboard/reports/chef/new" className="btn btn-primary no-underline text-black font-bold text-sm px-4 py-2 flex items-center gap-2">
                    <span>+</span> Yeni Rapor
                </Link>
            </div>

            <ChefStats reports={reports} locale={locale} />

            <ChefFilterBar />

            <div className="mt-8 space-y-12">
                {reports.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-800 rounded-lg">
                        <div className="text-4xl mb-4">📝</div>
                        <h3 className="text-white font-bold text-xl mb-2">Rapor Bulunamadı</h3>
                        <p className="text-gray-500">Henüz bir vardiya raporu oluşturmadınız veya filtre kriterlerine uygun kayıt yok.</p>
                        <Link href="/dashboard/reports/chef/new" className="text-gold hover:underline mt-4 inline-block">
                            İlk Raporu Oluştur &rarr;
                        </Link>
                    </div>
                ) : (
                    groups.map(group => (
                        <div key={group.title}>
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#d4af37] to-gray-400 border-b border-white/10 pb-2 mb-6 sticky top-[80px] backdrop-blur-md bg-black/80 z-20 py-3 uppercase tracking-widest shadow-2xl">
                                {group.title}
                            </h3>
                            <div className="grid gap-4">
                                {group.items.map(report => (
                                    <ReportCard key={report.id} report={report} isOwnReport={true} />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
