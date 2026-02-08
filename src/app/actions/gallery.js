'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { safeAction } from '@/lib/safe-action'
import { z } from 'zod'

const UpdateProductPhotoSchema = z.object({
  id: z.coerce.number(),
  photoUrl: z.string().url('Geçerli bir URL girin').optional().or(z.literal(''))
})

function buildInventoryGalleryTree(products) {
  const deptMap = new Map()

  for (const p of products) {
    const raw = p.category || 'Diğer'
    const parts = raw.split(' / ')
    const deptName = parts[0] || 'Diğer'
    const label = parts.length > 1 ? parts.slice(1).join(' / ') : raw

    if (!deptMap.has(deptName)) {
      deptMap.set(deptName, new Map())
    }
    const catMap = deptMap.get(deptName)
    if (!catMap.has(raw)) {
      catMap.set(raw, {
        id: raw,
        name: label,
        fullName: raw,
        items: []
      })
    }
    const category = catMap.get(raw)
    category.items.push({
      id: p.id,
      name: p.name,
      unit: p.unit,
      photoUrl: p.photoUrl,
      category: raw
    })
  }

  const departments = []

  for (const [deptName, catMap] of deptMap.entries()) {
    const categories = Array.from(catMap.values()).sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'tr')
    )
    departments.push({
      id: deptName,
      name: deptName,
      description: null,
      categories
    })
  }

  departments.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  return departments
}

export const getGalleryTree = safeAction(async () => {
  const session = await getSession()
  if (!session) throw new Error('Oturum gerekli.')

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      unit: true,
      category: true,
      photoUrl: true
    }
  })

  return buildInventoryGalleryTree(products)
})

export const updateProductPhoto = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

  const { id, photoUrl } = data

  await prisma.product.update({
    where: { id },
    data: {
      photoUrl: typeof photoUrl === 'string' && photoUrl.trim() === '' ? null : photoUrl || null
    }
  })

  const updated = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      unit: true,
      category: true,
      photoUrl: true
    }
  })

  return updated
}, UpdateProductPhotoSchema)
