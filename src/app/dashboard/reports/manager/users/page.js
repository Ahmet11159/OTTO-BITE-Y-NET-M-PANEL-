import { getUsers } from '@/app/actions/user'
import Link from 'next/link'
import UserList from './user-list'
import UserForm from './user-form'

export default async function UsersPage() {
    const res = await getUsers()
    const users = res.success ? res.data : []

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Personel Yönetimi</h1>
                    <p className="text-gray-400 text-sm mt-1">Sistemdeki tüm kullanıcıları yönetin</p>
                </div>
                <Link href="/dashboard/reports/manager" className="text-gray-400 hover:text-white flex items-center gap-2">
                    <span>&larr;</span> Panele Dön
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* New User Form */}
                <UserForm />

                {/* User List */}
                <div className="lg:col-span-2">
                    <UserList users={users} />
                </div>
            </div>
        </div>
    )
}
