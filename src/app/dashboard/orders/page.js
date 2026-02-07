import { getOrders, getUnfilledOrders } from '@/app/actions/orders'
import { getAllProducts } from '@/app/actions/inventory'
import { getSession } from '@/lib/auth'
import OrderDashboard from './order-dashboard'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
    const ordersRes = await getOrders()
    const unfilledRes = await getUnfilledOrders()
    const session = await getSession()
    const inventoryRes = await getAllProducts()
    
    const orders = ordersRes.success ? ordersRes.data : []
    const unfilled = unfilledRes.success ? unfilledRes.data : []
    const inventoryProducts = inventoryRes.success ? inventoryRes.data : []

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Sipariş Yönetimi</h1>
                    <p className="text-gray-400 text-sm mt-1">Sipariş listeleri oluşturun, gelen ürünleri takip edin ve depoya aktarın.</p>
                </div>
            </div>

            <OrderDashboard
                initialOrders={orders}
                initialUnfilled={unfilled}
                user={session}
                inventoryProducts={inventoryProducts}
            />
        </div>
    )
}
