'use server'

import prisma from '../../lib/prisma'
import { getSession } from '../../lib/auth'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { notify } from '@/lib/notify'
import { safeAction } from '@/lib/safe-action'
import { z } from 'zod'
import { getSettings } from '@/app/actions/settings'

// --- Schemas ---

const DateRangeSchema = z.object({
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable()
})

const ProductSchema = z.object({
    name: z.string().min(1, 'Ürün adı zorunludur'),
    unit: z.string().min(1, 'Birim zorunludur'),
    category: z.string().min(1, 'Kategori zorunludur'),
    startStock: z.coerce.number().min(0, 'Başlangıç stoğu negatif olamaz')
})

const UpdateProductSchema = ProductSchema.extend({
    id: z.coerce.number()
})

const UpdateStockSchema = z.object({
    productId: z.coerce.number(),
    type: z.enum(['IN', 'OUT']),
    amount: z.coerce.number().positive('Miktar pozitif olmalıdır')
})

const DeleteProductSchema = z.object({
    id: z.coerce.number()
})

const BulkDeleteSchema = z.object({
    ids: z.array(z.coerce.number())
})

const CategorySchema = z.object({
    name: z.string().min(1, 'Kategori adı zorunludur')
})

const UnitSchema = z.object({
    name: z.string().min(1, 'Birim adı zorunludur')
})

const DeleteMetaSchema = z.object({
    id: z.coerce.number()
})

const InventoryCountScheduleSchema = z.object({
    isEnabled: z.boolean(),
    scheduleType: z.enum(['LAST_DAY', 'DAY_OF_MONTH']),
    dayOfMonth: z.coerce.number().optional().nullable(),
    timeOfDay: z.string().regex(/^\d{2}:\d{2}$/)
})

// --- Helpers ---

function parseSafeDate(dateInput, fallback) {
    if (!dateInput) return fallback
    try {
        const d = new Date(dateInput)
        if (isNaN(d.getTime()) || d.getFullYear() < 1900 || d.getFullYear() > 3000) {
            return fallback
        }
        return d
    } catch (e) {
        return fallback
    }
}

function buildScheduleRunDate(now, schedule) {
    const [hourStr, minuteStr] = schedule.timeOfDay.split(':')
    const hour = parseInt(hourStr, 10)
    const minute = parseInt(minuteStr, 10)
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null

    if (schedule.scheduleType === 'LAST_DAY') {
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return new Date(now.getFullYear(), now.getMonth(), lastDay.getDate(), hour, minute, 0, 0)
    }

    if (schedule.scheduleType === 'DAY_OF_MONTH') {
        const day = schedule.dayOfMonth || 1
        const maxDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const safeDay = Math.min(Math.max(day, 1), maxDay)
        return new Date(now.getFullYear(), now.getMonth(), safeDay, hour, minute, 0, 0)
    }

    return null
}

// --- Actions ---

export const getInventory = safeAction(async (data) => {
    // data can be null or { startDate, endDate }
    const { startDate, endDate } = data || {}
    
    const session = await getSession()
    if (!session) return []

    const now = new Date()
    const start = parseSafeDate(startDate, new Date(now.getFullYear(), now.getMonth(), 1))
    const end = parseSafeDate(endDate, new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999))

    if (startDate && !isNaN(new Date(startDate).getTime())) start.setHours(0, 0, 0, 0)
    if (endDate && !isNaN(new Date(endDate).getTime())) end.setHours(23, 59, 59, 999)

    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
    })

    logger.debug(`Fetching inventory stats from ${start.toISOString()} to ${end.toISOString()}`)

    const aggregations = await prisma.stockTransaction.groupBy({
        by: ['productId', 'type'],
        _sum: { amount: true },
        where: {
            createdAt: { gte: start, lte: end }
        }
    })

    const statsMap = {}
    aggregations.forEach(agg => {
        if (!statsMap[agg.productId]) statsMap[agg.productId] = { IN: 0, OUT: 0 }
        statsMap[agg.productId][agg.type] = agg._sum.amount || 0
    })

    return products.map(product => {
        const stats = statsMap[product.id] || { IN: 0, OUT: 0 }
        return {
            ...product,
            addedThisMonth: stats.IN,
            removedThisMonth: stats.OUT
        }
    })
}, DateRangeSchema.optional())

export const getAllProducts = safeAction(async () => {
    return await prisma.product.findMany({
        select: { id: true, name: true, unit: true },
        orderBy: { name: 'asc' }
    })
})

export const getInventoryCountSchedule = safeAction(async () => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    let schedule = await prisma.inventoryCountSchedule.findFirst()
    if (!schedule) {
        schedule = await prisma.inventoryCountSchedule.create({
            data: {
                isEnabled: false,
                scheduleType: 'LAST_DAY',
                timeOfDay: '21:00'
            }
        })
    }
    return schedule
})

