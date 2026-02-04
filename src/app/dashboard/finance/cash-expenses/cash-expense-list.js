'use client'

import { useEffect, useState } from 'react'
import { getCashExpenses, getCashExpenseStats, getExpenseCategories, createCashExpense, addExpenseCategory, updateCashExpense, deleteCashExpense, updateExpenseCategory, deleteExpenseCategory } from '@/app/actions/cash-expense'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/app/providers/toast-provider'
import ConfirmModal from '@/app/components/confirm-modal'
import { getSettings } from '@/app/actions/settings'

export default function CashExpenseList({ initialExpenses, initialStats }) {
  const [expenses, setExpenses] = useState(initialExpenses || [])
  const [stats, setStats] = useState(initialStats || { totalAmount: 0, byCategory: [], byDay: {}, daysWithExpenses: 0 })
  const [categories, setCategories] = useState([])
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [locale, setLocale] = useState('tr-TR')

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const { addToast } = useToast()
  const [confirmState, setConfirmState] = useState({ open: false, onConfirm: null, message: '' })

  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const sd = params.get('startDate')
    const ed = params.get('endDate')
    const cat = params.get('category')
    const q = params.get('search')
    if (sd) setStartDate(sd)
    if (ed) setEndDate(ed)
    if (cat) setCategory(cat)
    if (q) setSearch(q)
    loadCategories()
  }, [])

  useEffect(() => {
    getSettings().then(res => {
      if (res.success && res.data?.general?.locale) {
        setLocale(String(res.data.general.locale))
      }
    }).catch(() => {})
  }, [])
  const showToast = (message, type = 'success') => addToast(message, type)

  const loadCategories = async () => {
    const res = await getExpenseCategories()
    if (res.success) setCategories(res.data)
  }

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const filters = { startDate: showAll ? undefined : startDate, endDate: showAll ? undefined : endDate, category, search, showAll }
      const [listRes, statsRes] = await Promise.all([getCashExpenses(filters), getCashExpenseStats(filters)])
      if (listRes.success) setExpenses(listRes.data)
      if (statsRes.success) setStats(statsRes.data)
    } catch (e) {
      showToast('Veriler alınamadı', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const p = new URLSearchParams(params)
    if (!showAll) {
      p.set('startDate', startDate)
      p.set('endDate', endDate)
    } else {
      p.delete('startDate'); p.delete('endDate')
    }
    if (category && category !== 'all') p.set('category', category); else p.delete('category')
    if (search) p.set('search', search); else p.delete('search')
    router.push(`?${p.toString()}`)
  }, [startDate, endDate, category, search, showAll])

  const handleCreate = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      date: fd.get('date'),
      category: fd.get('category'),
      description: fd.get('description'),
      amount: fd.get('amount'),
      paymentMethod: fd.get('paymentMethod') || 'CASH',
      receiptNumber: fd.get('receiptNumber')
    }
    const res = await createCashExpense(data)
    if (res.success) {
      setExpenses(prev => [res.data, ...prev])
      setShowCreate(false)
      fetchAll()
      e.target.reset()
      showToast('Harcama kaydedildi', 'success')
    } else {
      showToast(res.error || 'Hata oluştu', 'error')
    }
  }

  const handleAddCategory = async () => {
    const name = prompt('Yeni kategori adı:')
    if (!name) return
    const res = await addExpenseCategory({ name })
    if (res.success) {
      showToast('Kategori eklendi', 'success')
      loadCategories()
    } else {
      showToast(res.error, 'error')
    }
  }

  const downloadCsv = () => {
    const header = ['Tarih', 'Kategori', 'Açıklama', 'Tutar', 'Ödeme', 'Belge']
    const rows = expenses.map(e => [
      new Date(e.date).toLocaleString(locale),
      e.category,
      e.description,
      e.amount,
      e.paymentMethod || 'CASH',
      e.receiptNumber || ''
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nakit-cikis.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-rose-600/20 to-red-600/20 border border-rose-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
          <p className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">Toplam Çıkış</p>
          <p className="text-3xl font-bold text-white">{stats.totalAmount.toLocaleString(locale, { minimumFractionDigits: 2 })} ₺</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">İşlem Günü</p>
          <p className="text-3xl font-bold text-white">{stats.daysWithExpenses} gün</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 col-span-1 md:col-span-2 relative overflow-hidden">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Kategori Dağılımı</p>
          <div className="flex flex-wrap gap-2">
            {stats.byCategory.map(c => (
              <div key={c.category} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                <span className="text-xs text-gray-300">{c.category}</span>
                <span className="text-sm font-bold text-white">{c.amount.toLocaleString(locale)} ₺</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl min-h-[500px]">
        {/* Filter Bar */}
        <div className="p-4 bg-black/40 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-xl border border-white/10">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={showAll} className="bg-transparent text-white text-xs outline-none px-2 py-1 w-28 disabled:opacity-50" />
              <span className="text-gray-600">-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={showAll} className="bg-transparent text-white text-xs outline-none px-2 py-1 w-28 disabled:opacity-50" />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer bg-black/30 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="rounded border-gray-600 bg-gray-800 text-blue-500" />
              Tümü
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500">
              <option value="all">Tüm Kategoriler</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <div className="relative flex-1 md:w-48">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara..." className="w-full bg-black/30 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-blue-500" />
              <svg className="w-4 h-4 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button onClick={() => setShowCategoryManager(true)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors" title="Kategoriler">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button onClick={downloadCsv} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors" title="CSV İndir">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
              <span>+ Harcama Ekle</span>
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-4 space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">💸</div>
              <p className="text-gray-500">Bu tarih aralığında harcama kaydı bulunamadı.</p>
            </div>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/[0.02] hover:border-white/10 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex flex-col items-center justify-center border border-white/5 text-center">
                    <span className="text-xs font-bold text-gray-400 uppercase">{new Date(exp.date).toLocaleString(locale, { month: 'short' })}</span>
                    <span className="text-lg font-bold text-white">{new Date(exp.date).getDate()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">{exp.category}</span>
                      {exp.receiptNumber && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">#{exp.receiptNumber}</span>}
                    </div>
                    <p className="text-sm text-gray-400">{exp.description}</p>
                    <p className="text-xs text-gray-600 mt-1 md:hidden">{new Date(exp.date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} • {exp.paymentMethod === 'CASH' ? 'Nakit' : exp.paymentMethod}</p>
                  </div>
                </div>
                <div className="mt-3 md:mt-0 flex items-center justify-between md:justify-end gap-6">
                  <div className="text-right">
                      <p className="text-lg font-bold text-white font-mono tracking-tight">{exp.amount.toLocaleString(locale, { minimumFractionDigits: 2 })} ₺</p>
                      <p className="text-xs text-gray-500 hidden md:block">{new Date(exp.date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} • {exp.paymentMethod === 'CASH' ? 'Nakit' : exp.paymentMethod}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(exp); setShowEdit(true) }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => {
                      setConfirmState({
                        open: true,
                        message: 'Bu harcama kaydını silmek istediğinize emin misiniz?',
                        onConfirm: async () => {
                          const res = await deleteCashExpense({ id: exp.id })
                          if (res.success) { showToast('Kayıt silindi', 'success'); fetchAll() }
                          else showToast(res.error, 'error')
                          setConfirmState({ open: false, onConfirm: null, message: '' })
                        }
                      })
                    }} className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/20 text-red-500/50 group-hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl">
            <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-bold text-white mb-6">Yeni Harcama Ekle</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input name="date" type="datetime-local" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" defaultValue={new Date().toISOString().slice(0, 16)} />
              <div className="relative">
                <input name="category" list="categories" placeholder="Kategori (Seç veya Yaz)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
                <datalist id="categories">
                  {categories.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <input name="description" placeholder="Açıklama / Ürün" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="amount" type="number" step="0.01" placeholder="Tutar (₺)" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
                <select name="paymentMethod" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none">
                  <option value="CASH">Nakit</option>
                  <option value="CARD">Kredi Kartı</option>
                  <option value="TRANSFER">Havale/EFT</option>
                </select>
              </div>
              <input name="receiptNumber" placeholder="Fiş / Belge No (Opsiyonel)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all">Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit && editing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl">
            <button onClick={() => { setShowEdit(false); setEditing(null) }} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-bold text-white mb-6">Harcama Düzenle</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.target)
              const res = await updateCashExpense({
                id: editing.id,
                description: fd.get('description'),
                amount: fd.get('amount'),
                category: fd.get('category'),
                date: fd.get('date'),
                paymentMethod: fd.get('paymentMethod'),
                receiptNumber: fd.get('receiptNumber')
              })
              if (res.success) {
                showToast('Güncellendi')
                setShowEdit(false)
                fetchAll()
              } else showToast(res.error, 'error')
            }} className="space-y-4">
              <input name="date" type="datetime-local" defaultValue={new Date(editing.date).toISOString().slice(0, 16)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
              <input name="category" defaultValue={editing.category} list="categories" placeholder="Kategori" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
              <input name="description" defaultValue={editing.description} placeholder="Açıklama" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="amount" defaultValue={editing.amount} type="number" step="0.01" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" required />
                <select name="paymentMethod" defaultValue={editing.paymentMethod || 'CASH'} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none">
                  <option value="CASH">Nakit</option>
                  <option value="CARD">Kredi Kartı</option>
                  <option value="TRANSFER">Havale/EFT</option>
                </select>
              </div>
              <input name="receiptNumber" defaultValue={editing.receiptNumber} placeholder="Fiş / Belge No" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all">Güncelle</button>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MANAGER MODAL */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
            <button onClick={() => setShowCategoryManager(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-bold text-white mb-6">Kategoriler</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <button onClick={handleAddCategory} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold border border-white/10 border-dashed mb-4">+ Yeni Kategori Ekle</button>
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/5">
                  <input
                    defaultValue={cat.name}
                    className="flex-1 bg-transparent text-white text-sm outline-none"
                    onBlur={async (e) => {
                      const newName = e.target.value.trim()
                      if (newName && newName !== cat.name) {
                        await updateExpenseCategory({ id: cat.id, name: newName })
                        loadCategories()
                      }
                    }}
                  />
                  <button onClick={async () => {
                    setConfirmState({
                      open: true,
                      message: 'Bu kategoriyi silmek istediğinize emin misiniz?',
                      onConfirm: async () => {
                        await deleteExpenseCategory({ id: cat.id })
                        loadCategories()
                        setConfirmState({ open: false, onConfirm: null, message: '' })
                      }
                    })
                  }} className="text-red-500 hover:text-red-400 p-2">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmState.open}
        title="Silme Onayı"
        message={confirmState.message}
        confirmText="Sil"
        cancelText="Vazgeç"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, onConfirm: null, message: '' })}
      />
    </div>
  )
}
