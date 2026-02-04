'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { safeAction } from '@/lib/safe-action'
import { logger } from '@/lib/logger'
import { notify } from '@/lib/notify'
import { z } from 'zod'

/**
 * Kayıp Eşya Modülü - Server Actions
 */

// --- Şemalar ---

const CreateLostItemSchema = z.object({
    itemName: z.string().min(1, 'Eşya adı zorunludur'),
    itemDescription: z.string().optional(),
    itemCategory: z.string().min(1, 'Kategori seçiniz'),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    tableNumber: z.string().optional(),
    foundLocation: z.string().optional(),
    sittingTime: z.string().optional(), // ISO date string
    sittingEndTime: z.string().optional(), // ISO date string
    foundAt: z.string().optional(), // ISO date string
    photoUrl: z.string().optional(),
    notes: z.string().optional()
})

const UpdateLostItemSchema = z.object({
    id: z.coerce.number(),
    itemName: z.string().min(1).optional(),
    itemDescription: z.string().optional(),
    itemCategory: z.string().optional(),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    tableNumber: z.string().optional(),
    foundLocation: z.string().optional(),
    sittingTime: z.string().optional(),
    sittingEndTime: z.string().optional(),
    photoUrl: z.string().optional(),
    notes: z.string().optional()
})

const ReturnItemSchema = z.object({
    id: z.coerce.number(),
    returnedTo: z.string().min(1, 'Teslim alan kişi adı zorunludur')
})

const ChangeStatusSchema = z.object({
    id: z.coerce.number(),
    status: z.enum(['FOUND', 'RETURNED', 'DISPOSED'])
})

const IdSchema = z.object({
    id: z.coerce.number()
})

// --- Actions ---

/**
 * Yeni kayıp eşya kaydı oluştur
 * Hem ADMIN hem CHEF kullanabilir
 */
export const createLostItem = safeAction(async (data) => {
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const sittingTime = data.sittingTime ? new Date(data.sittingTime) : null
    const sittingEndTime = data.sittingEndTime ? new Date(data.sittingEndTime) : null
    if (sittingTime && sittingEndTime && sittingEndTime < sittingTime) {
        throw new Error('Oturma bitiş saati başlangıçtan önce olamaz.')
    }

    const item = await prisma.lostItem.create({
        data: {
            itemName: data.itemName,
            itemDescription: data.itemDescription || null,
            itemCategory: data.itemCategory,
            customerName: data.customerName || null,
            customerPhone: data.customerPhone || null,
            customerEmail: data.customerEmail || null,
            tableNumber: data.tableNumber || null,
            foundLocation: data.foundLocation || null,
            sittingTime,
            sittingEndTime,
            foundAt: data.foundAt ? new Date(data.foundAt) : new Date(),
            photoUrl: data.photoUrl || null,
            notes: data.notes || null,
            reportedById: parseInt(session.id),
            status: 'FOUND'
        }
    })

    logger.info(`Lost item created: ${data.itemName} by ${session.fullName}`)
    await notify('LOST_ITEM_CREATED', `"${data.itemName}" kaydı oluşturuldu.`, session.fullName, { link: '/dashboard/lost-found' })
    revalidatePath('/dashboard/lost-found')
    revalidatePath('/dashboard')
    return item
}, CreateLostItemSchema)

/**
 * Tüm kayıp eşyaları getir
 * Herkes görebilir
 */
