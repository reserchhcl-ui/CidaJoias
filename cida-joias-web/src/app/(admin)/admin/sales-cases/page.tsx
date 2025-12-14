'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Briefcase, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { salesCaseService } from '@/services/sales-case-service';

export default function AdminSalesCasesPage() {
  const queryClient = useQueryClient();

  const { data: cases, isLoading } = useQuery({
    queryKey: ['admin-cases'],
    queryFn: () => salesCaseService.getAllCasesAdmin(),
  });

  const deleteMutation = useMutation({
    mutationFn: salesCaseService.deleteCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cases'] });
      toast.success("Estojo excluído e itens retornados ao estoque.");
    },
    onError: () => toast.error("Erro ao excluir estojo.")
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Estojos</h1>
        <Button asChild>
          <Link href="/admin/sales-cases/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Estojo
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Vendedora (ID)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell></TableRow>
            ) : cases?.map((sc) => (
              <TableRow key={sc.id}>
                <TableCell className="font-medium">{sc.code}</TableCell>
                <TableCell>Rep #{sc.sales_rep_id}</TableCell>
                <TableCell>
                  <Badge variant={sc.status === 'open' ? 'default' : 'secondary'}>
                    {sc.status}
                  </Badge>
                </TableCell>
                <TableCell>{sc.items.length} produtos</TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/sales-cases/${sc.id}`}>
                        <Eye className="h-4 w-4 text-slate-500" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" size="icon" 
                    onClick={() => {
                        if(confirm('Tem certeza? Isso devolverá os itens ao estoque principal.')) 
                           deleteMutation.mutate(sc.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}