export const updateInventoryCountSchedule = safeAction(async (data) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    if (data.scheduleType === 'DAY_OF_MONTH') {
        const day = data.dayOfMonth ?? 1
        if (day < 1 || day > 31) {
            throw new Error('Gün 1 ile 31 arasında olmalıdır.')
        }
    }

    const existing = await prisma.inventoryCountSchedule.findFirst()
    const payload = {
        isEnabled: data.isEnabled,
        scheduleType: data.scheduleType,
        dayOfMonth: data.scheduleType === 'DAY_OF_MONTH' ? data.dayOfMonth : null,
        timeOfDay: data.timeOfDay
    }

    const schedule = existing
        ? await prisma.inventoryCountSchedule.update({ where: { id: existing.id }, data: payload })
        : await prisma.inventoryCountSchedule.create({ data: payload })

    revalidatePath('/dashboard/inventory')
    return schedule
}, InventoryCountScheduleSchema)

export const getLatestStockReport = safeAction(async () => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }
    return await prisma.stockReport.findFirst({ orderBy: { createdAt: 'desc' } })
})

export const getStockReports = safeAction(async () => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }
    return await prisma.stockReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, period: true, createdAt: true }
    })
})

export const getStockReportById = safeAction(async (data) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }
    const { id } = data
    return await prisma.stockReport.findUnique({ where: { id: parseInt(id) } })
}, z.object({ id: z.coerce.number() }))

export const createInventoryCountReportNow = safeAction(async () => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    const now = new Date()
    const settingsRes = await getSettings()
    const locale = settingsRes.success && settingsRes.data?.general?.locale ? String(settingsRes.data.general.locale) : 'tr-TR'
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })
    const payload = {
        generatedAt: now.toISOString(),
        generatedBy: session.fullName,
        items: products.map(p => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            category: p.category,
            currentStock: p.currentStock
        }))
    }

    const report = await prisma.stockReport.create({
        data: {
            period: `${now.toLocaleDateString(locale)} ${now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`,
            data: JSON.stringify(payload)
        }
    })

    revalidatePath('/dashboard/inventory')
    return report
})

export const checkAndRunInventoryCountSchedule = safeAction(async () => {
    const session = await getSession()
    if (!session) {
        throw new Error('Unauthorized')
    }

    const schedule = await prisma.inventoryCountSchedule.findFirst()
    if (!schedule || !schedule.isEnabled) return { ran: false }

    const now = new Date()
    const settingsRes = await getSettings()
    const locale = settingsRes.success && settingsRes.data?.general?.locale ? String(settingsRes.data.general.locale) : 'tr-TR'
    const runAt = buildScheduleRunDate(now, schedule)
    if (!runAt || now < runAt) return { ran: false }

    if (schedule.lastRunAt && schedule.lastRunAt >= runAt) {
        return { ran: false }
    }

    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })
    const payload = {
        generatedAt: now.toISOString(),
        generatedBy: 'Sistem',
        items: products.map(p => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            category: p.category,
            currentStock: p.currentStock
        }))
    }

    await prisma.stockReport.create({
        data: {
            period: `${now.toLocaleDateString(locale)} ${now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`,
            data: JSON.stringify(payload)
        }
    })

    await prisma.inventoryCountSchedule.update({
        where: { id: schedule.id },
        data: { lastRunAt: now }
    })

    revalidatePath('/dashboard/inventory')
    return { ran: true }
})

export const createProduct = safeAction(async (data) => {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) {
        throw new Error('Unauthorized')
    }

    const { name, unit, category, startStock } = data

    logger.info(`Creating product: ${name}`)

    const product = await prisma.product.create({
        data: {
            name,
            unit,
            category,
            startStock,
            currentStock: startStock,
            lastReset: new Date()
        }
    })

    await prisma.inventoryLog.create({
        data: {
            actionType: 'CREATE',
            productName: name,
            details: `Ürün oluşturuldu. Başlangıç stoğu: ${startStock} ${unit}`,
            userName: session.fullName,
            userId: session.id
        }
    })
    await notify('INVENTORY_PRODUCT_CREATED', `"${name}" ürünü oluşturuldu. Başlangıç stoğu: ${startStock} ${unit}`, session.fullName, { link: '/dashboard/inventory' })

    revalidatePath('/dashboard/inventory')
    return product
}, ProductSchema)

