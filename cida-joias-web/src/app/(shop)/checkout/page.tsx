'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  CreditCard, QrCode, ShieldCheck, Loader2, AlertCircle, 
  ShoppingBag, ChevronLeft, PackageOpen 
} from 'lucide-react';
import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { PixPayment } from '@/components/checkout/PixPayment';
import { CreditCardForm, CardFormValues } from '@/components/checkout/CreditCardForm';

import { paymentService, PixResponse } from '@/services/payment-service';
import { orderService } from '@/services/order-service';
import { useCartStore } from '@/store/use-cart-store';
import { formatPrice, getImageUrl } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearCart = useCartStore(state => state.clearCart);
  
  const orderIdParam = searchParams.get('orderId');
  const orderId = orderIdParam ? Number(orderIdParam) : 0;

  const [activeTab, setActiveTab] = useState<string>('credit_card');
  const [pixData, setPixData] = useState<PixResponse | null>(null);

  // 1. BUSCAR PEDIDO
  const { data: order, isLoading: isLoadingOrder, isError } = useQuery({
    queryKey: ['checkout-order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
    retry: 1,
  });

  // 2. CÁLCULO DE TOTAIS (Baseado no seu JSON novo)
  const { itemsTotal, shippingCost, grandTotal } = useMemo(() => {
    if (!order) return { itemsTotal: 0, shippingCost: 0, grandTotal: 0 };

    // Backend retorna Strings ("263.00"), precisamos converter para Number
    const total = Number(order.total_amount);
    const subtotal = Number(order.subtotal);
    
    // O frete é a diferença entre Total e Subtotal
    // (Ex: 263 - 243 = 20)
    const shipping = total - subtotal;

    return { 
        itemsTotal: subtotal, 
        shippingCost: shipping, 
        grandTotal: total 
    };
  }, [order]);

  // 3. VERIFICAÇÃO DE STATUS
  useEffect(() => {
    if (order?.status === 'paid_order' || order?.status === 'processing' || order?.status === 'shipped') {
        toast.success("Pedido já pago!");
        clearCart();
        router.push(`/orders/${orderId}`);
    }
  }, [order, orderId, router, clearCart]);

  // MUTAÇÕES
  const pixMutation = useMutation({
    mutationFn: () => paymentService.generatePix(orderId),
    onSuccess: (data) => {
        const pixInfo = data.pix || data; 
        if (pixInfo && pixInfo.qr_code) {
            setPixData(pixInfo as PixResponse);
            toast.success("QR Code gerado com sucesso!");
        } else {
            toast.error("Erro ao ler resposta do PIX.");
        }
    },
    onError: (error: any) => {
        const msg = error.response?.data?.detail || "Erro ao gerar PIX.";
        toast.error(msg);
    }
  });

  const cardMutation = useMutation({
    mutationFn: paymentService.processCreditCard,
    onSuccess: () => {
        toast.success("Pagamento aprovado!");
        clearCart();
        router.push(`/orders/${orderId}`);
    },
    onError: (error: any) => {
        toast.error(error.response?.data?.detail || "Erro no processamento do cartão.");
    }
  });

  const handleCardSubmit = (data: CardFormValues) => {
    const [month, year] = data.expiry.split('/');
    cardMutation.mutate({
        order_id: orderId,
        payment_method: 'credit_card',
        card_data: {
            holder_name: data.holder_name,
            number: data.number,
            expiry_month: month,
            expiry_year: `20${year}`,
            cvv: data.cvv
        }
    });
  };

  if (isLoadingOrder) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-slate-600 font-medium text-lg">Carregando pedido #{orderId}...</p>
        </div>
    );
  }

  if (isError || !orderId || !order) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Pedido não encontrado</h2>
                <Button className="w-full" onClick={() => router.push('/cart')}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar ao Carrinho
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-6">
        <div className="container mx-auto px-4 max-w-6xl">
            
            <div className="mb-8">
                <Button 
                    variant="ghost" 
                    className="mb-4 pl-0 hover:bg-transparent hover:text-blue-600 text-slate-500"
                    onClick={() => router.push('/cart')}
                >
                    <ChevronLeft className="h-5 w-5 mr-1" /> Voltar ao Carrinho
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8 text-green-600" /> Checkout Seguro
                        </h1>
                        <p className="text-slate-500 mt-1">Finalizando Pedido #{order.id}</p>
                    </div>
                    {/* Exibe o Total vindo direto do JSON (263.00) */}
                    <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Valor Total</p>
                        <p className="text-2xl font-bold text-green-700">{formatPrice(grandTotal)}</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                
                {/* ESQUERDA: PAGAMENTO */}
                <div className="md:col-span-2 space-y-6">
                    <Tabs defaultValue="credit_card" onValueChange={(val) => { setActiveTab(val); setPixData(null); }} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-16 mb-6 bg-white border shadow-sm rounded-xl p-1">
                            <TabsTrigger value="credit_card" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-semibold h-full rounded-lg transition-all text-base">
                                <CreditCard className="mr-2 h-5 w-5" /> Cartão de Crédito
                            </TabsTrigger>
                            <TabsTrigger value="pix" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:font-semibold h-full rounded-lg transition-all text-base">
                                <QrCode className="mr-2 h-5 w-5" /> PIX (Instantâneo)
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="credit_card" className="mt-0">
                            <Card className="border-slate-200 shadow-md">
                                <div className="bg-slate-50 border-b px-6 py-4">
                                    <h3 className="font-semibold text-slate-800">Dados do Cartão</h3>
                                </div>
                                <CardContent className="p-6">
                                    <CreditCardForm 
                                        onSubmit={handleCardSubmit} 
                                        isProcessing={cardMutation.isPending}
                                        totalAmount={formatPrice(grandTotal)}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="pix" className="mt-0">
                            <Card className="border-slate-200 shadow-md">
                                <CardContent className="p-0">
                                    {pixData ? (
                                        <div className="p-6">
                                            <PixPayment orderId={orderId} pixData={pixData} />
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 px-6">
                                            <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6 shadow-sm">
                                                <QrCode className="h-12 w-12" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900">Pagamento via PIX</h3>
                                            <Button 
                                                onClick={() => pixMutation.mutate()}
                                                disabled={pixMutation.isPending}
                                                className="w-full md:w-auto min-w-[280px] h-14 text-lg bg-green-600 hover:bg-green-700 rounded-full mt-6"
                                            >
                                                {pixMutation.isPending ? (
                                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando Código...</>
                                                ) : (
                                                    "Gerar QR Code PIX"
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* DIREITA: RESUMO DO PEDIDO */}
                <div className="relative">
                    <Card className="sticky top-8 border-slate-200 shadow-lg overflow-hidden">
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold">
                                <ShoppingBag className="h-5 w-5 text-white/80" /> Resumo do Pedido
                            </div>
                        </div>
                        
                        <CardContent className="p-6 space-y-4">
                            
                            {/* LISTA DE ITENS */}
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item: any) => (
                                        <div key={item.id} className="flex gap-3 text-sm group border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                                            {/* Imagem (Se não vier do back, mostra ícone) */}
                                            {item.product?.image_url ? (
                                                <div className="h-10 w-10 bg-slate-100 rounded border overflow-hidden flex-shrink-0">
                                                    <img src={getImageUrl(item.product.image_url)} className="h-full w-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 bg-slate-100 rounded border flex items-center justify-center text-slate-400">
                                                    <PackageOpen className="h-5 w-5" />
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <div className="flex justify-between font-medium text-slate-900">
                                                    {/* Fallback de nome se o Backend não mandar */}
                                                    <span className="truncate max-w-[150px]">
                                                        {item.product_name || item.product?.name || `Produto #${item.product_id}`}
                                                    </span>
                                                    {/* Usa price_at_purchase do JSON */}
                                                    <span>{formatPrice((item.price_at_purchase || 0) * item.quantity)}</span>
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {item.quantity} un x {formatPrice(item.price_at_purchase || 0)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-slate-400 text-sm">
                                        Nenhum item carregado.
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* VALORES */}
                            <div className="space-y-2 text-sm pt-2">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(itemsTotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Frete</span>
                                    {/* Frete Calculado (Total - Subtotal) */}
                                    <span className={shippingCost === 0 ? "text-green-600 font-medium" : ""}>
                                        {shippingCost <= 0 ? 'Grátis' : formatPrice(shippingCost)}
                                    </span>
                                </div>
                            </div>

                            <Separator className="bg-slate-200" />

                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-slate-800">Total a Pagar</span>
                                <span className="text-2xl font-bold text-green-700">
                                    {formatPrice(grandTotal)}
                                </span>
                            </div>

                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    </div>
  );
}