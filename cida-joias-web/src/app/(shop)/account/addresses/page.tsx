'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Pencil, Trash2, Home, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

import { AddressForm } from '@/components/account/AddressForm';
import { addressService } from '@/services/address-service';
import { Address } from '@/types/address';

export default function AddressesPage() {
  const queryClient = useQueryClient();
  
  // Estados para Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);
  
  // Estados para Exclusão
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  // 1. Buscar Endereços
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: addressService.getMyAddresses,
  });

  // 2. Mutação de Exclusão (Refinada)
  const deleteMutation = useMutation({
    mutationFn: addressService.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      toast.success("Endereço excluído", {
        description: "O endereço foi removido da sua lista com sucesso.",
        icon: <Trash2 className="h-4 w-4 text-red-500" />
      });
      setAddressToDelete(null); // Fecha o dialog
    },
    onError: () => {
      toast.error("Não foi possível excluir", {
        description: "Ocorreu um erro ao tentar remover o endereço. Tente novamente."
      });
    }
  });

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingAddress(undefined);
    setIsFormOpen(true);
  };

  const confirmDelete = () => {
    if (addressToDelete) {
      deleteMutation.mutate(addressToDelete);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-xl font-semibold text-slate-900">Meus Endereços</h2>
           <p className="text-sm text-slate-500">Gerencie seus locais de entrega.</p>
        </div>
        <Button onClick={handleAddNew} size="sm" className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Novo Endereço
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : addresses?.length === 0 ? (
        <Card className="border-dashed bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                   <MapPin className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-900">Nenhum endereço cadastrado</p>
                <p className="text-sm">Cadastre seu primeiro endereço para agilizar suas compras.</p>
                <Button variant="link" onClick={handleAddNew} className="mt-2">
                   Cadastrar agora
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {addresses?.map((addr) => (
                <Card key={addr.id} className={`relative transition-all hover:shadow-md ${addr.is_default ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'hover:border-slate-300'}`}>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-md ${addr.is_default ? 'bg-white text-primary' : 'bg-slate-100 text-slate-500'}`}>
                                   <Home className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-900">{addr.name}</CardTitle>
                                    {addr.is_default && (
                                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                                            Padrão
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => handleEdit(addr)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => setAddressToDelete(addr.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <CardDescription className="font-medium text-slate-700 mt-1">
                            {addr.recipient_name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 space-y-1">
                        <p>{addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}</p>
                        <p>{addr.neighborhood} - {addr.city}/{addr.state}</p>
                        <p className="pt-2 font-mono text-xs text-slate-400">{addr.zip_code}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editingAddress ? 'Editar Endereço' : 'Novo Endereço'}</DialogTitle>
            </DialogHeader>
            <AddressForm 
                initialData={editingAddress} 
                onSuccess={() => {
                    setIsFormOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
                }} 
                onCancel={() => setIsFormOpen(false)}
            />
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão (Alert Dialog) */}
      <AlertDialog open={!!addressToDelete} onOpenChange={(open) => !open && setAddressToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" /> Excluir Endereço
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este endereço? Essa ação não pode ser desfeita e ele não aparecerá mais no seu checkout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => {
                    e.preventDefault(); // Impede fechar automático para mostrar loading
                    confirmDelete();
                }}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={deleteMutation.isPending}
            >
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {deleteMutation.isPending ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}