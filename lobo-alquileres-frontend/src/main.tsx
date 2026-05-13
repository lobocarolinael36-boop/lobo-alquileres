import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,  // 30 segundos antes de refetch automático
      retry: 1,           // un solo reintento en caso de error
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* Toaster global — cada módulo usa toast.success() / toast.error() */}
      <Toaster
        richColors
        position="top-right"
        closeButton
        duration={4000}
      />
    </QueryClientProvider>
  </StrictMode>
);
