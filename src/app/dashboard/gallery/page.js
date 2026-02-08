import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getGalleryTree } from '@/app/actions/gallery'
import PhotoGalleryDashboard from './ui/photo-gallery-dashboard'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const res = await getGalleryTree()
  const departments = res.success ? res.data : []

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center">
              <span className="text-2xl">📸</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Fotoğraf Galerisi</h1>
              <p className="text-gray-400 text-sm">
                Departman, kategori ve ürün bazlı görsel katalog
              </p>
            </div>
          </div>
        </div>
      </div>

      <PhotoGalleryDashboard initialDepartments={departments} user={session} />
    </div>
  )
}

