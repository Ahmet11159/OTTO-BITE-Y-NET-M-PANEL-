'use server'

import prisma from '@/lib/prisma'
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { safeAction } from '@/lib/safe-action'
import { z } from 'zod'

const LoginSchema = z.object({
    username: z.string().min(1, 'Kullanıcı adı zorunludur'),
    password: z.string().min(1, 'Şifre zorunludur')
})

export const login = safeAction(async (data) => {
    const { username, password } = data

    // Validate credentials
    const user = await prisma.user.findUnique({
        where: { username },
    })

    if (!user) {
        logger.warn(`Failed login attempt for username: ${username}`)
        throw new Error('Geçersiz kullanıcı adı veya şifre')
    }

    // Check password (supports both bcrypt hash and legacy plain text for migration)
    let isValid = false
    if (user.password.startsWith('$2')) {
            isValid = await bcrypt.compare(password, user.password)
    } else {
        // Legacy plain text check
        isValid = user.password === password
        // Optional: Upgrade to hash if valid
        if (isValid) {
            const hashedPassword = await bcrypt.hash(password, 10)
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            })
            logger.info(`Upgraded password to hash for user: ${username}`)
        }
    }

    if (!isValid) {
        logger.warn(`Invalid password for user: ${username}`)
        throw new Error('Geçersiz kullanıcı adı veya şifre')
    }

    // Create session
    const session = await encrypt({ id: user.id, role: user.role, fullName: user.fullName, department: user.department })
    
    logger.info(`User logged in: ${username} (${user.role})`)

    // Save session in cookie
    cookies().set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        path: '/',
    })

    // Redirect based on role
    redirect('/dashboard')
}, LoginSchema)

export const logout = safeAction(async () => {
    cookies().delete('session')
    redirect('/login')
})
