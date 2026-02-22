import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Define protected routes
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/quotations') ||
        request.nextUrl.pathname.startsWith('/receiving') ||
        request.nextUrl.pathname.startsWith('/scheduling') ||
        request.nextUrl.pathname.startsWith('/worklist') ||
        request.nextUrl.pathname.startsWith('/testing') ||
        request.nextUrl.pathname.startsWith('/qc-monitor') ||
        request.nextUrl.pathname.startsWith('/review') ||
        request.nextUrl.pathname.startsWith('/reports') ||
        request.nextUrl.pathname.startsWith('/settings') ||
        request.nextUrl.pathname.startsWith('/archive');

    // Define auth routes (login pages)
    const isAuthRoute = request.nextUrl.pathname.startsWith('/admin/login') ||
        request.nextUrl.pathname.startsWith('/login');

    // Redirect unauthenticated users to login
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from login pages
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes (handled separately)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