export const updateStock = safeAction(async (data) => {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) {
        throw new Error('Unauthorized')
    }

    const { productId, type, amount } = data
    
    // Verify user exists
    let uId = session.id ? parseInt(session.id) : null
    if (uId) {
        const userExists = await prisma.user.findUnique({ where: { id: uId } })
        if (!userExists) uId = null
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Ürün bulunamadı')

    await prisma.stockTransaction.create({
        data: {
            productId,
            type,
            amount,
            userId: uId
        }
    })

    const operation = type === 'IN' ? { increment: amount } : { decrement: amount }
    
    const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { currentStock: operation }
    })

    const details = `${type === 'IN' ? 'Stok Girişi' : 'Stok Çıkışı'}: ${amount} ${updatedProduct.unit} (İşlem sonrası: ${updatedProduct.currentStock} ${updatedProduct.unit})`

    await prisma.inventoryLog.create({
        data: {
            actionType: type === 'IN' ? 'STOCK_IN' : 'STOCK_OUT',
            productName: updatedProduct.name,
            details,
            userName: session.fullName,
            userId: uId || 0
        }
    })
    await notify(type === 'IN' ? 'INVENTORY_STOCK_IN' : 'INVENTORY_STOCK_OUT', `${updatedProduct.name}: ${details}`, session.fullName, { link: '/dashboard/inventory' })

    revalidatePath('/dashboard/inventory')
    return updatedProduct
}, UpdateStockSchema)

export const deleteProduct = safeAction(async (data) => {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) {
        throw new Error('Unauthorized')
    }

    const { id } = data

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return

    // Check active orders
    const activeOrderItems = await prisma.orderItem.findMany({
        where: {
            productId: id,
            isAddedToStock: false
        },
        include: {
            order: { select: { title: true } }
        }
    })

    if (activeOrderItems.length > 0) {
        const orderList = activeOrderItems
            .map(item => item.order.title)
            .filter((v, i, a) => a.indexOf(v) === i)
            .slice(0, 3)
            .join(', ')
        
        const moreCount = activeOrderItems.length > 3 ? ` ve ${activeOrderItems.length - 3} sipariş daha` : ''
        
        throw new Error(`Bu ürün aktif siparişlerde kullanılıyor: ${orderList}${moreCount}. Silmeden önce siparişleri tamamlayın.`)
    }

    await prisma.product.delete({ where: { id } })

    const currentUserId = session.id ? parseInt(session.id) : 0
    const userExists = await prisma.user.findUnique({ where: { id: currentUserId } })

    await prisma.inventoryLog.create({
        data: {
            actionType: 'DELETE',
            productName: product.name,
            details: `Ürün tamamen silindi. (Son stok: ${product.currentStock} ${product.unit})`,
            userName: session.fullName,
            userId: userExists ? currentUserId : 0
        }
    })
    await notify('INVENTORY_PRODUCT_DELETED', `"${product.name}" silindi. Son stok: ${product.currentStock} ${product.unit}`, session.fullName, { link: '/dashboard/inventory', priority: 'HIGH' })

    revalidatePath('/dashboard/inventory')
}, DeleteProductSchema)

export const updateProduct = safeAction(async (data) => {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) {
        throw new Error('Unauthorized')
    }

    const { id, name, unit, category, startStock } = data

    const oldProduct = await prisma.product.findUnique({ where: { id } })
    if (!oldProduct) throw new Error('Ürün bulunamadı')

    let currentStock = oldProduct.currentStock
    if (oldProduct.startStock !== startStock) {
        const diff = startStock - oldProduct.startStock
        currentStock += diff
    }

    await prisma.product.update({
        where: { id },
        data: {
            name,
            unit,
            category,
            startStock,
            currentStock
        }
    })

    const changes = []
    if (oldProduct.name !== name) changes.push(`İsim: "${oldProduct.name}" -> "${name}"`)
    if (oldProduct.unit !== unit) changes.push(`Birim: "${oldProduct.unit}" -> "${unit}"`)
    if (oldProduct.category !== category) changes.push(`Kategori: "${oldProduct.category || '-'}" -> "${category}"`)
    if (oldProduct.startStock !== startStock) changes.push(`Başlangıç Stoğu: ${oldProduct.startStock} -> ${startStock}`)

    await prisma.inventoryLog.create({
        data: {
            actionType: 'UPDATE',
            productName: name,
            details: changes.length > 0 ? `Ürün bilgileri güncellendi: ${changes.join(', ')}` : 'Ürün bilgileri kaydedildi.',
            userName: session.fullName,
            userId: (await prisma.user.findUnique({ where: { id: parseInt(session.id) } })) ? parseInt(session.id) : 0
        }
    })
    await notify('INVENTORY_PRODUCT_UPDATED', `"${name}" güncellendi.`, session.fullName, { link: '/dashboard/inventory' })

    revalidatePath('/dashboard/inventory')
}, UpdateProductSchema)

