'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

import { StatusBadge } from '@/components/orders/OrderStatusBadge';
import { orderService } from '@/services/order-service';
import { OrderFilter } from '@/types/order';
import { formatPrice } from '@/lib/utils';

export default function AdminOrdersPage() {
  // Estado dos Filtros
  const [filters, setFilters] = useState<OrderFilter>({
    status: 'all',
    customer_email: '',
  });

  // Query com dependência dos filtros
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', filters], // Recarrega se filtro mudar
    queryFn: () => orderService.searchOrdersAdmin({
        ...filters,
        status: filters.status === 'all' ? undefined : filters.status
    }),
  });

  const handleFilterChange = (key: keyof OrderFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Pedidos</h1>
        <Button onClick={() => refetch()} variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* BARRA DE FILTROS */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
                <span className="text-sm font-medium">Status do Pedido</span>
                <Select 
                    value={filters.status || 'all'} 
                    onValueChange={(val) => handleFilterChange('status', val)}
                >
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="processing">Em Processamento</SelectItem>
                        <SelectItem value="shipped">Enviado</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Buscar Cliente (Email)</span>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Ex: cliente@email.com" 
                        className="pl-9"
                        value={filters.customer_email}
                        onChange={(e) => handleFilterChange('customer_email', e.target.value)}
                    />
                </div>
            </div>
            {/* Adicione DatePicker aqui futuramente */}
        </CardContent>
      </Card>

      {/* TABELA DE PEDIDOS */}
      <div className="rounded-md border bg-white overflow-hidden">
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente (ID)</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Logística</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell>
                </TableRow>
                ) : orders?.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-slate-500">Nenhum pedido encontrado.</TableCell>
                    </TableRow>
                ) : orders?.map((order) => (
                <TableRow key={order.id}>
                    <TableCell className="font-bold">#{order.id}</TableCell>
                    <TableCell>{format(new Date(order.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell>ID: {order.user_id}</TableCell>
                    <TableCell className="font-medium">{formatPrice(order.total_amount)}</TableCell>
                    <TableCell><StatusBadge status={order.status} type="order" /></TableCell>
                    <TableCell><StatusBadge status={order.payment_status} type="payment" /></TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/orders/${order.id}`}>Gerenciar</Link>
                        </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}