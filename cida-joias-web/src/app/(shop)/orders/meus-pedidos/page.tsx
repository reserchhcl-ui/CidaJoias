'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Package, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';
import { dashboardService } from '@/services/dashboard-service';
import { formatPrice } from '@/lib/utils';


export default function MyOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: dashboardService.getMyOrders,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'shipped': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'Pendente',
      paid: 'Pago',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return map[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Meus Pedidos</h1>
          <p className="text-gray-500">Acompanhe o status das suas compras.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders?.length === 0 ? (
          <Card className="text-center py-10">
            <CardContent>
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Você ainda não fez nenhum pedido.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders?.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50/50 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-right">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-bold text-lg">{formatPrice(order.total_amount)}</p>
                       </div>
                       <Badge className={`${getStatusColor(order.status)} hover:${getStatusColor(order.status)}`}>
                         {getStatusLabel(order.status)}
                       </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500">Itens do pedido</h4>
                    <ul className="divide-y">
                      {order.items.map((item) => (
                        <li key={item.id} className="py-2 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{item.quantity}x</span>
                            <span>Produto ID: {item.product_id}</span> 
                            {/* Nota: O backend precisa retornar o nome do produto no OrderItemResponse para mostrarmos aqui, 
                                ou teremos que buscar o produto pelo ID separadamente. Por enquanto mostramos o ID. */}
                          </div>
                          <span className="text-gray-600">{formatPrice(item.price_at_purchase)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}