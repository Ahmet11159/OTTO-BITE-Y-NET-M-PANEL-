import { decrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import NotificationBell from './notifications'
import Navbar from './components/navbar'
import { getSettings } from '@/app/actions/settings'

export default async function DashboardLayout({ children }) {
    const session = cookies().get('session')?.value
    const user = await decrypt(session)
    const settingsRes = await getSettings()
    const initialLocale = settingsRes?.success && settingsRes.data?.general?.locale ? String(settingsRes.data.general.locale) : 'tr-TR'
    const pollIntervalMs = settingsRes?.success && settingsRes.data?.notifications?.pollIntervalMs ? Number(settingsRes.data.notifications.pollIntervalMs) : 10000

    return (
        <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black">
            <Navbar user={user} notificationElement={<NotificationBell initialLocale={initialLocale} pollIntervalMs={pollIntervalMs} />} />
            <main className="container py-8">
                {children}
            </main>
        </div>
    )
}
