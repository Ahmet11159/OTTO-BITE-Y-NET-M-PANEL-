'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { safeAction } from '@/lib/safe-action'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const CreateDepartmentSchema = z.object({
  name: z.string().min(1, 'Departman adı zorunludur'),
  description: z.string().optional()
})

const UpdateDepartmentSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1, 'Departman adı zorunludur'),
  description: z.string().optional(),
  position: z.coerce.number().optional()
})

const CreateCategorySchema = z.object({
  departmentId: z.coerce.number(),
  name: z.string().min(1, 'Kategori adı zorunludur'),
  description: z.string().optional()
})

const UpdateCategorySchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1, 'Kategori adı zorunludur'),
  description: z.string().optional(),
  position: z.coerce.number().optional()
})

const CreateItemSchema = z.object({
  categoryId: z.coerce.number(),
  name: z.string().min(1, 'Ürün adı zorunludur'),
  description: z.string().optional(),
  sizeLabel: z.string().optional(),
  photoUrl: z.string().url('Geçerli bir URL girin').optional()
})

const UpdateItemSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1, 'Ürün adı zorunludur').optional(),
  description: z.string().optional(),
  sizeLabel: z.string().optional(),
  photoUrl: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  position: z.coerce.number().optional()
})

const IdSchema = z.object({
  id: z.coerce.number()
})

export const getGalleryTree = safeAction(async () => {
  const session = await getSession()
  if (!session) throw new Error('Oturum gerekli.')

  const departments = await prisma.galleryDepartment.findMany({
    orderBy: { position: 'asc' },
    include: {
      categories: {
        orderBy: { position: 'asc' },
        include: {
          items: {
            orderBy: { position: 'asc' }
          }
        }
      }
    }
  })

  return departments
})

export const createDepartment = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

  const maxPos = await prisma.galleryDepartment.aggregate({
    _max: { position: true }
  })

  const department = await prisma.galleryDepartment.create({
    data: {
      name: data.name,
      description: data.description || null,
      position: (maxPos._max.position || 0) + 1
    }
  })

  logger.info(`Gallery department created: ${department.name}`)
  revalidatePath('/dashboard/gallery')
  return department
}, CreateDepartmentSchema)

export const updateDepartment = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

  const { id, position, ...rest } = data

  const department = await prisma.galleryDepartment.update({
    where: { id },
    data: {
      ...rest,
      position: typeof position === 'number' ? position : undefined
    }
  })

  logger.info(`Gallery department updated: ${department.name}`)
  revalidatePath('/dashboard/gallery')
  return department
}, UpdateDepartmentSchema)

export const deleteDepartment = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

  const department = await prisma.galleryDepartment.delete({
    where: { id: data.id }
  })

  logger.info(`Gallery department deleted: ${department.name}`)
  revalidatePath('/dashboard/gallery')
  return { deleted: true }
}, IdSchema)

export const createCategory = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

  const maxPos = await prisma.galleryCategory.aggregate({
    where: { departmentId: data.departmentId },
    _max: { position: true }
  })

  const category = await prisma.galleryCategory.create({
    data: {
      name: data.name,
      description: data.description || null,
      departmentId: data.departmentId,
      position: (maxPos._max.position || 0) + 1
    }
  })

  logger.info(`Gallery category created: ${category.name}`)
  revalidatePath('/dashboard/gallery')
  return category
}, CreateCategorySchema)

export const updateCategory = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

  const { id, position, ...rest } = data

  const category = await prisma.galleryCategory.update({
    where: { id },
    data: {
      ...rest,
      position: typeof position === 'number' ? position : undefined
    }
  })

  logger.info(`Gallery category updated: ${category.name}`)
  revalidatePath('/dashboard/gallery')
  return category
}, UpdateCategorySchema)

export const deleteCategory = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

  const category = await prisma.galleryCategory.delete({
    where: { id: data.id }
  })

  logger.info(`Gallery category deleted: ${category.name}`)
  revalidatePath('/dashboard/gallery')
  return { deleted: true }
}, IdSchema)

export const createItem = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

  const maxPos = await prisma.galleryItem.aggregate({
    where: { categoryId: data.categoryId },
    _max: { position: true }
  })

  const item = await prisma.galleryItem.create({
    data: {
      name: data.name,
      description: data.description || null,
      sizeLabel: data.sizeLabel || null,
      photoUrl: data.photoUrl || null,
      categoryId: data.categoryId,
      position: (maxPos._max.position || 0) + 1
    }
  })

  logger.info(`Gallery item created: ${item.name}`)
  revalidatePath('/dashboard/gallery')
  return item
}, CreateItemSchema)

export const updateItem = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

  const { id, position, photoUrl, ...rest } = data

  const cleanData = { ...rest }
  if (typeof photoUrl === 'string') {
    cleanData.photoUrl = photoUrl.trim() === '' ? null : photoUrl
  }
  if (typeof position === 'number') {
    cleanData.position = position
  }

  const item = await prisma.galleryItem.update({
    where: { id },
    data: cleanData
  })

  logger.info(`Gallery item updated: ${item.name}`)
  revalidatePath('/dashboard/gallery')
  return item
}, UpdateItemSchema)

export const deleteItem = safeAction(async (data) => {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized')

  const item = await prisma.galleryItem.delete({
    where: { id: data.id }
  })

  logger.info(`Gallery item deleted: ${item.name}`)
  revalidatePath('/dashboard/gallery')
  return { deleted: true }
}, IdSchema)

