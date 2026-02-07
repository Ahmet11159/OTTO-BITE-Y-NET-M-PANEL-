import { getOrders, getUnfilledOrders } from '@/app/actions/orders'
import { getAllProducts } from '@/app/actions/inventory'
import { getSession } from '@/lib/auth'
import OrderDashboard from './order-dashboard'
import { getSettings } from '@/app/actions/settings'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
    const ordersRes = await getOrders()
    const unfilledRes = await getUnfilledOrders()
    const session = await getSession()
    const inventoryRes = await getAllProducts()
    const settingsRes = await getSettings()
    
    const orders = ordersRes.success ? ordersRes.data : []
    const unfilled = unfilledRes.success ? unfilledRes.data : []
    const inventoryProducts = inventoryRes.success ? inventoryRes.data : []
    const initialLocale = settingsRes?.success && settingsRes.data?.general?.locale ? String(settingsRes.data.general.locale) : 'tr-TR'

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
                initialLocale={initialLocale}
            />
        </div>
    )
}
