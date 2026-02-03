 'use server'
 
 import prisma from '@/lib/prisma'
 import { getSession } from '@/lib/auth'
 import { revalidatePath } from 'next/cache'
 import { safeAction } from '@/lib/safe-action'
 import { z } from 'zod'
 
 const EquipmentSchema = z.object({
   name: z.string().min(1),
   serial: z.string().optional(),
   location: z.string().optional(),
   vendor: z.string().optional(),
   defaultCycleDays: z.coerce.number().optional(),
   status: z.string().optional()
 })
 
 const UpdateEquipmentSchema = EquipmentSchema.extend({ id: z.coerce.number() })
 
 const PlanSchema = z.object({
   equipmentId: z.coerce.number(),
   title: z.string().min(1),
   firm: z.string().optional(),
   description: z.string().optional(),
   startDate: z.string().optional(),
   cycleDays: z.coerce.number().optional(),
   notifyThresholds: z.string().optional(),
   nextDueDate: z.string().optional()
 })
 
 const UpdatePlanSchema = PlanSchema.extend({
   id: z.coerce.number(),
   status: z.string().optional()
 })
 
 const RecordSchema = z.object({
   equipmentId: z.coerce.number(),
   planId: z.coerce.number().optional(),
   date: z.string().optional(),
   description: z.string().optional(),
   firm: z.string().optional()
 })
 
 const AlertsMarkSchema = z.object({ ids: z.array(z.coerce.number()).optional() })
 
 function parseDate(s, fb) {
   if (!s) return fb
   const d = new Date(s)
   return isNaN(d.getTime()) ? fb : d
 }
 
 export const getEquipment = safeAction(async () => {
   return await prisma.equipment.findMany({ orderBy: { name: 'asc' } })
 })
 
 export const createEquipment = safeAction(async (data) => {
   const session = await getSession()
   if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')
   const created = await prisma.equipment.create({
     data: {
       name: data.name,
       serial: data.serial || null,
       location: data.location || null,
       vendor: data.vendor || null,
       defaultCycleDays: data.defaultCycleDays || null,
       status: data.status || 'ACTIVE'
     }
   })
   revalidatePath('/dashboard/bakim')
   return created
 }, EquipmentSchema)
 
 export const updateEquipment = safeAction(async (data) => {
   const session = await getSession()
   if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')
   await prisma.equipment.update({
     where: { id: data.id },
     data: {
       name: data.name,
       serial: data.serial || null,
       location: data.location || null,
       vendor: data.vendor || null,
       defaultCycleDays: data.defaultCycleDays || null,
       status: data.status || 'ACTIVE'
     }
   })
   revalidatePath('/dashboard/bakim')
   return { updated: true }
 }, UpdateEquipmentSchema)
 
 export const deleteEquipment = safeAction(async (data) => {
   const session = await getSession()
   if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')
   await prisma.equipment.delete({ where: { id: data.id } })
   revalidatePath('/dashboard/bakim')
   return { deleted: true }
 }, z.object({ id: z.coerce.number() }))
 
 export const getPlans = safeAction(async (filters = {}) => {
   const where = {}
   if (filters.equipmentId) where.equipmentId = filters.equipmentId
   if (filters.status && filters.status !== 'all') where.status = filters.status
   return await prisma.maintenancePlan.findMany({
     where,
     orderBy: { nextDueDate: 'asc' },
     include: { equipment: true }
   })
 })
 
 export const createPlan = safeAction(async (data) => {
   const session = await getSession()
   if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) throw new Error('Unauthorized')
   const start = parseDate(data.startDate, new Date())
   const nextDue = data.nextDueDate ? new Date(data.nextDueDate) : (data.cycleDays ? new Date(start.getTime() + Number(data.cycleDays) * 24 * 60 * 60 * 1000) : null)
   const created = await prisma.maintenancePlan.create({
     data: {
       equipmentId: data.equipmentId,
       title: data.title,
       firm: data.firm || null,
       description: data.description || null,
       startDate: start,
       cycleDays: data.cycleDays || null,
       notifyThresholds: data.notifyThresholds || null,
       nextDueDate: nextDue
     }
   })
   revalidatePath('/dashboard/bakim')
   return created
 }, PlanSchema)
 
 export const updatePlan = safeAction(async (data) => {
   const session = await getSession()
   if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) throw new Error('Unauthorized')
   await prisma.maintenancePlan.update({
     where: { id: data.id },
     data: {
       equipmentId: data.equipmentId,
       title: data.title,
       firm: data.firm || null,
       description: data.description || null,
       startDate: data.startDate ? new Date(data.startDate) : undefined,
       cycleDays: data.cycleDays || null,
       notifyThresholds: data.notifyThresholds || null,
       nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
       status: data.status || undefined
     }
   })
   revalidatePath('/dashboard/bakim')
   return { updated: true }
 }, UpdatePlanSchema)
 
 export const deletePlan = safeAction(async (data) => {
   const session = await getSession()
   if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) throw new Error('Unauthorized')
   await prisma.maintenancePlan.delete({ where: { id: data.id } })
   revalidatePath('/dashboard/bakim')
   return { deleted: true }
 }, z.object({ id: z.coerce.number() }))
 
 export const createRecord = safeAction(async (data) => {
   const session = await getSession()
   if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) throw new Error('Unauthorized')
   const date = parseDate(data.date, new Date())
  let prevNext = null
  if (data.planId) {
    const prevPlan = await prisma.maintenancePlan.findUnique({ where: { id: data.planId } })
    prevNext = prevPlan?.nextDueDate || null
  }
   const created = await prisma.maintenanceRecord.create({
     data: {
       equipmentId: data.equipmentId,
       planId: data.planId || null,
       date,
       description: data.description || null,
      firm: data.firm || null,
      prevNextDueDate: prevNext
     }
   })
   // If plan has cycle, bump nextDueDate
   if (data.planId) {
     const plan = await prisma.maintenancePlan.findUnique({ where: { id: data.planId } })
     if (plan && plan.cycleDays && Number(plan.cycleDays) > 0) {
       const nd = new Date(date.getTime() + Number(plan.cycleDays) * 24 * 60 * 60 * 1000)
       await prisma.maintenancePlan.update({ where: { id: plan.id }, data: { nextDueDate: nd } })
     }
   }
   revalidatePath('/dashboard/bakim')
   return created
 }, RecordSchema)

