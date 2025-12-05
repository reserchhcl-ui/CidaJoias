'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingBag, DollarSign, Users, Loader2, AlertTriangle } from 'lucide-react';

import { adminService } from '@/services/admin-service';
import { useAuthStore } from '@/store/use-auth-store';
import { formatPrice } from '@/lib/utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // 1. Proteção Client-Side Rápida
  // Se o usuário já estiver carregado e não for admin, chuta pra Home antes mesmo da API
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, router]);

  // 2. Busca de Dados Protegidos (A proteção real ocorre aqui via API 403)
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
    retry: false, // Não insiste se der erro de permissão
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-slate-500">Carregando indicadores...</span>
      </div>
    );
  }

  // Se der erro (ex: 403), mostramos msg enquanto o interceptor redireciona
  if (isError) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-red-500">
        <AlertTriangle className="h-10 w-10 mb-2" />
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-sm text-slate-500">Verificando permissões...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Visão geral do negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Vendas Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats?.revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">Pedidos pagos/enviados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.ordersCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total de pedidos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Produtos</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.productsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Itens no catálogo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Usuários</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.usersCount || 0}</div>
            <p className="text-xs text-muted-foreground">Clientes e Funcionários</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder para gráficos futuros */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-slate-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-64 text-slate-400">
            <p>Gráfico de Vendas (Em breve)</p>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-slate-50 border-dashed">
           <CardContent className="flex flex-col items-center justify-center h-64 text-slate-400">
            <p>Produtos Recentes (Em breve)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}