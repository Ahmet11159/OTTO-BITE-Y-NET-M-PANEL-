'use server'

import { safeAction } from '@/lib/safe-action'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'app-settings.json')

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

function ensureFile() {
  const dir = path.dirname(SETTINGS_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(SETTINGS_PATH)) {
    fs.writeFileSync(
      SETTINGS_PATH,
      JSON.stringify(
        {
          general: { locale: 'tr-TR' },
          orders: { minQty: 1, maxQty: 250000 },
          reports: { minTextLength: 5 },
          notifications: { pollIntervalMs: 10000 },
        },
        null,
        2
      )
    )
  }
}

export const getSettings = safeAction(async () => {
  ensureFile()
  const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
  try {
    const parsed = JSON.parse(raw)
    return SettingsSchema.partial().parse(parsed)
  } catch {
    return { orders: { minQty: 1, maxQty: 250000 } }
  }
})

export const updateSettings = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')
  ensureFile()
  const current = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
  const payload = SettingsSchema.partial().parse({ ...current, ...data })
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(payload, null, 2))
  return payload
}, SettingsSchema.partial())
