 import { NextResponse } from 'next/server'
 import prisma from '@/lib/prisma'
 
 export const dynamic = 'force-dynamic'
 
 export async function GET(request) {
   const cronSecret = process.env.CRON_SECRET
   if (cronSecret) {
     const requestSecret = request.headers.get('x-cron-secret')
     if (requestSecret !== cronSecret) {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
     }
   }
 
   try {
     const now = new Date()
     const plans = await prisma.maintenancePlan.findMany({
       where: { nextDueDate: { not: null }, status: 'ACTIVE' },
       include: { equipment: true }
     })
     let created = 0
     for (const p of plans) {
       if (!p.nextDueDate) continue
       const msPerDay = 24 * 60 * 60 * 1000
       const daysRemaining = Math.floor((new Date(p.nextDueDate).getTime() - now.getTime()) / msPerDay)
       const thresholds = (p.notifyThresholds || '').split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
       if (thresholds.includes(daysRemaining)) {
         const content = `${p.equipment?.name || 'Ekipman'} • ${p.title} • ${daysRemaining} gün kaldı`
         await prisma.maintenanceAlert.create({
           data: { content, equipmentId: p.equipmentId, planId: p.id }
         })
         created++
       }
     }
     return NextResponse.json({ success: true, created })
   } catch (e) {
     return NextResponse.json({ success: false, error: e.message }, { status: 500 })
   }
 }
