'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { safeAction } from '@/lib/safe-action'
import { z } from 'zod'

const CreateUserSchema = z.object({
    fullName: z.string().min(1, 'Ad Soyad zorunludur'),
    username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır'),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    role: z.enum(['ADMIN', 'CHEF']),
    department: z.string().optional()
})

const DeleteUserSchema = z.object({
    id: z.coerce.number()
})

export const createUser = safeAction(async (data) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    const { fullName, username, password, role, department } = data

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
        throw new Error('Bu kullanıcı adı zaten alınmış.')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
        data: {
            fullName,
            username,
            password: hashedPassword,
            role,
            department
        }
    })

    logger.info(`New user created: ${username} by ${session.fullName}`)
    revalidatePath('/dashboard/reports/manager/users')
    return { created: true }
}, CreateUserSchema)

export const getUsers = safeAction(async () => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return []
    }

    return await prisma.user.findMany({
        select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
            department: true
        },
        orderBy: {
            role: 'asc'
        }
    })
})

export const deleteUser = safeAction(async (data) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    const { id } = data

    // Prevent deleting self
    if (id === parseInt(session.id)) {
        throw new Error('Kendinizi silemezsiniz.')
    }

    await prisma.user.delete({
        where: { id }
    })

    revalidatePath('/dashboard/reports/manager/users')
}, DeleteUserSchema)

const ResetPasswordSchema = z.object({
    id: z.coerce.number(),
    customPassword: z.string().min(8, 'Şifre en az 8 karakter olmalıdır').optional()
})

export const resetUserPassword = safeAction(async (data) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    const { id, customPassword } = data

    // Özel şifre verilmişse onu kullan, yoksa rastgele oluştur
    let newPassword
    if (customPassword && customPassword.trim()) {
        newPassword = customPassword.trim()
    } else {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
        newPassword = ''
        for (let i = 0; i < 12; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length))
        }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
            password: hashedPassword
        }
    })

    logger.info(`Password reset for user ID: ${id} by ${session.fullName}`)
    revalidatePath('/dashboard/reports/manager/users')

    return { newPassword }
}, ResetPasswordSchema)
