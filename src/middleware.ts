import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем, начинается ли путь с /browse
  if (pathname.startsWith('/browse')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // /browse или /browse/ → /titles или /titles/
    if (pathname === '/browse' || pathname === '/browse/') {
      return NextResponse.redirect(new URL('/titles', request.url));
    }

    // /browse/:titleId → /titles/:slug
    const titleIdMatch = pathname.match(/^\/browse\/([^/]+)$/);
    if (titleIdMatch) {
      const titleId = titleIdMatch[1];
      try {
        const response = await fetch(`${baseUrl}/titles/${titleId}?populateChapters=false`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Middleware-Redirect/1.0)',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.slug) {
            return NextResponse.redirect(
              new URL(`/titles/${data.data.slug}`, request.url)
            );
          }
        }
      } catch (error) {
        console.error('Middleware: Error fetching title for redirect:', error);
      }

      // Если не удалось получить slug, редиректим на /titles
      return NextResponse.redirect(new URL('/titles', request.url));
    }

    // /browse/:titleId/chapter/:chapterId → /titles/:slug/chapter/:chapterId
    const chapterMatch = pathname.match(/^\/browse\/([^/]+)\/chapter\/([^/]+)$/);
    if (chapterMatch) {
      const titleId = chapterMatch[1];
      const chapterId = chapterMatch[2];

      try {
        const response = await fetch(`${baseUrl}/titles/${titleId}?populateChapters=false`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Middleware-Redirect/1.0)',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.slug) {
            return NextResponse.redirect(
              new URL(`/titles/${data.data.slug}/chapter/${chapterId}`, request.url)
            );
          }
        }
      } catch (error) {
        console.error('Middleware: Error fetching title for chapter redirect:', error);
      }

      // Если не удалось получить slug, редиректим на /titles
      return NextResponse.redirect(new URL('/titles', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

