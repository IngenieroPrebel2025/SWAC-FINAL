"use client";

import { type ReactNode, useState } from "react";
import { Provider } from "react-redux";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/context/ThemeProvider";
import { SidebarProvider } from "@/context/SidebarProvider";
import { Toaster } from "@/components/organisms/Toaster";
import { StoreSync } from "@/providers/StoreSync";
import { toast } from "@/lib/toast";
import { store } from "@/store";

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      // Solo notificar cuando no hay datos previos que mostrar.
      onError: (error, query) => {
        if (query.state.data === undefined) toast.error(error.message);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => toast.error(error.message),
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <StoreSync />
        <ThemeProvider>
          <SidebarProvider>
            {children}
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
