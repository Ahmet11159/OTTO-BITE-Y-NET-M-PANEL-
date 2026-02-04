import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUnfilledOrders } from '@/app/actions/orders'
import { getAlerts } from '@/app/actions/bakim'
import { getAllReports, getMyReports } from '@/app/actions/report'

export default async function DashboardHub() {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    // Parallel data fetching for stats
    const reportLink = session.role === 'ADMIN' ? '/dashboard/reports/manager' : '/dashboard/reports/chef'

    // Fetch critical stats based on role
    const [unfilledOrders, maintenanceAlerts, todaysReports] = await Promise.all([
        getUnfilledOrders().then(res => res.success ? res.data : []),
        getAlerts().then(res => res.success ? res.data : []),
        session.role === 'ADMIN'
            ? getAllReports({ startDate: new Date().toISOString().split('T')[0] }).then(res => res.success ? res.data : [])
            : getMyReports({ startDate: new Date().toISOString().split('T')[0] }).then(res => res.success ? res.data : [])
    ])

    const pendingOrdersCount = unfilledOrders.length
    const alertsCount = maintenanceAlerts.length
    const reportsCount = todaysReports.length

    // Helper for cards
    const Card = ({ href, title, desc, icon, alerts, color }) => (
        <Link href={href} className={`relative group p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm overflow-hidden hover:scale-[1.02] hover:shadow-2xl hover:shadow-${color}-500/20`}>
            {/* Ambient Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${color}-500/20 rounded-full blur-3xl group-hover:bg-${color}-500/30 transition-all`} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 group-hover:border-${color}-500/50 transition-colors`}>
                        {icon}
                    </div>
                    {alerts > 0 && (
                        <div className={`px-2 py-1 rounded-full text-xs font-bold bg-${color}-500 text-black shadow-[0_0_10px_rgba(0,0,0,0.5)] animate-pulse`}>
                            {alerts} Yeni
                        </div>
                    )}
                </div>

                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                    {title}
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                    {desc}
                </p>

                <div className="mt-auto pt-4 flex items-center text-xs font-medium text-gray-500 group-hover:text-white transition-colors uppercase tracking-widest">
                    Görüntüle <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
            </div>
        </Link>
    )

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-8">
                <div>
                    <div className="text-sm font-medium text-[#d4af37] mb-2 uppercase tracking-widest">Platform Paneli</div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                        Hoşgeldin, {session.fullName.split(' ')[0]}
                    </h1>
                    <p className="text-gray-400 text-lg font-light">
                        {session.role === 'ADMIN' ? 'İşletme genel durum özeti ve yönetim araçları.' : 'Vardiye işlemlerinizi buradan yönetebilirsiniz.'}
                    </p>
                </div>

                {/* Mini Stats Row */}
                <div className="flex gap-6">
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">{pendingOrdersCount}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-widest">Bekleyen Sipariş</div>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-emerald-400">{reportsCount}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-widest">Bugünkü Rapor</div>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <Card
                    href="/dashboard/settings"
                    title="Ayarlar"
                    desc="Uygulama ve modül ayarlarını yönetin."
                    icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4-1.343 4-3-1.79-3-4-3zm0 9c-4.418 0-8-2.239-8-5V8l8-4 8 4v4c0 2.761-3.582 5-8 5z" /></svg>}
                    alerts={0}
                    color="yellow"
                />
                <Card
                    href={reportLink}
                    title={session.role === 'ADMIN' ? 'Şef Raporları' : 'Raporlarım'}
                    desc="Günlük vardiye raporları, operasyonel notlar ve personel durumu."
                    icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    alerts={reportsCount > 0 && session.role === 'ADMIN' ? reportsCount : 0} // Only admins care about count as alert
                    color="emerald"
                />

                <Card
                    href="/dashboard/bakim"
                    title="Bakım Yönetimi"
                    desc="Ekipman envanteri, periyodik bakım takvimi ve arıza bildirimleri."
                    icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    alerts={alertsCount}
                    color="purple"
                />

                <Card
                    href="/dashboard/inventory"
                    title="Depo & Stok"
                    desc="Anlık ürün stokları, sayım işlemleri ve kritik seviye takibi."
                    icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    alerts={0}
                    color="cyan"
                />

                <Card
                    href="/dashboard/orders"
                    title="Sipariş Takip"
                    desc="Tedarikçi siparişleri, mal kabulü ve otomatik stok entegrasyonu."
                    icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                    alerts={pendingOrdersCount}
                    color="blue"
                />

                <Card
                    href="/dashboard/finance/cash-expenses"
                    title="Finans / Kasa"
                    desc="Günlük nakit akışı, kasa çıkışları ve harcama raporları."
                    icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4-1.343 4-3-1.79-3-4-3zm0 9c-4.418 0-8-2.239-8-5V8l8-4 8 4v4c0 2.761-3.582 5-8 5z" /></svg>}
                    alerts={0}
                    color="rose"
                />

                <Card
                    href="/dashboard/lost-found"
                    title="Kayıp Eşya"
                    desc="Unutulan eşyaların kaydı, teslim süreçleri ve arşivleme."
                    icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                    alerts={0}
                    color="amber"
                />
            </div>
        </div>
    )
}
