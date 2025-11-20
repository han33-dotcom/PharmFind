import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, List, Truck, Clock, LogOut } from "lucide-react";
import Logo from "@/components/Logo";
import { useRole } from "@/contexts/RoleContext";
import { Badge } from "@/components/ui/badge";
import { DriverService } from "@/services/driver.service";

interface DriverLayoutProps {
  children: ReactNode;
}

const DriverLayout = ({ children }: DriverLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRole } = useRole();
  const stats = DriverService.getDriverStats();

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setRole("patient");
    navigate("/");
  };

  const navItems = [
    { path: "/driver/dashboard", label: "Dashboard", icon: Home },
    { path: "/driver/available", label: "Available Orders", icon: List },
    { path: "/driver/active", label: "Active Delivery", icon: Truck, badge: stats.activeDelivery ? "1" : null },
    { path: "/driver/history", label: "History", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-foreground">Delivery Driver</h1>
              <p className="text-sm text-muted-foreground">
                {stats.activeDelivery ? "Active Delivery" : "Ready for orders"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {stats.activeDelivery && (
              <Badge variant="default" className="bg-secondary text-secondary-foreground">
                <Truck className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  className="relative"
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default DriverLayout;
