'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Calendar, User, Check, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { SalesCaseItemManager } from '@/components/admin/SalesCaseItemManager';
import { salesCaseService } from '@/services/sales-case-service';
import { productService } from '@/services/product-service';
import { userService } from '@/services/user-service';

export default function EditSalesCasePage() {
  const router = useRouter();
  const params = useParams();
  const caseId = Number(params.id);
  const queryClient = useQueryClient();
  
  // Estado para o modal de exclusão do estojo
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 1. Dados do Estojo
  const { data: salesCase, isLoading: isLoadingCase } = useQuery({
    queryKey: ['sales-case', caseId],
    queryFn: () => salesCaseService.getCaseById(caseId),
    enabled: !!caseId,
  });

  // 2. Catálogo Completo (para o Manager resolver nomes/fotos)
  const { data: allProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['admin-products-full'],
    queryFn: () => productService.getProducts(0, 2000),
  });

  // 3. Usuários (para nome da vendedora)
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: userService.getAllUsers,
  });

  // Mutação: Excluir Estojo Inteiro
  const deleteCaseMutation = useMutation({
    mutationFn: () => salesCaseService.deleteCase(caseId),
    onSuccess: () => {
      toast.success("Estojo excluído e itens devolvidos ao estoque.");
      queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] }); // Estoque mudou
      router.push('/admin/sales-cases');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Erro ao excluir estojo.";
      toast.error(msg);
    }
  });

  // Handler de Conclusão (Apenas sai da página)
  const handleFinish = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
    toast.success("Edição concluída.");
    router.push('/admin/sales-cases');
  };

  const isLoading = isLoadingCase || isLoadingProducts;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-slate-500">Carregando gerenciador...</span>
      </div>
    );
  }

  if (!salesCase) return <div className="p-10 text-center text-red-500">Estojo não encontrado.</div>;

  const salesRepName = users?.find(u => u.id === salesCase.sales_rep_id)?.full_name || `ID: ${salesCase.sales_rep_id}`;
  const totalItems = salesCase.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="space-y-6 pb-28">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    Gerenciar Estojo #{salesCase.id}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant={salesCase.status === 'on_loan' ? 'secondary' : 'outline'}>
                        {salesCase.status === 'on_loan' ? 'Emprestado' : salesCase.status}
                    </Badge>
                    <span className="text-sm text-slate-500">Criado em {format(new Date(salesCase.loan_date), "dd/MM/yyyy")}</span>
                </div>
            </div>
        </div>

        {/* Botão de Perigo (Excluir Estojo) */}
        <Button  
            variant="outline" 
            className="text-red-500 hover:bg-red-50 hover:text-red-700"
            onClick={() => setIsDeleteDialogOpen(true)}
        >
            <Trash2 className="mr-2 h-4 w-4" /> Excluir Estojo
        </Button>
      </div>

      {/* Info Card (Resumo) */}
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

      {/* Gerenciador de Itens (Adicionar/Remover Peças) */}
      <SalesCaseItemManager salesCase={salesCase} allProducts={allProducts || []} />

      {/* Rodapé Fixo de Ação */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-white border-t flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
          <Button variant="outline" onClick={() => router.push('/admin/sales-cases')}>
             Voltar para Lista
          </Button>
          <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 w-full md:w-auto px-8">
             <Check className="mr-2 h-4 w-4" /> Concluir Edição
          </Button>
      </div>

      {/* Modal de Confirmação de Exclusão do Estojo */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" /> Excluir Estojo #{caseId}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível.
              <br/><br/>
              Todos os <b>{totalItems} itens</b> listados neste estojo serão <b>devolvidos automaticamente ao estoque</b> da loja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCaseMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => {
                    e.preventDefault();
                    deleteCaseMutation.mutate();
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={deleteCaseMutation.isPending}
            >
                {deleteCaseMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sim, Excluir e Estornar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}