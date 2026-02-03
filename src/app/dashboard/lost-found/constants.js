// Kayıp Eşya Kategorileri
export const ITEM_CATEGORIES = [
    { value: 'Elektronik', label: '📱 Elektronik', icon: '📱' },
    { value: 'Giyim', label: '👔 Giyim', icon: '👔' },
    { value: 'Aksesuar', label: '👓 Aksesuar', icon: '👓' },
    { value: 'Değerli', label: '💎 Değerli Eşya', icon: '💎' },
    { value: 'Çanta', label: '👜 Çanta/Cüzdan', icon: '👜' },
    { value: 'Diğer', label: '📦 Diğer', icon: '📦' }
]

// Kategori ikonunu getir
export const getCategoryIcon = (category) => {
    const cat = ITEM_CATEGORIES.find(c => c.value === category)
    return cat?.icon || '📦'
}

// Durum renkleri ve etiketleri
export const STATUS_CONFIG = {
    FOUND: { label: 'Bekliyor', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '🟡' },
    RETURNED: { label: 'Teslim Edildi', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '🟢' },
    DISPOSED: { label: 'İmha Edildi', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '🔴' }
}
