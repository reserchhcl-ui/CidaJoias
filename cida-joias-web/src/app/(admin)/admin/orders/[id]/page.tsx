'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, ArrowLeft, Truck, User, Mail, Phone, MapPin, Save, X, 
  Package, DollarSign 
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { orderService } from '@/services/order-service';
import { userService } from '@/services/user-service';
import { OrderStatus } from '@/types/order';
import { StatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatPrice, getImageUrl } from '@/lib/utils';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const queryClient = useQueryClient();

  // Estados para edição de status
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [isChanged, setIsChanged] = useState(false);

  // 1. Buscar Pedido
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => orderService.getOrderAdminById(orderId),
  });

  // 2. Buscar Cliente (Só executa se tivermos o user_id do pedido)
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['admin-user', order?.user_id],
    queryFn: () => userService.getUserById(order!.user_id),
    enabled: !!order?.user_id,
  });

  // Sincronizar status local
  useEffect(() => {
    if (order) setSelectedStatus(order.status);
  }, [order]);

  // Mutação para salvar status
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: OrderStatus) => orderService.updateOrderStatus(orderId, newStatus),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        toast.success("Status atualizado com sucesso!");
        setIsChanged(false);
    },
    onError: () => toast.error("Erro ao atualizar status.")
  });

  const handleSave = () => {
    if (selectedStatus) updateStatusMutation.mutate(selectedStatus);
  };

  const handleCancel = () => {
    if (order) {
        setSelectedStatus(order.status);
        setIsChanged(false);
    }
  };

  if (isLoadingOrder || !order) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;
  }

  // Conversão de valores (String -> Number)
  const subtotal = Number(order.subtotal);
  const shipping = Number(order.shipping_cost);
  const discount = Number(order.applied_discount);
  const total = Number(order.total_amount);

  return (
    <div className="space-y-6 pb-20">
       
       {/* HEADER */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Pedido #{order.id}
                        <Badge variant="outline" className="text-xs font-normal">
                            {new Date(order.created_at).toLocaleDateString()}
                        </Badge>
                    </h1>
                </div>
            </div>
            
            <div className="flex gap-2">
                <StatusBadge status={order.status} type="order" />
                <StatusBadge status={order.payment_status} type="payment" />
            </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* ESQUERDA: ITENS DO PEDIDO */}
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader className="bg-slate-50 border-b pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" /> Itens do Pedido
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    {order.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 py-3 border-b last:border-0 border-slate-100">
                             {/* Imagem do Produto */}
                             <div className="h-16 w-16 bg-slate-100 rounded-md overflow-hidden border flex-shrink-0">
                                {item.product?.image_url ? (
                                    <img src={getImageUrl(item.product.image_url)} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-300">Img</div>
                                )}
                             </div>
                             
                             {/* Detalhes */}
                             <div className="flex-1">
                                <p className="font-medium text-slate-900">
                                    {item.product?.name || `Produto ID: ${item.product_id}`}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {item.quantity} un x {formatPrice(item.price_at_purchase)}
                                </p>
                             </div>
                             
                             {/* Subtotal Item */}
                             <div className="font-semibold text-slate-700">
                                {formatPrice(item.price_at_purchase * item.quantity)}
                             </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            {/* RESUMO FINANCEIRO ADMIN */}
            <Card>
                <CardHeader className="bg-slate-50 border-b pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Financeiro
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Frete</span>
                        <span>{shipping > 0 ? formatPrice(shipping) : 'Grátis'}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Desconto</span>
                            <span>- {formatPrice(discount)}</span>
                        </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold text-slate-900">
                        <span>Total Recebido</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* DIREITA: OPERAÇÕES, CLIENTE E ENDEREÇO */}
        <div className="space-y-6">
            
            {/* 1. GESTÃO DE STATUS */}
            <Card className={isChanged ? "border-blue-400 ring-1 ring-blue-400 shadow-md" : ""}>
                <CardHeader className="bg-slate-50 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4" /> Atualizar Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <Select 
                        value={selectedStatus || ''} 
                        onValueChange={(val) => {
                            setSelectedStatus(val as OrderStatus);
                            setIsChanged(val !== order.status);
                        }}
                        disabled={updateStatusMutation.isPending}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="processing">Em Processamento</SelectItem>
                            <SelectItem value="shipped">Enviado</SelectItem>
                            <SelectItem value="delivered">Entregue</SelectItem>
                            <SelectItem value="cancelled" className="text-red-600">Cancelar</SelectItem>
                        </SelectContent>
                    </Select>

                    {isChanged && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                            <Button 
                                variant="outline" 
                                className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={handleCancel}
                                disabled={updateStatusMutation.isPending}
                            >
                                <X className="mr-2 h-4 w-4" /> Cancelar
                            </Button>
                            <Button 
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={handleSave}
                                disabled={updateStatusMutation.isPending}
                            >
                                {updateStatusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Salvar
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. CLIENTE */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" /> Dados do Cliente
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4 pt-2">
                    {isLoadingCustomer ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                                    {customer?.full_name?.charAt(0) || 'C'}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{customer?.full_name}</p>
                                    <p className="text-xs text-slate-500">ID: {order.user_id}</p>
                                </div>
                            </div>
                            
                            <Separator />

                            <div className="space-y-2 text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span className="truncate" title={customer?.email}>{customer?.email}</span>
                                </div>
                                {customer?.phone_number && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <span>{customer.phone_number}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 3. ENDEREÇO DE ENTREGA (Novo Objeto) */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Entrega
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm pt-2">
                    {order.shipping_address ? (
                        <div className="space-y-1 text-slate-700">
                            <p className="font-medium text-slate-900">
                                {order.shipping_address.street}, {order.shipping_address.number}
                            </p>
                            {order.shipping_address.complement && (
                                <p className="text-xs text-slate-500">Comp: {order.shipping_address.complement}</p>
                            )}
                            <p>{order.shipping_address.neighborhood}</p>
                            <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                            <p className="text-xs text-slate-400 mt-1">CEP: {order.shipping_address.zip_code}</p>
                        </div>
                    ) : (
                        <p className="text-slate-400 italic">Endereço não registrado.</p>
                    )}
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}