export default function ChefStats({ reports, locale = 'tr-TR' }) {
    const totalReports = reports.length
    const technicalIssues = reports.filter(r => r.technicalIssues && r.technicalIssues.length > 0).length

    // Calculate last report date properly
    const lastReportDate = reports.length > 0
        ? new Date(reports[0].createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long' })
        : '-'

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card border-l-4 border-gold">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Toplam Rapor</h3>
                <div className="text-3xl font-bold text-white">{totalReports}</div>
            </div>

            <div className="card border-l-4 border-red-500">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Bildirilen Arızalar</h3>
                <div className="text-3xl font-bold text-white">{technicalIssues}</div>
            </div>

            <div className="card border-l-4 border-blue-500">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Son Rapor</h3>
                <div className="text-3xl font-bold text-white">{lastReportDate}</div>
            </div>
        </div>
    )
}
