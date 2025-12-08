'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, User, Eye, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { UserForm } from '@/components/admin/UserForm';
import { userService } from '@/services/user-service';
import { UserProfile } from '@/types/auth';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: userService.getAllUsers,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => userService.updateUser(editingUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success("Usuário atualizado!");
      setEditingUser(null);
    },
    onError: () => toast.error("Erro ao atualizar."),
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success("Usuário removido.");
      setUserToDelete(null);
    },
    onError: (err: any) => {
        const msg = err.response?.data?.detail || "Erro ao remover.";
        toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>

      <div className="rounded-md border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell>
                </TableRow>
              ) : users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell className="font-medium">
                      <div className="flex items-center gap-2 min-w-[160px]">
                          <div className="bg-slate-100 p-1.5 rounded-full"><User className="h-4 w-4 text-slate-500" /></div>
                          <span className="truncate">{u.full_name || 'Sem nome'}</span>
                      </div>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'sales_rep' ? 'secondary' : 'outline'}>
                      {u.role === 'sales_rep' ? 'Vendedora' : u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                      <span className={`h-2 w-2 rounded-full inline-block mr-2 ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {u.is_active ? 'Ativo' : 'Inativo'}
                  </TableCell>
                  <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                              <Link href={`/admin/users/${u.id}`} title="Ver Pedidos">
                                  <Eye className="h-4 w-4 text-blue-500" />
                              </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingUser(u)} title="Editar">
                              <Pencil className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setUserToDelete(u.id)} title="Excluir">
                              <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Edição */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
            {editingUser && (
                <UserForm 
                    initialData={editingUser}
                    isSubmitting={updateMutation.isPending}
                    onSubmit={(data) => updateMutation.mutate(data)}
                    onCancel={() => setEditingUser(null)}
                />
            )}
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600"><AlertCircle /> Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>Esta ação removerá o usuário permanentemente. Deseja continuar?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => userToDelete && deleteMutation.mutate(userToDelete)} className="bg-red-600">Excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}