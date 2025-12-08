'use client';

import { useState } from 'react'; // Adicionado useState
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Adicionado Mutation e Client
import { Loader2, ArrowLeft, Mail, Phone, Instagram, Package, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Adicionado Dialog

import { UserForm } from '@/components/admin/UserForm'; // Importar o form
import { userService } from '@/services/user-service';
import { formatPrice } from '@/lib/utils';

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);
  const queryClient = useQueryClient();
  
  // Estado para controlar o modal de edição
  const [isEditing, setIsEditing] = useState(false);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => userService.getUserById(userId),
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['admin-user-orders', userId],
    queryFn: () => userService.getUserOrders(userId),
  });

  // Mutação para atualizar o usuário direto desta tela
  const updateMutation = useMutation({
    mutationFn: (data: any) => userService.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }); // Atualiza a lista geral também
      toast.success("Usuário atualizado com sucesso!");
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Erro ao atualizar.");
    },
  });

  if (isLoadingUser || isLoadingOrders) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!user) return <div>Usuário não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        
        {/* Botão de Editar na Página de Detalhes */}
        <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" /> Editar Usuário
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Card de Perfil */}
        <Card className="md:col-span-1 h-fit">
            <CardHeader>
                <CardTitle>Perfil do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg mb-4 text-center">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-2">
                        {user.full_name?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <h2 className="font-bold text-lg">{user.full_name || 'Sem Nome'}</h2>
                    <div className="flex gap-2 justify-center mt-1">
                        <Badge variant="secondary">{user.role}</Badge>
                        {!user.is_active && <Badge variant="destructive">Inativo</Badge>}
                    </div>
                </div>
                
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400" /> 
                        <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone_number ? (
                        <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="h-4 w-4 text-slate-400" /> {user.phone_number}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400 italic">
                            <Phone className="h-4 w-4 opacity-50" /> Sem telefone
                        </div>
                    )}
                    {user.instagram_handle ? (
                        <div className="flex items-center gap-2 text-slate-600">
                            <Instagram className="h-4 w-4 text-slate-400" /> {user.instagram_handle}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400 italic">
                            <Instagram className="h-4 w-4 opacity-50" /> Sem instagram
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* Lista de Pedidos (Igual ao anterior) */}
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" /> Histórico de Pedidos ({orders?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {orders?.length === 0 ? (
                    <p className="text-slate-500 text-center py-10">Nenhum pedido encontrado para este usuário.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders?.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>#{order.id}</TableCell>
                                        <TableCell>
                                            {order.created_at ? format(new Date(order.created_at), "dd/MM/yyyy") : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{order.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatPrice(order.total_amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      {/* Modal de Edição (Reutilizando UserForm) */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <UserForm 
                initialData={user}
                isSubmitting={updateMutation.isPending}
                onSubmit={(data) => updateMutation.mutate(data)}
                onCancel={() => setIsEditing(false)}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}