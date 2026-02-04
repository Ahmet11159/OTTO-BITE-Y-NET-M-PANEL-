 'use server'
 
 import prisma from '@/lib/prisma'
 import { getSession } from '@/lib/auth'
 import { revalidatePath } from 'next/cache'
 import { safeAction } from '@/lib/safe-action'
 import { z } from 'zod'
import { notify } from '@/lib/notify'
 
 const DateRangeSchema = z.object({
   startDate: z.string().optional().nullable(),
   endDate: z.string().optional().nullable(),
   category: z.string().optional().nullable(),
   search: z.string().optional().nullable(),
   showAll: z.boolean().optional(),
   limit: z.coerce.number().optional(),
   offset: z.coerce.number().optional()
 })
 
 const CreateExpenseSchema = z.object({
   date: z.string().optional(),
   category: z.string().min(1, 'Kategori zorunludur'),
   description: z.string().min(1, 'Açıklama zorunludur'),
   amount: z.coerce.number().positive('Tutar pozitif olmalıdır'),
   paymentMethod: z.string().optional().default('CASH'),
   receiptNumber: z.string().optional()
 })
 
 const CategorySchema = z.object({
   name: z.string().min(1, 'Kategori adı zorunludur')
 })
 
const UpdateCategorySchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1, 'Kategori adı zorunludur')
})

const UpdateExpenseSchema = z.object({
  id: z.coerce.number(),
  date: z.string().optional(),
  category: z.string().min(1, 'Kategori zorunludur'),
  description: z.string().min(1, 'Açıklama zorunludur'),
  amount: z.coerce.number().positive('Tutar pozitif olmalıdır'),
  paymentMethod: z.string().optional().default('CASH'),
  receiptNumber: z.string().optional()
})

 function parseSafeDate(dateInput, fallback) {
   if (!dateInput) return fallback
   try {
     const d = new Date(dateInput)
     if (isNaN(d.getTime())) return fallback
     return d
   } catch (e) {
     return fallback
   }
 }
 
 export const getCashExpenses = safeAction(async (filters = {}) => {
   const session = await getSession()
   if (!session) return []
 
   const now = new Date()
   const start = filters.showAll ? null : parseSafeDate(filters.startDate, new Date(now.getFullYear(), now.getMonth(), 1))
   const end = filters.showAll ? null : parseSafeDate(filters.endDate, new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999))
 
   if (start) start.setHours(0, 0, 0, 0)
   if (end) end.setHours(23, 59, 59, 999)
 
   const where = {}
   if (start && end) {
     where.date = { gte: start, lte: end }
   }
   if (filters.category && filters.category !== 'all') {
     where.category = filters.category
   }
   if (filters.search && filters.search.trim()) {
     where.description = { contains: filters.search.trim() }
   }
 
   return await prisma.cashExpense.findMany({
     where,
     orderBy: { date: 'desc' }
   })
 }, DateRangeSchema)
 
 export const getCashExpenseStats = safeAction(async (filters = {}) => {
   const session = await getSession()
   if (!session) return {}
 
   const now = new Date()
   const start = filters.showAll ? null : parseSafeDate(filters.startDate, new Date(now.getFullYear(), now.getMonth(), 1))
   const end = filters.showAll ? null : parseSafeDate(filters.endDate, new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999))
   if (start) start.setHours(0, 0, 0, 0)
   if (end) end.setHours(23, 59, 59, 999)
 
   const whereBase = {}
   if (start && end) {
     whereBase.date = { gte: start, lte: end }
   }
   if (filters.category && filters.category !== 'all') {
     whereBase.category = filters.category
   }
 
   const total = await prisma.cashExpense.aggregate({
     _sum: { amount: true },
     where: whereBase
   })
 
   const byDayRaw = await prisma.cashExpense.groupBy({
     by: ['date'],
     _sum: { amount: true },
     where: whereBase
   })
 
   // Normalize by day (YYYY-MM-DD)
   const byDay = {}
   byDayRaw.forEach(d => {
     const key = new Date(d.date).toISOString().split('T')[0]
     byDay[key] = (byDay[key] || 0) + (d._sum.amount || 0)
   })
 
   const byCategory = await prisma.cashExpense.groupBy({
     by: ['category'],
     _sum: { amount: true },
     where: whereBase
   })
 
   return {
     totalAmount: total._sum.amount || 0,
     daysWithExpenses: Object.keys(byDay).length,
     byDay,
     byCategory: byCategory.map(x => ({ category: x.category, amount: x._sum.amount || 0 }))
   }
 }, DateRangeSchema)
 
 export const createCashExpense = safeAction(async (data) => {
   const session = await getSession()
   if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) {
     throw new Error('Unauthorized')
   }
 
   const expenseDate = data.date ? new Date(data.date) : new Date()
 
  const created = await prisma.cashExpense.create({
    data: {
       date: expenseDate,
       category: data.category,
       description: data.description,
       amount: data.amount,
       paymentMethod: data.paymentMethod || 'CASH',
       receiptNumber: data.receiptNumber || null,
       createdById: session.id
     }
   })
 
  await notify('CASH_EXPENSE_CREATED', `${data.category}: ${data.description} - ${data.amount}`, session.fullName, { link: '/dashboard/finance/cash-expenses' })
   revalidatePath('/dashboard/finance/cash-expenses')
  return created
 }, CreateExpenseSchema)
 
 export const getExpenseCategories = safeAction(async () => {
   const cats = await prisma.cashExpenseCategory.findMany({ orderBy: { name: 'asc' } })
   return cats
 })
 
 export const addExpenseCategory = safeAction(async (data) => {
   const session = await getSession()
   if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')
 
   const cat = await prisma.cashExpenseCategory.create({ data: { name: data.name } })
   revalidatePath('/dashboard/finance/cash-expenses')
   return cat
 }, CategorySchema)

