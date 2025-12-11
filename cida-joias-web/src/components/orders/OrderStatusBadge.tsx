'use client';

import { Badge } from '@/components/ui/badge';
import { OrderStatus, PaymentStatus } from '@/types/order';

interface StatusBadgeProps {
  status: string;
  type: 'order' | 'payment';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  
  const getStyle = (val: string) => {
    switch (val) {
      // Sucesso / Finalizado
      case OrderStatus.DELIVERED:
      case PaymentStatus.PAID:
        return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200';
      
      // Processamento / Atenção
      case OrderStatus.SHIPPED:
      case OrderStatus.PROCESSING:
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
      
      // Pendente
      case OrderStatus.PENDING:
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200';
      
      // Erro / Cancelado
      case OrderStatus.CANCELLED:
      case PaymentStatus.FAILED:
      case PaymentStatus.REFUNDED:
        return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200';
        
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const labels: Record<string, string> = {
    [OrderStatus.PENDING]: 'Pendente',
    [OrderStatus.PROCESSING]: 'Em Processamento',
    [OrderStatus.SHIPPED]: 'Enviado',
    [OrderStatus.DELIVERED]: 'Entregue',
    [OrderStatus.CANCELLED]: 'Cancelado',
    [PaymentStatus.PENDING]: 'Aguardando Pagto',
    [PaymentStatus.PAID]: 'Pago',
    [PaymentStatus.FAILED]: 'Falhou',
  };

  return (
    <Badge variant="outline" className={`font-medium border ${getStyle(status)}`}>
      {labels[status] || status}
    </Badge>
  );
}