import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./App";

type UserRole = "patient" | "pharmacist" | "driver";

const roleState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  role: "patient" as UserRole,
}));

vi.mock("@/contexts/RoleContext", () => ({
  RoleProvider: ({ children }: { children: React.ReactNode }) => children,
  useRole: () => roleState,
  getDefaultRouteForRole: (role: UserRole) => {
    if (role === "pharmacist") return "/pharmacist/dashboard";
    if (role === "driver") return "/driver/dashboard";
    return "/dashboard";
  },
}));

vi.mock("./pages/Auth", () => ({ default: () => <div>Auth Page</div> }));
vi.mock("./pages/ForgotPassword", () => ({ default: () => <div>Forgot Password Page</div> }));
vi.mock("./pages/ResetPassword", () => ({ default: () => <div>Reset Password Page</div> }));
vi.mock("./pages/VerifyEmail", () => ({ default: () => <div>Verify Email Page</div> }));
vi.mock("./pages/Index", () => ({ default: () => <div>Patient Dashboard</div> }));
vi.mock("./pages/UserSettings", () => ({ default: () => <div>User Settings Page</div> }));
vi.mock("./pages/SearchResults", () => ({ default: () => <div>Search Results Page</div> }));
vi.mock("./pages/PharmacyStore", () => ({ default: () => <div>Pharmacy Store Page</div> }));
vi.mock("./pages/Cart", () => ({ default: () => <div>Cart Page</div> }));
vi.mock("./pages/Checkout", () => ({ default: () => <div>Checkout Page</div> }));
vi.mock("./pages/OrderConfirmation", () => ({ default: () => <div>Order Confirmation Page</div> }));
vi.mock("./pages/Orders", () => ({ default: () => <div>Orders Page</div> }));
vi.mock("./pages/OrderTracking", () => ({ default: () => <div>Order Tracking Page</div> }));
vi.mock("./pages/Favorites", () => ({ default: () => <div>Favorites Page</div> }));
vi.mock("./pages/NotFound", () => ({ default: () => <div>Not Found Page</div> }));
vi.mock("./pages/pharmacist/Dashboard", () => ({ default: () => <div>Pharmacist Dashboard</div> }));
vi.mock("./pages/pharmacist/OrdersQueue", () => ({ default: () => <div>Pharmacist Orders Queue</div> }));
vi.mock("./pages/pharmacist/OrderReview", () => ({ default: () => <div>Pharmacist Order Review</div> }));
vi.mock("./pages/pharmacist/InventoryManagement", () => ({ default: () => <div>Pharmacist Inventory</div> }));
vi.mock("./pages/pharmacist/Profile", () => ({ default: () => <div>Pharmacist Profile</div> }));
vi.mock("./pages/driver/Dashboard", () => ({ default: () => <div>Driver Dashboard</div> }));
vi.mock("./pages/driver/AvailableOrders", () => ({ default: () => <div>Driver Available Orders</div> }));
vi.mock("./pages/driver/ActiveDelivery", () => ({ default: () => <div>Driver Active Delivery</div> }));
vi.mock("./pages/driver/DeliveryHistory", () => ({ default: () => <div>Driver Delivery History</div> }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AppRoutes />
    </MemoryRouter>
  );

describe("App route smoke coverage", () => {
  beforeEach(() => {
    roleState.isAuthenticated = false;
    roleState.isLoading = false;
    roleState.role = "patient";
  });

  it("renders the public auth route for unauthenticated users", () => {
    renderAt("/");
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("redirects unauthenticated users away from patient routes", () => {
    renderAt("/dashboard");
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("allows patient-only routes for patient users", () => {
    roleState.isAuthenticated = true;
    roleState.role = "patient";

    renderAt("/orders");
    expect(screen.getByText("Orders Page")).toBeInTheDocument();
  });

  it("redirects patients away from pharmacist routes", () => {
    roleState.isAuthenticated = true;
    roleState.role = "patient";

    renderAt("/pharmacist/inventory");
    expect(screen.getByText("Patient Dashboard")).toBeInTheDocument();
  });

  it("allows driver-only routes for driver users", () => {
    roleState.isAuthenticated = true;
    roleState.role = "driver";

    renderAt("/driver/active");
    expect(screen.getByText("Driver Active Delivery")).toBeInTheDocument();
  });

  it("renders the not found route for unknown paths", () => {
    renderAt("/definitely-missing");
    expect(screen.getByText("Not Found Page")).toBeInTheDocument();
  });
});
