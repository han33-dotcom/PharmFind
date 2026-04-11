import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { AddressProvider } from "@/contexts/AddressContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { RoleProvider } from "@/contexts/RoleContext";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        <CartProvider>
          <OrdersProvider>
            <AddressProvider>
              <FavoritesProvider>{children}</FavoritesProvider>
            </AddressProvider>
          </OrdersProvider>
        </CartProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
}
