import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Fotoğraf Galerisi</h1>
          <p className="text-gray-400 text-sm">
            Burayı adım adım birlikte dolduracağız.
          </p>
        </div>
      </div>
    </div>
  )
}
