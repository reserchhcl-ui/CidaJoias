'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Minus, Trash2, ScanBarcode, Search, AlertCircle, Save,Camera } from 'lucide-react';
import { toast } from 'sonner';
import { BarcodeScanner } from '@/components/common/BarcodeScanner'; // Importar o scanner
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
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
import { SalesCase } from '@/types/dashboard';
import { ProductAdmin } from '@/types/product';
import { formatPrice, getImageUrl } from '@/lib/utils';

interface SalesCaseItemManagerProps {
  salesCase: SalesCase;
  allProducts: ProductAdmin[];
}

export function SalesCaseItemManager({ salesCase, allProducts }: SalesCaseItemManagerProps) {
  const queryClient = useQueryClient();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null); // Estado para o Modal
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const enrichedItems = useMemo(() => {
    return salesCase.items.map((item) => {
      const productDetails = allProducts.find(p => p.id === item.product_id);
      return {
        ...item,
        product: productDetails,
      };
    }).sort((a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''));
  }, [salesCase.items, allProducts]);

  const addItemMutation = useMutation({
    mutationFn: (data: { barcode: string, quantity: number }) => 
      salesCaseService.addItem(salesCase.id, data),
    onMutate: () => setIsProcessing(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-case', salesCase.id] });
      toast.success("Item adicionado!");
      setBarcodeInput('');
      setTimeout(() => inputRef.current?.focus(), 50); 
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail || "Erro ao adicionar item.";
      toast.error(msg);
      inputRef.current?.select(); 
    },
    onSettled: () => setIsProcessing(false),
  });

  const updateQtyMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number, quantity: number }) => 
      salesCaseService.updateItemQuantity(salesCase.id, productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-case', salesCase.id] });
      if (itemToDelete) {
          toast.success("Item removido do estojo.");
          setItemToDelete(null);
      }
    },
    onError: (error: any) => {
        toast.error(error.response?.data?.detail || "Erro ao atualizar estoque.");
    }
  });

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    addItemMutation.mutate({ barcode: barcodeInput, quantity: 1 });
  };

  const handleQtyChange = (productId: number, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty < 0) return;
    updateQtyMutation.mutate({ productId, quantity: newQty });
  };

  const confirmRemove = () => {
    if (itemToDelete) {
        updateQtyMutation.mutate({ productId: itemToDelete, quantity: 0 });
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    // Toca um som de "beep" (opcional, melhora UX)
    //const audio = new Audio('/beep.mp3'); audio.play();

    toast.success(`Código lido: ${decodedText}`);
    
    // Preenche o input
    setBarcodeInput(decodedText);
    
    // Fecha o scanner
    setIsScannerOpen(false);
    
    // Dispara a mutação automaticamente
    addItemMutation.mutate({ barcode: decodedText, quantity: 1 });
  };

  return (
    <>
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                  <ScanBarcode className="h-6 w-6 text-blue-600" />
                  Gestão de Itens
              </CardTitle>
            {/* AREA DE INPUT E CAMERA */}
            <div className="flex flex-col w-full md:w-auto gap-2">
                
                {/* Botão para abrir câmera (Só aparece se estiver fechada) */}
                {!isScannerOpen && (
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input 
                                ref={inputRef}
                                placeholder="Bipe, digite ou use a câmera..." 
                                className="pl-10 font-mono text-lg h-10 border-blue-200 focus:border-blue-500"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                disabled={isProcessing}
                                autoComplete="off"
                            />
                        </div>
                        <Button 
                            type="button" // Type button para não submeter o form
                            variant="outline"
                            onClick={() => setIsScannerOpen(true)}
                            title="Ler com Câmera"
                        >
                            <Camera className="h-5 w-5" />
                        </Button>
                        <Button type="button" onClick={handleBarcodeSubmit} disabled={isProcessing || !barcodeInput}>
                            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                        </Button>
                    </div>
                )}
            </div>
        </div>
        
        {/* COMPONENTE DO SCANNER (Renderização Condicional) */}
        {isScannerOpen && (
            <div className="mt-4 p-4 border rounded-md bg-slate-100">
                <BarcodeScanner 
                    onScanSuccess={handleScanSuccess} 
                    onClose={() => setIsScannerOpen(false)} 
                />
            </div>
        )}
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
              <TableHeader>
                  <TableRow className="bg-slate-50">
                      <TableHead className="w-[80px]">Imagem</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-right pr-6">Ações</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {enrichedItems.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={5} className="h-40 text-center text-slate-500">
                              <div className="flex flex-col items-center gap-2">
                                  <ScanBarcode className="h-10 w-10 opacity-20" />
                                  <p>Estojo vazio.</p>
                                  <p className="text-sm">Use o campo acima para bipar e adicionar produtos.</p>
                              </div>
                          </TableCell>
                      </TableRow>
                  ) : (
                      enrichedItems.map((item) => (
                          <TableRow key={item.product_id}>
                              <TableCell>
                                  <div className="h-12 w-12 rounded-md bg-white border overflow-hidden">
                                      <img 
                                          src={getImageUrl(item.product?.image_url)} 
                                          alt="img" 
                                          className="h-full w-full object-cover"
                                      />
                                  </div>
                              </TableCell>
                              <TableCell>
                                  <div className="flex flex-col">
                                      {item.product ? (
                                          <>
                                              <span className="font-medium text-slate-900">{item.product.name}</span>
                                              <span className="text-xs text-slate-500">{formatPrice(item.product.selling_price)}</span>
                                          </>
                                      ) : (
                                          <span className="text-red-500 flex items-center gap-1">
                                              <AlertCircle className="h-3 w-3" /> Produto #{item.product_id} não encontrado
                                          </span>
                                      )}
                                  </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-slate-600">
                                  {item.product?.barcode || '-'}
                              </TableCell>
                              <TableCell>
                                  <div className="flex items-center justify-center gap-3">
                                      <Button 
                                          variant="outline" size="icon" className="h-8 w-8"
                                          onClick={() => handleQtyChange(item.product_id, item.quantity, -1)}
                                          disabled={updateQtyMutation.isPending}
                                      >
                                          <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                                      <Button 
                                          variant="outline" size="icon" className="h-8 w-8"
                                          onClick={() => handleQtyChange(item.product_id, item.quantity, 1)}
                                          disabled={updateQtyMutation.isPending}
                                      >
                                          <Plus className="h-3 w-3" />
                                      </Button>
                                  </div>
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                  <Button 
                                      variant="ghost" size="icon" 
                                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => setItemToDelete(item.product_id)}
                                  >
                                      <Trash2 className="h-5 w-5" />
                                  </Button>
                              </TableCell>
                          </TableRow>
                      ))
                  )}
              </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DE CONFIRMAÇÃO (DELETE) */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Remover item do estojo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O item será devolvido imediatamente para o estoque global da loja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => {
                    e.preventDefault(); 
                    confirmRemove();
                }}
                className="bg-red-600 hover:bg-red-700"
            >
                {updateQtyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Remoção"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}