'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useQuery } from '@tanstack/react-query';
import { Copy, CheckCircle, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { paymentService } from '@/services/payment-service';
import { PixResponse } from '@/services/payment-service'; // Ajuste o import conforme criado acima

interface PixPaymentProps {
  orderId: number;
  pixData: PixResponse;
}

export function PixPayment({ orderId, pixData }: PixPaymentProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 minutos em segundos

  // POLLING: Consulta o status a cada 5 segundos
  const { data: statusData } = useQuery({
    queryKey: ['order-status', orderId],
    queryFn: () => paymentService.checkPaymentStatus(orderId),
    refetchInterval: (query) => {
        // Para de consultar se já estiver pago ou cancelado
        const status = query.state.data?.status;
        if (status === 'paid' || status === 'processing' || status === 'shipped') return false;
        return 5000; // 5 segundos
    },
  });

  // Reagir à mudança de status
  useEffect(() => {
    if (statusData?.status === 'paid' || statusData?.status === 'processing') {
        toast.success("Pagamento confirmado! 🎉");
        // Redirecionar para página de sucesso após um delay visual
        setTimeout(() => router.push(`/orders/${orderId}`), 2000);
    }
  }, [statusData, orderId, router]);

  // Timer Regressivo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pixData.qr_code);
    toast.success("Código PIX copiado!");
  };

  return (
    <div className="flex flex-col items-center space-y-6 animate-in fade-in">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-slate-900">Pagamento via PIX</h3>
        <p className="text-slate-500 text-sm">Escaneie o QR Code ou copie o código abaixo.</p>
      </div>

      {/* Área do QR Code */}
      <Card className="border-2 border-primary/20 bg-white shadow-lg">
        <CardContent className="p-6 flex flex-col items-center">
            {statusData?.status === 'paid' ? (
                <div className="h-64 w-64 flex flex-col items-center justify-center text-green-600">
                    <CheckCircle className="h-20 w-20 mb-4" />
                    <span className="text-xl font-bold">Pago!</span>
                </div>
            ) : (
                <div className="bg-white p-2">
                    <QRCode value={pixData.qr_code} size={200} />
                </div>
            )}
        </CardContent>
      </Card>

      {/* Timer e Status */}
      <div className="flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 px-4 py-2 rounded-full">
        <Clock className="h-4 w-4" /> Expira em: {formatTime(timeLeft)}
      </div>
      
      {statusData?.status !== 'paid' && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
             <Loader2 className="h-3 w-3 animate-spin" /> Aguardando confirmação do banco...
          </div>
      )}

      {/* Copia e Cola */}
      <div className="w-full max-w-sm space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase">Pix Copia e Cola</label>
        <div className="flex gap-2">
            <input 
                readOnly 
                value={pixData.qr_code} 
                className="flex-1 text-xs bg-slate-100 border rounded px-3 py-2 text-slate-500 truncate font-mono"
            />
            <Button onClick={handleCopy} size="icon" variant="outline">
                <Copy className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}