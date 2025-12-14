'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, Filter, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { StatusBadge } from '@/components/orders/OrderStatusBadge';
import { orderService } from '@/services/order-service';
import { OrderFilter } from '@/types/order';
import { formatPrice } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState<OrderFilter>({
    status: 'all',
    customer_email: '',
  });

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', filters],
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão de Pedidos</h1>
        <Button onClick={() => refetch()} variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Atualizar Lista
        </Button>
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
                <span className="text-sm font-medium">Status</span>
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
        </CardContent>
      </Card>

      {/* TABELA */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow className="bg-slate-50">
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente (ID)</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status Pedido</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                        <Loader2 className="animate-spin mx-auto h-8 w-8 text-blue-600" />
                        <span className="text-xs text-slate-500 mt-2 block">Carregando pedidos...</span>
                    </TableCell>
                </TableRow>
                ) : orders?.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                            Nenhum pedido encontrado com os filtros atuais.
                        </TableCell>
                    </TableRow>
                ) : orders?.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50">
                    <TableCell className="font-bold">#{order.id}</TableCell>
                    <TableCell>
                        {order.created_at 
                            ? format(new Date(order.created_at), "dd/MM/yyyy HH:mm") 
                            : '-'}
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">ID: {order.user_id}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                        {/* Conversão de String para Number */}
                        {formatPrice(Number(order.total_amount))}
                    </TableCell>
                    <TableCell><StatusBadge status={order.status} type="order" /></TableCell>
                    <TableCell><StatusBadge status={order.payment_status} type="payment" /></TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600">
                            <Link href={`/admin/orders/${order.id}`} title="Ver Detalhes">
                                <Eye className="h-4 w-4" />
                            </Link>
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