'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { safeAction } from '@/lib/safe-action'
import { logger } from '@/lib/logger'
import { notify } from '@/lib/notify'
import { z } from 'zod'

/**
 * Professional Order Management Actions
 */

// --- Schemas ---

const OrderItemInputSchema = z.object({
    productName: z.string().min(1),
    quantity: z.coerce.number().positive(),
    unit: z.string().default('adet'),
    productId: z.coerce.number().nullable().optional()
})

const CreateOrderSchema = z.object({
    title: z.string().min(1, 'Başlık zorunludur'),
    items: z.array(OrderItemInputSchema).min(1, 'En az bir ürün eklemelisiniz')
})

const ToggleReceivedSchema = z.object({
    itemId: z.coerce.number(),
    isReceived: z.boolean(),
    receivedQuantity: z.union([
        z.number(),
        z.string().transform((val) => {
            if (val === '' || val === null || val === undefined) return null
            const num = parseFloat(val)
            return isNaN(num) ? null : num
        })
    ]).nullable().optional()
})

const ToggleSyncSchema = z.object({
    itemId: z.coerce.number()
})

const DeleteOrderSchema = z.object({
    id: z.coerce.number()
})

const UpdateOrderTitleSchema = z.object({
    orderId: z.coerce.number(),
    newTitle: z.string().min(1)
})

const UpdateOrderItemSchema = z.object({
    itemId: z.coerce.number(),
    updates: z.object({
        quantity: z.coerce.number().optional(),
        unit: z.string().optional(),
        productName: z.string().optional()
    })
})

const AddOrderItemSchema = z.object({
    orderId: z.coerce.number(),
    item: OrderItemInputSchema
})

const RemoveOrderItemSchema = z.object({
    itemId: z.coerce.number()
})

// --- Actions ---

export const createOrder = safeAction(async (data) => {
    const { title, items } = data
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const order = await prisma.order.create({
        data: {
            title,
            status: 'PENDING',
            items: {
                create: items.map(item => ({
                    productName: item.productName,
                    quantity: parseFloat(item.quantity) || 0,
                    unit: item.unit || 'adet',
                    productId: item.productId || null
                }))
            }
        }
    })

    // Broadcast notification
    await notify('ORDER_CREATED', `"${title}" başlıklı yeni bir sipariş listesi oluşturuldu.`, session.fullName, { link: '/dashboard/orders' })

    logger.info(`Order created: ${title} by ${session.fullName}`)
    revalidatePath('/dashboard/orders')
    return order
}, CreateOrderSchema)

export const getOrders = safeAction(async () => {
    return await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' }
    })
})

export const getOrderById = safeAction(async (data) => {
    const { id } = typeof data === 'object' ? data : { id: data }
    return await prisma.order.findUnique({
        where: { id: parseInt(id) },
        include: { items: true }
    })
})

export const toggleItemReceived = safeAction(async (data) => {
    const { itemId, isReceived, receivedQuantity } = data
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const normalizedQuantity = receivedQuantity !== null && receivedQuantity !== undefined
        ? parseFloat(receivedQuantity)
        : null

    if (isReceived && normalizedQuantity !== null && (Number.isNaN(normalizedQuantity) || normalizedQuantity <= 0)) {
        throw new Error('Geçerli bir teslim miktarı girin.')
    }

    const item = await prisma.orderItem.update({
        where: { id: parseInt(itemId) },
        data: {
            isReceived,
            receivedAt: isReceived ? new Date() : null,
            receivedQuantity: isReceived && normalizedQuantity !== null ? normalizedQuantity : null
        },
        include: { order: true }
    })

    if (isReceived) {
        await notify('ITEM_RECEIVED', `"${item.order.title}" listesindeki "${item.productName}" ürünü geldi.${normalizedQuantity !== null ? ` (${normalizedQuantity} ${item.unit})` : ''}`, session.fullName, { link: '/dashboard/orders' })
    }

    revalidatePath('/dashboard/orders')
    return item
}, ToggleReceivedSchema)

