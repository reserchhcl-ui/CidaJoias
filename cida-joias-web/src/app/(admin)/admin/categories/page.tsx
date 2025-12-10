'use client';

import { useState, Fragment } from 'react'; // Importar Fragment é crucial aqui
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Pencil, CornerDownRight, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { productService } from '@/services/product-service';
import { CategoryForm } from '@/components/admin/CategoryForm'; 
import { Category } from '@/types/product';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  
  // Estados
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<number | null>(null);

  // 1. Buscar Categorias (Árvore)
  const { data: categoriesTree, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  // 2. Mutação: Criar
  const createMutation = useMutation({
    mutationFn: productService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada!');
      setIsCreateOpen(false);
    },
    onError: () => toast.error('Erro ao criar categoria.'),
  });

  // 3. Mutação: Atualizar
  const updateMutation = useMutation({
    mutationFn: (data: any) => {
        // Precisamos garantir que estamos passando o ID e os Dados
        if (!editingCategory) throw new Error("Sem categoria selecionada");
        return productService.updateCategory(editingCategory.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria atualizada!');
      setEditingCategory(null);
    },
    onError: () => toast.error('Erro ao atualizar categoria.'),
  });

  // 4. Mutação: Deletar
  const deleteMutation = useMutation({
    mutationFn: productService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria removida.');
      setCatToDelete(null);
    },
    onError: () => toast.error('Erro ao remover categoria.'),
  });

  // --- RENDERIZAÇÃO RECURSIVA (CORRIGIDA) ---
  const renderCategoryRows = (cats: Category[], depth = 0) => {
    return cats.map((cat) => (
      // CORREÇÃO: Usar Fragment com key explícita. O fragmento curto <> não aceita key.
      <Fragment key={cat.id}>
        <TableRow className="hover:bg-slate-50">
          <TableCell className="font-mono text-xs text-slate-500 w-[50px]">{cat.id}</TableCell>
          <TableCell>
            <div 
                className="flex items-center gap-2" 
                style={{ paddingLeft: `${depth * 24}px` }} // Indentação visual
            >
                {depth > 0 && <CornerDownRight className="h-4 w-4 text-slate-300" />}
                <span className={depth === 0 ? "font-semibold text-slate-900" : "text-slate-700"}>
                    {cat.name}
                </span>
            </div>
          </TableCell>
          <TableCell className="text-slate-500 text-sm">{cat.slug}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingCategory(cat)}>
                    <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCatToDelete(cat.id)}>
                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                </Button>
            </div>
          </TableCell>
        </TableRow>
        
        {/* Chamada Recursiva se houver filhos */}
        {cat.sub_categories && cat.sub_categories.length > 0 && (
            renderCategoryRows(cat.sub_categories, depth + 1)
        )}
      </Fragment>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Categorias</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        {/* Wrapper responsivo */}
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>ID</TableHead>
                <TableHead className="min-w-[200px]">Nome (Hierarquia)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                </TableRow>
                ) : categoriesTree?.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                        <FolderTree className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        Nenhuma categoria encontrada.
                    </TableCell>
                    </TableRow>
                ) : (
                    // Inicia a renderização recursiva
                    renderCategoryRows(categoriesTree || [])
                )}
            </TableBody>
            </Table>
        </div>
      </div>

      {/* --- MODAIS --- */}

      {/* Criar */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
            <CategoryForm 
                categoriesTree={categoriesTree || []}
                isSubmitting={createMutation.isPending}
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setIsCreateOpen(false)}
            />
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Editar Categoria</DialogTitle></DialogHeader>
            <CategoryForm 
                initialData={editingCategory || undefined}
                categoriesTree={categoriesTree || []}
                isSubmitting={updateMutation.isPending}
                onSubmit={(data) => updateMutation.mutate(data)}
                onCancel={() => setEditingCategory(null)}
            />
        </DialogContent>
      </Dialog>

      {/* Deletar */}
      <AlertDialog open={!!catToDelete} onOpenChange={(open) => !open && setCatToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">Excluir Categoria?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação é permanente. Se esta categoria possuir sub-categorias, verifique se elas serão movidas ou excluídas (dependendo da regra do sistema).
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => catToDelete && deleteMutation.mutate(catToDelete)} className="bg-red-600 hover:bg-red-700">
                    Excluir
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}