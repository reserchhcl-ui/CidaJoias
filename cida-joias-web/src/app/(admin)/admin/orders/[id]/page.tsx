'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Truck, User, Mail, Phone, MapPin, Save, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { orderService } from '@/services/order-service';
import { userService } from '@/services/user-service'; // Importar Service de Usuário
import { OrderStatus } from '@/types/order';
import { StatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatPrice, getImageUrl } from '@/lib/utils';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const queryClient = useQueryClient();

  // Estado local para gerenciar a edição do status antes de salvar
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [isChanged, setIsChanged] = useState(false);

  // 1. Buscar Pedido
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => orderService.getOrderAdminById(orderId),
  });

  // 2. Buscar Dados Completos do Cliente (Só roda quando tivermos o order.user_id)
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['admin-user', order?.user_id],
    queryFn: () => userService.getUserById(order!.user_id),
    enabled: !!order?.user_id,
  });

  // Sincronizar estado local com o pedido carregado
  useEffect(() => {
    if (order) {
        setSelectedStatus(order.status);
    }
  }, [order]);

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: OrderStatus) => orderService.updateOrderStatus(orderId, newStatus),
    onSuccess: () => {
        // Atualiza os dados desta página
        queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
        
        // CRÍTICO: Atualiza a lista de pedidos (Gestão) para quando voltarmos lá
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        
        toast.success("Status atualizado com sucesso!");
        setIsChanged(false);
    },
    onError: () => toast.error("Erro ao atualizar status.")
  });

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val as OrderStatus);
    setIsChanged(val !== order?.status);
  };

  const handleCancel = () => {
    if (order) {
        setSelectedStatus(order.status); // Volta ao original
        setIsChanged(false);
    }
  };

  const handleSave = () => {
    if (selectedStatus) {
        updateStatusMutation.mutate(selectedStatus);
    }
  };

  if (isLoadingOrder || isLoadingCustomer || !order) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 para espaço se houver footer fixo */}
       
       {/* Cabeçalho */}
       <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Pedido #{order.id}</h1>
                    <p className="text-slate-500 text-sm">Gerencie os detalhes e o andamento.</p>
                </div>
            </div>
            
            {/* Status Visual Rápido */}
            <div className="hidden md:flex gap-2">
                <StatusBadge status={order.status} type="order" />
                <StatusBadge status={order.payment_status} type="payment" />
            </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Coluna Principal: Itens */}
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader><CardTitle>Itens do Pedido</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 py-3 border-b last:border-0">
                             <div className="h-16 w-16 bg-slate-100 rounded-md overflow-hidden border">
                                <img src={getImageUrl(item.image_url)} alt="" className="h-full w-full object-cover" />
                             </div>
                             <div className="flex-1">
                                <p className="font-medium text-slate-900">{item.product_name}</p>
                                <p className="text-sm text-slate-500">
                                    {item.quantity} un x {formatPrice(item.unit_price)}
                                </p>
                             </div>
                             <div className="font-semibold text-lg">{formatPrice(item.subtotal)}</div>
                        </div>
                    ))}
                    <div className="flex justify-end pt-4 gap-8">
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Total do Pedido</p>
                            <span className="text-2xl font-bold text-slate-900">{formatPrice(order.total_amount)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Coluna Lateral: Ações e Cliente */}
        <div className="space-y-6">
            
            {/* 1. Gestão Logística (Com Botões Salvar/Cancelar) */}
            <Card className={isChanged ? "border-blue-400 ring-1 ring-blue-400 shadow-md" : "border-slate-200"}>
                <CardHeader className="bg-slate-50/50 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4" /> Atualizar Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">Novo Status:</p>
                        <Select 
                            value={selectedStatus || ''} 
                            onValueChange={handleStatusChange}
                            disabled={updateStatusMutation.isPending}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="processing">Em Processamento (Separando)</SelectItem>
                                <SelectItem value="shipped">Enviado (Transportadora)</SelectItem>
                                <SelectItem value="delivered">Entregue (Finalizado)</SelectItem>
                                <SelectItem value="cancelled" className="text-red-600 font-medium">Cancelar Pedido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Botões de Ação Condicionais */}
                    {isChanged && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                            <Button 
                                variant="outline" 
                                className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                                onClick={handleCancel}
                                disabled={updateStatusMutation.isPending}
                            >
                                <X className="mr-2 h-4 w-4" /> Cancelar
                            </Button>
                            <Button 
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleSave}
                                disabled={updateStatusMutation.isPending}
                            >
                                {updateStatusMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Salvar
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. Dados Completos do Cliente */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" /> Dados do Cliente
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4 pt-2">
                    {/* Identificação */}
                    <div className="flex items-start gap-3">
                        <div className="bg-slate-100 p-2 rounded-full">
                            <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">{customer?.full_name || 'Nome Desconhecido'}</p>
                            <p className="text-xs text-slate-500">ID: {order.user_id} • {customer?.role === 'sales_rep' ? 'Vendedora' : 'Cliente'}</p>
                        </div>
                    </div>
                    
                    <Separator />

                    {/* Contato */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="truncate" title={customer?.email}>{customer?.email}</span>
                        </div>
                        {customer?.phone_number ? (
                            <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span>{customer.phone_number}</span>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-xs italic pl-6">Telefone não cadastrado</div>
                        )}
                    </div>

                    <Separator />

                    {/* Endereço de Entrega */}
                    <div>
                        <div className="flex items-center gap-2 font-medium text-slate-800 mb-1">
                            <MapPin className="h-4 w-4 text-slate-500" /> Endereço de Entrega
                        </div>
                        {order.shipping_address ? (
                            <p className="text-slate-600 pl-6 leading-relaxed">
                                {order.shipping_address}
                            </p>
                        ) : (
                            <p className="text-slate-400 text-xs italic pl-6">Retirada na loja ou não informado.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}