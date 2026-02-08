'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/providers/toast-provider'
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem
} from '@/app/actions/gallery'

export default function PhotoGalleryDashboard({ initialDepartments, user }) {
  const router = useRouter()
  const [departments, setDepartments] = useState(initialDepartments || [])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    initialDepartments?.[0]?.id || null
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [newDepartmentDesc, setNewDepartmentDesc] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemSize, setNewItemSize] = useState('')
  const [newItemPhoto, setNewItemPhoto] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()

  const isAdmin = user?.role === 'ADMIN'

  const showToast = (message, type = 'success') => addToast(message, type)

  const refreshFromServer = async () => {
    router.refresh()
  }

  const handleAddDepartment = async (e) => {
    e.preventDefault()
    if (!newDepartmentName.trim()) return
    setIsSubmitting(true)
    try {
      const res = await createDepartment({
        name: newDepartmentName.trim(),
        description: newDepartmentDesc.trim() || undefined
      })
      if (!res.success) throw new Error(res.error)
      setNewDepartmentName('')
      setNewDepartmentDesc('')
      showToast('Departman eklendi')
      refreshFromServer()
    } catch (err) {
      showToast(err.message || 'Departman eklenemedi', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!selectedDepartmentId || !newCategoryName.trim()) return
    setIsSubmitting(true)
    try {
      const res = await createCategory({
        departmentId: selectedDepartmentId,
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim() || undefined
      })
      if (!res.success) throw new Error(res.error)
      setNewCategoryName('')
      setNewCategoryDesc('')
      showToast('Kategori eklendi')
      refreshFromServer()
    } catch (err) {
      showToast(err.message || 'Kategori eklenemedi', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!selectedCategoryId || !newItemName.trim()) return
    setIsSubmitting(true)
    try {
      const res = await createItem({
        categoryId: selectedCategoryId,
        name: newItemName.trim(),
        description: newItemDesc.trim() || undefined,
        sizeLabel: newItemSize.trim() || undefined,
        photoUrl: newItemPhoto.trim() || undefined
      })
      if (!res.success) throw new Error(res.error)
      setNewItemName('')
      setNewItemDesc('')
      setNewItemSize('')
      setNewItemPhoto('')
      showToast('Ürün eklendi')
      refreshFromServer()
    } catch (err) {
      showToast(err.message || 'Ürün eklenemedi', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeDepartment =
    departments.find((d) => d.id === selectedDepartmentId) || departments[0] || null
  const activeCategories = activeDepartment ? activeDepartment.categories : []
  const activeCategory =
    activeCategories.find((c) => c.id === selectedCategoryId) || activeCategories[0] || null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Servis Departmanları</h2>
          <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
            {departments.length === 0 && (
              <div className="text-xs text-gray-400">Henüz departman yok.</div>
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

        {isAdmin && (
          <form onSubmit={handleAddDepartment} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Yeni Departman</h3>
            <input
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="Servis Departmanı"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              disabled={isSubmitting}
            />
            <input
              value={newDepartmentDesc}
              onChange={(e) => setNewDepartmentDesc(e.target.value)}
              placeholder="Açıklama (opsiyonel)"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newDepartmentName.trim()}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-2 rounded-xl transition-all disabled:opacity-50"
            >
              Departman Ekle
            </button>
          </form>
        )}
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {activeDepartment ? activeDepartment.name : 'Departman seçin'}
              </h2>
              {activeDepartment?.description && (
                <p className="text-xs text-gray-400 mt-1">{activeDepartment.description}</p>
              )}
            </div>
            {isAdmin && activeDepartment && (
              <div className="text-xs text-gray-400">
                Toplam kategori: {activeDepartment.categories.length}
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-64">
              <div className="border border-white/10 rounded-2xl p-3 bg-black/40">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">Kategoriler</h3>
                </div>
                <div className="space-y-1 max-h-[260px] overflow-auto pr-1">
                  {!activeDepartment && (
                    <div className="text-xs text-gray-400">Önce departman ekleyin.</div>
                  )}
                  {activeDepartment && activeDepartment.categories.length === 0 && (
                    <div className="text-xs text-gray-400">Henüz kategori yok.</div>
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

              {isAdmin && activeDepartment && (
                <form onSubmit={handleAddCategory} className="mt-3 border border-white/10 rounded-2xl p-3 bg-black/40 space-y-2">
                  <h4 className="text-xs font-semibold text-white">
                    {activeDepartment.name} için kategori
                  </h4>
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Temizlik - Hijyen"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    disabled={isSubmitting}
                  />
                  <input
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Açıklama (opsiyonel)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newCategoryName.trim()}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold py-2 rounded-xl transition-all disabled:opacity-50"
                  >
                    Kategori Ekle
                  </button>
                </form>
              )}
            </div>

            <div className="flex-1">
              <div className="border border-white/10 rounded-2xl p-4 bg-black/40">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    {activeCategory ? activeCategory.name : 'Kategori seçin'}
                  </h3>
                  {activeCategory && (
                    <span className="text-xs text-gray-400">
                      Toplam ürün: {activeCategory.items.length}
                    </span>
                  )}
                </div>

                {!activeCategory && (
                  <div className="text-xs text-gray-400">
                    Ürün listelemek için önce kategori seçin.
                  </div>
                )}

                {activeCategory && (
                  <div className="border border-white/5 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 bg-white/5 text-xs text-gray-300 px-3 py-2">
                      <div className="col-span-5">Ürün</div>
                      <div className="col-span-3">Fotoğraf</div>
                      <div className="col-span-2 text-center">Boyut</div>
                      <div className="col-span-2 text-right">Sıra</div>
                    </div>
                    <div className="divide-y divide-white/5">
                      {activeCategory.items.length === 0 && (
                        <div className="px-3 py-3 text-xs text-gray-400">
                          Bu kategoride henüz ürün yok.
                        </div>
                      )}
                      {activeCategory.items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 items-center px-3 py-2 text-xs text-gray-100"
                        >
                          <div className="col-span-5 truncate">{item.name}</div>
                          <div className="col-span-3">
                            {item.photoUrl ? (
                              <img
                                src={item.photoUrl}
                                alt={item.name}
                                className="h-10 w-10 object-cover rounded-lg border border-white/10"
                              />
                            ) : (
                              <span className="text-gray-500">Yok</span>
                            )}
                          </div>
                          <div className="col-span-2 text-center">
                            {item.sizeLabel || '-'}
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px]">
                              {item.position}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isAdmin && activeCategory && (
                <form onSubmit={handleAddItem} className="mt-4 border border-white/10 rounded-2xl p-4 bg-black/40 space-y-3">
                  <h4 className="text-sm font-semibold text-white">
                    {activeCategory.name} için yeni ürün
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Ürün adı"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                      disabled={isSubmitting}
                    />
                    <input
                      value={newItemSize}
                      onChange={(e) => setNewItemSize(e.target.value)}
                      placeholder="Boyut / Sıra bilgisi"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                  <input
                    value={newItemPhoto}
                    onChange={(e) => setNewItemPhoto(e.target.value)}
                    placeholder="Fotoğraf URL"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    disabled={isSubmitting}
                  />
                  <textarea
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Açıklama"
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none resize-none"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !newItemName.trim()}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-sm font-bold py-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    Ürün Ekle
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