export const bulkDeleteProducts = safeAction(async (data) => {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) {
        throw new Error('Unauthorized')
    }

    const { ids } = data
    if (!ids || ids.length === 0) return

    const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { name: true }
    })

    await prisma.product.deleteMany({
        where: { id: { in: ids } }
    })

    await prisma.inventoryLog.create({
        data: {
            actionType: 'DELETE',
            productName: 'Toplu Silme',
            details: `Silinen ürünler: ${products.map(p => p.name).join(', ')}`,
            userName: session.fullName,
            userId: session.id
        }
    })
    await notify('INVENTORY_PRODUCTS_DELETED', `Toplu silme: ${products.map(p => p.name).join(', ')}`, session.fullName, { link: '/dashboard/inventory', priority: 'HIGH' })

    revalidatePath('/dashboard/inventory')
}, BulkDeleteSchema)

export const getProductHistory = safeAction(async (data) => {
    // data: { productId } - wait, original took just productId arg. 
    // safeAction expects object if schema provided, or we can just treat the first arg as the input.
    // Let's define schema for this or handle it manually.
    // Original: getProductHistory(productId)
    // New: getProductHistory({ id: productId }) or just assume first arg is input.
    // If I pass a primitive to safeAction, my current safeAction implementation might fail validation if I strictly check for object.
    // My safeAction check: if (input && typeof input === 'object' && !(input instanceof FormData)) { schema.parse(input) }
    // So if input is primitive (string/number), schema validation is skipped?
    // Actually `args[0]` would be the primitive.
    // Ideally I should change to object input everywhere.
    
    const { id } = (data && typeof data === 'object') ? data : { id: data }
    
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const history = await prisma.stockTransaction.findMany({
        where: { productId: parseInt(id) },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { fullName: true } } }
    })

    return history.map(h => ({
        id: h.id,
        type: h.type,
        amount: h.amount,
        date: h.createdAt,
        user: h.user ? h.user.fullName : 'Bilinmiyor'
    }))
})

export const getInventoryLogs = safeAction(async () => {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) {
        throw new Error('Unauthorized')
    }

    const logs = await prisma.inventoryLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    return logs
})

