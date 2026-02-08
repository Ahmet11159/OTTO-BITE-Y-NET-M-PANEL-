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
  deleteItem,
  reorderItemsInCategory
} from '@/app/actions/gallery'
import ConfirmModal from '@/app/components/confirm-modal'

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
  const [search, setSearch] = useState('')
  const [detailItem, setDetailItem] = useState(null)
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null })
  const { addToast } = useToast()

  const isAdmin = user?.role === 'ADMIN'

  const showToast = (message, type = 'success') => addToast(message, type)

  const openConfirm = (message, onConfirm) => {
    setConfirmState({
      open: true,
      message,
      onConfirm: async () => {
        await onConfirm()
        setConfirmState({ open: false, message: '', onConfirm: null })
      }
    })
  }

  const closeConfirm = () => {
    setConfirmState({ open: false, message: '', onConfirm: null })
  }

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

  const handleDeleteItem = (item) => {
    if (!isAdmin) return
    openConfirm(
      `"${item.name}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      async () => {
        setIsSubmitting(true)
        try {
          const res = await deleteItem({ id: item.id })
          if (!res.success) throw new Error(res.error)
          showToast('Ürün silindi')
          router.refresh()
        } catch (err) {
          showToast(err.message || 'Ürün silinemedi', 'error')
        } finally {
          setIsSubmitting(false)
        }
      }
    )
  }

  const handleMoveItem = async (itemId, direction) => {
    if (!isAdmin) return
    if (!activeCategory || !activeCategory.items || activeCategory.items.length < 2) return

    const sorted = [...activeCategory.items].sort((a, b) => a.position - b.position)
    const index = sorted.findIndex((i) => i.id === itemId)
    if (index === -1) return

    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sorted.length) return

    const temp = sorted[index]
    sorted[index] = sorted[targetIndex]
    sorted[targetIndex] = temp

    const orderedIds = sorted.map((i) => i.id)

    setIsSubmitting(true)
    try {
      const res = await reorderItemsInCategory({
        categoryId: activeCategory.id,
        itemIds: orderedIds
      })
      if (!res.success) throw new Error(res.error)
      showToast('Sıralama güncellendi')
      router.refresh()
    } catch (err) {
      showToast(err.message || 'Sıralama güncellenemedi', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }
  const filteredItems =
    activeCategory && activeCategory.items
      ? activeCategory.items.filter((item) => {
          if (!search.trim()) return true
          const q = search.toLowerCase()
          return (
            item.name.toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q)
          )
        })
      : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Departmanlar</h2>
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

        {/* Departman ekleme artık depo modülü üzerinden yönetiliyor */}
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

              {/* Kategori ekleme artık depo modülündeki filtre yönetimi üzerinden yapılır */}
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
                        {activeDepartment.name} › {activeCategory.name} › Ürünler
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
                      {filteredItems.length === 0 && (
                        <div className="px-3 py-3 text-xs text-gray-400">
                          Bu kategoride aramaya uygun ürün bulunamadı.
                        </div>
                      )}
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 items-center px-3 py-2 text-xs text-gray-100"
                        >
                          <button
                            type="button"
                            onClick={() => setDetailItem(item)}
                            className="col-span-5 text-left truncate hover:text-amber-200"
                          >
                            {item.name}
                          </button>
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
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] mr-1">
                              {item.position}
                            </span>
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleMoveItem(item.id, -1)}
                                  disabled={isSubmitting}
                                  className="px-1.5 py-1 rounded-lg border border-white/10 bg-white/5 text-[11px] hover:bg-white/10 disabled:opacity-40"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveItem(item.id, 1)}
                                  disabled={isSubmitting}
                                  className="px-1.5 py-1 rounded-lg border border-white/10 bg-white/5 text-[11px] hover:bg-white/10 disabled:opacity-40"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item)}
                                  disabled={isSubmitting}
                                  className="px-1.5 py-1 rounded-lg border border-red-500/40 bg-red-500/10 text-[11px] text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                                >
                                  Sil
                                </button>
                              </>
                            )}
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

      {detailItem && (
        <div className="fixed inset-0 z-[900] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  {activeDepartment ? activeDepartment.name : ''}{' '}
                  {activeCategory ? `› ${activeCategory.name}` : ''}
                </div>
                <div className="text-lg font-semibold text-white">{detailItem.name}</div>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10"
              >
                Kapat
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                {detailItem.photoUrl ? (
                  <img
                    src={detailItem.photoUrl}
                    alt={detailItem.name}
                    className="w-full h-48 object-cover rounded-xl border border-white/10"
                  />
                ) : (
                  <div className="w-full h-48 rounded-xl border border-dashed border-white/15 flex items-center justify-center text-xs text-gray-500">
                    Fotoğraf eklenmemiş
                  </div>
                )}
              </div>
              <div className="md:col-span-2 space-y-3">
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {detailItem.sizeLabel && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200">
                      {detailItem.sizeLabel}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-200">
                    Pozisyon: {detailItem.position}
                  </span>
                </div>
                <div className="text-sm text-gray-200 whitespace-pre-line">
                  {detailItem.description || 'Açıklama eklenmemiş.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmState.open}
        title="Onay"
        message={confirmState.message}
        onCancel={closeConfirm}
        onConfirm={confirmState.onConfirm}
      />
    </div>
  )
}
