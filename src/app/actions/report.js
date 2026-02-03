'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { safeAction } from '@/lib/safe-action'
import { z } from 'zod'

// --- Schemas ---

const CreateReportSchema = z.object({
    shiftType: z.string().min(1, 'Vardiye tipi seçiniz'),
    personnelStatus: z.string().optional(),
    operationalNotes: z.string().optional(),
    technicalIssues: z.string().optional(),
    closingChecklist: z.boolean().optional()
})

const UpdateReportSchema = CreateReportSchema.extend({
    id: z.coerce.number()
})

const ManagerNoteSchema = z.object({
    reportId: z.coerce.number(),
    managerNote: z.string().min(1, 'Not boş olamaz')
})

const ReviewStatusSchema = z.object({
    reportId: z.coerce.number(),
    isReviewed: z.boolean()
})

const DeleteReportSchema = z.object({
    reportId: z.coerce.number()
})

// --- Actions ---

export const createReport = safeAction(async (data) => {
    const session = await getSession()
    if (!session || (session.role !== 'CHEF' && session.role !== 'ADMIN')) {
        throw new Error('Unauthorized')
    }

    const { shiftType, personnelStatus, operationalNotes, technicalIssues, closingChecklist } = data
    const department = session.department || 'Belirtilmemiş'

    await prisma.report.create({
        data: {
            shiftType,
            department,
            personnelStatus,
            operationalNotes,
            technicalIssues,
            closingChecklist: !!closingChecklist,
            authorId: session.id
        }
    })

    if (session.role === 'ADMIN') {
        redirect('/dashboard/reports/manager')
    } else {
        redirect('/dashboard/reports/chef')
    }
}, CreateReportSchema)

export const getMyReports = safeAction(async (filters = {}) => {
    const session = await getSession()
    if (!session) return []

    const where = {
        authorId: session.id
    }

    if (filters.shiftType && filters.shiftType !== 'all') {
        where.shiftType = filters.shiftType
    }

    if (filters.startDate) {
        where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) }
    }

    if (filters.endDate) {
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt = { ...where.createdAt, lte: end }
    }

    return await prisma.report.findMany({
        where,
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            author: true
        }
    })
})

export const getAllReports = safeAction(async (filters = {}) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return []

    const where = {}

    if (filters.department && filters.department !== 'all') {
        where.department = filters.department
    }

    if (filters.shiftType && filters.shiftType !== 'all') {
        where.shiftType = filters.shiftType
    }

    if (filters.startDate) {
        where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) }
    }

    if (filters.endDate) {
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt = { ...where.createdAt, lte: end }
    }

    return await prisma.report.findMany({
        where,
        include: {
            author: {
                select: { fullName: true, department: true }
            },
            reviewer: {
                select: { fullName: true }
            }
        },
        orderBy: [
            { isReviewed: 'asc' }, // Unreviewed first
            { createdAt: 'desc' }
        ]
    })
})

export const addManagerNote = safeAction(async (data) => {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    const { reportId, managerNote } = data

    await prisma.report.update({
        where: { id: reportId },
        data: {
            managerNote,
            isReviewed: true, // Adding a note implicitly reviews it
            reviewedById: session.id
        }
    })

    revalidatePath('/dashboard/reports/manager')
}, ManagerNoteSchema)

export const toggleReviewStatus = safeAction(async (data) => {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) {
        throw new Error('Unauthorized')
    }

    const { reportId, isReviewed } = data

    const updateData = { isReviewed }

    if (isReviewed) {
        updateData.reviewedById = session.id
    } else {
        updateData.reviewedById = null
    }

    await prisma.report.update({
        where: { id: reportId },
        data: updateData
    })

    revalidatePath('/dashboard/reports/manager')
}, ReviewStatusSchema)

export const deleteReport = safeAction(async (data) => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const { reportId } = data

    const report = await prisma.report.findUnique({
        where: { id: reportId },
        select: { authorId: true }
    })

    if (!report) throw new Error('Report not found')

    // Allow if Admin OR Author
    if (session.role !== 'ADMIN' && session.id !== report.authorId) {
        throw new Error('Unauthorized')
    }

    await prisma.report.delete({
        where: { id: reportId }
    })

    revalidatePath('/dashboard/reports/chef')
    revalidatePath('/dashboard/reports/manager')
}, DeleteReportSchema)

export const updateReport = safeAction(async (data) => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const { id, shiftType, personnelStatus, operationalNotes, technicalIssues, closingChecklist } = data

    const report = await prisma.report.findUnique({
        where: { id },
        select: { authorId: true }
    })

    if (!report) throw new Error('Report not found')

    if (session.id !== report.authorId) {
        throw new Error('Unauthorized')
    }

    await prisma.report.update({
        where: { id },
        data: {
            shiftType,
            personnelStatus,
            operationalNotes,
            technicalIssues,
            closingChecklist: !!closingChecklist
        }
    })

    redirect('/dashboard/reports/chef')
}, UpdateReportSchema)
