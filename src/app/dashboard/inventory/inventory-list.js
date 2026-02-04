'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import InventoryRow from './inventory-row'
import NewProductModal from './new-product-modal'
import FilterManagementModal from './filter-management-modal'
import InventoryLogModal from './inventory-log-modal'
import { bulkDeleteProducts, getInventory, getFilterOptions, addCategory, addUnit, getInventoryCountSchedule, updateInventoryCountSchedule, createInventoryCountReportNow, getLatestStockReport, checkAndRunInventoryCountSchedule, getStockReports, getStockReportById } from '@/app/actions/inventory'
import { getSettings } from '@/app/actions/settings'
import { useToast } from '@/app/providers/toast-provider'
import ConfirmModal from '@/app/components/confirm-modal'

export default function InventoryList({ initialProducts, userRole }) {
    const [products, setProducts] = useState(initialProducts)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLogModalOpen, setIsLogModalOpen] = useState(false)
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [unitFilter, setUnitFilter] = useState('all')
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [filterOptions, setFilterOptions] = useState({ categories: [], units: [] })
    const [selectedIds, setSelectedIds] = useState([])
    const [isDeleting, setIsDeleting] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showBulkConfirm, setShowBulkConfirm] = useState(false)
    const [confirmBulkOpen, setConfirmBulkOpen] = useState(false)
    const [activeView, setActiveView] = useState('table') // 'table' or 'cards'
    const [expandedProduct, setExpandedProduct] = useState(null)
    const { addToast } = useToast()
    const [schedule, setSchedule] = useState(null)
    const [scheduleType, setScheduleType] = useState('LAST_DAY')
    const [dayOfMonth, setDayOfMonth] = useState(1)
    const [timeOfDay, setTimeOfDay] = useState('21:00')
    const [scheduleEnabled, setScheduleEnabled] = useState(false)
    const [isScheduleSaving, setIsScheduleSaving] = useState(false)
    const [isReportGenerating, setIsReportGenerating] = useState(false)
    const [latestReport, setLatestReport] = useState(null)
    const [reports, setReports] = useState([])
    const [isReportsLoading, setIsReportsLoading] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState(null)
    const [selectedReportData, setSelectedReportData] = useState(null)
    const [searchInput, setSearchInput] = useState('')
    const [locale, setLocale] = useState('tr-TR')
    const router = useRouter()
    const isAdmin = userRole === 'ADMIN'

    const showToast = (message, type = 'error') => addToast(message, type)

    const fetchFilters = async () => {
        const res = await getFilterOptions()
        if (res.success) {
            setFilterOptions(res.data)
        }
    }

    const loadSchedule = async () => {
        try {
            await checkAndRunInventoryCountSchedule()
            setIsReportsLoading(true)
            const [scheduleRes, reportRes, reportsRes] = await Promise.all([
                getInventoryCountSchedule(),
                getLatestStockReport(),
                getStockReports()
            ])
            if (scheduleRes.success) {
                const data = scheduleRes.data
                setSchedule(data)
                setScheduleType(data.scheduleType)
                setDayOfMonth(data.dayOfMonth || 1)
                setTimeOfDay(data.timeOfDay || '21:00')
                setScheduleEnabled(!!data.isEnabled)
            } else {
                showToast(scheduleRes.error || 'Zamanlama bilgisi alınamadı.')
            }
            if (reportRes.success) {
                setLatestReport(reportRes.data)
            }
            if (reportsRes.success) {
                setReports(reportsRes.data || [])
            }
        } catch (error) {
            showToast(error.message || 'Zamanlama bilgisi alınamadı.')
        } finally {
            setIsReportsLoading(false)
        }
    }

    const handleSaveSchedule = async () => {
        setIsScheduleSaving(true)
        try {
            const res = await updateInventoryCountSchedule({
                isEnabled: scheduleEnabled,
                scheduleType,
                dayOfMonth: scheduleType === 'DAY_OF_MONTH' ? dayOfMonth : null,
                timeOfDay
            })
            if (!res.success) throw new Error(res.error)
            setSchedule(res.data)
            showToast('Zamanlama güncellendi.', 'success')
        } catch (error) {
            showToast(error.message || 'Zamanlama güncellenemedi.')
        } finally {
            setIsScheduleSaving(false)
        }
    }

    const handleGenerateReport = async () => {
        setIsReportGenerating(true)
        try {
            const res = await createInventoryCountReportNow()
            if (!res.success) throw new Error(res.error)
            setLatestReport(res.data)
            setReports(prev => [res.data, ...prev.filter(r => r.id !== res.data.id)].slice(0, 20))
            showToast('Sayım listesi oluşturuldu.', 'success')
        } catch (error) {
            showToast(error.message || 'Sayım listesi oluşturulamadı.')
        } finally {
            setIsReportGenerating(false)
        }
    }

    const parseReportData = (report) => {
        if (!report?.data) return null
        try {
            return JSON.parse(report.data)
        } catch (error) {
            return null
        }
    }

    const handleOpenReport = async (reportId) => {
        try {
            const res = await getStockReportById({ id: reportId })
            if (!res.success) throw new Error(res.error)
            setSelectedReport(res.data)
            setSelectedReportData(parseReportData(res.data))
            setIsReportModalOpen(true)
        } catch (error) {
            showToast(error.message || 'Sayım listesi alınamadı.')
        }
    }

    const buildCsv = (reportData) => {
        if (!reportData?.items) return ''
        const header = ['Ürün', 'Kategori', 'Stok', 'Sayım', 'Fark', 'Birim']
        const fmt = (v) => {
            if (v === null || v === undefined || v === '') return ''
            const n = Number(v)
            return Number.isFinite(n) ? n.toLocaleString(locale) : String(v)
        }
        const rows = reportData.items.map(item => [
            item.name || '',
            item.category || '',
            fmt(item.currentStock),
            '',
            '',
            item.unit || ''
        ])
        return [header, ...rows]
            .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\n')
    }

    const handleDownloadReport = (report) => {
        const reportData = parseReportData(report)
        if (!reportData) {
            showToast('Sayım listesi verisi okunamadı.')
            return
        }
        const csv = buildCsv(reportData)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const dateLabel = new Date(report.createdAt).toISOString().split('T')[0]
        link.href = url
        link.download = `depo-sayim-${dateLabel}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const escapeHtml = (value) => {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;')
    }

    const buildReportHtml = (report, reportData) => {
        const items = reportData.items || []
        const totalStock = items.reduce((acc, item) => acc + (Number(item.currentStock) || 0), 0)
        const fmtNum = (v) => {
            const n = Number(v)
            return Number.isFinite(n) ? n.toLocaleString(locale) : '-'
        }
        const rows = items.map(item => `
            <tr>
                <td>${escapeHtml(item.name || '')}</td>
                <td>${escapeHtml(item.category || '-')}</td>
                <td class="right">${escapeHtml(fmtNum(item.currentStock))}</td>
                <td class="right"></td>
                <td class="right"></td>
                <td class="right">${escapeHtml(item.unit || '')}</td>
            </tr>
        `).join('')

        return `
            <!doctype html>
            <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Depo Sayım Listesi</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
                        h1 { margin: 0 0 8px 0; font-size: 20px; }
                        .meta { font-size: 12px; color: #555; margin-bottom: 16px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #f5f5f5; }
                        .right { text-align: right; }
                        .summary { margin-top: 16px; font-size: 12px; color: #333; }
                    </style>
                </head>
                <body>
                    <h1>Depo Sayım Listesi</h1>
                    <div class="meta">${escapeHtml(report.period || '')}</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Ürün</th>
                                <th>Kategori</th>
                                <th class="right">Stok</th>
                                <th class="right">Sayım</th>
                                <th class="right">Fark</th>
                                <th class="right">Birim</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                    <div class="summary">Toplam Ürün: ${items.length} • Toplam Stok: ${fmtNum(totalStock)}</div>
                </body>
            </html>
        `
    }

    const handlePrintReport = async (report) => {
        let reportData = parseReportData(report)
        let fullReport = report
        if (!reportData) {
            const res = await getStockReportById({ id: report.id })
            if (!res.success) {
                showToast(res.error || 'Sayım listesi alınamadı.')
                return
            }
            fullReport = res.data
            reportData = parseReportData(res.data)
        }
        if (!reportData) {
            showToast('Sayım listesi verisi okunamadı.')
            return
        }
        const printWindow = window.open('', '_blank', 'width=900,height=700')
        if (!printWindow) {
            showToast('Yazdırma penceresi açılamadı.')
            return
        }
        printWindow.document.write(buildReportHtml(fullReport, reportData))
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
    }

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const res = await getInventory({ startDate, endDate })
            if (res.success) {
                setProducts(res.data)
            } else {
                showToast('Veriler yüklenirken hata oluştu: ' + res.error)
            }
        } catch (error) {
            console.error(error)
            showToast('Beklenmedik bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFilters()
        getSettings().then(res => {
            if (res.success && res.data?.general?.locale) {
                setLocale(String(res.data.general.locale))
            }
        }).catch(() => {})
    }, [])

    useEffect(() => {
        fetchData()
    }, [startDate, endDate])

    useEffect(() => {
        const id = setTimeout(() => setSearchTerm(searchInput), 200)
        return () => clearTimeout(id)
    }, [searchInput])

    useEffect(() => {
        if (isAdmin) {
            loadSchedule()
        }
    }, [isAdmin])

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
        const matchesUnit = unitFilter === 'all' || product.unit === unitFilter
        return matchesSearch && matchesCategory && matchesUnit
    })

    // Calculate stats
    const stats = {
        totalProducts: products.length,
        totalStock: products.reduce((acc, p) => acc + (p.currentStock || 0), 0),
        addedThisMonth: products.reduce((acc, p) => acc + (p.addedThisMonth || 0), 0),
        removedThisMonth: products.reduce((acc, p) => acc + (p.removedThisMonth || 0), 0),
        categories: [...new Set(products.map(p => p.category).filter(Boolean))].length,
        lowStock: products.filter(p => p.currentStock < 10).length
    }

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredProducts.map(p => p.id))
        } else {
            setSelectedIds([])
            setShowBulkConfirm(false)
        }
    }

    const handleSelectOne = (id, checked) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id])
        } else {
            setSelectedIds(prev => prev.filter(item => item !== id))
        }
    }

    const selectedItemsCount = selectedReportData?.items?.length || 0
    const selectedItemsTotal = selectedReportData?.items?.reduce((acc, item) => acc + (Number(item.currentStock) || 0), 0) || 0

    const handleBulkDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await bulkDeleteProducts({ ids: selectedIds })
            if (res.success) {
                await fetchData()
                setSelectedIds([])
                setShowBulkConfirm(false)
                setConfirmBulkOpen(false)
                showToast(`${selectedIds.length} ürün silindi`, 'success')
            } else {
                showToast('Hata: ' + res.error)
            }
        } catch (error) {
            showToast('Hata: ' + error.message)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-5 group hover:border-blue-500/40 transition-all duration-300">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.totalProducts}</p>
                        <p className="text-xs text-gray-400 mt-1">Toplam Ürün</p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600/20 to-green-600/20 border border-emerald-500/20 rounded-2xl p-5 group hover:border-emerald-500/40 transition-all duration-300">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.totalStock.toLocaleString(locale)}</p>
                        <p className="text-xs text-gray-400 mt-1">Toplam Stok</p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-green-600/20 to-lime-600/20 border border-green-500/20 rounded-2xl p-5 group hover:border-green-500/40 transition-all duration-300">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-green-400">+{stats.addedThisMonth}</p>
                        <p className="text-xs text-gray-400 mt-1">Bu Dönem Eklenen</p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-red-600/20 to-rose-600/20 border border-red-500/20 rounded-2xl p-5 group hover:border-red-500/40 transition-all duration-300">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-red-400">-{stats.removedThisMonth}</p>
                        <p className="text-xs text-gray-400 mt-1">Bu Dönem Çıkan</p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/20 rounded-2xl p-5 group hover:border-purple-500/40 transition-all duration-300">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.categories}</p>
                        <p className="text-xs text-gray-400 mt-1">Kategori</p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20 rounded-2xl p-5 group hover:border-amber-500/40 transition-all duration-300">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-amber-400">{stats.lowStock}</p>
                        <p className="text-xs text-gray-400 mt-1">Kritik Stok</p>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
                    <div className="flex flex-col xl:flex-row gap-6">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Depo Sayım Listesi</h3>
                                    <p className="text-sm text-gray-400">İstediğiniz anda sayım listesi oluşturun veya otomatik zamanlayın.</p>
                                </div>
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={isReportGenerating}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-black font-bold text-sm hover:from-emerald-400 hover:to-green-400 transition-all disabled:opacity-50"
                                >
                                    {isReportGenerating ? 'Oluşturuluyor...' : 'Sayım Listesi Oluştur'}
                                </button>
                            </div>
                            <div className="text-sm text-gray-400">
                                {latestReport
                                    ? `Son sayım: ${new Date(latestReport.createdAt).toLocaleString(locale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                    : 'Henüz sayım listesi oluşturulmadı.'}
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">Otomatik Sayım</label>
                                    <select
                                        value={scheduleType}
                                        onChange={(e) => setScheduleType(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                                    >
                                        <option value="LAST_DAY">Ayın Son Günü</option>
                                        <option value="DAY_OF_MONTH">Ayın Belirli Günü</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">Gün</label>
                                    <select
                                        value={dayOfMonth}
                                        onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10))}
                                        disabled={scheduleType !== 'DAY_OF_MONTH'}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
                                    >
                                        {Array.from({ length: 31 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">Saat</label>
                                    <input
                                        type="time"
                                        value={timeOfDay}
                                        onChange={(e) => setTimeOfDay(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                                    />
                                </div>
                                <div className="flex items-center gap-3 mt-6">
                                    <input
                                        type="checkbox"
                                        checked={scheduleEnabled}
                                        onChange={(e) => setScheduleEnabled(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500/50"
                                    />
                                    <span className="text-sm text-gray-300">Otomatik sayımı etkinleştir</span>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <button
                                    onClick={handleSaveSchedule}
                                    disabled={isScheduleSaving}
                                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50"
                                >
                                    {isScheduleSaving ? 'Kaydediliyor...' : 'Zamanlamayı Kaydet'}
                                </button>
                                {schedule?.lastRunAt && (
                                    <span className="text-xs text-gray-500">
                                        Son otomatik: {new Date(schedule.lastRunAt).toLocaleString(locale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAdmin && (
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Sayım Listeleri</h3>
                        {isReportsLoading && <span className="text-xs text-gray-500">Yükleniyor...</span>}
                    </div>
                    {reports.length === 0 ? (
                        <div className="text-sm text-gray-500">Kayıtlı sayım listesi yok.</div>
                    ) : (
                        <div className="space-y-2">
                            {reports.map(report => (
                                <div key={report.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                                    <div>
                                        <div className="text-sm text-white">{report.period}</div>
                                        <div className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleString(locale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenReport(report.id)}
                                            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                                        >
                                            Görüntüle
                                        </button>
                                        <button
                                            onClick={() => handlePrintReport(report)}
                                            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                                        >
                                            Yazdır
                                        </button>
                                        <button
                                            onClick={() => handleDownloadReport(report)}
                                            className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
                                        >
                                            CSV İndir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Card */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
                {/* Toolbar */}
                <div className="p-4 bg-black/40 border-b border-white/5">
                    {/* Selection Bar - Shows when items are selected */}
                    {selectedIds.length > 0 ? (
                        <div className="flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => { setSelectedIds([]); setShowBulkConfirm(false) }}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <span className="text-white font-semibold text-lg">
                                    {selectedIds.length} ürün seçildi
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setConfirmBulkOpen(true)}
                                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-sm font-bold hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-600/20 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Seçilenleri Sil
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4 justify-between items-center">
                            <div className="flex flex-1 flex-wrap gap-3 items-center">
                                {/* Search */}
                                <div className="relative flex-1 max-w-xs">
                                    <input
                                        type="text"
                                        placeholder="Ürün ara..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') setSearchInput('')
                                        }}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                    />
                                    <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>

                                {/* Date Range */}
                                <div className="flex items-center gap-2 bg-black/30 p-2 rounded-2xl border border-white/10">
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider px-2">Dönem</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                    <span className="text-gray-600">-</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                </div>

                                {/* Filters */}
                                <div className="flex items-center gap-2 bg-black/30 p-2 rounded-2xl border border-white/10">
                                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider px-2">Filtre</span>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500/50 transition-all min-w-[120px]"
                                    >
                                        <option value="all">Tüm Kategoriler</option>
                                        {filterOptions.categories.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={unitFilter}
                                        onChange={(e) => setUnitFilter(e.target.value)}
                                        className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500/50 transition-all min-w-[100px]"
                                    >
                                        <option value="all">Tüm Birimler</option>
                                        {filterOptions.units.map(u => (
                                            <option key={u.id} value={u.name}>{u.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setIsFilterModalOpen(true)}
                                        className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex items-center justify-center transition-colors"
                                        title="Filtreleri Yönet"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchData}
                                    disabled={isLoading}
                                    className="px-4 py-2.5 bg-white/5 text-gray-300 font-medium rounded-xl text-sm hover:bg-white/10 hover:text-white border border-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Yenile
                                </button>
                                {userRole === 'ADMIN' && (
                                    <button
                                        onClick={() => setIsLogModalOpen(true)}
                                        className="px-4 py-2.5 bg-white/5 text-gray-300 font-medium rounded-xl text-sm hover:bg-white/10 hover:text-white border border-white/10 transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Geçmiş / Rapor
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Yeni Ürün
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-black/40 border-b border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1 flex items-center">
                        <input
                            type="checkbox"
                            checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                            onChange={handleSelectAll}
                            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                        />
                    </div>
                    <div className="col-span-3">Ürün Adı</div>
                    <div className="col-span-2">Kategori</div>
                    <div className="col-span-1 text-center">Başlangıç</div>
                    <div className="col-span-1 text-center text-green-500">+ Giren</div>
                    <div className="col-span-1 text-center text-red-500">- Çıkan</div>
                    <div className="col-span-1 text-center text-amber-400">Güncel</div>
                    <div className="col-span-2 text-right">İşlemler</div>
                </div>

                {/* Content Area */}
                <div className="relative min-h-[400px]">
                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <svg className="w-10 h-10 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-gray-400 text-sm font-medium">Yükleniyor...</span>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-amber-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <p className="text-gray-500 font-medium mb-2">
                                {searchTerm || categoryFilter !== 'all' || unitFilter !== 'all'
                                    ? 'Arama kriterlerine uygun ürün bulunamadı'
                                    : 'Henüz ürün eklenmemiş'
                                }
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-4 text-amber-400 hover:text-amber-300 font-medium text-sm flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                İlk ürünü ekle
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filteredProducts.map(product => (
                                <InventoryRow
                                    key={product.id}
                                    product={product}
                                    isSelected={selectedIds.includes(product.id)}
                                    onSelect={(checked) => handleSelectOne(product.id, checked)}
                                    onTransaction={fetchData}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                {filteredProducts.length > 0 && (
                    <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            {filteredProducts.length} ürün gösteriliyor
                            {(searchTerm || categoryFilter !== 'all' || unitFilter !== 'all') && (
                                <span className="ml-1">({products.length} toplam)</span>
                            )}
                        </span>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-500">
                                Dönem: <span className="text-white font-medium">{new Date(startDate).toLocaleDateString(locale)} - {new Date(endDate).toLocaleDateString(locale)}</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {isReportModalOpen && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl p-6 relative shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <button
                            onClick={() => setIsReportModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="flex items-center justify-between mb-4 pr-10">
                            <div>
                                <h2 className="text-xl font-bold text-white">Sayım Listesi</h2>
                                <p className="text-xs text-gray-500">{selectedReport.period}</p>
                                <p className="text-xs text-gray-500">Toplam Ürün: {selectedItemsCount} • Toplam Stok: {selectedItemsTotal}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePrintReport(selectedReport)}
                                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                                >
                                    Yazdır
                                </button>
                                <button
                                    onClick={() => handleDownloadReport(selectedReport)}
                                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
                                >
                                    CSV İndir
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                            {selectedReportData?.items?.length ? (
                                <table className="w-full text-left text-sm">
                                    <thead className="text-xs text-gray-500 uppercase border-b border-white/5">
                                        <tr>
                                            <th className="py-2">Ürün</th>
                                            <th className="py-2">Kategori</th>
                                            <th className="py-2 text-right">Stok</th>
                                            <th className="py-2 text-right">Sayım</th>
                                            <th className="py-2 text-right">Fark</th>
                                            <th className="py-2 text-right">Birim</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedReportData.items.map(item => (
                                            <tr key={item.id} className="border-b border-white/5">
                                                <td className="py-2 text-white">{item.name}</td>
                                                <td className="py-2 text-gray-400">{item.category || '-'}</td>
                                                <td className="py-2 text-right text-white font-mono">{item.currentStock}</td>
                                                <td className="py-2 text-right text-gray-500">-</td>
                                                <td className="py-2 text-right text-gray-500">-</td>
                                                <td className="py-2 text-right text-gray-400">{item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center text-gray-500 py-16">Liste verisi bulunamadı.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {isModalOpen && <NewProductModal onClose={() => setIsModalOpen(false)} onUpdate={fetchData} />}
            {isLogModalOpen && <InventoryLogModal onClose={() => setIsLogModalOpen(false)} />}
            {isFilterModalOpen && (
                <FilterManagementModal
                    onClose={() => setIsFilterModalOpen(false)}
                    onUpdate={() => {
                        fetchFilters()
                        fetchData()
                    }}
                />
            )}
            <ConfirmModal
                open={confirmBulkOpen}
                title="Toplu Silme"
                message={`${selectedIds.length} ürünü silmek istediğinize emin misiniz?`}
                confirmText="Sil"
                cancelText="Vazgeç"
                onConfirm={handleBulkDelete}
                onCancel={() => setConfirmBulkOpen(false)}
            />
        </div>
    )
}
