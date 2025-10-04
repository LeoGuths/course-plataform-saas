'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/tanstack-query';
import { Toaster } from '@/components/ui/sonner';
import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ClientProvidersProps = {
  children: ReactNode;
};

export const ClientProviders = ({ children }: ClientProvidersProps) => {
  useEffect(() => {
    setDefaultOptions({ locale: ptBR });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors />
      {children}
    </QueryClientProvider>
  );
};
