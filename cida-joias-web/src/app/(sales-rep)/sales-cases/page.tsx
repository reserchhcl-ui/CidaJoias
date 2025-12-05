'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Briefcase, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/common/Header'; // Podemos criar um Header específico para Vendedora se quiser
import { dashboardService } from '@/services/dashboard-service';

export default function SalesRepDashboard() {
  const { data: cases, isLoading } = useQuery({
    queryKey: ['sales-cases'],
    queryFn: dashboardService.getMySalesCases,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Painel da Vendedora</h1>
            <p className="text-slate-500">Gerencie seus estojos e consignações.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : cases?.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent>
              <Briefcase className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">Nenhum estojo ativo</h3>
              <p className="text-slate-500">Você não possui estojos em consignação no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases?.map((salesCase) => {
              const daysLeft = differenceInDays(new Date(salesCase.return_by_date), new Date());
              const isLate = daysLeft < 0;
              const totalItems = salesCase.items.reduce((acc, item) => acc + item.quantity, 0);

              return (
                <Card key={salesCase.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2">Estojo #{salesCase.id}</Badge>
                      {isLate ? (
                        <Badge variant="destructive">Atrasado</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Em dia</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-slate-500" />
                      {totalItems} Itens
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Retirado em: {format(new Date(salesCase.loan_date), "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Devolução: <span className="font-semibold">{format(new Date(salesCase.return_by_date), "dd/MM/yyyy")}</span>
                      </span>
                    </div>
                    {isLate && (
                       <div className="flex items-center gap-2 text-red-600 font-medium bg-red-50 p-2 rounded">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Venceu há {Math.abs(daysLeft)} dias</span>
                       </div>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Button className="w-full" variant={isLate ? "destructive" : "default"}>
                      Realizar Acerto / Devolução
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}