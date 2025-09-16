import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { OptimizedErrorBoundary, usePerformanceMonitor, usePreloadComponents } from "@/utils/performance";

// Optimized QueryClient for shop computers
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds - good for shop data
      cacheTime: 5 * 60 * 1000, // 5 minutes cache
      retry: 2, // Reduce retries for faster failures
      refetchOnWindowFocus: false, // Avoid unnecessary refetches in shop
    },
    mutations: {
      retry: 1, // Quick fail for mutations
    },
  },
});

const AppContent = () => {
  usePerformanceMonitor('App');
  usePreloadComponents();
  
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <OptimizedErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  </OptimizedErrorBoundary>
);

export default App;