export const toggleInventorySync = safeAction(async (data) => {
    const { itemId } = data
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const item = await prisma.orderItem.findUnique({
        where: { id: parseInt(itemId) },
        include: { order: true }
    })

    if (!item) throw new Error('Ürün bulunamadı.')
    if (!item.isReceived && !item.isAddedToStock) {
        throw new Error('Önce ürünün geldiğini onaylamalısınız.')
    }

    // Try to find matching product in inventory if not linked
    let productId = item.productId
    let officialProductName = item.productName
    let needsRelinking = false

    if (!productId) {
        // No productId - search by name
        const allProducts = await prisma.product.findMany({
            select: { id: true, name: true }
        })
        const matchedProduct = allProducts.find(
            p => p.name.toLowerCase() === item.productName.toLowerCase()
        )
        if (matchedProduct) {
            productId = matchedProduct.id
            officialProductName = matchedProduct.name
            needsRelinking = true
        }
    } else {
        // We have a productId - verify it still exists
        const product = await prisma.product.findUnique({ where: { id: productId } })
        if (product) {
            officialProductName = product.name
        } else {
            // Product was deleted! Try to find by name (self-healing)
            logger.info(`[Orders] Product ID ${productId} was deleted, searching by name: "${item.productName}"`)

            const allProducts = await prisma.product.findMany({
                select: { id: true, name: true }
            })
            const matchedProduct = allProducts.find(
                p => p.name.toLowerCase() === item.productName.toLowerCase()
            )

            if (matchedProduct) {
                // Found! Auto-relink to the new product
                logger.info(`[Orders] Self-healing: Found new product ID ${matchedProduct.id} for "${item.productName}"`)
                productId = matchedProduct.id
                officialProductName = matchedProduct.name
                needsRelinking = true
            } else {
                // Product truly doesn't exist
                throw new Error(`"${item.productName}" depoda bulunamadı. Lütfen önce Depo modülünden bu ürünü ekleyin.`)
            }
        }
    }

    if (!productId) {
        throw new Error(`"${item.productName}" depoda bulunamadı. Lütfen önce Depo modülünden bu ürünü ekleyin.`)
    }

    const newSyncState = !item.isAddedToStock
    const quantityToSync = item.receivedQuantity !== null ? item.receivedQuantity : item.quantity

    // Transaction to update both item and product stock
    await prisma.$transaction(async (tx) => {
        // 1. Update OrderItem (include productId if we relinked to a new product)
        await tx.orderItem.update({
            where: { id: item.id },
            data: {
                isAddedToStock: newSyncState,
                ...(needsRelinking && { productId: productId }) // Persist the new link
            }
        })

        // 2. Update Product Stock
        await tx.product.update({
            where: { id: productId },
            data: {
                currentStock: newSyncState
                    ? { increment: quantityToSync }
                    : { decrement: quantityToSync }
            }
        })

        // Detect if session user actually exists (handling DB resets)
        const activeUser = await tx.user.findUnique({
            where: { id: parseInt(session.id) }
        })
        const userIdToRecord = activeUser ? activeUser.id : null

        // 3. Create Inventory Log & Stock Transaction
        const transactionType = newSyncState ? 'IN' : 'IN' // Always affect the IN column
        const transactionAmount = newSyncState ? quantityToSync : -quantityToSync

        await tx.stockTransaction.create({
            data: {
                productId,
                type: transactionType,
                amount: transactionAmount,
                userId: userIdToRecord
            }
        })

        await tx.inventoryLog.create({
            data: {
                actionType: newSyncState ? 'STOCK_IN' : 'STOCK_OUT', // Log can still say OUT/CORRECTION for clarity
                productName: officialProductName,
                details: newSyncState
                    ? `Sipariş üzerinden otomatik eklendi (${item.order.title})`
                    : `Sipariş eşlemesi geri alındı (Eklenen stok düşüldü) (${item.order.title})`,
                userName: session.fullName,
                userId: userIdToRecord || 0
            }
        })
    })

    revalidatePath('/dashboard/inventory')
    revalidatePath('/dashboard/orders')
    return { success: true }
}, ToggleSyncSchema)

