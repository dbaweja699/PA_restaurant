import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "./components/layout/MainLayout";

import Dashboard from "@/pages/dashboard";
import Calls from "@/pages/calls";
import Chats from "@/pages/chats";
import Reviews from "@/pages/reviews";
import Orders from "@/pages/orders";
import Bookings from "@/pages/bookings";
import Social from "@/pages/social";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/calls" component={Calls} />
      <Route path="/chats" component={Chats} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/orders" component={Orders} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/social" component={Social} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Router />
      </MainLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
