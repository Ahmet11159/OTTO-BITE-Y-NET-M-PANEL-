 'use server'
 
 import prisma from '@/lib/prisma'
 import { safeAction } from '@/lib/safe-action'
 import { getSession } from '@/lib/auth'
 
 export const getNotifications = safeAction(async () => {
  const session = await getSession().catch(() => null)
  let notifs = []
  let maint = []
  let orders = []
  try {
    const list1 = await prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' }
    })
    notifs = list1
  } catch {}
  try {
    const list2 = await prisma.maintenanceAlert.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' }
    })
    maint = list2
  } catch {}
  try {
    const list3 = await prisma.orderNotification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' }
    })
    orders = list3
  } catch {}
  const matches = (n) => {
    if (!session) return true
    if (n.userId && parseInt(session.id) !== n.userId) return false
    if (n.role && session.role !== n.role) return false
    if (n.department && session.department !== n.department) return false
    return true
  }
  const a = notifs.filter(matches).map(n => ({ id: n.id, type: n.type, content: n.content, userName: n.userName, createdAt: n.createdAt, link: n.link, priority: n.priority }))
  const b = maint.map(m => ({ id: m.id, type: 'MAINTENANCE_ALERT', content: m.content, userName: 'Sistem', createdAt: m.createdAt }))
  const c = orders.map(o => ({ id: o.id, type: o.type, content: o.content, userName: o.userName, createdAt: o.createdAt }))
  return [...a, ...b, ...c].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))
 })
 
 export const markNotificationsRead = safeAction(async () => {
  try { await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } }) } catch {}
  try { await prisma.maintenanceAlert.updateMany({ where: { isRead: false }, data: { isRead: true } }) } catch {}
  try { await prisma.orderNotification.updateMany({ where: { isRead: false }, data: { isRead: true } }) } catch {}
  return { ok: true }
 })
