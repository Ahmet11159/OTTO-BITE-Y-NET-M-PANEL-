import { decrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import NotificationBell from './notifications'
import Navbar from './components/navbar'

export default async function DashboardLayout({ children }) {
    const session = cookies().get('session')?.value
    const user = await decrypt(session)

    return (
        <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black">
            <Navbar user={user} notificationElement={<NotificationBell />} />
            <main className="container py-8">
                {children}
            </main>
        </div>
    )
}
