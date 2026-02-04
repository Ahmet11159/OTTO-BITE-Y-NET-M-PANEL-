import { useState, useEffect } from 'react'
import ReportCard from './report-card'
import { getSettings } from '@/app/actions/settings'

export default function TechnicalIssuesModal({ reports, onClose, currentUserId }) {
    const [selectedDetail, setSelectedDetail] = useState(null)
    const [showDateFilter, setShowDateFilter] = useState(false)
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
    const [locale, setLocale] = useState('tr-TR')

    useEffect(() => {
        getSettings()
            .then(res => {
                if (res.success && res.data?.general?.locale) {
                    setLocale(String(res.data.general.locale))
                }
            })
            .catch(() => {})
    }, [])

    // Filter reports with technical issues
    let issues = reports.filter(r => r.technicalIssues)

    // Apply Date Filter
    if (dateFilter.start) {
        issues = issues.filter(r => new Date(r.createdAt) >= new Date(dateFilter.start))
    }
    if (dateFilter.end) {
        // Add 1 day to end date to make it inclusive for the whole day
        const endDate = new Date(dateFilter.end)
        endDate.setHours(23, 59, 59, 999)
        issues = issues.filter(r => new Date(r.createdAt) <= endDate)
    }

    issues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Handle back button from detail view
    const handleBack = () => setSelectedDetail(null)

    const toggleDateFilter = () => {
        setShowDateFilter(!showDateFilter)
        if (showDateFilter) {
            setDateFilter({ start: '', end: '' }) // Clear on close? Optional, but maybe safer UI. let's keep it.
        }
    }

    if (selectedDetail) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <div
                    className="w-full h-full bg-zinc-950 overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sticky top-0 z-10 flex justify-between items-center bg-zinc-950 border-b border-gray-800 p-4">
                        <div className="flex items-center gap-2">
                            <button onClick={handleBack} className="text-gray-400 hover:text-white mr-2 text-xl" title="Listeye Dön">
                                ←
                            </button>
                            <h3 className="text-xl font-bold text-white">Rapor Detayı</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>
                    <div className="p-6 max-w-7xl mx-auto">
                        <ReportCard report={selectedDetail} isManager={true} isOwnReport={selectedDetail.authorId === currentUserId} forceExpanded={true} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-zinc-950 rounded-xl shadow-2xl border border-red-900/50"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 flex flex-col bg-zinc-950 border-b border-gray-800 p-4 gap-4">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">⚠️</span>
                            <h3 className="text-xl font-bold text-white">Teknik Arıza Bildirimleri</h3>
                            <span className="bg-red-900/50 text-red-200 text-xs px-2 py-1 rounded-full border border-red-900">
                                {issues.length} Adet
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Date Filter Inputs */}
                    {showDateFilter && (
                        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded animate-fade-in-down border border-gray-800">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 uppercase">Başlangıç:</span>
                                <input
                                    type="date"
                                    value={dateFilter.start}
                                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                    className="bg-black border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gold outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 uppercase">Bitiş:</span>
                                <input
                                    type="date"
                                    value={dateFilter.end}
                                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                    className="bg-black border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gold outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setDateFilter({ start: '', end: '' })}
                                className="text-xs text-red-400 hover:text-red-300 ml-auto underline"
                            >
                                Temizle
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-0">
                    {issues.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            {dateFilter.start || dateFilter.end ? 'Bu tarih aralığında arıza bildirimi bulunmuyor.' : 'Aktif arıza bildirimi bulunmuyor.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="text-xs text-gray-500 uppercase bg-zinc-900/50 border-b border-gray-800">
                                    <tr>
                                        <th className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                Tarih
                                                <button
                                                    onClick={() => setShowDateFilter(!showDateFilter)}
                                                    className={`hover:text-white transition-colors ${showDateFilter ? 'text-gold' : 'text-gray-600'}`}
                                                    title="Tarih Filtresi"
                                                >
                                                    📅
                                                </button>
                                            </div>
                                        </th>
                                        <th className="px-6 py-3">Bildiren</th>
                                        <th className="px-6 py-3">Departman</th>
                                        <th className="px-6 py-3">Arıza Notu</th>
                                        <th className="px-6 py-3 text-right">Rapor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {issues.map((report) => (
                                        <tr key={report.id} className="bg-zinc-950 hover:bg-zinc-900/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap" suppressHydrationWarning>
                                                {new Date(report.createdAt).toLocaleDateString(locale)}
                                                <div className="text-xs text-gray-600">
                                                    {new Date(report.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-white">
                                                {report.author.fullName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`
                                                    text-xs px-2 py-1 rounded border
                                                    ${report.department === 'Mutfak' ? 'border-red-500/30 text-red-400' :
                                                        report.department === 'Bar' ? 'border-purple-500/30 text-purple-400' :
                                                            'border-yellow-500/30 text-yellow-400'}
                                                `}>
                                                    {report.department}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {report.technicalIssues}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    className="text-gold hover:text-white text-lg font-bold px-2 py-1 hover:bg-white/10 rounded transition-colors"
                                                    title="Rapora git"
                                                    onClick={() => setSelectedDetail(report)}
                                                >
                                                    -&gt;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
