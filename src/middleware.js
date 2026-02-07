import { NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request) {
    const canonical = process.env.NEXT_PUBLIC_CANONICAL_HOST || process.env.CANONICAL_HOST || 'otto-bite-y-net-m-panel.vercel.app'
    const currentHost = request.headers.get('host')
    if (canonical && currentHost && currentHost !== canonical) {
        const url = new URL(request.url)
        url.protocol = 'https:'
        url.host = canonical
        return NextResponse.redirect(url, 308)
    }

    const session = request.cookies.get('session')?.value
    const payload = session ? await decrypt(session) : null

    // 1. Unauthenticated users trying to access protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard') && !payload) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Role-based access control
    if (payload) {
        const referer = request.headers.get('referer') || ''
        if (request.nextUrl.pathname.startsWith('/dashboard/reports') && referer.includes('/login')) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        if (request.nextUrl.pathname.startsWith('/dashboard/reports/manager') && payload.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard/reports/chef', request.url))
        }
        if (request.nextUrl.pathname.startsWith('/dashboard/reports/chef') && payload.role !== 'CHEF') {
            if (payload.role === 'ADMIN' && request.nextUrl.pathname === '/dashboard/reports/chef/new') {
                return NextResponse.next()
            }
            if (payload.role === 'ADMIN') {
                return NextResponse.redirect(new URL('/dashboard/reports/manager', request.url))
            }
        }
    }

    // 3. Authenticated users trying to access login
    if (payload && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
