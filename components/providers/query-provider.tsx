'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuration par défaut pour toutes les queries
            staleTime: 60 * 1000, // Les données sont considérées comme fraîches pendant 1 minute
            refetchOnWindowFocus: false, // Pas de refetch automatique quand on revient sur la fenêtre
            retry: 1, // Réessayer 1 fois en cas d'erreur
          },
          mutations: {
            // Configuration par défaut pour toutes les mutations
            retry: 0, // Ne pas réessayer les mutations en cas d'erreur
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
