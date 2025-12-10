'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Package, Briefcase, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productService } from '@/services/product-service';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-inventory-stats'],
    queryFn: productService.getInventoryStats,
  });

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{/* Renderizar Skeletons aqui */}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Geral</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Estoque Físico */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque em Loja</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_stock_quantity} un</div>
            <p className="text-xs text-muted-foreground">Valor: {formatPrice(stats?.total_stock_value || 0)}</p>
          </CardContent>
        </Card>

        {/* Consignado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Consignação</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_on_loan_quantity} un</div>
            <p className="text-xs text-muted-foreground">Valor: {formatPrice(stats?.total_on_loan_value || 0)}</p>
          </CardContent>
        </Card>

        {/* Total Geral */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
                {formatPrice((stats?.total_stock_value || 0) + (stats?.total_on_loan_value || 0))}
            </div>
            <p className="text-xs text-muted-foreground">Custo total do inventário</p>
          </CardContent>
        </Card>
      </div>
      
      {/* ... Gráficos ou Tabelas Recentes viriam aqui ... */}
    </div>
  );
}