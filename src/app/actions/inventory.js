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
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    const units = await prisma.unit.findMany({ orderBy: { name: 'asc' } })
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