export const getLostItems = safeAction(async (filters = {}) => {
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const where = {}

    // Durum filtresi
    if (filters.status && filters.status !== 'ALL') {
        where.status = filters.status
    }

    // Kategori filtresi
    if (filters.category && filters.category !== 'ALL') {
        where.itemCategory = filters.category
    }

    // Arama filtresi
    if (filters.search) {
        where.OR = [
            { itemName: { contains: filters.search } },
            { itemDescription: { contains: filters.search } },
            { tableNumber: { contains: filters.search } },
            { customerName: { contains: filters.search } }
        ]
    }

    // Tarih filtresi
    if (filters.dateFrom || filters.dateTo) {
        where.foundAt = {}
        if (filters.dateFrom) {
            where.foundAt.gte = new Date(filters.dateFrom)
        }
        if (filters.dateTo) {
            where.foundAt.lte = new Date(filters.dateTo)
        }
    }

    const items = await prisma.lostItem.findMany({
        where,
        include: {
            reportedBy: {
                select: { id: true, fullName: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return items
})

/**
 * Tek bir kayıp eşya detayını getir
 */
export const getLostItemById = safeAction(async (data) => {
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const item = await prisma.lostItem.findUnique({
        where: { id: parseInt(data.id) },
        include: {
            reportedBy: {
                select: { id: true, fullName: true }
            }
        }
    })

    if (!item) throw new Error('Kayıt bulunamadı.')
    return item
}, IdSchema)

/**
 * Kayıp eşya bilgilerini güncelle
 * Kayıt sahibi veya ADMIN düzenleyebilir
 */
export const updateLostItem = safeAction(async (data) => {
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const { id, ...updateData } = data

    // Önce kaydı kontrol et
    const existingItem = await prisma.lostItem.findUnique({
        where: { id: parseInt(id) },
        select: { reportedById: true, sittingTime: true, sittingEndTime: true }
    })

    if (!existingItem) throw new Error('Kayıt bulunamadı.')

    // Yetki kontrolü: Sadece kayıt sahibi veya admin düzenleyebilir
    const isOwner = existingItem.reportedById === parseInt(session.id)
    const isAdmin = session.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
        throw new Error('Bu kaydı düzenleme yetkiniz yok.')
    }

    // Clean up empty strings
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') updateData[key] = null
    })

    // Handle date conversion
    if (updateData.sittingTime) {
        updateData.sittingTime = new Date(updateData.sittingTime)
    }
    if (updateData.sittingEndTime) {
        updateData.sittingEndTime = new Date(updateData.sittingEndTime)
    }
    const hasStart = Object.prototype.hasOwnProperty.call(updateData, 'sittingTime')
    const hasEnd = Object.prototype.hasOwnProperty.call(updateData, 'sittingEndTime')
    const startTime = hasStart ? updateData.sittingTime : existingItem.sittingTime
    const endTime = hasEnd ? updateData.sittingEndTime : existingItem.sittingEndTime
    if (startTime && endTime && endTime < startTime) {
        throw new Error('Oturma bitiş saati başlangıçtan önce olamaz.')
    }

    const item = await prisma.lostItem.update({
        where: { id: parseInt(id) },
        data: updateData
    })

    logger.info(`Lost item updated: ${item.itemName} by ${session.fullName}`)
    revalidatePath('/dashboard/lost-found')
    return item
}, UpdateLostItemSchema)

/**
 * Eşyayı teslim edildi olarak işaretle
 * Sadece ADMIN yapabilir
 */
export const returnItem = safeAction(async (data) => {
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')
    if (session.role !== 'ADMIN') throw new Error('Bu işlem için yetkiniz yok.')

    const item = await prisma.lostItem.update({
        where: { id: parseInt(data.id) },
        data: {
            status: 'RETURNED',
            returnedAt: new Date(),
            returnedTo: data.returnedTo
        }
    })

    logger.info(`Lost item returned: ${item.itemName} to ${data.returnedTo} by ${session.fullName}`)
    await notify('LOST_ITEM_RETURNED', `"${item.itemName}" teslim edildi (${data.returnedTo}).`, session.fullName, { link: '/dashboard/lost-found' })
    revalidatePath('/dashboard/lost-found')
    revalidatePath('/dashboard')
    return item
}, ReturnItemSchema)

/**
 * Eşyayı imha edildi olarak işaretle
 * Sadece ADMIN yapabilir
 */
export const disposeItem = safeAction(async (data) => {
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')
    if (session.role !== 'ADMIN') throw new Error('Bu işlem için yetkiniz yok.')

    const item = await prisma.lostItem.update({
        where: { id: parseInt(data.id) },
        data: {
            status: 'DISPOSED'
        }
    })

    logger.info(`Lost item disposed: ${item.itemName} by ${session.fullName}`)
    await notify('LOST_ITEM_DISPOSED', `"${item.itemName}" imha edildi.`, session.fullName, { link: '/dashboard/lost-found' })
    revalidatePath('/dashboard/lost-found')
    revalidatePath('/dashboard')
    return item
}, IdSchema)

/**
 * Kayıp eşya kaydını sil
 * Sadece ADMIN yapabilir
 */
export const deleteLostItem = safeAction(async (data) => {
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')
    if (session.role !== 'ADMIN') throw new Error('Bu işlem için yetkiniz yok.')

    const item = await prisma.lostItem.delete({
        where: { id: parseInt(data.id) }
    })

    logger.info(`Lost item deleted: ${item.itemName} by ${session.fullName}`)
    await notify('LOST_ITEM_DELETED', `"${item.itemName}" kaydı silindi.`, session.fullName, { link: '/dashboard/lost-found', priority: 'HIGH' })
    revalidatePath('/dashboard/lost-found')
    revalidatePath('/dashboard')
    return { deleted: true }
}, IdSchema)

/**
 * İstatistikleri getir
 */
export const getLostItemStats = safeAction(async () => {
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const [total, found, returned, disposed] = await Promise.all([
        prisma.lostItem.count(),
        prisma.lostItem.count({ where: { status: 'FOUND' } }),
        prisma.lostItem.count({ where: { status: 'RETURNED' } }),
        prisma.lostItem.count({ where: { status: 'DISPOSED' } })
    ])

    // Son 30 günde bulunan eşyalar
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentItems = await prisma.lostItem.count({
        where: {
            createdAt: { gte: thirtyDaysAgo }
        }
    })

    // Kategori bazlı dağılım
    const byCategory = await prisma.lostItem.groupBy({
        by: ['itemCategory'],
        _count: true
    })

    return {
        total,
        found,
        returned,
        disposed,
        recentItems,
        byCategory: byCategory.map(c => ({
            category: c.itemCategory,
            count: c._count
        }))
    }
})

/**
 * Bekleyen (FOUND) eşya sayısını getir - Dashboard için
 */
export const getPendingLostItemsCount = safeAction(async () => {
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const count = await prisma.lostItem.count({
        where: { status: 'FOUND' }
    })

    return count
})
