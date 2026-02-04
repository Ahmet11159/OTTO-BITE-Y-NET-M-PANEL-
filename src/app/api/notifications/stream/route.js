import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/auth'
import { subscribe } from '@/lib/sse'

export async function GET() {
  const session = cookies().get('session')?.value
  const user = await decrypt(session).catch(() => null)

  const ts = new TransformStream()
  const writer = ts.writable.getWriter()
  const encoder = new TextEncoder()
  const send = (data) => writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

  const matches = (n) => {
    if (!user) return true
    if (n.userId && parseInt(user.id) !== n.userId) return false
    if (n.role && user.role !== n.role) return false
    if (n.department && user.department !== n.department) return false
    return true
  }

  try {
    const list1 = await prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    list1.filter(matches).forEach(n => send(n))
  } catch {}
  try {
    const list2 = await prisma.maintenanceAlert.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    list2.forEach(m => send({ id: m.id, type: 'MAINTENANCE_ALERT', content: m.content, userName: 'Sistem', createdAt: m.createdAt }))
  } catch {}
  try {
    const list3 = await prisma.orderNotification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    list3.forEach(o => send({ id: o.id, type: o.type, content: o.content, userName: o.userName, createdAt: o.createdAt }))
  } catch {}

  const unsub = subscribe((n) => {
    if (matches(n)) send(n)
  })

  const ping = setInterval(() => {
    writer.write(encoder.encode(`: ping\n\n`))
  }, 15000)

  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  }

  const res = new Response(ts.readable, { headers })

  res.body.cancel = () => {
    clearInterval(ping)
    unsub()
    writer.close().catch(() => {})
  }

  return res
}
