import { NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request) {
    const session = request.cookies.get('session')?.value
    const payload = session ? await decrypt(session) : null

    // 1. Unauthenticated users trying to access protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard') && !payload) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. Role-based access control
    if (payload) {
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
    if (request.nextUrl.pathname === '/login' && payload) {
        if (payload.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard/reports/manager', request.url))
        } else {
            return NextResponse.redirect(new URL('/dashboard/reports/chef', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
