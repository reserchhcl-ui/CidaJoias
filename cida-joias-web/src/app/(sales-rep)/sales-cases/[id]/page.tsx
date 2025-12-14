'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Download, ArrowLeft, PackageOpen, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { salesCaseService } from '@/services/sales-case-service';
import { getImageUrl } from '@/lib/utils';

export default function SalesCaseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const caseId = Number(id);

  const { data: salesCase, isLoading, isError } = useQuery({
    queryKey: ['my-case', caseId],
    queryFn: () => salesCaseService.getCaseDetails(caseId),
    retry: 1, // Não insistir se for 403
  });

  const downloadMutation = useMutation({
    mutationFn: () => salesCaseService.downloadMarketingPack(caseId, salesCase?.code || 'Estojo'),
    onSuccess: () => toast.success("Download iniciado!"),
    onError: () => toast.error("Erro ao baixar fotos. Tente novamente.")
  });

  const returnMutation = useMutation({
    mutationFn: () => {
        // Assume que devolve tudo por padrão neste fluxo simples
        const itemsToReturn = salesCase?.items.map(i => ({ 
            product_id: i.product_id, 
            quantity: i.quantity 
        })) || [];
        return salesCaseService.returnCase(caseId, itemsToReturn);
    },
    onSuccess: () => {
        toast.success("Estojo devolvido com sucesso!");
        router.push('/sales-cases');
    },
    onError: () => toast.error("Erro ao devolver estojo.")
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  // Tratamento de Erro 403 (Acesso Negado)
  if (isError || !salesCase) {
    return (
        <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Acesso Negado ou Estojo não encontrado</h2>
            <Button onClick={() => router.push('/sales-cases')}>Voltar para Meus Estojos</Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      
      {/* HEADER */}
      <div className="mb-6">
        <Button variant="ghost" className="pl-0 mb-4" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold">{salesCase.code}</h1>
                <p className="text-slate-500">Contém {salesCase.items.length} peças</p>
            </div>
            
            {/* AÇÕES PRINCIPAIS */}
            <div className="flex gap-3 w-full md:w-auto">
                <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => downloadMutation.mutate()}
                    disabled={downloadMutation.isPending}
                >
                    {downloadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Baixar Fotos
                </Button>
                
                {salesCase.status === 'on_loan' && (
                    <Button 
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                        onClick={() => {
                            if(confirm("Confirmar devolução de todos os itens deste estojo?")) returnMutation.mutate();
                        }}
                        disabled={returnMutation.isPending}
                    >
                       <CheckCircle className="mr-2 h-4 w-4" /> Devolver Estojo
                    </Button>
                )}
            </div>
        </div>
      </div>

      {/* LISTA DE ITENS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {salesCase.items.map((item) => (
            <Card key={item.product_id} className="overflow-hidden">
                <div className="aspect-square bg-slate-100 relative flex items-center justify-center">
                    {item.product?.image_url ? (
                        <img 
                            src={getImageUrl(item.product.image_url)} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <PackageOpen className="h-10 w-10 text-slate-300" />
                    )}
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        Qtd: {item.quantity}
                    </div>
                </div>
                <CardContent className="p-4">
                    <h4 className="font-semibold text-sm line-clamp-1" title={item.product?.name}>
                        {item.product?.name || `Produto #${item.product_id}`}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Ref: {item.product_id}</p>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}