export const getFilterOptions = safeAction(async () => {
    const defaultUnits = ['ADET', 'lt', 'kg', 'paket', 'koli', 'top', 'set']
    for (const u of defaultUnits) {
        const exists = await prisma.unit.findFirst({ where: { name: u } })
        if (!exists) {
            await prisma.unit.create({ data: { name: u } })
        }
    }
    const deptCats = [
        { dept: 'Servis Departmanı', cats: ['Temizlik - Hijyen Malzemeleri', 'Servis Tabakları', 'Servis Çatal - Bıçak', 'Servis Gümüş Tabaklar', 'Demirbaşlar', 'Personel Kıyafet'] },
        { dept: 'Kasa Departmanı', cats: ['Kırtasiye Malzemeleri', 'Operasyon Malzemeleri'] },
        { dept: 'Mutfak – Tezgah Departmanı', cats: ['10’lu Kibrit Kutu Lokumlar', '20’li Kibrit Kutu Lokumlar', 'Teneke Lokumlar', 'Poşet Lokumlar ve Kurabiyeler – 250 Gramlıklar', 'Poşet Lokumlar ve Kurabiyeler – 100 Gramlıklar', 'Şekerlemeler', 'Kavanoz Gıdalar', 'Kutular'] },
        { dept: 'Bar Departmanı', cats: ['Donuk Ürünler', 'Kahve – Çay – Bitki Çayı', 'Soft İçecekler', 'Süt Ürünleri', 'Perakende Ürünler', 'Tatlı İçecek Ürünler', 'Al Götür Ekipmanlar'] }
    ]
    for (const d of deptCats) {
        for (const c of d.cats) {
            const name = `${d.dept} / ${c}`
            const exists = await prisma.category.findFirst({ where: { name } })
            if (!exists) {
                await prisma.category.create({ data: { name } })
            }
        }
    }
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    const units = await prisma.unit.findMany({ orderBy: { name: 'asc' } })
    const seed = [
            { dept: 'Servis Departmanı', cat: 'Temizlik - Hijyen Malzemeleri', items: [
                'Diversey Bulaşık Deterjanı Makina 20LT',
                'Diversey El Bulaşık Sabunu 20LT',
                'Diversey Kireç Çözücü 20LT',
                'Diversey Parlatıcı 20LT',
                'Domestos Çamaşır Suyu 3,2LT',
                'Sıvı Arap Sabunu 5LT',
                'Cam Sil 1LT',
                'Battal Boy Çöp Torbası',
                'Mavi Eldiven Paket 100’lü',
                'Beyaz Eldiven Paket 100’lü',
                'Logolu Servis Peçetesi Koli 1920 Adet',
                'Logolu Servis Peçetesi Koli 2400 Adet',
                'Servis Islak Mendil Koli 500 Adet',
                'Ekmekli Rulo Kağıt',
                'Bingo Islak Mendil',
                'Cam Bez',
                'Mikrofiber Bez',
                'Güderi Bez',
                'Bulaşık Süngeri',
                'Bulaşık Teli',
                'Vileda Kova Kapağı',
                'Vileda Mop',
                'Vileda Paspas Ucu Saçaklı',
                'Uzatmalı Temizlik Başlığı',
                'Vileda Kovası',
                'Shark Makine İlacı',
                'Gümüş Parlatma İlacı',
                'Gümüş Parlatma Bezi',
                'Beyaz Sirke',
                'Dose Leke Çıkarıcı'
            ]},
            { dept: 'Servis Departmanı', cat: 'Servis Tabakları', items: [
                'Imperial Orta Pembe Servis Tabak',
                'Imperial Küçük Mavi Servis Tabak',
                'Classic Rose Lacivert-Gold Küçük Servis Tabak',
                'Classic Rose Lacivert-Gold Orta Servis Tabak',
                'Classic Rose Lacivert-Gold Büyük Servis Tabak',
                'Classic Rose Lacivert-Gold Kayık Servis Tabak',
                'Weinnar Porselen Sos Tabağı',
                'Weinnar Porselen Sosluk',
                'Weinnar Porselen Büyük Şekerlik',
                'Weinnar Porselen Şekerlik',
                'Weinnar Porselen Salata Kasesi',
                'Weinnar Porselen Çorba Kasesi',
                'Weinnar Porselen Tuzluk',
                'Weinnar Porselen Büyük Çukur Tabak',
                'Weinnar Porselen Büyük Kayık Tabak',
                'Weinnar Porselen Küçük Kayık Tabak',
                'Weinnar Porselen Kruvasan Tabağı Orta',
                'Weinnar Porselen Ciğer Tabağı Büyük',
                'Furstenberg Porselen Lacivert-Gold Tabak',
                'Furstenberg Porselen Beyaz-Gold Tabak'
            ]},
            { dept: 'Servis Departmanı', cat: 'Servis Çatal - Bıçak', items: [
                'Gümüş Tatlı Çatalı',
                'Gümüş Tatlı Bıçağı',
                'Gümüş Tatlı Kaşığı',
                'Gümüş Yemek Çatalı',
                'Gümüş Yemek Bıçağı',
                'Gümüş Yemek Kaşığı',
                'Jumbo Yemek Bıçağı'
            ]},
            { dept: 'Servis Departmanı', cat: 'Servis Gümüş Tabaklar', items: [
                'Gümüş Oval Tabak',
                'Gümüş Dikdörtgen Tabak',
                'Gümüş Yuvarlak Küçük Tabak',
                'Gümüş Yuvarlak Orta Tabak'
            ]},
            { dept: 'Servis Departmanı', cat: 'Demirbaşlar', items: [
                'Gümüş Masa Vazoları',
                'Gümüş Masa Servis Seti (14 Parça Masa)',
                'Mama Sandalyesi',
                'Küllabası',
                'Servis Tepsisi Büyük',
                'Servis Tepsisi Orta'
            ]},
            { dept: 'Servis Departmanı', cat: 'Personel Kıyafet', items: [
                'Şef Pantolonu 36 Beden',
                'Şef Pantolonu 46 Beden',
                'Pantolon S Beden',
                'Pantolon M Beden',
                'Gömlek M Beden',
                'Gömlek L Beden',
                'Gömlek XL Beden',
                'Polar XS Beden',
                'Pantolon L Beden (Defolu)',
                'Pantolon XXL Beden (Defolu)'
            ]},
            { dept: 'Kasa Departmanı', cat: 'Kırtasiye Malzemeleri', items: [
                'A4 Kağıt (Top / 500’lü)',
                'Zımba Teli (Paket)',
                'Etiket Tarih Makinası',
                'Makas',
                'Sümen',
                'Koli Bandı',
                'Falcata',
                'Zımba Makine',
                'Raptiye',
                'Paket Lastiği Paket 700’lü'
            ]},
            { dept: 'Kasa Departmanı', cat: 'Operasyon Malzemeleri', items: [
                'Büyük Yazıcı Fişi 10’lu',
                'Küçük Yazıcı Fişi 10’lu',
                'Kürdan Kutu Paket 1000’li',
                'Pasta Mum Paket 6’lı',
                'Kibrit Koli X300',
                'Şarj Aleti',
                'QR Menü',
                'Değerlendirme QR'
            ]}
        ,
        { dept: 'Mutfak – Tezgah Departmanı', cat: '10’lu Kibrit Kutu Lokumlar', items: [
            'Çifte Kavrulmuş Antep Fıstıklı Lokum 320 gr',
            'Çifte Kavrulmuş Fındıklı Lokum 320 gr',
            'Çifte Kavrulmuş Narlı - Fıstıklı Lokum 280 gr',
            'Çikolata Kaplı Antep Fıstıklı Lokum 300 gr',
            'Çikolata Kaplı Antep Fıstıklı Lokum 350 gr',
            'Fındıklı Lokum 300 gr',
            'Fıstıklı Lokum 300 gr',
            'Güllü Lokum 300 gr',
            'Karamelli Lokum 300 gr',
            'Nar Aromalı Antep Fıstıklı Lokum 300 gr',
            'Nar Aromalı Fıstıklı Lokum 300 gr',
            'Nar Aromalı Fındıklı Lokum 325 gr',
            'Narlı Fıstıklı Lokum 300 gr',
            'Nar ve Portakal Aromalı Fıstıklı Fitil Lokum 325 gr',
            'Parmak Fitil Lokum 180 gr',
            'Portakal Aromalı Fıstıklı Fitil Lokum 300 gr',
            'Portakallı Lokum 300 gr'
        ]},
        { dept: 'Mutfak – Tezgah Departmanı', cat: '20’li Kibrit Kutu Lokumlar', items: [
            'Çifte Kavrulmuş Antep Fıstıklı Lokum 600 gr',
            'Çifte Kavrulmuş Antep Fıstıklı Lokum 650 gr',
            'Çifte Kavrulmuş Fındıklı Lokum 660 gr',
            'Çikolata Kaplı Antep Fıstıklı Lokum 600 gr',
            'Çikolata Kaplı Antep Fıstıklı Lokum 700 gr',
            'Fındıklı Lokum 600 gr',
            'Fındıklı Lokum 700 gr',
            'Fıstıklı Lokum 700 gr',
            'Güllü Lokum 700 gr',
            'Karamelli Lokum 725 gr',
            'Nar Aromalı Fıstıklı Fitil Lokum 600 gr',
            'Narlı Fıstıklı Lokum 700 gr',
            'Nar-Portakal Aromalı Fıstıklı Fitil Lokum 550 gr',
            'Parmak Fitil Lokum 415 gr',
            'Portakallı Fitil Lokum 600 gr',
            'Portakal Aromalı Fıstıklı Fitil Lokum 480 gr',
            'Portakallı Lokum 880 gr',
            'Nar Aromalı Antep Fıstıklı Lokum 600 gr',
            'Special Lokum 470 gr'
        ]},
        { dept: 'Mutfak – Tezgah Departmanı', cat: 'Teneke Lokumlar', items: [
            'Otto Karamelli Lokum 250 gr',
            'Otto Narlı Antep Fıstıklı Lokum 250 gr'
        ]},
        { dept: 'Mutfak – Tezgah Departmanı', cat: 'Poşet Lokumlar ve Kurabiyeler – 250 Gramlıklar', items: [
            'Otto Çifte Kavrulmuş Antep Fıstıklı Lokum 250 gr',
            'Otto Narlı Antep Fıstıklı Lokum 250 gr',
            'Otto Poşet Kuş Lokumu 250 gr',
            'Otto Çikolata Kaplı Antep Fıstıklı Lokum 250 gr',
            'Otto Karamelli Lokum 250 gr'
        ]},
        { dept: 'Mutfak – Tezgah Departmanı', cat: 'Poşet Lokumlar ve Kurabiyeler – 100 Gramlıklar', items: [
            'Otto Çifte Kavrulmuş Fıstıklı Lokum 100 gr',
            'Otto Çifte Kavrulmuş Fındıklı Lokum 100 gr',
            'Otto Portakal Aromalı Antep Fıstıklı Fitil Lokum 100 gr',
            'Otto Narlı Antep Fıstıklı Fitil Lokum 100 gr',
            'Otto Kuş Lokumu 100 gr',
            'Otto Narlı Antep Fıstıklı Lokum 100 gr',
            'Otto Susamlı Hurmalı Kurabiye Paket 6’lı'
        ]},
        { dept: 'Mutfak – Tezgah Departmanı', cat: 'Şekerlemeler', items: [
            'Fındıklı Akide Şekeri 200 gr',
            'Portakallı Akide Şekeri 200 gr',
            'Limonlu Akide Şekeri 200 gr',
            'Tarçınlı Akide Şekeri 200 gr',
            'Karanfilli Akide Şekeri 200 gr',
            'Susamlı Akide Şekeri 200 gr',
            'Badem Şekeri 150 gr',
            'Badem Şekeri 2 kg',
            'Fıstık Şekeri 150 gr',
            'Fıstık Şekeri 2 kg',
            'İran Şekeri 1 kg'
        ]},
        { dept: 'Mutfak – Tezgah Departmanı', cat: 'Kavanoz Gıdalar', items: [
            'Otto Çiçek Balı 350 gr',
            'Otto Tahin 300 gr',
            'Otto Antep Fıstık Ezmesi 380 gr'
        ]},
        { dept: 'Mutfak – Tezgah Departmanı', cat: 'Kutular', items: [
            'Kibrit Dikdörtgen 10’lu Kutu',
            'Kibrit Dikdörtgen 20’li Kutu',
            'Premium Special Kutu',
            'Pencereli Şekerleme Kutu Sarı',
            'Pencereli Şekerleme Kutu Kırmızı',
            'Küçük Kare Pasta Kutusu',
            'Orta Dikdörtgen Pasta Kutusu',
            'Büyük Kare Pasta Kutusu',
            'Küçük Kare Pasta Altlığı',
            'Orta Dikdörtgen Pasta Altlığı',
            'Büyük Kare Pasta Altlığı',
            'Paket Tart Altlığı',
            'Yeşil Küçük Poşet',
            'Kırmızı Orta Poşet',
            'Kırmızı Büyük Poşet',
            'Yeşil Poşet Altlıklı Dikdörtgen',
            'Kırmızı Orta Boy Poşet Altlığı',
            'Kırmızı Büyük Boy Poşet Altlığı',
            'Pelur Kağıt Kutu İçi',
            'Orta Sticker Rulo Kağıt',
            'Orta Sticker A4 Kağıt',
            'Küçük Sticker 100’lü Kağıt',
            'Küçük Sticker 200’lü Kağıt',
            'Şeffaf Poşet 20’li Paket',
            'Lokum Kürdan 500’lü Paket'
        ]},
        { dept: 'Bar Departmanı', cat: 'Donuk Ürünler', items: [
            'Viyana Kahvesi Limonata 1 Litre',
            'Viyana Kahvesi Portakal Suyu 1 Litre',
            'Viyana Kahvesi Nar Suyu 1 Litre',
            'Viyana Kahvesi Cool Lime 1 Litre',
            'Viyana Kahvesi Berry Hibiscus 1 Litre',
            'Tikevsi Salep 1 Litre',
            'Otto Bite Özel Yayım Cold Brew 2 Litre',
            'Viyana Kahvesi Cold Brew 1 Litre'
        ]},
        { dept: 'Bar Departmanı', cat: 'Kahve – Çay – Bitki Çayı', items: [
            'Spada Motion Espresso 1 kg',
            'Spada Motion Espresso 2 kg',
            'Spada Popayan Kolombiya 1 kg',
            'Spada Huila Kolombiya 1 kg',
            'Mehmet Efendi Türk Kahvesi 100 gr Paket x24’lü',
            'Tahmis Menengiç Kahvesi 500 gr',
            'Tahmis Osmanlı Kahvesi 500 gr',
            'Tahmis Dibek Kahvesi 500 gr',
            'Balküpü Küp Şeker',
            'Çaykur Poşet Altınbaş Çay 1 kg',
            'Çaykur Altınbaş Kutu Çay 1 kg',
            'Çaykur Poşet Tomurcuk Çay 1 kg',
            'Ofçay Early Green 320 gr',
            'Ginger Power 250 gr',
            'Fıstık Bitki Çayı 250 gr',
            'Çikolata Bitki Çayı 250 gr',
            'Ceviz Bitki Çayı 250 gr',
            'Jasmine Jade 250 gr'
        ]},
        { dept: 'Bar Departmanı', cat: 'Soft İçecekler', items: [
            'Kula Soda Paket 24’lü',
            'San Pellegrino Limonlu Paket 4’lü',
            'San Pellegrino Portakallı Paket 4’lü',
            'San Pellegrino Paket 6’lı',
            'Kestane Su Paket 24’lü',
            'Chaika Peach Tea Paket 24’lü',
            'Chaika Cool Lime Paket 24’lü',
            'Chaika Pina Colada Paket 24’lü'
        ]},
        { dept: 'Bar Departmanı', cat: 'Süt Ürünleri', items: [
            'Pınar Art Sütü 1 Litre',
            'Pınar Laktozsuz Süt 1 Litre',
            'Pınar UHT Süt 1 Litre',
            'Pınar Badem Sütü 1 Litre',
            'Pınar Yulaf Sütü 1 Litre'
        ]},
        { dept: 'Bar Departmanı', cat: 'Perakende Ürünler', items: [
            'Spada Huila Kolombiya 250 gr',
            'Spada Popayan Kolombiya 250 gr',
            'Spada Motion Espresso 250 gr',
            'Spada Türk Kahvesi 250 gr',
            'Soy Cezve Büyük',
            'Soy Cezve Orta',
            'Soy Cezve Küçük'
        ]},
        { dept: 'Bar Departmanı', cat: 'Tatlı İçecek Ürünler', items: [
            'Kestane Püresi 320 gr',
            'Ballı Fındık Kreması 320 gr',
            'Hurma Püresi 320 gr',
            'Beyaz Pul Çikolata 10 kg',
            'Siyah Tablet Çikolata 10 kg',
            'Sprey Krema 320 gr',
            'Marshmallow Paket'
        ]},
        { dept: 'Bar Departmanı', cat: 'Al Götür Ekipmanlar', items: [
            'Take Away Karton Büyük Bardak Fişek x38’li',
            'Take Away Karton Küçük Bardak Fişek x38’li',
            'Take Away Ice Bardak Fişek x38’li',
            'Take Away Karton Büyük Bardak Kapağı Fişek x38’li',
            'Take Away Karton Küçük Bardak Kapağı Fişek x38’li',
            'Take Away Ice Bardak Kapağı Fişek x38’li',
            'Bambu Pipet Büyük Poşet x100',
            'Bambu Pipet Küçük Poşet x100'
        ]}
    ]
    function unitFor(name) {
        const n = name.toLowerCase()
        if (n.includes('litre') || n.includes('liter') || n.includes(' lt')) return 'lt'
        if (n.includes('kg')) return 'kg'
        if (n.includes('koli')) return 'koli'
        if (n.includes('paket')) return 'paket'
        if (n.includes('top')) return 'top'
        if (n.includes('set')) return 'set'
        return 'ADET'
    }
    for (const group of seed) {
        const categoryName = `${group.dept} / ${group.cat}`
        for (const item of group.items) {
            const exists = await prisma.product.findFirst({ where: { name: item } })
            if (!exists) {
                await prisma.product.create({
                    data: {
                        name: item,
                        unit: unitFor(item),
                        category: categoryName,
                        startStock: 0,
                        currentStock: 0,
                        lastReset: new Date()
                    }
                })
            }
        }
    }
    revalidatePath('/dashboard/inventory')
    return { categories, units }
})

