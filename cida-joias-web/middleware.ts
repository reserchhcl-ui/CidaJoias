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
  // Rotas que exigem autenticação
  const protectedRoutes = ['/admin', '/sales-cases', '/orders'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // 1. Sem token tentando acessar rota protegida -> Login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname); // Guarda a URL para redirecionar depois
    return NextResponse.redirect(loginUrl);
  }

  // 2. Com token tentando acessar Login -> Home
  if (pathname === '/login' && token) {
     return NextResponse.redirect(new URL('/', request.url));
  }

  // Nota: A validação fina de Roles (ex: Cliente tentando acessar /admin) 
  // é melhor feita no componente ou layout via hook useAuthStore, 
  // pois decodificar JWT no Edge Runtime requer bibliotecas específicas (jose) 
  // e adiciona complexidade. Se o usuário acessar, a API retornará 403 Forbidden.

  return NextResponse.next();
}
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};