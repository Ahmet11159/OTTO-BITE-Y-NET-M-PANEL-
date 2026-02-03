 import { getSession } from '@/lib/auth'
 import { redirect } from 'next/navigation'
 import { getEquipment, getPlans, getRecords } from '@/app/actions/bakim'
 import BakimDashboard from './ui/bakim-dashboard'
 
 export const dynamic = 'force-dynamic'
 
 export default async function BakimPage({ searchParams }) {
   const session = await getSession()
   if (!session) redirect('/login')
 
   const equipmentRes = await getEquipment()
   const plansRes = await getPlans({ equipmentId: searchParams?.equipmentId ? parseInt(searchParams.equipmentId) : undefined })
   const recordsRes = await getRecords({ equipmentId: searchParams?.equipmentId ? parseInt(searchParams.equipmentId) : undefined })
 
   const equipment = equipmentRes.success ? equipmentRes.data : []
   const plans = plansRes.success ? plansRes.data : []
   const records = recordsRes.success ? recordsRes.data : []
 
   return (
     <div>
       <div className="flex justify-between items-start mb-8">
         <div>
           <h1 className="text-3xl font-bold text-white">Bakım</h1>
           <p className="text-gray-400 text-sm">OTTO BITE EKİPMANLARI ve bakım akışları</p>
         </div>
       </div>
       <BakimDashboard initialEquipment={equipment} initialPlans={plans} initialRecords={records} />
     </div>
   )
 }
