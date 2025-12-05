'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingBag, DollarSign, Users } from 'lucide-react';

export default function AdminDashboardPage() {
  // Aqui futuramente faremos chamadas reais à API
  const stats = [
    { label: 'Vendas Hoje', value: 'R$ 0,00', icon: DollarSign, color: 'text-green-500' },
    { label: 'Pedidos Pendentes', value: '0', icon: ShoppingBag, color: 'text-blue-500' },
    { label: 'Produtos Ativos', value: '3', icon: Package, color: 'text-orange-500' }, // Valor simulado do Seed
    { label: 'Vendedoras', value: '0', icon: Users, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Visão geral do negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Nenhuma venda registrada.</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-slate-500">Sem dados suficientes.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}