import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { Protected } from "@/components/layout/Protected";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

// Dashboard pages
import Dashboard from "@/pages/dashboard";
import Calls from "@/pages/calls";
import Chats from "@/pages/chats";
import Reviews from "@/pages/reviews";
import Orders from "@/pages/orders";
import Bookings from "@/pages/bookings";
import Social from "./pages/social";
import ServiceRequest from "@/pages/service-request";
import Gallery from "./pages/gallery";
import Settings from "./pages/settings";
import FunctionBookings from "./pages/function-bookings";
import NotFound from "./pages/not-found";

// Auth pages
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import { Suspense, lazy, useEffect, useState } from "react";
import { getQueryFn } from "./lib/queryClient";

// Protected app router (dashboard, etc.)
function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/calls" component={Calls} />
      <Route path="/chats" component={Chats} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/orders" component={Orders} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/social" component={Social} />
      <Route path="/gallery" component={Gallery} />
      {/* <Route path="/recipes" component={Recipes} /> */}
      <Route path="/function-bookings" component={FunctionBookings} />
      <Route path="/service-request" component={ServiceRequest} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Request notification permission on app load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log(`Notification permission: ${permission}`);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Authentication Routes */}
        <Route path="/auth">
          <AuthLayout>
            <Switch>
              <Route path="/auth/signin" component={SignIn} />
              <Route path="/auth" component={SignIn} />
            </Switch>
          </AuthLayout>
        </Route>

        {/* Protected Application Routes */}
        <Route>
          <Protected>
            <MainLayout>
              <AppRouter />
            </MainLayout>
          </Protected>
        </Route>
      </Switch>
      <Toaster />
      <AIChatbot />
      {/* PWA Install Prompt - will only show if app can be installed */}
      <InstallPrompt />
    </QueryClientProvider>
  );
}

export default App;