export const updateExpenseCategory = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')
  await prisma.cashExpenseCategory.update({
    where: { id: data.id },
    data: { name: data.name }
  })
  revalidatePath('/dashboard/finance/cash-expenses')
  return { updated: true }
}, UpdateCategorySchema)

export const deleteExpenseCategory = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')
  const id = typeof data === 'object' ? data.id : data
  await prisma.cashExpenseCategory.delete({ where: { id: parseInt(id) } })
  revalidatePath('/dashboard/finance/cash-expenses')
  return { deleted: true }
}, z.object({ id: z.coerce.number() }))

export const updateCashExpense = safeAction(async (data) => {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) {
    throw new Error('Unauthorized')
  }
  const expenseDate = data.date ? new Date(data.date) : undefined
  await prisma.cashExpense.update({
    where: { id: data.id },
    data: {
      ...(expenseDate ? { date: expenseDate } : {}),
      category: data.category,
      description: data.description,
      amount: data.amount,
      paymentMethod: data.paymentMethod || 'CASH',
      receiptNumber: data.receiptNumber || null
    }
  })
  await notify('CASH_EXPENSE_UPDATED', `${data.category}: ${data.description} - ${data.amount}`, session.fullName, { link: '/dashboard/finance/cash-expenses' })
  revalidatePath('/dashboard/finance/cash-expenses')
  return { updated: true }
}, UpdateExpenseSchema)

export const deleteCashExpense = safeAction(async (data) => {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) {
    throw new Error('Unauthorized')
  }
  const id = typeof data === 'object' ? data.id : data
  await prisma.cashExpense.delete({ where: { id: parseInt(id) } })
  await notify('CASH_EXPENSE_DELETED', `Nakit çıkış silindi #${id}`, session.fullName, { link: '/dashboard/finance/cash-expenses', priority: 'HIGH' })
  revalidatePath('/dashboard/finance/cash-expenses')
  return { deleted: true }
}, z.object({ id: z.coerce.number() }))
