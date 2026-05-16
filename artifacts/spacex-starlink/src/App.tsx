import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { initAuth } from "@/lib/auth";

import NotFound from "@/pages/not-found";

// Main App
import Home from "@/pages/home";
import Plans from "@/pages/plans";
import Checkout from "@/pages/checkout";
import CheckoutSuccess from "@/pages/checkout-success";
import Dashboard from "@/pages/dashboard";
import Contact from "@/pages/contact";
import Wallet from "@/pages/wallet";
import Login from "@/pages/login";
import Tracker from "@/pages/tracker";

// Admin App
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminPlans from "@/pages/admin/plans";
import AdminSubscriptions from "@/pages/admin/subscriptions";

// Initialize admin auth helper
initAuth();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/plans" component={Plans} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/contact" component={Contact} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/login" component={Login} />
      <Route path="/tracker" component={Tracker} />

      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/plans" component={AdminPlans} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