export const getUnfilledOrders = safeAction(async () => {
    return await prisma.order.findMany({
        where: {
            items: {
                some: { isReceived: false }
            }
        },
        include: {
            items: {
                where: { isReceived: false }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
})

export const getNotifications = safeAction(async () => {
    return await prisma.orderNotification.findMany({
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 10
    })
})

export const markNotificationsRead = safeAction(async () => {
    await prisma.orderNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true }
    })
    revalidatePath('/dashboard')
})

export const deleteOrder = safeAction(async (data) => {
    const { id } = data
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') throw new Error('Sadece yöneticiler silebilir.')

    await prisma.order.delete({
        where: { id: parseInt(id) }
    })
    revalidatePath('/dashboard/orders')
}, DeleteOrderSchema)

/**
 * Order Editing Actions
 */

// Update order title
export const updateOrderTitle = safeAction(async (data) => {
    const { orderId, newTitle } = data
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { title: newTitle }
    })

    revalidatePath('/dashboard/orders')
}, UpdateOrderTitleSchema)

// Update an existing order item (quantity, unit, productName)
export const updateOrderItem = safeAction(async (data) => {
    const { itemId, updates } = data
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const item = await prisma.orderItem.findUnique({
        where: { id: parseInt(itemId) }
    })

    if (!item) throw new Error('Ürün bulunamadı.')

    // Don't allow editing if already synced to inventory
    if (item.isAddedToStock) {
        throw new Error('Bu ürün zaten depoya eklendi. Düzenleme yapılamaz.')
    }

    const updateData = {}
    if (updates.quantity !== undefined) updateData.quantity = parseFloat(updates.quantity)
    if (updates.unit !== undefined) updateData.unit = updates.unit
    if (updates.productName !== undefined) updateData.productName = updates.productName

    await prisma.orderItem.update({
        where: { id: parseInt(itemId) },
        data: updateData
    })

    revalidatePath('/dashboard/orders')
}, UpdateOrderItemSchema)

// Add a new item to an existing order
export const addOrderItem = safeAction(async (data) => {
    const { orderId, item } = data
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) }
    })

    if (!order) throw new Error('Sipariş bulunamadı.')

    // Try to find matching product in inventory
    let productId = null
    const allProducts = await prisma.product.findMany({
        select: { id: true, name: true }
    })
    const matchedProduct = allProducts.find(
        p => p.name.toLowerCase() === item.productName.toLowerCase()
    )
    if (matchedProduct) {
        productId = matchedProduct.id
    }

    await prisma.orderItem.create({
        data: {
            orderId: parseInt(orderId),
            productName: item.productName,
            quantity: parseFloat(item.quantity) || 0,
            unit: item.unit || 'adet',
            productId: productId,
            isReceived: false,
            isAddedToStock: false
        }
    })

    revalidatePath('/dashboard/orders')
}, AddOrderItemSchema)

// Remove an item from an order
export const removeOrderItem = safeAction(async (data) => {
    const { itemId } = data
    const session = await getSession()
    if (!session) throw new Error('Oturum gerekli.')

    const item = await prisma.orderItem.findUnique({
        where: { id: parseInt(itemId) }
    })

    if (!item) throw new Error('Ürün bulunamadı.')

    // Don't allow deletion if already synced to inventory
    if (item.isAddedToStock) {
        throw new Error('Bu ürün zaten depoya eklendi. Silmeden önce depo eşlemesini geri alın.')
    }

    await prisma.orderItem.delete({
        where: { id: parseInt(itemId) }
    })

    const remainingItems = await prisma.orderItem.count({
        where: { orderId: item.orderId }
    })

    revalidatePath('/dashboard/orders')
    return { remainingItems }
}, RemoveOrderItemSchema)