export const addCategory = safeAction(async (data) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')
    
    const { name } = data
    const cat = await prisma.category.create({ data: { name } })
    revalidatePath('/dashboard/inventory')
    return cat
}, CategorySchema)

export const addUnit = safeAction(async (data) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    const { name } = data
    const unit = await prisma.unit.create({ data: { name } })
    revalidatePath('/dashboard/inventory')
    return unit
}, UnitSchema)

export const deleteCategory = safeAction(async (data) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    const { id } = data
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) throw new Error('Kategori bulunamadı.')

    const usageCount = await prisma.product.count({
        where: { category: { equals: category.name } }
    })

    if (usageCount > 0) throw new Error('Bu kategori kullanımda olduğu için silinemez.')

    await prisma.category.delete({ where: { id } })

    // Logging
    try {
        const currentUserId = session?.id ? parseInt(session.id) : 0
        const userExists = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId } }) : null

        await prisma.inventoryLog.create({
            data: {
                actionType: 'DELETE',
                productName: 'Kategori',
                details: `Kategori silindi: ${category.name}`,
                userName: session?.fullName || 'Sistem',
                userId: userExists ? currentUserId : 0
            }
        })
    } catch (e) {
        logger.error('Failed to log category deletion', e)
    }

    revalidatePath('/dashboard/inventory')
}, DeleteMetaSchema)

export const deleteUnit = safeAction(async (data) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

    const { id } = data
    const unit = await prisma.unit.findUnique({ where: { id } })
    if (!unit) throw new Error('Birim bulunamadı.')

    const usageCount = await prisma.product.count({
        where: { unit: { equals: unit.name } }
    })

    if (usageCount > 0) throw new Error('Bu birim kullanımda olduğu için silinemez.')

    await prisma.unit.delete({ where: { id } })

    try {
        const currentUserId = session?.id ? parseInt(session.id) : 0
        const userExists = currentUserId ? await prisma.user.findUnique({ where: { id: currentUserId } }) : null

        await prisma.inventoryLog.create({
            data: {
                actionType: 'DELETE',
                productName: 'Birim',
                details: `Birim silindi: ${unit.name}`,
                userName: session?.fullName || 'Sistem',
                userId: userExists ? currentUserId : 0
            }
        })
    } catch (e) {
        logger.error('Failed to log unit deletion', e)
    }

    revalidatePath('/dashboard/inventory')
}, DeleteMetaSchema)
