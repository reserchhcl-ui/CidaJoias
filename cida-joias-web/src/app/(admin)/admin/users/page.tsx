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

      {/* Container com overflow-hidden para arredondar as bordas da tabela */}
      <div className="rounded-md border bg-white overflow-hidden">
        
        {/* RESPONSIVIDADE: Wrapper para permitir rolagem horizontal no mobile */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.id}</TableCell>
                  <TableCell className="font-medium">
                      {/* min-w garante que o nome não fique espremido no mobile */}
                      <div className="flex items-center gap-2 min-w-[160px]">
                          <div className="bg-slate-100 p-1.5 rounded-full flex-shrink-0">
                              <User className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="truncate">{u.full_name || 'Sem nome'}</span>
                      </div>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'sales_rep' ? 'secondary' : 'outline'}>
                      {u.role === 'sales_rep' ? 'Vendedora' : u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-slate-600">{u.is_active ? 'Ativo' : 'Inativo'}</span>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}