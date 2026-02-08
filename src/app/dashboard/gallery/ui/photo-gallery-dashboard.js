'use client'

import { useState, useMemo } from 'react'
import { useToast } from '@/app/providers/toast-provider'
import { updateProductPhoto } from '@/app/actions/gallery'

export default function PhotoGalleryDashboard({ initialDepartments, user }) {
  const { addToast } = useToast()
  const [departments, setDepartments] = useState(initialDepartments || [])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    initialDepartments?.[0]?.id || null
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [editingPhoto, setEditingPhoto] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = user?.role === 'ADMIN'

  const activeDepartment =
    departments.find((d) => d.id === selectedDepartmentId) || departments[0] || null
  const activeCategories = activeDepartment ? activeDepartment.categories : []
  const activeCategory =
    activeCategories.find((c) => c.id === selectedCategoryId) || activeCategories[0] || null

  const filteredItems = useMemo(() => {
    if (!activeCategory || !activeCategory.items) return []
    if (!search.trim()) return activeCategory.items
    const q = search.toLowerCase()
    return activeCategory.items.filter((item) => item.name.toLowerCase().includes(q))
  }, [activeCategory, search])

  const handlePhotoEditOpen = (item) => {
    if (!isAdmin) return
    setEditingItem(item)
    setEditingPhoto(item.photoUrl || '')
  }

  const handlePhotoSave = async (e) => {
    e.preventDefault()
    if (!editingItem) return
    setIsSubmitting(true)
    try {
      const res = await updateProductPhoto({
        id: editingItem.id,
        photoUrl: editingPhoto.trim()
      })
      if (!res.success) throw new Error(res.error)
      const updated = res.data
      setDepartments((prev) =>
        prev.map((dept) => ({
          ...dept,
          categories: dept.categories.map((cat) => ({
            ...cat,
            items: cat.items.map((it) =>
              it.id === updated.id ? { ...it, photoUrl: updated.photoUrl } : it
            )
          }))
        }))
      )
      addToast('Fotoğraf bilgisi güncellendi', 'success')
      setEditingItem(null)
      setEditingPhoto('')
    } catch (err) {
      addToast(err.message || 'Fotoğraf güncellenemedi', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Departmanlar</h2>
          <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
            {departments.length === 0 && (
              <div className="text-xs text-gray-400">Depoda tanımlı departman bulunamadı.</div>
            )}
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => {
                  setSelectedDepartmentId(dept.id)
                  setSelectedCategoryId(null)
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                  activeDepartment && activeDepartment.id === dept.id
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'bg-black/30 text-gray-300 border border-white/5 hover:bg-white/10'
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {activeDepartment ? activeDepartment.name : 'Departman seçin'}
              </h2>
              {activeDepartment && (
                <p className="text-xs text-gray-400 mt-1">
                  Depodaki ürünler departman ve kategoriye göre gruplanır.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-64">
              <div className="border border-white/10 rounded-2xl p-3 bg-black/40">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">Kategoriler</h3>
                </div>
                <div className="space-y-1 max-h-[260px] overflow-auto pr-1">
                  {!activeDepartment && (
                    <div className="text-xs text-gray-400">Önce departman seçin.</div>
                  )}
                  {activeDepartment && activeDepartment.categories.length === 0 && (
                    <div className="text-xs text-gray-400">Bu departmanda kategori yok.</div>
                  )}
                  {activeDepartment &&
                    activeDepartment.categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                          activeCategory && activeCategory.id === cat.id
                            ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/40'
                            : 'bg-black/30 text-gray-300 border border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="border border-white/10 rounded-2xl p-4 bg-black/40">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {activeCategory ? activeCategory.name : 'Kategori seçin'}
                    </h3>
                    {activeDepartment && activeCategory && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        {activeDepartment.name} › {activeCategory.name}
                      </p>
                    )}
                  </div>
                  {activeCategory && (
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:block text-[11px] text-gray-400">
                        Toplam ürün: {activeCategory.items.length}
                      </div>
                      <div className="relative">
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Ürün ara..."
                          className="w-40 sm:w-56 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!activeCategory && (
                  <div className="text-xs text-gray-400">
                    Fotoğrafları görmek için önce kategori seçin.
                  </div>
                )}

                {activeCategory && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.length === 0 && (
                      <div className="text-xs text-gray-400 col-span-full">
                        Bu kategoride aramaya uygun ürün bulunamadı.
                      </div>
                    )}
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="border border-white/10 rounded-2xl bg-black/40 overflow-hidden flex flex-col"
                      >
                        <div className="aspect-video bg-black/60 flex items-center justify-center">
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[11px] text-gray-500">
                              Fotoğraf eklenmemiş
                            </span>
                          )}
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-sm font-semibold text-white truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-1">
                              {activeDepartment?.name} › {activeCategory.name}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              Birim: {item.unit}
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handlePhotoEditOpen(item)}
                              className="mt-3 w-full text-[11px] px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 transition-colors"
                            >
                              Fotoğraf URL&apos;ini düzenle
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && editingItem && (
        <div className="fixed inset-0 z-[900] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Fotoğraf URL&apos;i</div>
                <div className="text-lg font-semibold text-white">{editingItem.name}</div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10"
              >
                Kapat
              </button>
            </div>
            <form onSubmit={handlePhotoSave} className="space-y-4">
              <div className="space-y-2">
                <input
                  value={editingPhoto}
                  onChange={(e) => setEditingPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  disabled={isSubmitting}
                />
                <p className="text-[11px] text-gray-500">
                  Boş bırakırsanız ürün için fotoğraf gösterilmez. Değer URL olmalıdır.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 rounded-xl border border-white/15 text-xs text-gray-300 hover:bg-white/10"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-xs font-semibold text-black hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
