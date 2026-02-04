'use server'

import { safeAction } from '@/lib/safe-action'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

const SettingsSchema = z.object({
  general: z.object({
    locale: z.string().optional().default('tr-TR'),
  }).optional(),
  orders: z.object({
    minQty: z.coerce.number().min(1).default(1),
    maxQty: z.coerce.number().min(1).default(250000),
  }).optional(),
  inventory: z.object({}).optional(),
  lostFound: z.object({}).optional(),
  finance: z.object({}).optional(),
  reports: z.object({
    minTextLength: z.coerce.number().min(1).max(1000).default(5),
  }).optional(),
  maintenance: z.object({}).optional(),
  notifications: z.object({
    pollIntervalMs: z.coerce.number().min(3000).max(600000).default(10000),
  }).optional(),
})

function applyEnvOverrides(settings) {
  const envMin = Number(process.env.NEXT_PUBLIC_ORDER_MIN_QTY)
  const envMax = Number(process.env.NEXT_PUBLIC_ORDER_MAX_QTY)
  const hasEnv = Number.isFinite(envMin) || Number.isFinite(envMax)
  if (!hasEnv) return settings
  const baseMin = settings?.orders?.minQty ?? 1
  const baseMax = settings?.orders?.maxQty ?? 250000
  return {
    ...settings,
    orders: {
      minQty: Number.isFinite(envMin) ? envMin : baseMin,
      maxQty: Number.isFinite(envMax) ? envMax : baseMax
    }
  }
}

export const getSettings = safeAction(async () => {
  const defaults = {
    general: { locale: 'tr-TR' },
    orders: { minQty: 1, maxQty: 250000 },
    reports: { minTextLength: 5 },
    notifications: { pollIntervalMs: 10000 }
  }
  try {
    const row = await prisma.appSettings?.findFirst?.()
    const parsed = SettingsSchema.partial().parse(row?.data ?? defaults)
    return applyEnvOverrides(parsed)
  } catch (e) {
    logger.error('getSettings failed', { error: e?.message })
    return defaults
  }
})

export const updateSettings = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')
  try {
    const currentRow = await prisma.appSettings?.findFirst?.()
    const currentData = SettingsSchema.partial().parse(currentRow?.data ?? {})
    const payload = SettingsSchema.partial().parse({ ...currentData, ...data })
    const saved = currentRow
      ? await prisma.appSettings.update({ where: { id: currentRow.id }, data: { data: payload } })
      : await prisma.appSettings.create({ data: { data: payload } })
    return saved.data
  } catch (e) {
    logger.error('updateSettings failed', { error: e?.message })
    throw new Error('Ayarlar kaydedilemedi')
  }
}, SettingsSchema.partial())
