'use server'

import prisma from '@/lib/prisma'
import { safeAction } from '@/lib/safe-action'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'

const RegisterSchema = z.object({
    fullName: z.string().min(1, 'Ad Soyad zorunludur'),
    username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
    department: z.string().optional()
})

export const registerFirstAdmin = safeAction(async (data) => {
    const { fullName, username, password, department } = data

    // Check if username exists
    const existing = await prisma.user.findUnique({
        where: { username }
    })

    if (existing) {
        throw new Error('Bu kullanıcı adı zaten kullanılıyor.')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create ADMIN user
    await prisma.user.create({
        data: {
            fullName,
            username,
            password: hashedPassword,
            role: 'ADMIN',
            department: department || 'Yönetim'
        }
    })

    logger.info(`New ADMIN user registered: ${username}`)

    redirect('/login?registered=true')
}, RegisterSchema)
