 import { getCashExpenses, getCashExpenseStats } from '@/app/actions/cash-expense'
 import CashExpenseList from './cash-expense-list'
 import { getSession } from '@/lib/auth'
 
 export const dynamic = 'force-dynamic'
 
 export default async function CashExpensesPage({ searchParams }) {
   const session = await getSession()
   if (!session) {
     return <div className="text-white">Oturum gerekli.</div>
   }
 
   const filters = {
     startDate: searchParams?.startDate,
     endDate: searchParams?.endDate,
     category: searchParams?.category,
     search: searchParams?.search
   }
 
   const [listRes, statsRes] = await Promise.all([
     getCashExpenses(filters),
     getCashExpenseStats(filters)
   ])
 
   const expenses = listRes.success ? listRes.data : []
   const stats = statsRes.success ? statsRes.data : { totalAmount: 0, daysWithExpenses: 0, byDay: {}, byCategory: [] }
 
   return (
     <div>
       <div className="flex justify-between items-start mb-8">
         <div>
           <h1 className="text-3xl font-bold text-white">Nakit Çıkış Takip</h1>
           <p className="text-gray-400 text-sm">Harcamaları kaydedin, filtreleyin ve raporlayın</p>
         </div>
       </div>
 
       <CashExpenseList initialExpenses={expenses} initialStats={stats} />
     </div>
   )
 }
