 'use server'
 
 import prisma from '@/lib/prisma'
 import { safeAction } from '@/lib/safe-action'
 
 export const getNotifications = safeAction(async () => {
   const maintenance = await prisma.maintenanceAlert.findMany({
     where: { isRead: false },
     orderBy: { createdAt: 'desc' }
   })
   return maintenance.map(m => ({
     id: m.id,
     type: 'MAINTENANCE_ALERT',
     content: m.content,
     userName: 'Sistem',
     createdAt: m.createdAt
   }))
 })
 
 export const markNotificationsRead = safeAction(async () => {
   await prisma.maintenanceAlert.updateMany({
     where: { isRead: false },
     data: { isRead: true }
   })
   return { ok: true }
 })