export const revertLastRecord = safeAction(async (data) => {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'CHEF')) throw new Error('Unauthorized')
  const planId = typeof data === 'object' ? data.planId : data
  const last = await prisma.maintenanceRecord.findFirst({
    where: { planId: planId },
    orderBy: { date: 'desc' }
  })
  if (!last) throw new Error('Geri alınacak kayıt bulunamadı')
  const plan = await prisma.maintenancePlan.findUnique({ where: { id: planId } })
  let revertedTo = last.prevNextDueDate
  if (!revertedTo && plan && plan.cycleDays && Number(plan.cycleDays) > 0 && plan.nextDueDate) {
    const nd = new Date(plan.nextDueDate)
    nd.setDate(nd.getDate() - Number(plan.cycleDays))
    revertedTo = nd
  }
  await prisma.maintenancePlan.update({
    where: { id: planId },
    data: { nextDueDate: revertedTo || null }
  })
  await prisma.maintenanceRecord.delete({ where: { id: last.id } })
  revalidatePath('/dashboard/bakim')
  return { reverted: true, revertedTo }
}, z.object({ planId: z.coerce.number() }))
 
 export const getRecords = safeAction(async (filters = {}) => {
   const where = {}
   if (filters.equipmentId) where.equipmentId = filters.equipmentId
   return await prisma.maintenanceRecord.findMany({
     where,
     orderBy: { date: 'desc' },
     include: { equipment: true, plan: true }
   })
 })
 
 export const getAlerts = safeAction(async () => {
   return await prisma.maintenanceAlert.findMany({ where: { isRead: false }, orderBy: { createdAt: 'desc' } })
 })
 
 export const markAlertsRead = safeAction(async (data) => {
   const where = data.ids && data.ids.length ? { id: { in: data.ids } } : { isRead: false }
   await prisma.maintenanceAlert.updateMany({ where, data: { isRead: true } })
   return { ok: true }
 }, AlertsMarkSchema)
