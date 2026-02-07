'use client'

import { useState, useRef, useEffect } from 'react'
import { createOrder, toggleItemReceived, toggleInventorySync, deleteOrder } from '@/app/actions/orders'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/providers/toast-provider'
import ConfirmModal from '@/app/components/confirm-modal'
import { getOrderLimits } from '@/lib/app-config'

export default function OrderDashboard({ initialOrders, initialUnfilled, user, inventoryProducts = [], initialLocale = 'tr-TR' }) {
    const [activeTab, setActiveTab] = useState('active')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const { addToast } = useToast()
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [editingOrder, setEditingOrder] = useState(null)
    const [editTitle, setEditTitle] = useState('')
    const [editingItem, setEditingItem] = useState(null)
    const [editItemQuantity, setEditItemQuantity] = useState('')
    
    // Received Confirmation State
    const [confirmingItem, setConfirmingItem] = useState(null)
    const [receivedQuantityInput, setReceivedQuantityInput] = useState('')
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })

    const router = useRouter()

    // New Order Form State
    const [orderTitle, setOrderTitle] = useState('')
    const [orderItems, setOrderItems] = useState([])
    const [locale, setLocale] = useState(initialLocale || 'tr-TR')

    // Product Selector State
    const [productSearch, setProductSearch] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [quantity, setQuantity] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef(null)

    // Custom Product State
    const [showCustomForm, setShowCustomForm] = useState(false)
    const [customProduct, setCustomProduct] = useState({ name: '', quantity: '', unit: 'adet' })

    // Available units from inventory
    const availableUnits = [...new Set(inventoryProducts.map(p => p.unit))].filter(Boolean)

    // Filter products based on search
    const filteredProducts = inventoryProducts.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 8)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Auto-set order title with today's date
    useEffect(() => {
        if (!orderTitle && activeTab === 'create') {
            const today = new Date()
            const dateStr = today.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
            setOrderTitle(dateStr)
        }
    }, [activeTab, locale])

    const showToast = (message, type = 'error') => addToast(message, type)
    const getStepForUnit = (unit) => {
        const u = (unit || '').toLowerCase()
        if (['kg', 'kilogram', 'litre', 'liter'].includes(u)) return 0.5
        if (['adet', 'paket', 'koli', 'piece', 'box'].includes(u)) return 1
        return 1
    }
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
    const roundToStep = (v, step) => Math.round(v / step) * step
    const [limits, setLimits] = useState(getOrderLimits())
    const MIN_QTY = limits.min
    const MAX_QTY = limits.max
    const fmt = (v) => {
        const n = Number(v)
        return Number.isFinite(n) ? n.toLocaleString(locale) : String(v)
    }

    useEffect(() => {
        setLimits(getOrderLimits())
    }, [])

    useEffect(() => {
        const id = setTimeout(() => setSearchQuery(searchInput), 200)
        return () => clearTimeout(id)
    }, [searchInput])

    // Calculate stats
    const stats = {
        total: initialOrders.length,
        completed: initialOrders.filter(o => o.items.every(i => i.isReceived)).length,
        pending: initialOrders.filter(o => !o.items.every(i => i.isReceived)).length,
        unfilled: initialUnfilled.reduce((acc, o) => acc + o.items.length, 0),
        totalItems: initialOrders.reduce((acc, o) => acc + o.items.length, 0),
        receivedItems: initialOrders.reduce((acc, o) => acc + o.items.filter(i => i.isReceived).length, 0)
    }

    // Add product from inventory
    const handleAddProduct = () => {
        if (!selectedProduct) {
        showToast('Önce ürünü seçin', 'error'); return
        }
        const q = parseFloat(quantity)
        if (Number.isNaN(q)) { showToast('Geçerli bir miktar girin', 'error'); return }
        if (q < MIN_QTY) { showToast(`Miktar en az ${MIN_QTY} olmalı`, 'error'); return }
        if (q > MAX_QTY) { showToast(`Miktar ${MAX_QTY}’i aşamaz`, 'error'); return }

        // Check if product already exists in list
        const existingItem = orderItems.find(item => item.productId === selectedProduct.id)
        if (existingItem) {
            setOrderItems(orderItems.map(item =>
                item.productId === selectedProduct.id
                    ? { ...item, quantity: item.quantity + q }
                    : item
            ))
        } else {
            const newItem = {
                id: Date.now(),
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                quantity: parseFloat(quantity),
                unit: selectedProduct.unit,
                isCustom: false
            }
            setOrderItems([...orderItems, newItem])
        }

        setSelectedProduct(null)
            setProductSearch('')
            setQuantity('')
        showToast('Ürün listeye eklendi', 'success')
    }

    // Add custom product
    const handleAddCustomProduct = () => {
        if (!customProduct.name || !customProduct.quantity) { showToast('Ürün adı ve miktar gerekli', 'error'); return }
        const q = parseFloat(customProduct.quantity)
        if (Number.isNaN(q)) { showToast('Geçerli miktar girin', 'error'); return }
        if (q < MIN_QTY) { showToast(`Miktar en az ${MIN_QTY} olmalı`, 'error'); return }
        if (q > MAX_QTY) { showToast(`Miktar ${MAX_QTY}’i aşamaz`, 'error'); return }

            const newItem = {
            id: Date.now(),
            productId: null,
            productName: customProduct.name,
                quantity: q,
            unit: customProduct.unit,
            isCustom: true
        }

        setOrderItems([...orderItems, newItem])
        setCustomProduct({ name: '', quantity: '', unit: 'adet' })
        setShowCustomForm(false)
        showToast('Özel ürün eklendi', 'success')
    }

    // Remove item from list
    const handleRemoveItem = (itemId) => {
        setOrderItems(orderItems.filter(item => item.id !== itemId))
    }

    // Update item quantity
    const handleUpdateQuantity = (itemId, newQuantity) => {
        if (Number.isNaN(newQuantity)) { showToast('Geçerli miktar girin', 'error'); return }
        if (newQuantity < MIN_QTY) {
            showToast(`Miktar en az ${MIN_QTY} olmalı`, 'error')
            newQuantity = MIN_QTY
        }
        if (newQuantity > MAX_QTY) {
            showToast(`Miktar ${MAX_QTY}’i aşamaz`, 'error')
            newQuantity = MAX_QTY
        }
        setOrderItems(orderItems.map(item =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        ))
    }

    // Create order
    const handleCreateOrder = async (e) => {
        e.preventDefault()
        if (!orderTitle || orderItems.length === 0) {
            showToast('Liste başlığı ve en az bir ürün gerekli')
            return
        }

        setIsSubmitting(true)
        try {
            const items = orderItems.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                unit: item.unit,
                productId: item.productId
            }))

            const res = await createOrder({ title: orderTitle, items })
            
            if (!res.success) {
                throw new Error(res.error)
            }

            setOrderTitle('')
            setOrderItems([])
            setActiveTab('active')
            showToast('Sipariş başarıyla oluşturuldu!', 'success')
            router.refresh()
        } catch (error) {
            showToast(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleReceived = async (item) => {
        if (!item.isReceived) {
            // Opening modal to confirm quantity
            setConfirmingItem(item)
            setReceivedQuantityInput(item.quantity.toString())
            return
        }

        // Unchecking (resetting)
        try {
            const res = await toggleItemReceived({ itemId: item.id, isReceived: false })
            if (!res.success) throw new Error(res.error)
            router.refresh()
        } catch (error) {
            showToast(error.message)
        }
    }

    const confirmReceived = async () => {
        if (!confirmingItem) return
        const parsedQuantity = parseFloat(receivedQuantityInput)
        if (Number.isNaN(parsedQuantity)) {
            showToast('Geçerli bir teslim miktarı girin.')
            return
        }
        if (parsedQuantity < MIN_QTY) {
            showToast(`Teslim miktarı en az ${MIN_QTY} olmalı.`)
            return
        }
        if (parsedQuantity > MAX_QTY) {
            showToast(`Teslim miktarı ${MAX_QTY}’i aşamaz.`)
            return
        }
        
        try {
            const res = await toggleItemReceived({ 
                itemId: confirmingItem.id, 
                isReceived: true, 
                receivedQuantity: parsedQuantity 
            })
            
            if (!res.success) throw new Error(res.error)

            setConfirmingItem(null)
            setReceivedQuantityInput('')
            router.refresh()
            showToast('Ürün teslim alındı olarak işaretlendi.', 'success')
        } catch (error) {
            showToast(error.message)
        }
    }

    const handleSyncStock = async (itemId) => {
        try {
            const result = await toggleInventorySync({ itemId })
            if (result.success === false) {
                showToast(result.error)
                return
            }
            showToast('Stok güncellendi!', 'success')
            router.refresh()
        } catch (error) {
            showToast(error.message || 'Beklenmeyen bir hata oluştu.')
        }
    }

    const handleDeleteOrder = async (id) => {
        setConfirmDelete({ open: true, id })
    }

    const filteredOrders = initialOrders.filter(o =>
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Calculate order progress
    const getOrderProgress = (order) => {
        const total = order.items.length
        const received = order.items.filter(i => i.isReceived).length
        return { total, received, percentage: total > 0 ? Math.round((received / total) * 100) : 0 }
    }

    return (
        <div className="space-y-6">
            

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-5 group hover:border-blue-500/40 transition-all duration-300">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Toplam</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.total}</p>
                        <p className="text-xs text-gray-400 mt-1">Sipariş listesi</p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20 rounded-2xl p-5 group hover:border-amber-500/40 transition-all duration-300">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Bekleyen</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.pending}</p>
                        <p className="text-xs text-gray-400 mt-1">Tamamlanmadı</p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600/20 to-green-600/20 border border-emerald-500/20 rounded-2xl p-5 group hover:border-emerald-500/40 transition-all duration-300">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Tamamlandı</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.completed}</p>
                        <p className="text-xs text-gray-400 mt-1">Tüm ürünler geldi</p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-rose-600/20 to-red-600/20 border border-rose-500/20 rounded-2xl p-5 group hover:border-rose-500/40 transition-all duration-300">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="text-xs font-medium text-rose-400 uppercase tracking-wider">Eksik</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.unfilled}</p>
                        <p className="text-xs text-gray-400 mt-1">Gelmemiş ürün</p>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
                {/* Premium Tab Navigation */}
                <div className="relative flex bg-black/40 p-2 gap-2">
                    {[
                        { id: 'active', label: 'Aktif Siparişler', count: initialOrders.length, icon: '📦' },
                        { id: 'unfilled', label: 'Eksik Ürünler', count: stats.unfilled, icon: '⚠️' },
                        { id: 'create', label: 'Yeni Oluştur', icon: '➕' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 py-4 px-6 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === tab.id
                                ? tab.id === 'create'
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/20'
                                    : 'bg-white/10 text-white'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            <span className="text-base">{tab.icon}</span>
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id
                                    ? tab.id === 'unfilled' && tab.count > 0 ? 'bg-red-500/30 text-red-300' : 'bg-white/20 text-white'
                                    : 'bg-white/10 text-gray-400'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6 min-h-[500px]">
                    {/* ACTIVE ORDERS TAB */}
                    {activeTab === 'active' && (
                        <div className="space-y-6">
                            {/* Search Bar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Sipariş veya ürün ara..."
                                    className="w-full bg-black/30 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                />
                                <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>

                            {/* Orders List */}
                            {filteredOrders.length === 0 ? (
                                <div className="text-center py-20 bg-gradient-to-br from-black/20 to-black/40 rounded-3xl border border-dashed border-white/10">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                    </div>
                                    <p className="text-gray-500 mb-2">Sipariş bulunamadı</p>
                                    <button onClick={() => setActiveTab('create')} className="text-sm text-blue-400 hover:text-blue-300">
                                        + Yeni sipariş oluştur
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredOrders.map(order => {
                                        const progress = getOrderProgress(order)
                                        const isExpanded = expandedOrder === order.id

                                        return (
                                            <div
                                                key={order.id}
                                                className={`bg-black/30 border rounded-2xl overflow-hidden transition-all duration-300 ${progress.percentage === 100
                                                    ? 'border-green-500/20 hover:border-green-500/40'
                                                    : 'border-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                {/* Order Header */}
                                                <div
                                                    className="p-5 cursor-pointer"
                                                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${progress.percentage === 100
                                                                ? 'bg-green-500/20'
                                                                : 'bg-blue-500/20'
                                                                }`}>
                                                                {progress.percentage === 100 ? (
                                                                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                ) : (
                                                                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-white">{order.title}</h3>
                                                                <p className="text-xs text-gray-500">
                                                                    {new Date(order.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {progress.percentage === 100 ? (
                                                                <span className="px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                                                                    ✓ Tamamlandı
                                                                </span>
                                                            ) : (
                                                                <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                                                                    {progress.received}/{progress.total} Geldi
                                                                </span>
                                                            )}
                                                            {user.role === 'ADMIN' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id) }}
                                                                    className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-xl transition-all"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            <svg className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="relative h-2 bg-black/50 rounded-full overflow-hidden">
                                                        <div
                                                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${progress.percentage === 100
                                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                                                }`}
                                                            style={{ width: `${progress.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Expanded Items List */}
                                                {isExpanded && (
                                                    <div className="border-t border-white/5 bg-black/20 p-5 space-y-3">
                                                        {order.items.map(item => (
                                                            <div
                                                                key={item.id}
                                                                className={`flex items-center justify-between p-4 rounded-xl transition-all ${item.isReceived
                                                                    ? 'bg-green-500/5 border border-green-500/10'
                                                                    : 'bg-white/5 border border-white/5'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <button
                                                                        onClick={() => handleToggleReceived(item)}
                                                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.isReceived
                                                                            ? 'bg-green-500 border-green-500'
                                                                            : 'border-gray-600 hover:border-green-500'
                                                                            }`}
                                                                    >
                                                                        {item.isReceived && (
                                                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                    <div>
                                                                        <span className={`font-medium ${item.isReceived ? 'text-gray-500 line-through' : 'text-white'}`}>
                                                                            {item.productName}
                                                                        </span>
                                                                        <span className="ml-2 text-gray-500 text-sm font-mono">
                                                                            {item.quantity} {item.unit}
                                                                            {item.receivedQuantity !== null && item.receivedQuantity !== item.quantity && (
                                                                                <span className="text-rose-400 ml-2 font-bold">
                                                                                    ({item.receivedQuantity} {item.unit} geldi)
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleSyncStock(item.id)}
                                                                    disabled={!item.isReceived}
                                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${item.isAddedToStock
                                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20'
                                                                        : item.isReceived
                                                                            ? 'bg-white/10 text-white hover:bg-white/20'
                                                                            : 'opacity-30 cursor-not-allowed bg-white/5 text-gray-600'
                                                                        }`}
                                                                >
                                                                    {item.isAddedToStock ? '✓ Depoda' : 'Depoya Ekle'}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* UNFILLED ORDERS TAB */}
                    {activeTab === 'unfilled' && (
                        <div className="space-y-6">
                            {initialUnfilled.length === 0 || stats.unfilled === 0 ? (
                                <div className="text-center py-20 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-3xl border border-dashed border-emerald-500/20">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <p className="text-emerald-400 font-medium mb-1">Tüm ürünler tamamlandı!</p>
                                    <p className="text-gray-500 text-sm">Eksik veya gelmemiş ürün bulunmuyor.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {initialUnfilled.map(order => (
                                        <div key={order.id} className="bg-gradient-to-br from-rose-500/5 to-red-500/5 border border-rose-500/20 rounded-2xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-rose-400">{order.title}</h4>
                                                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString(locale)}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {order.items.map(item => (
                                                    <div key={item.id} className="px-4 py-2 bg-black/40 border border-white/10 rounded-xl flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                                                        <span className="text-white text-sm">{item.productName}</span>
                                                        <span className="text-rose-400 font-mono text-xs">{fmt(item.quantity)} {item.unit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CREATE ORDER TAB */}
                    {activeTab === 'create' && (
                        <div className="max-w-4xl mx-auto space-y-8">
                            {/* Order Title */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-xs">1</span>
                                    Liste Başlığı
                                </label>
                                <input
                                    value={orderTitle}
                                    onChange={(e) => setOrderTitle(e.target.value)}
                                    placeholder="Örn: 27 Ocak Sipariş Listesi"
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white placeholder-gray-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                />
                            </div>

                            {/* Smart Suggestions - REMOVED */}

                            {/* Product Selector from Inventory */}
                            <div className="bg-gradient-to-br from-emerald-500/5 to-green-600/5 border border-emerald-500/20 rounded-3xl p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Depodan Ürün Ekle</h3>
                                        <p className="text-xs text-gray-500">Envanterdeki ürünlerden seçin</p>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-3">
                                    {/* Product Search/Dropdown */}
                                    <div className="flex-1 relative" ref={dropdownRef}>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={selectedProduct ? selectedProduct.name : productSearch}
                                                onChange={(e) => {
                                                    setProductSearch(e.target.value)
                                                    setSelectedProduct(null)
                                                    setShowDropdown(true)
                                                }}
                                                onFocus={() => setShowDropdown(true)}
                                                placeholder="🔍 Ürün adı yazın..."
                                                className="w-full bg-black/50 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                            />
                                            {selectedProduct && (
                                                <button
                                                    onClick={() => { setSelectedProduct(null); setProductSearch('') }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                        </div>

                                        {/* Dropdown */}
                                        {showDropdown && productSearch && filteredProducts.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl max-h-64 overflow-y-auto">
                                                {filteredProducts.map(product => (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => {
                                                            setSelectedProduct(product)
                                                            setProductSearch('')
                                                            setShowDropdown(false)
                                                        }}
                                                        className="w-full px-5 py-4 text-left hover:bg-emerald-500/10 flex justify-between items-center transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        <span className="text-white font-medium">{product.name}</span>
                                                        <span className="text-emerald-400 text-sm font-mono bg-emerald-500/10 px-2 py-1 rounded-lg">{product.unit}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* No results message */}
                                        {showDropdown && productSearch && filteredProducts.length === 0 && inventoryProducts.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl p-4 z-20 shadow-2xl">
                                                <p className="text-gray-500 text-center text-sm">"{productSearch}" bulunamadı</p>
                                            </div>
                                        )}

                                        {/* Empty inventory message */}
                                        {showDropdown && inventoryProducts.length === 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-amber-500/20 rounded-2xl p-4 z-20 shadow-2xl">
                                                <p className="text-amber-400 text-center text-sm">Envanterde ürün yok. Önce Depo'ya ürün ekleyin.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity Input */}
                                    <div className="w-36">
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            onBlur={(e) => {
                                                const raw = parseFloat(e.target.value)
                                                if (Number.isNaN(raw)) return
                                                const step = getStepForUnit(selectedProduct?.unit)
                                                const clamped = clamp(raw, MIN_QTY, MAX_QTY)
                                                const rounded = roundToStep(clamped, step)
                                                setQuantity(String(rounded))
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const q = parseFloat(quantity)
                                                    if (!selectedProduct || Number.isNaN(q) || q < MIN_QTY || q > MAX_QTY) return
                                                    handleAddProduct()
                                                }
                                            }}
                                            placeholder="Miktar"
                                            min={MIN_QTY}
                                            max={MAX_QTY}
                                            step={getStepForUnit(selectedProduct?.unit)}
                                            className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-center text-lg font-mono"
                                        />
                                        <div className="mt-2 text-[10px] text-gray-500 text-center">Min {MIN_QTY} • Maks {MAX_QTY}</div>
                                    </div>

                                    {/* Unit Display */}
                                    <div className="w-28 bg-black/30 border border-white/10 rounded-2xl px-4 py-4 text-gray-400 text-center flex items-center justify-center font-medium">
                                        {selectedProduct?.unit || 'birim'}
                                    </div>

                                    {/* Add Button */}
                                    <button
                                        onClick={handleAddProduct}
                                        disabled={
                                            !selectedProduct ||
                                            !quantity ||
                                            Number.isNaN(parseFloat(quantity)) ||
                                            parseFloat(quantity) < MIN_QTY ||
                                            parseFloat(quantity) > MAX_QTY
                                        }
                                        className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 disabled:shadow-none flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        Ekle
                                    </button>
                                </div>
                            </div>

                            {/* Custom Product Section */}
                            <div className="bg-gradient-to-br from-amber-500/5 to-orange-600/5 border border-amber-500/20 rounded-3xl p-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Özel Ürün Ekle</h3>
                                            <p className="text-xs text-gray-500">Depoda olmayan ürün için</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowCustomForm(!showCustomForm)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${showCustomForm
                                            ? 'bg-amber-500/20 text-amber-400'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {showCustomForm ? 'Kapat' : '+ Ekle'}
                                    </button>
                                </div>

                                {showCustomForm && (
                                    <div className="mt-5 flex flex-col lg:flex-row gap-3 animate-fade-in">
                                        <input
                                            type="text"
                                            value={customProduct.name}
                                            onChange={(e) => setCustomProduct({ ...customProduct, name: e.target.value })}
                                            placeholder="Ürün adı"
                                            className="flex-1 bg-black/50 border border-amber-500/30 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                                        />
                                        <input
                                            type="number"
                                            value={customProduct.quantity}
                                            onChange={(e) => setCustomProduct({ ...customProduct, quantity: e.target.value })}
                                            onBlur={(e) => {
                                                const raw = parseFloat(e.target.value)
                                                if (Number.isNaN(raw)) return
                                                const step = getStepForUnit(customProduct.unit)
                                                const clamped = clamp(raw, MIN_QTY, MAX_QTY)
                                                const rounded = roundToStep(clamped, step)
                                                setCustomProduct({ ...customProduct, quantity: String(rounded) })
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const q = parseFloat(customProduct.quantity)
                                                    if (!customProduct.name || Number.isNaN(q) || q < MIN_QTY || q > MAX_QTY) return
                                                    handleAddCustomProduct()
                                                }
                                            }}
                                            placeholder="Miktar"
                                            min={MIN_QTY}
                                            max={MAX_QTY}
                                            step={getStepForUnit(customProduct.unit)}
                                            className="w-36 bg-black/50 border border-amber-500/30 rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none text-center font-mono"
                                        />
                                        <div className="text-[10px] text-gray-500 text-center mt-2">Min {MIN_QTY} • Maks {MAX_QTY}</div>
                                        <select
                                            value={customProduct.unit}
                                            onChange={(e) => setCustomProduct({ ...customProduct, unit: e.target.value })}
                                            className="w-32 bg-black/50 border border-amber-500/30 rounded-2xl px-4 py-4 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                                        >
                                            <option value="adet">adet</option>
                                            <option value="koli">koli</option>
                                            <option value="kg">kg</option>
                                            <option value="litre">litre</option>
                                            <option value="paket">paket</option>
                                            {availableUnits.map(unit => (
                                                !['adet', 'koli', 'kg', 'litre', 'paket'].includes(unit) && (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                )
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleAddCustomProduct}
                                        disabled={
                                            !customProduct.name ||
                                            !customProduct.quantity ||
                                            Number.isNaN(parseFloat(customProduct.quantity)) ||
                                            parseFloat(customProduct.quantity) < MIN_QTY ||
                                            parseFloat(customProduct.quantity) > MAX_QTY
                                        }
                                            className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                            Ekle
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Order Items List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-semibold">2</span>
                                        <h3 className="text-lg font-bold text-white">Sipariş Listesi</h3>
                                        <span className="ml-2 px-3 py-1 bg-white/10 text-gray-400 text-sm rounded-full font-mono">
                                            {orderItems.length} ürün
                                        </span>
                                        <span className="ml-2 px-3 py-1 bg-white/10 text-gray-400 text-sm rounded-full font-mono">
                                            Toplam {orderItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0).toLocaleString(locale)}
                                        </span>
                                    </div>
                                    {orderItems.length > 0 && (
                                        <button
                                            onClick={() => setConfirmDelete({ open: true, id: 'clear' })}
                                            className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Temizle
                                        </button>
                                    )}
                                </div>

                                {orderItems.length === 0 ? (
                                    <div className="text-center py-16 bg-gradient-to-br from-black/20 to-black/40 rounded-3xl border border-dashed border-white/10">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                        </div>
                                        <p className="text-gray-500">Henüz ürün eklenmedi</p>
                                        <p className="text-gray-600 text-sm mt-1">Yukarıdan ürün seçerek başlayın</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {orderItems.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.01] ${item.isCustom
                                                    ? 'bg-gradient-to-r from-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/40'
                                                    : 'bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20 hover:border-emerald-500/40'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-sm text-gray-500 font-mono">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-2 h-2 rounded-full ${item.isCustom ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                                        <span className="text-white font-medium">{item.productName}</span>
                                                        {item.isCustom && (
                                                            <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-medium">Özel</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-1 bg-black/30 rounded-xl p-1">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.id, Math.round((item.quantity - getStepForUnit(item.unit)) * 100) / 100)}
                                                            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                                        </button>
                                                        <span className="w-12 text-center text-white font-mono text-lg">{fmt(item.quantity)}</span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.id, Math.round((item.quantity + getStepForUnit(item.unit)) * 100) / 100)}
                                                            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                        </button>
                                                    </div>
                                                    <span className="text-gray-500 font-medium w-16">{item.unit}</span>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleCreateOrder}
                                disabled={isSubmitting || !orderTitle || orderItems.length === 0}
                                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${isSubmitting || !orderTitle || orderItems.length === 0
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.02]'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Oluşturuluyor...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Siparişi Kaydet & Yayınla
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{orderItems.length} ürün</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Quantity Confirmation Modal */}
            {confirmingItem && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl transform transition-all animate-scale-in">
                        <h3 className="text-lg font-bold text-white mb-4">Teslimat Miktarı</h3>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-gray-400 text-sm mb-1">Sipariş Edilen</p>
                                <p className="text-xl font-mono text-white">{confirmingItem.quantity} {confirmingItem.unit}</p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Gelen Miktar</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={receivedQuantityInput}
                                        onChange={(e) => setReceivedQuantityInput(e.target.value)}
                                        onBlur={(e) => {
                                            const raw = parseFloat(e.target.value)
                                            if (Number.isNaN(raw)) return
                                            const step = getStepForUnit(confirmingItem.unit)
                                            const clamped = clamp(raw, MIN_QTY, MAX_QTY)
                                            const rounded = roundToStep(clamped, step)
                                            setReceivedQuantityInput(String(rounded))
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const v = parseFloat(receivedQuantityInput)
                                                if (Number.isNaN(v) || v < MIN_QTY || v > MAX_QTY) return
                                                confirmReceived()
                                            }
                                        }}
                                        min={MIN_QTY}
                                        max={MAX_QTY}
                                        step={getStepForUnit(confirmingItem.unit)}
                                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        autoFocus
                                    />
                                    <div className="flex items-center justify-center px-4 bg-white/5 rounded-xl border border-white/5 text-gray-400">
                                        {confirmingItem.unit}
                                    </div>
                                </div>
                                <div className="mt-2 text-[10px] text-gray-500">Min {MIN_QTY} • Maks {MAX_QTY}</div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setConfirmingItem(null)}
                                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={confirmReceived}
                                    disabled={
                                        !receivedQuantityInput ||
                                        Number.isNaN(parseFloat(receivedQuantityInput)) ||
                                        parseFloat(receivedQuantityInput) < MIN_QTY ||
                                        parseFloat(receivedQuantityInput) > MAX_QTY
                                    }
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Onayla
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal
                open={confirmDelete.open}
                title="Siparişi Sil"
                message={confirmDelete.id === 'clear' ? 'Sipariş listesini temizlemek istiyor musunuz?' : 'Bu sipariş listesini silmek istediğinize emin misiniz?'}
                confirmText={confirmDelete.id === 'clear' ? 'Temizle' : 'Sil'}
                cancelText="Vazgeç"
                onConfirm={async () => {
                    if (confirmDelete.id === 'clear') {
                        setOrderItems([])
                        setConfirmDelete({ open: false, id: null })
                        return
                    }
                    try {
                        const res = await deleteOrder({ id: confirmDelete.id })
                        if (!res.success) throw new Error(res.error)
                        showToast('Sipariş silindi.', 'success')
                        router.refresh()
                    } catch (error) {
                        showToast(error.message)
                    } finally {
                        setConfirmDelete({ open: false, id: null })
                    }
                }}
                onCancel={() => setConfirmDelete({ open: false, id: null })}
            />
        </div>
    )
}
