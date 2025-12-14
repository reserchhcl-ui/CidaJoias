'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Save, Trash, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { salesCaseService } from '@/services/sales-case-service';
import { getImageUrl } from '@/lib/utils';

export default function AdminCaseDetails() {
  const { id } = useParams();
  const caseId = Number(id);
  const queryClient = useQueryClient();

  // Inputs para adicionar novo item
  const [newProductId, setNewProductId] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');

  const { data: salesCase, isLoading } = useQuery({
    queryKey: ['admin-case', caseId],
    queryFn: () => salesCaseService.getCaseAdminById(caseId),
  });

  // Mutação: Adicionar Item
  const addItemMutation = useMutation({
    mutationFn: () => salesCaseService.addItem(caseId, Number(newProductId), Number(newQuantity)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-case', caseId] });
      toast.success("Item adicionado!");
      setNewProductId('');
      setNewQuantity('1');
    },
    onError: () => toast.error("Erro ao adicionar (Verifique ID ou Estoque).")
  });

  // Mutação: Editar Quantidade (0 remove)
  const updateItemMutation = useMutation({
    mutationFn: ({ pId, qtd }: { pId: number, qtd: number }) => 
      salesCaseService.updateItemQuantity(caseId, pId, qtd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-case', caseId] });
      toast.success("Quantidade atualizada.");
    }
  });

  if (isLoading || !salesCase) return <Loader2 className="animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold">Estojo: {salesCase.code}</h1>
            <p className="text-slate-500">Vendedora ID: {salesCase.sales_rep_id} • Status: {salesCase.status}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* COLUNA 1: ADICIONAR PRODUTOS */}
        <Card className="h-fit">
            <CardHeader><CardTitle className="text-base">Adicionar Produto</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">ID do Produto</label>
                    <Input 
                        placeholder="Ex: 50" 
                        value={newProductId} 
                        onChange={e => setNewProductId(e.target.value)} 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Quantidade</label>
                    <Input 
                        type="number" 
                        min={1} 
                        value={newQuantity} 
                        onChange={e => setNewQuantity(e.target.value)} 
                    />
                </div>
                <Button 
                    className="w-full" 
                    onClick={() => addItemMutation.mutate()}
                    disabled={addItemMutation.isPending || !newProductId}
                >
                    {addItemMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Adicionar ao Estojo
                </Button>
            </CardContent>
        </Card>

        {/* COLUNA 2: LISTA DE ITENS */}
        <Card className="md:col-span-2">
            <CardHeader><CardTitle>Conteúdo Atual ({salesCase.items.length} itens)</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {salesCase.items.map((item) => (
                        <div key={item.product_id} className="flex items-center justify-between border-b pb-4 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-slate-100 rounded border overflow-hidden flex items-center justify-center">
                                    {item.product?.image_url ? (
                                        <img src={getImageUrl(item.product.image_url)} className="h-full w-full object-cover" />
                                    ) : (
                                        <PackageOpen className="h-5 w-5 text-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{item.product?.name || `Produto #${item.product_id}`}</p>
                                    <p className="text-xs text-slate-500">ID: {item.product_id}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    className="w-16 h-8 text-center" 
                                    defaultValue={item.quantity}
                                    onBlur={(e) => {
                                        const val = Number(e.target.value);
                                        if (val !== item.quantity) {
                                            updateItemMutation.mutate({ pId: item.product_id, qtd: val });
                                        }
                                    }}
                                />
                                <Button 
                                    variant="ghost" size="icon" className="text-red-500 hover:bg-red-50"
                                    onClick={() => updateItemMutation.mutate({ pId: item.product_id, qtd: 0 })}
                                    title="Remover do estojo"
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {salesCase.items.length === 0 && (
                        <p className="text-center text-slate-500 py-4">Estojo vazio.</p>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}