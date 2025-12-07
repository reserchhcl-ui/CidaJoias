'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Calendar, User, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner'; // Importante para o feedback final

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SalesCaseItemManager } from '@/components/admin/SalesCaseItemManager';
import { salesCaseService } from '@/services/sales-case-service';
import { productService } from '@/services/product-service';
import { userService } from '@/services/user-service';

export default function EditSalesCasePage() {
  const router = useRouter();
  const params = useParams();
  const caseId = Number(params.id);
  const queryClient = useQueryClient();

  // ... (Queries de dados permanecem iguais)
  const { data: salesCase, isLoading: isLoadingCase } = useQuery({
    queryKey: ['sales-case', caseId],
    queryFn: () => salesCaseService.getCaseById(caseId),
    enabled: !!caseId,
  });

  const { data: allProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['admin-products-full'],
    queryFn: () => productService.getProducts(0, 2000),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: userService.getAllUsers,
  });

  // Handler de Conclusão com Refresh
  const handleFinish = () => {
    // 1. Invalida a lista de estojos para garantir que ela mostre os totais atualizados
    queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
    
    // 2. Feedback visual
    toast.success("Estojo salvo com sucesso!");
    
    // 3. Redirecionamento (O router.push força a navegação, e o invalidate garante os dados novos)
    router.push('/admin/sales-cases');
    
    // Opcional: router.refresh() força um soft-reload dos componentes do servidor
    router.refresh();
  };

  if (isLoadingCase || isLoadingProducts || !salesCase) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-slate-500">Carregando estojo...</span>
      </div>
    );
  }

  const salesRepName = users?.find(u => u.id === salesCase.sales_rep_id)?.full_name || `ID: ${salesCase.sales_rep_id}`;
  const totalItems = salesCase.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Gerenciar Estojo #{salesCase.id}
            </h1>
            <Badge variant={salesCase.status === 'on_loan' ? 'secondary' : 'outline'} className="ml-2">
                {salesCase.status === 'on_loan' ? 'Emprestado' : salesCase.status}
            </Badge>
        </div>
      </div>

      {/* Info Card (Mantido igual) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                    <User className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-slate-500">Vendedora</p>
                    <p className="font-semibold">{salesRepName}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <Calendar className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-slate-500">Data de Retorno</p>
                    <p className="font-semibold">{format(new Date(salesCase.return_by_date), "dd/MM/yyyy")}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <span className="font-bold text-lg px-1">{totalItems}</span>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Total de Peças</p>
                    <p className="font-semibold text-green-700">Itens no Estojo</p>
                </div>
            </div>
      </div>

      {/* Item Manager */}
      <SalesCaseItemManager salesCase={salesCase} allProducts={allProducts || []} />

      {/* BARRA DE AÇÕES (Rodapé Atualizado) */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-white border-t flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
          <Button variant="outline" onClick={() => router.back()}>
             <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 w-full md:w-auto">
             <Check className="mr-2 h-4 w-4" /> Concluir e Salvar
          </Button>
      </div>

    </div>
  );
}