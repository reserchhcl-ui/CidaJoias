'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, Plus, Pencil, Trash2, Search, PackageOpen, AlertCircle, Package 
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { productService } from '@/services/product-service';
import { formatPrice, getImageUrl } from '@/lib/utils';

// Hook para evitar chamadas excessivas à API enquanto digita
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // Espera 500ms após parar de digitar para atualizar o valor de busca
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Query Principal: Alterna dinamicamente entre Listagem Padrão e Busca
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', debouncedSearch],
    queryFn: () => {
      if (debouncedSearch) {
        // Se houver texto, usa a busca global (POST)
        return productService.searchProductsAdmin(debouncedSearch);
      } else {
        // Se vazio, traz os 100 primeiros (GET padrão)
        return productService.getProductsAdmin(0, 5);
      }
    },
  });

  // Mutação de Exclusão
  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Produto excluído com sucesso.");
      setProductToDelete(null);
    },
    onError: (error: any) => {
      // Tratamento para erro de integridade (ex: produto em pedido)
      const msg = error.response?.data?.detail || "Erro ao excluir. O produto pode estar vinculado a vendas.";
      toast.error(msg);
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho e Botão Novo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Produtos</h1>
            <p className="text-muted-foreground text-sm">Gerencie o catálogo completo, preços e estoque.</p>
        </div>
        <Button asChild className="w-full sm:w-auto shadow-md">
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Link>
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, código de barras ou ref. fornecedor..."
          className="pl-9 bg-white border-slate-200 focus-visible:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isLoading && debouncedSearch && (
            <div className="absolute right-3 top-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
        )}
      </div>

      {/* Tabela de Produtos */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[80px]">Imagem</TableHead>
                <TableHead className="min-w-[200px]">Detalhes do Produto</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Preços (R$)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="text-sm text-slate-500">Carregando catálogo...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <PackageOpen className="h-10 w-10 text-slate-300" />
                        <p className="font-medium">Nenhum produto encontrado.</p>
                        {debouncedSearch && <p className="text-xs">Tente buscar por outro termo.</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products?.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50 transition-colors">
                    {/* Imagem */}
                    <TableCell>
                        <div className="h-12 w-12 rounded-md bg-slate-100 border overflow-hidden flex items-center justify-center">
                            {product.image_url ? (
                                <img 
                                    src={getImageUrl(product.image_url)} 
                                    alt={product.name} 
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Package className="h-5 w-5 text-slate-300" />
                            )}
                        </div>
                    </TableCell>
                    
                    {/* Detalhes (Nome, Barcode, Ref) */}
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 line-clamp-1" title={product.name}>
                                {product.name}
                            </span>
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-1">
                                <span className="bg-slate-100 px-1 rounded">{product.barcode}</span>
                                {product.supplier_ref && (
                                    <span className="text-blue-600 bg-blue-50 px-1 rounded">
                                        Ref: {product.supplier_ref}
                                    </span>
                                )}
                            </div>
                        </div>
                    </TableCell>

                    {/* Categoria */}
                    <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="font-normal text-slate-600">
                            {product.category?.name || 'Sem Categoria'}
                        </Badge>
                    </TableCell>

                    {/* Estoque (Físico + Consignado) */}
                    <TableCell>
                        <div className="flex flex-col text-sm">
                            <span className={product.stock_quantity === 0 ? "text-red-500 font-bold" : "text-slate-900"}>
                                {product.stock_quantity} un
                            </span>
                            {product.on_loan_quantity > 0 && (
                                <span className="text-xs text-orange-600 font-medium" title="Peças em estojos com vendedoras">
                                    + {product.on_loan_quantity} em estojos
                                </span>
                            )}
                        </div>
                    </TableCell>

                    {/* Preços (Venda e Custo) */}
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{formatPrice(product.selling_price)}</span>
                            {product.cost_price > 0 && (
                                <span className="text-xs text-slate-400">
                                    Custo: {formatPrice(product.cost_price)}
                                </span>
                            )}
                        </div>
                    </TableCell>

                    {/* Ações */}
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={`/admin/products/${product.id}`} title="Editar">
                                    <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                </Link>
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setProductToDelete(product.id)}
                                title="Excluir"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Exclusão */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" /> Excluir Produto?
                </AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação é permanente. Isso removerá o produto do catálogo.
                    <br/><br/>
                    <b>Atenção:</b> Se o produto já foi vendido ou está em algum estojo ativo, a exclusão pode ser bloqueada para manter o histórico financeiro.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={(e) => {
                        e.preventDefault();
                        if(productToDelete) deleteMutation.mutate(productToDelete);
                    }} 
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleteMutation.isPending}
                >
                    {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sim, Excluir"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}