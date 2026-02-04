'use client'

import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '@/app/actions/settings'
import { useToast } from '@/app/providers/toast-provider'
import { getInventoryCountSchedule, updateInventoryCountSchedule } from '@/app/actions/inventory'

const MODULES = [
  { id: 'general', label: 'Genel' },
  { id: 'orders', label: 'Siparişler' },
  { id: 'inventory', label: 'Depo' },
  { id: 'lostFound', label: 'Kayıp Eşya' },
  { id: 'finance', label: 'Finans' },
  { id: 'reports', label: 'Raporlar' },
  { id: 'maintenance', label: 'Bakım' },
  { id: 'notifications', label: 'Bildirimler' },
]

export default function SettingsPage() {
  const [activeModule, setActiveModule] = useState('general')
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()
  const [schedule, setSchedule] = useState(null)
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const envMin = Number(process.env.NEXT_PUBLIC_ORDER_MIN_QTY)
  const envMax = Number(process.env.NEXT_PUBLIC_ORDER_MAX_QTY)
  const envOrdersActive = Number.isFinite(envMin) || Number.isFinite(envMax)

  useEffect(() => {
    getSettings().then(res => {
      if (res.success) setSettings(res.data || {})
      else addToast(res.error || 'Ayarlar alınamadı')
    }).finally(() => setLoading(false))
  }, [])

  const handleOrdersSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.target)
    const minQty = Number(form.get('minQty'))
    const maxQty = Number(form.get('maxQty'))
    if (Number.isFinite(minQty) && Number.isFinite(maxQty) && minQty > maxQty) {
      addToast('Minimum miktar, maksimumdan büyük olamaz', 'error')
      setSaving(false)
      return
    }
    try {
      const res = await updateSettings({ orders: { minQty, maxQty } })
      if (res.success === false) throw new Error(res.error)
      setSettings(prev => ({ ...prev, orders: res.data.orders }))
      addToast('Sipariş ayarları güncellendi', 'success')
    } catch (err) {
      addToast(err.message || 'Ayarlar güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationsSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.target)
    const pollIntervalMs = Number(form.get('pollIntervalMs'))
    if (!Number.isFinite(pollIntervalMs) || pollIntervalMs < 3000 || pollIntervalMs > 600000) {
      addToast('Aralık 3000-600000 ms arasında olmalı', 'error')
      setSaving(false)
      return
    }
    try {
      const res = await updateSettings({ notifications: { pollIntervalMs } })
      if (res.success === false) throw new Error(res.error)
      setSettings(prev => ({ ...prev, notifications: res.data.notifications }))
      addToast('Bildirim ayarları güncellendi', 'success')
    } catch (err) {
      addToast(err.message || 'Ayarlar güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleReportsSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.target)
    const minTextLength = Number(form.get('minTextLength'))
    try {
      const res = await updateSettings({ reports: { minTextLength } })
      if (res.success === false) throw new Error(res.error)
      setSettings(prev => ({ ...prev, reports: res.data.reports }))
      addToast('Rapor ayarları güncellendi', 'success')
    } catch (err) {
      addToast(err.message || 'Ayarlar güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleGeneralSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.target)
    const locale = String(form.get('locale'))
    try {
      const res = await updateSettings({ general: { locale } })
      if (res.success === false) throw new Error(res.error)
      setSettings(prev => ({ ...prev, general: res.data.general }))
      addToast('Genel ayarlar güncellendi', 'success')
    } catch (err) {
      addToast(err.message || 'Ayarlar güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (activeModule === 'inventory' && schedule === null) {
      getInventoryCountSchedule().then(res => {
        if (res.success) setSchedule(res.data)
      })
    }
  }, [activeModule, schedule])

  const handleInventoryScheduleSave = async (e) => {
    e.preventDefault()
    if (!schedule) return
    setScheduleSaving(true)
    const form = new FormData(e.target)
    const isEnabled = form.get('isEnabled') === 'on'
    const scheduleType = String(form.get('scheduleType'))
    const dayOfMonth = form.get('dayOfMonth') ? Number(form.get('dayOfMonth')) : null
    const timeOfDay = String(form.get('timeOfDay'))
    try {
      const res = await updateInventoryCountSchedule({ isEnabled, scheduleType, dayOfMonth, timeOfDay })
      if (res.success === false) throw new Error(res.error)
      setSchedule(res.data)
      addToast('Depo sayım takvimi güncellendi', 'success')
    } catch (err) {
      addToast(err.message || 'Takvim güncellenemedi')
    } finally {
      setScheduleSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
          <p className="text-white/60">Uygulama genelini ve modül ayarlarını yönetin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-black/40 border border-white/10 rounded-2xl p-3">
          <div className="text-xs text-gray-400 uppercase tracking-wider px-2 mb-2">Modüller</div>
          <div className="space-y-1">
            {MODULES.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${activeModule === m.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-3 bg-black/40 border border-white/10 rounded-2xl p-6">
          {loading ? (
            <div className="text-gray-500">Yükleniyor...</div>
          ) : activeModule === 'general' ? (
            <form onSubmit={handleGeneralSave} className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Genel Ayarlar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Dil/Locale</label>
                  <select
                    name="locale"
                    defaultValue={settings?.general?.locale ?? 'tr-TR'}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="tr-TR">Türkçe (tr-TR)</option>
                    <option value="en-US">English (en-US)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          ) : activeModule === 'orders' ? (
            <form onSubmit={handleOrdersSave} className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Sipariş Ayarları</h2>
              {envOrdersActive && (
                <div className="text-[11px] text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded-xl px-3 py-2 inline-block">
                  Ortam değişkeni aktif: Min {Number.isFinite(envMin) ? envMin : '—'}, Maks {Number.isFinite(envMax) ? envMax : '—'}. Ayarlar env ile override edilir.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Minimum Miktar</label>
                  <input
                    name="minQty"
                    type="number"
                    defaultValue={settings?.orders?.minQty ?? 1}
                    min={1}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Maksimum Miktar</label>
                  <input
                    name="maxQty"
                    type="number"
                    defaultValue={settings?.orders?.maxQty ?? 250000}
                    min={1}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
              <p className="text-xs text-gray-500">Not: Ortam değişkeni tanımlı ise öncelik ortam değerlerindedir.</p>
            </form>
          ) : activeModule === 'inventory' ? (
            <form onSubmit={handleInventoryScheduleSave} className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Depo Sayım Takvimi</h2>
              {!schedule ? (
                <div className="text-gray-500">Takvim yükleniyor...</div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="isEnabled" defaultChecked={schedule.isEnabled} className="h-5 w-5 rounded-md border border-white/20 bg-black" />
                    <span className="text-sm text-gray-300">Takvim aktif</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Zamanlama Tipi</label>
                      <select
                        name="scheduleType"
                        defaultValue={schedule.scheduleType}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      >
                        <option value="LAST_DAY">Ayın Son Günü</option>
                        <option value="DAY_OF_MONTH">Ayın Belirli Günü</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Saat</label>
                      <input
                        name="timeOfDay"
                        type="time"
                        defaultValue={schedule.timeOfDay}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Gün (1-31)</label>
                    <input
                      name="dayOfMonth"
                      type="number"
                      min={1}
                      max={31}
                      defaultValue={schedule.dayOfMonth ?? ''}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder="LAST_DAY için boş bırakın"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={scheduleSaving}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {scheduleSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : activeModule === 'notifications' ? (
            <form onSubmit={handleNotificationsSave} className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Bildirim Ayarları</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">SSE yoksa geri kazanım aralığı (ms)</label>
                  <input
                    name="pollIntervalMs"
                    type="number"
                    defaultValue={settings?.notifications?.pollIntervalMs ?? 10000}
                    min={3000}
                    max={600000}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          ) : activeModule === 'reports' ? (
            <form onSubmit={handleReportsSave} className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Rapor Ayarları</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Minimum metin uzunluğu</label>
                  <input
                    name="minTextLength"
                    type="number"
                    defaultValue={settings?.reports?.minTextLength ?? 5}
                    min={1}
                    max={1000}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-gray-500 text-sm">Bu modül için ayarlar yakında eklenecek.</div>
          )}
        </div>
      </div>
    </div>
  )
}
