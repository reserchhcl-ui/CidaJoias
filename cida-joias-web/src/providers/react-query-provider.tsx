'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Garantir que o QueryClient seja criado apenas uma vez por sessão no client
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Dados considerados "frescos" por 1 minuto (evita refetch excessivo)
        staleTime: 60 * 1000, 
        // Não tenta reconectar imediatamente se falhar (opcional, bom para dev)
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}