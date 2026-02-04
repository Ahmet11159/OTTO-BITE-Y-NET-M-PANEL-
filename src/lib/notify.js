'use server'

import prisma from '@/lib/prisma'
import { publish } from '@/lib/sse'

export async function notify(type, content, userName = 'Sistem', options = {}) {
  const payload = {
    type,
    content,
    userName,
    link: options.link || null,
    role: options.role || null,
    department: options.department || null,
    userId: options.userId || null,
    priority: options.priority || 'INFO'
  }
  try {
    await prisma.notification.create({ data: payload })
    publish(payload)
    return { ok: true }
  } catch (e) {
    try {
      await prisma.orderNotification.create({
        data: {
          type: payload.type || 'INFO',
          content: payload.content,
          userName: payload.userName
        }
      })
      publish(payload)
    } catch {}
    return { ok: false }
  }
}
