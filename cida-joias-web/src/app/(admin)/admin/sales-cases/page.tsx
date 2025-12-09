'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { userService } from '@/services/user-service';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
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

import { salesCaseService } from '@/services/sales-case-service';

export default function AdminSalesCasesPage() {
  const queryClient = useQueryClient();
  const [caseToDelete, setCaseToDelete] = useState<number | null>(null);

  // Buscar Estojos
  const { data: cases, isLoading } = useQuery({
    queryKey: ['admin-cases'],
    queryFn: () => salesCaseService.getAllCases(), // Busca todos os estojos
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: userService.getAllUsers,
  });

  // Mutação de Exclusão
  const deleteMutation = useMutation({
    mutationFn: salesCaseService.deleteCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
      toast.success("Estojo excluído com sucesso.");
      setCaseToDelete(null);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Erro ao excluir estojo.";
      toast.error(msg);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Consignados</h1>
        <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/sales-cases/new">
                <Plus className="mr-2 h-4 w-4" /> Novo Estojo
            </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        {/* --- RESPONSIVIDADE: Scroll Horizontal --- */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="min-w-[100px]">Vendedora</TableHead>
                {/* Ocultamos datas em telas muito pequenas para limpar a visão */}
                <TableHead className="hidden md:table-cell">Empréstimo</TableHead>
                <TableHead className="min-w-[100px]">Devolução</TableHead>
                <TableHead className="text-center">Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : cases?.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                          Nenhum estojo encontrado.
                      </TableCell>
                  </TableRow>
              ) : cases?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">#{c.id}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            {/* Procuramos o usuário cujo ID bate com o sales_rep_id do estojo */}
                            <span className="font-medium">
                                {users?.find(u => u.id === c.sales_rep_id)?.full_name || `ID: ${c.sales_rep_id}`}
                            </span>
                        </div>
                    </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-500">
                    {format(new Date(c.loan_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(c.return_by_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold">
                    {c.items.reduce((acc, i) => acc + i.quantity, 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'on_loan' ? 'secondary' : c.status === 'overdue' ? 'destructive' : 'outline'}>
                      {c.status === 'on_loan' ? 'Ativo' : c.status === 'overdue' ? 'Atrasado' : 'Devolvido'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/sales-cases/${c.id}`} title="Editar Estojo">
                                <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                            </Link>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setCaseToDelete(c.id)}
                            title="Excluir Estojo"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!caseToDelete} onOpenChange={(open) => !open && setCaseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" /> Excluir Estojo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação desfará o estojo e <b>devolverá todos os itens para o estoque</b> da loja automaticamente.
              <br/><br/>
              Histórico de estojos já finalizados (devolvidos) não pode ser excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => {
                    e.preventDefault();
                    if(caseToDelete) deleteMutation.mutate(caseToDelete);
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={deleteMutation.isPending}
            >
                {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sim, excluir e estornar estoque"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}