import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Package, ClipboardList, Store, LogOut, User } from 'lucide-react';
import Logo from '@/components/Logo';
import { AuthService } from '@/services/auth.service';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

interface PharmacistLayoutProps {
  children: ReactNode;
}

const PharmacistLayout = ({ children }: PharmacistLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setRole } = useRole();

  const handleLogout = () => {
    AuthService.logout();
    setRole('patient');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navItems = [
    { path: '/pharmacist/dashboard', label: 'Dashboard', icon: Store },
    { path: '/pharmacist/orders', label: 'Orders Queue', icon: ClipboardList },
    { path: '/pharmacist/inventory', label: 'Inventory', icon: Package },
    { path: '/pharmacist/profile', label: 'Profile', icon: User },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              className="w-full justify-start"
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
      <Button
        variant="ghost"
        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col gap-4 py-4">
                <Logo size="small" />
                <nav className="flex flex-col gap-2">
                  <NavLinks />
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 lg:gap-4">
            <Logo size="small" />
            <div className="hidden lg:flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Store className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Pharmacist Portal</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 border-r bg-muted/10">
          <nav className="flex flex-col gap-2 p-4 w-full">
            <NavLinks />
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PharmacistLayout;
