'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Mail, Phone, Instagram, Package } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { userService } from '@/services/user-service';
import { formatPrice } from '@/lib/utils';

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => userService.getUserById(userId),
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['admin-user-orders', userId],
    queryFn: () => userService.getUserOrders(userId),
  });

  if (isLoadingUser || isLoadingOrders) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!user) return <div>Usuário não encontrado.</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Card de Perfil */}
        <Card className="md:col-span-1 h-fit">
            <CardHeader>
                <CardTitle>Perfil do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg mb-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-2">
                        {user.full_name?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <h2 className="font-bold text-lg">{user.full_name}</h2>
                    <Badge variant="secondary">{user.role}</Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4" /> {user.email}
                    </div>
                    {user.phone_number && (
                        <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="h-4 w-4" /> {user.phone_number}
                        </div>
                    )}
                    {user.instagram_handle && (
                        <div className="flex items-center gap-2 text-slate-600">
                            <Instagram className="h-4 w-4" /> {user.instagram_handle}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* Lista de Pedidos */}
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
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}