'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, User } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { userService } from '@/services/user-service';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: userService.getAllUsers,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-100 p-1 rounded-full">
                            <User className="h-3 w-3 text-slate-500" />
                        </div>
                        {u.full_name || 'Sem nome'}
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}