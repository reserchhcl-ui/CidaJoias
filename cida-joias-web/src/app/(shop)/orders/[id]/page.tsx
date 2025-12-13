'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, ArrowLeft, Package, MapPin, 
  Calendar, Clock, CheckCircle, AlertCircle, PackageOpen 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { StatusBadge } from '@/components/orders/OrderStatusBadge';
import { orderService } from '@/services/order-service';
import { formatPrice, getImageUrl } from '@/lib/utils';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-slate-500 font-medium">Carregando detalhes do pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-lg">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-700">Pedido não encontrado</AlertTitle>
          <AlertDescription className="text-red-600">Não localizamos este pedido.</AlertDescription>
        </Alert>
        <Button className="mt-6 w-full" onClick={() => router.push('/orders/meus-pedidos')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  // --- CORREÇÃO 1: Usar os valores da raiz do JSON ---
  const subtotal = Number(order.subtotal);
  const total = Number(order.total_amount);
  const discount = Number(order.applied_discount);
  const shipping = Number(order.shipping_cost);

  const isPendingPayment = (order.status === 'pending') && order.payment_status !== 'paid';

  // Helper para formatar endereço com segurança
  const address = order.shipping_address;
  const formattedAddress = address 
    ? `${address.street}, ${address.number} ${address.complement ? '- ' + address.complement : ''}, ${address.neighborhood}, ${address.city} - ${address.state}, CEP: ${address.zip_code}`
    : 'Endereço não informado.';

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Cabeçalho */}
        <div className="mb-6">
          <Button variant="ghost" className="mb-4 pl-0 text-slate-500 hover:bg-transparent hover:text-blue-600" asChild>
            <Link href="/orders/meus-pedidos">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Meus Pedidos
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-6 w-6 text-slate-600" /> Pedido #{order.id}
              </h1>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Realizado em {order.created_at ? format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '-'}
              </p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={order.status} type="order" />
              <StatusBadge status={order.payment_status} type="payment" />
            </div>
          </div>
        </div>

        {/* Alerta de Pagamento Pendente */}
        {isPendingPayment && (
          <Alert className="mb-8 bg-amber-50 border-amber-200 shadow-sm">
            <Clock className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 font-semibold text-base ml-2">Aguardando Pagamento</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2 ml-2">
              <span className="text-amber-700">Pagamento não confirmado. Finalize para garantirmos o envio.</span>
              <Button 
                size="sm" 
                className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-sm" 
                onClick={() => router.push(`/checkout?orderId=${order.id}`)}
              >
                Pagar Agora
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Lista de Produtos */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-white border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold text-slate-800">Itens Comprados</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100">
                {order.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4 py-4">
                      {/* --- CORREÇÃO 2: Usar item.product.image_url --- */}
                      <div className="h-16 w-16 bg-slate-50 rounded-md border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.product?.image_url ? (
                          <img 
                            src={getImageUrl(item.product.image_url)} 
                            alt={item.product.name} 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <PackageOpen className="h-6 w-6 text-slate-300" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* --- CORREÇÃO 3: Usar item.product.name --- */}
                        <p className="font-medium text-slate-900 text-sm truncate">
                           {item.product?.name || `Produto #${item.product_id}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.quantity} un x {formatPrice(item.price_at_purchase)}
                        </p>
                      </div>

                      <div className="font-medium text-slate-900 text-sm whitespace-nowrap">
                        {formatPrice(item.price_at_purchase * item.quantity)}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Endereço de Entrega */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" /> Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm text-slate-600 leading-relaxed">
                {/* --- CORREÇÃO 4: Renderizar string formatada, não o objeto --- */}
                {address ? (
                  <>
                    <p className="font-medium text-slate-900 mb-1">
                      {address.street}, {address.number}
                    </p>
                    <p>{address.neighborhood} - {address.city}/{address.state}</p>
                    <p className="text-xs text-slate-400 mt-1">CEP {address.zip_code}</p>
                    {address.complement && <p className="text-xs text-slate-500 mt-1">Comp: {address.complement}</p>}
                  </>
                ) : (
                    <p className="italic text-slate-400">Endereço não disponível.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* COLUNA DIREITA: Resumo Financeiro */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm sticky top-6">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-semibold text-slate-800">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-slate-600">
                  <span>Frete</span>
                  <span className={shipping <= 0 ? "text-green-600 font-medium" : ""}>
                    {shipping <= 0 ? 'Grátis' : formatPrice(shipping)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Descontos</span>
                    <span>- {formatPrice(discount)}</span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between font-bold text-lg text-slate-900">
                  <span>Total</span>
                  <span className="text-green-700">{formatPrice(total)}</span>
                </div>
              </CardContent>
            </Card>

            {order.status === 'delivered' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 shadow-sm">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800 text-sm">Pedido Entregue</h4>
                  <p className="text-xs text-green-700 mt-1">Aproveite sua compra!</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}