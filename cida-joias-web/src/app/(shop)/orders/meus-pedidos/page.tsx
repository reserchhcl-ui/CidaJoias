'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Package, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/orders/OrderStatusBadge';
import { orderService } from '@/services/order-service';
import { formatPrice } from '@/lib/utils';

export default function MyOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: orderService.getMyOrders,
  });

  if (isLoading) {
    return <div className="flex h-64 justify-center items-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="h-6 w-6" /> Meus Pedidos
      </h1>

      {orders?.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-500">Você ainda não fez nenhum pedido.</p>
          <Button asChild className="mt-4" variant="link">
             <Link href="/">Ir às compras</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  
                  {/* Info Principal */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">Pedido #{order.id}</span>
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                             <Calendar className="h-3 w-3" />
                             {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <StatusBadge status={order.status} type="order" />
                        <StatusBadge status={order.payment_status} type="payment" />
                    </div>
                  </div>

                  {/* Valor e Botão */}
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-right">
                        <p className="text-xs text-slate-500">Total</p>
                        <p className="font-bold text-lg text-green-700">{formatPrice(order.total_amount)}</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                        <Link href={`/orders/${order.id}`}>
                            Detalhes <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}