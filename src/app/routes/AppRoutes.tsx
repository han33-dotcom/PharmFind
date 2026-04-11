import Auth from "@/pages/Auth";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Favorites from "@/pages/Favorites";
import ForgotPassword from "@/pages/ForgotPassword";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Orders from "@/pages/Orders";
import OrderTracking from "@/pages/OrderTracking";
import PharmacyStore from "@/pages/PharmacyStore";
import ResetPassword from "@/pages/ResetPassword";
import SearchResults from "@/pages/SearchResults";
import UserSettings from "@/pages/UserSettings";
import VerifyEmail from "@/pages/VerifyEmail";
import ActiveDelivery from "@/pages/driver/ActiveDelivery";
import AvailableOrders from "@/pages/driver/AvailableOrders";
import DriverDashboard from "@/pages/driver/Dashboard";
import DeliveryHistory from "@/pages/driver/DeliveryHistory";
import PharmacistDashboard from "@/pages/pharmacist/Dashboard";
import InventoryManagement from "@/pages/pharmacist/InventoryManagement";
import OrderReview from "@/pages/pharmacist/OrderReview";
import OrdersQueue from "@/pages/pharmacist/OrdersQueue";
import PharmacistProfile from "@/pages/pharmacist/Profile";
import { Route, Routes } from "react-router-dom";
import { AuthGate } from "./AuthGate";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthGate requireAuth={false} />}>
        <Route path="/" element={<Auth />} />
      </Route>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route element={<AuthGate allowedRoles={["patient"]} />}>
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
      </Route>
      <Route element={<AuthGate allowedRoles={["pharmacist"]} />}>
        <Route path="/pharmacist/dashboard" element={<PharmacistDashboard />} />
        <Route path="/pharmacist/orders" element={<OrdersQueue />} />
        <Route path="/pharmacist/orders/:orderId" element={<OrderReview />} />
        <Route path="/pharmacist/inventory" element={<InventoryManagement />} />
        <Route path="/pharmacist/profile" element={<PharmacistProfile />} />
      </Route>
      <Route element={<AuthGate allowedRoles={["driver"]} />}>
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/driver/available" element={<AvailableOrders />} />
        <Route path="/driver/active" element={<ActiveDelivery />} />
        <Route path="/driver/history" element={<DeliveryHistory />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
