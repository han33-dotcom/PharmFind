import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { AddressProvider } from "@/contexts/AddressContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { RoleProvider } from "@/contexts/RoleContext";
import Index from "./pages/Index";
import Favorites from "./pages/Favorites";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import UserSettings from "./pages/UserSettings";
import SearchResults from "./pages/SearchResults";
import PharmacyStore from "./pages/PharmacyStore";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import OrderTracking from "./pages/OrderTracking";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import PharmacistDashboard from "./pages/pharmacist/Dashboard";
import OrdersQueue from "./pages/pharmacist/OrdersQueue";
import OrderReview from "./pages/pharmacist/OrderReview";
import InventoryManagement from "./pages/pharmacist/InventoryManagement";
import PharmacistProfile from "./pages/pharmacist/Profile";
import DriverDashboard from "./pages/driver/Dashboard";
import AvailableOrders from "./pages/driver/AvailableOrders";
import ActiveDelivery from "./pages/driver/ActiveDelivery";
import DeliveryHistory from "./pages/driver/DeliveryHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoleProvider>
      <CartProvider>
        <OrdersProvider>
          <AddressProvider>
            <FavoritesProvider>
              <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/user-settings" element={<UserSettings />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/pharmacy/:id" element={<PharmacyStore />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderTracking />} />
            <Route path="/favorites" element={<Favorites />} />
            {/* Pharmacist Routes */}
            <Route path="/pharmacist/dashboard" element={<PharmacistDashboard />} />
            <Route path="/pharmacist/orders" element={<OrdersQueue />} />
            <Route path="/pharmacist/orders/:orderId" element={<OrderReview />} />
            <Route path="/pharmacist/inventory" element={<InventoryManagement />} />
            <Route path="/pharmacist/profile" element={<PharmacistProfile />} />
            {/* Driver Routes */}
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/available" element={<AvailableOrders />} />
            <Route path="/driver/active" element={<ActiveDelivery />} />
            <Route path="/driver/history" element={<DeliveryHistory />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
              </TooltipProvider>
            </FavoritesProvider>
          </AddressProvider>
        </OrdersProvider>
      </CartProvider>
    </RoleProvider>
  </QueryClientProvider>
);

export default App;
