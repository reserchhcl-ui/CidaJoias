import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('cidajoias.token')?.value;
  const { pathname } = request.nextUrl;

  // Rotas Públicas (Adicione outras conforme necessário)
  const publicRoutes = ['/login', '/register', '/', '/products'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Rotas Protegidas por Role (Simplificado - idealmente decodifica JWT)
  // Como não podemos decodificar o JWT de forma segura e performática aqui sem libs pesadas edge-compatible,
  // verificamos apenas a presença do token. A validação real da role acontece na API ou Layout.
  
  const isAdminRoute = pathname.startsWith('/admin');
  const isSalesRoute = pathname.startsWith('/sales-cases');

  // 1. Redirecionar para login se tentar acessar rota protegida sem token
  if ((isAdminRoute || isSalesRoute) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirecionar para Dashboard se usuário logado tentar acessar login
  if (pathname === '/login' && token) {
     return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};