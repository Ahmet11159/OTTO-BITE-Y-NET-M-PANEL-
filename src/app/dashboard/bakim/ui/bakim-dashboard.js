'use client'

import { useState, useEffect } from 'react'
import { createEquipment, updateEquipment, deleteEquipment, createPlan, updatePlan, deletePlan, createRecord, revertLastRecord } from '@/app/actions/bakim'
import { getSettings } from '@/app/actions/settings'

export default function BakimDashboard({ initialEquipment, initialPlans, initialRecords }) {
  const [activeTab, setActiveTab] = useState('equipment')
  const [equipment, setEquipment] = useState(initialEquipment || [])
  const [plans, setPlans] = useState(initialPlans || [])
  const [records, setRecords] = useState(initialRecords || [])
  const [locale, setLocale] = useState('tr-TR')

  useEffect(() => {
    getSettings().then(res => {
      if (res.success && res.data?.general?.locale) {
        setLocale(String(res.data.general.locale))
      }
    }).catch(() => {})
  }, [])

  // Modals
  const [showNewEq, setShowNewEq] = useState(false)
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [selectedEqId, setSelectedEqId] = useState(null)
  const [showEditEq, setShowEditEq] = useState(false)
  const [editingEq, setEditingEq] = useState(null)
  const [showEditPlan, setShowEditPlan] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  // UI State
  const [toast, setToast] = useState(null)
  const [completedPlans, setCompletedPlans] = useState({})

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Stats
  const stats = {
    totalEquipment: equipment.length,
    activePlans: plans.filter(p => p.status !== 'CANCELLED').length,
    tasksToday: plans.filter(p => {
      if (!p.nextDueDate) return false
      const today = new Date().toISOString().slice(0, 10)
      const due = new Date(p.nextDueDate).toISOString().slice(0, 10)
      return due <= today
    }).length
  }

  const handleCreateEq = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      name: fd.get('name'),
      serial: fd.get('serial') || undefined,
      location: fd.get('location') || undefined,
      vendor: fd.get('vendor') || undefined,
      defaultCycleDays: fd.get('defaultCycleDays') ? Number(fd.get('defaultCycleDays')) : undefined,
      status: fd.get('status') || 'ACTIVE'
    }
    const res = await createEquipment(data)
    if (res.success) {
      setEquipment(prev => [res.data, ...prev])
      setShowNewEq(false)
      e.target.reset()
      showToast('Ekipman başarıyla eklendi')
    } else showToast(res.error || 'Hata oluştu', 'error')
  }

  const handleCreatePlan = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      equipmentId: Number(fd.get('equipmentId')),
      title: fd.get('title'),
      firm: fd.get('firm') || undefined,
      description: fd.get('description') || undefined,
      startDate: fd.get('startDate') || undefined,
      cycleDays: fd.get('cycleDays') ? Number(fd.get('cycleDays')) : undefined,
      notifyThresholds: fd.get('notifyThresholds') || undefined,
      nextDueDate: fd.get('nextDueDate') || undefined
    }
    const res = await createPlan(data)
    if (res.success) {
      setPlans(prev => [res.data, ...prev])
      setShowNewPlan(false)
      e.target.reset()
      showToast('Bakım planı oluşturuldu')
    } else showToast(res.error || 'Hata oluştu', 'error')
  }

  const handleQuickDone = async (eqId, planId) => {
    const res = await createRecord({ equipmentId: eqId, planId, description: 'Bakım yapıldı' })
    if (res.success) {
      setRecords(prev => [res.data, ...prev])
      setPlans(prev => prev.map(p => {
        if (p.id !== planId) return p
        const ms = 24 * 60 * 60 * 1000
        if (p.cycleDays) {
          const nd = new Date(Date.now() + Number(p.cycleDays) * ms)
          return { ...p, nextDueDate: nd }
        }
        return p
      }))
      setCompletedPlans(prev => ({ ...prev, [planId]: true }))
      showToast('Bakım tamamlandı işaretlendi')
    } else showToast(res.error || 'Hata', 'error')
  }

  const handleUndoDone = async (planId) => {
    const res = await revertLastRecord({ planId })
    if (res.success) {
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, nextDueDate: res.data.revertedTo || null } : p))
      setCompletedPlans(prev => {
        const cp = { ...prev }
        delete cp[planId]
        return cp
      })
      showToast('Son işlem geri alındı')
    } else {
      showToast(res.error || 'Geri alma başarısız', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Premium Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transform transition-all animate-slide-in-right backdrop-blur-xl ${toast.type === 'error'
          ? 'bg-gradient-to-r from-red-600/90 to-rose-600/90 text-white border border-red-400/30'
          : 'bg-gradient-to-r from-emerald-600/90 to-green-600/90 text-white border border-green-400/30'
          }`}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            {toast.type === 'error' ? '✕' : '✓'}
          </div>
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="relative">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Toplam Ekipman</p>
            <p className="text-3xl font-bold text-white">{stats.totalEquipment}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="relative">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Aktif Planlar</p>
            <p className="text-3xl font-bold text-white">{stats.activePlans}</p>
          </div>
        </div>
        <div className={`bg-gradient-to-br border rounded-2xl p-5 relative overflow-hidden group transition-all ${stats.tasksToday > 0
          ? 'from-rose-600/20 to-red-600/20 border-rose-500/20 shadow-[0_0_30px_rgba(225,29,72,0.15)]'
          : 'from-emerald-600/20 to-green-600/20 border-emerald-500/20'
          }`}>
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-all ${stats.tasksToday > 0 ? 'bg-rose-500/10 group-hover:bg-rose-500/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'}`}></div>
          <div className="relative">
            <p className={`${stats.tasksToday > 0 ? 'text-rose-400' : 'text-emerald-400'} text-xs font-bold uppercase tracking-wider mb-1`}>
              {stats.tasksToday > 0 ? 'Geciken / Bugün' : 'Durum'}
            </p>
            <p className="text-3xl font-bold text-white">
              {stats.tasksToday > 0 ? stats.tasksToday : 'Her Şey Yolunda'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl min-h-[600px]">
        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-black/20 p-1">
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 py-4 text-sm font-bold transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'equipment' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <span>🔧 Ekipmanlar</span>
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 py-4 text-sm font-bold transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'plans' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <span>📅 Bakım Planları</span>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-4 text-sm font-bold transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'records' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <span>📋 Kayıtlar</span>
          </button>
        </div>

        <div className="p-6">
          {/* EQUIPMENT TAB */}
          {activeTab === 'equipment' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Ekipman Listesi</h3>
                <button
                  onClick={() => setShowNewEq(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                  <span>+ Yeni Ekipman</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {equipment.map(eq => (
                  <div key={eq.id} className="group bg-black/40 border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all hover:bg-black/60 relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                          <span className="text-lg font-bold">{eq.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-white leading-tight">{eq.name}</h4>
                          <p className="text-xs text-gray-500">{eq.serial || 'Seri No Yok'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${eq.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                        }`}>
                        {eq.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Konum</span>
                        <span className="text-gray-300">{eq.location || '-'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tedarikçi</span>
                        <span className="text-gray-300">{eq.vendor || '-'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-white/5">
                      <button
                        onClick={() => { setSelectedEqId(eq.id); setShowNewPlan(true) }}
                        className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-colors"
                      >
                        Bakım Planla
                      </button>
                      <button
                        onClick={() => { setEditingEq(eq); setShowEditEq(true) }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                      >
                        ✎
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Ekipman silinsin mi?')) return
                          const res = await deleteEquipment({ id: eq.id })
                          if (res.success) { setEquipment(prev => prev.filter(x => x.id !== eq.id)); showToast('Ekipman silindi') }
                        }}
                        className="p-2 bg-red-500/5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PLANS TAB */}
          {activeTab === 'plans' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Bakım Planları</h3>
                <button
                  onClick={() => setShowNewPlan(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2"
                >
                  <span>+ Yeni Plan</span>
                </button>
              </div>

              <div className="space-y-3">
                {plans.map(p => {
                  const isDue = p.nextDueDate && new Date(p.nextDueDate) <= new Date()
                  return (
                    <div key={p.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-white/[0.02] ${isDue ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/5 bg-black/20'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border font-bold text-lg ${isDue ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          }`}>
                          {isDue ? '!' : '📅'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white">{p.title}</h4>
                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{p.equipment?.name}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span>Firma: {p.firm || '-'}</span>
                            <span>•</span>
                            <span className={isDue ? 'text-rose-400 font-bold' : ''}>
                              Hedef: {p.nextDueDate ? new Date(p.nextDueDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirsiz'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {completedPlans[p.id] ? (
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 text-sm font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">Tamamlandı ✓</span>
                            <button
                              onClick={() => handleUndoDone(p.id)}
                              className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors text-xs"
                              title="Geri Al"
                            >
                              ↩
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleQuickDone(p.equipmentId, p.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                            >
                              Tamamla
                            </button>
                            <button
                              onClick={() => { setEditingPlan(p); setShowEditPlan(true) }}
                              className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                            >
                              ✎
                            </button>
                          </>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm('Plan silinsin mi?')) return
                            const res = await deletePlan({ id: p.id })
                            if (res.success) { setPlans(prev => prev.filter(x => x.id !== p.id)); showToast('Plan silindi') }
                          }}
                          className="p-2 bg-red-500/5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* RECORDS TAB */}
          {activeTab === 'records' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">İşlem Geçmişi</h3>
              <div className="space-y-2">
                {records.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 text-xs font-mono border border-white/5">
                        {new Date(r.date).getDate()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{r.equipment?.name}</span>
                          <span className="text-xs text-gray-500">→</span>
                          <span className="text-sm text-gray-300">{r.plan?.title || 'Plansız Bakım'}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(r.date).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          {r.description && ` • ${r.description}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-emerald-500 text-xs font-bold px-2 py-1 bg-emerald-500/10 rounded-lg">Tamamlandı</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NEW EQUIPMENT MODAL */}
      {showNewEq && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl">
            <button onClick={() => setShowNewEq(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-bold text-white mb-6">Yeni Ekipman Ekle</h3>
            <form onSubmit={handleCreateEq} className="space-y-4">
              <input name="name" placeholder="Ekipman Adı" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-600" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="serial" placeholder="Seri No" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-600" />
                <input name="location" placeholder="Konum" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-600" />
              </div>
              <input name="vendor" placeholder="Tedarikçi Firma" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-600" />
              <input name="defaultCycleDays" type="number" placeholder="Varsayılan Bakım Periyodu (Gün)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-600" />
              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all">Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EQUIPMENT MODAL - Similar structure */}
      {showEditEq && editingEq && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl">
            <button onClick={() => { setShowEditEq(false); setEditingEq(null) }} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-bold text-white mb-6">Ekipman Düzenle</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.target)
              const res = await updateEquipment({
                id: editingEq.id,
                name: fd.get('name'),
                serial: fd.get('serial'),
                location: fd.get('location'),
                vendor: fd.get('vendor'),
                defaultCycleDays: fd.get('defaultCycleDays') ? Number(fd.get('defaultCycleDays')) : null,
                status: fd.get('status')
              })
              if (res.success) {
                setEquipment(prev => prev.map(x => x.id === editingEq.id ? res.data : x))
                showToast('Güncellendi')
                setShowEditEq(false)
              } else showToast(res.error, 'error')
            }} className="space-y-4">
              <input name="name" defaultValue={editingEq.name} placeholder="Ekipman Adı" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="serial" defaultValue={editingEq.serial} placeholder="Seri No" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                <input name="location" defaultValue={editingEq.location} placeholder="Konum" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <input name="vendor" defaultValue={editingEq.vendor} placeholder="Tedarikçi" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input name="defaultCycleDays" defaultValue={editingEq.defaultCycleDays} type="number" placeholder="Periyot (Gün)" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                <select name="status" defaultValue={editingEq.status} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none">
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Pasif</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all">Güncelle</button>
            </form>
          </div>
        </div>
      )}

      {/* NEW PLAN MODAL */}
      {showNewPlan && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl">
            <button onClick={() => setShowNewPlan(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-bold text-white mb-6">Yeni Bakım Planı</h3>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-bold ml-1">EKİPMAN</label>
                <select name="equipmentId" defaultValue={selectedEqId || ""} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" required>
                  <option value="" disabled>Seçiniz</option>
                  {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                </select>
              </div>
              <input name="title" placeholder="Plan Başlığı (Örn: Haftalık Temizlik)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="cycleDays" type="number" placeholder="Döngü (Gün)" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                <input name="nextDueDate" type="date" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
              </div>
              <input name="firm" placeholder="Sorumlu Firma (Opsiyonel)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
              <textarea name="description" placeholder="Açıklama / Notlar" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none h-24 custom-scrollbar" />
              <button type="submit" className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-600/20 transition-all">Planı Oluştur</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {showEditPlan && editingPlan && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl">
            <button onClick={() => { setShowEditPlan(false); setEditingPlan(null) }} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">✕</button>
            <h3 className="text-xl font-bold text-white mb-6">Planı Düzenle</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.target)
              const payload = {
                id: editingPlan.id,
                equipmentId: Number(fd.get('equipmentId')),
                title: fd.get('title'),
                firm: fd.get('firm'),
                description: fd.get('description'),
                cycleDays: fd.get('cycleDays') ? Number(fd.get('cycleDays')) : null,
                nextDueDate: fd.get('nextDueDate'),
                status: fd.get('status')
              }
              const res = await updatePlan(payload)
              if (res.success) {
                setPlans(prev => prev.map(x => x.id === editingPlan.id ? { ...x, ...payload, equipment: equipment.find(e => e.id === payload.equipmentId) } : x))
                showToast('Plan güncellendi')
                setShowEditPlan(false)
              } else showToast(res.error, 'error')
            }} className="space-y-4">
              <select name="equipmentId" defaultValue={editingPlan.equipmentId} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" required>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
              <input name="title" defaultValue={editingPlan.title} placeholder="Başlık" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" required />
              <div className="grid grid-cols-2 gap-4">
                <input name="cycleDays" defaultValue={editingPlan.cycleDays} type="number" placeholder="Döngü" className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                <input name="nextDueDate" type="date" defaultValue={editingPlan.nextDueDate ? new Date(editingPlan.nextDueDate).toISOString().slice(0, 10) : ''} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
              </div>
              <input name="firm" defaultValue={editingPlan.firm} placeholder="Firma" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
              <textarea name="description" defaultValue={editingPlan.description} placeholder="Notlar" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none h-24 custom-scrollbar" />
              <button type="submit" className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-600/20 transition-all">Güncelle</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
