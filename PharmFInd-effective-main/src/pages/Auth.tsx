import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, Heart, ShieldCheck, Building2, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { AuthService } from "@/services/auth.service";
import { PharmaciesService } from "@/services/pharmacies.service";
import { useRole, UserRole } from "@/contexts/RoleContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Auth = () => {
  const { setRole } = useRole();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const firstName = formData.get('signup-firstname') as string;
    const lastName = formData.get('signup-lastname') as string;
    const email = formData.get('signup-email') as string;
    const phone = formData.get('signup-phone') as string;
    const password = formData.get('signup-password') as string;

    try {
      // Register user account
      const response = await AuthService.register({
        email,
        password,
        fullName: `${firstName} ${lastName}`,
        phone,
      });
      
      if ((response as any).message) {
        toast.success((response as any).message);
      } else {
        toast.success("Account created successfully!");
      }
      
      // If pharmacist, register pharmacy
      if (selectedRole === 'pharmacist') {
        const pharmacyName = formData.get('pharmacy-name') as string;
        const pharmacyAddress = formData.get('pharmacy-address') as string;
        const pharmacyPhone = formData.get('pharmacy-phone') as string;
        const licenseNumber = formData.get('license-number') as string;
        const hoursOpen = formData.get('hours-open') as string;
        const hoursClose = formData.get('hours-close') as string;
        const deliveryFee = formData.get('delivery-fee') as string;

        if (!pharmacyName || !pharmacyAddress || !pharmacyPhone) {
          toast.error("Please fill in all pharmacy details");
          setIsLoading(false);
          return;
        }

        // Ensure token is available
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.error('No auth token found after registration');
          toast.error("Account created but pharmacy registration failed. Please try registering your pharmacy from the dashboard.");
          setIsLoading(false);
          return;
        }

        try {
          const pharmacyData = {
            name: pharmacyName,
            address: pharmacyAddress,
            phone: pharmacyPhone,
            licenseNumber: licenseNumber || undefined,
            hours: hoursOpen && hoursClose ? {
              open: hoursOpen,
              close: hoursClose,
            } : undefined,
            baseDeliveryFee: deliveryFee ? parseFloat(deliveryFee) : undefined,
          };

          console.log('Registering pharmacy with data:', pharmacyData);
          console.log('Auth token:', token ? 'Present' : 'Missing');

          const pharmacyResponse = await PharmaciesService.registerPharmacy(pharmacyData);
          
          console.log('Pharmacy registration response:', pharmacyResponse);
          
          if (pharmacyResponse && pharmacyResponse.message) {
            toast.success(pharmacyResponse.message);
          } else {
            toast.success("Pharmacy registered successfully! You can now receive orders.");
          }
        } catch (pharmacyError: any) {
          console.error('Pharmacy registration error details:', {
            error: pharmacyError,
            errorMessage: pharmacyError?.error?.message,
            message: pharmacyError?.message,
            status: pharmacyError?.status,
            fullError: pharmacyError
          });
          
          // Show more detailed error message
          let errorMessage = "Account created but pharmacy registration failed.";
          if (pharmacyError?.error?.message) {
            errorMessage = pharmacyError.error.message;
          } else if (pharmacyError?.message) {
            errorMessage = pharmacyError.message;
          } else if (pharmacyError?.status === 401) {
            errorMessage = "Authentication failed. Please try logging in again.";
          } else if (pharmacyError?.status === 409) {
            errorMessage = "You already have a registered pharmacy.";
          } else if (pharmacyError?.status === 400) {
            errorMessage = "Invalid pharmacy data. Please check all fields.";
          }
          
          toast.error(errorMessage + " You can register your pharmacy later from your dashboard.");
          // Don't prevent navigation - user account is created successfully
        }
      }
      
      setRole(selectedRole);
      const redirectPath = 
        selectedRole === 'pharmacist' ? '/pharmacist/dashboard' : 
        selectedRole === 'driver' ? '/driver/dashboard' : 
        '/dashboard';
      navigate(redirectPath);
    } catch (error: any) {
      const errorMessage = error?.error?.message || error?.message || "Failed to create account";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const email = loginMethod === 'email' ? formData.get('login-email') as string : undefined;
    const phone = loginMethod === 'phone' ? formData.get('login-phone') as string : undefined;
    const password = formData.get('login-password') as string;

    try {
      await AuthService.login({
        email,
        phone,
        password,
      });
      
      setRole(selectedRole);
      toast.success("Logged in successfully!");
      const redirectPath = 
        selectedRole === 'pharmacist' ? '/pharmacist/dashboard' : 
        selectedRole === 'driver' ? '/driver/dashboard' : 
        '/dashboard';
      navigate(redirectPath);
    } catch (error: any) {
      const errorMessage = error?.error?.message || error?.message || "Invalid credentials";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 px-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-xl text-muted-foreground">
              Your trusted medicine finder & delivery service in Lebanon
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors">
              <div className="p-2 bg-primary/20 rounded-lg mt-1 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Real-time Availability</h3>
                <p className="text-muted-foreground">
                  Check medicine stock across pharmacies instantly
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 hover:border-secondary/40 transition-colors">
              <div className="p-2 bg-secondary/20 rounded-lg mt-1 shadow-sm">
                <Heart className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Convenient Delivery</h3>
                <p className="text-muted-foreground">
                  Get your medicines delivered right to your doorstep
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 hover:border-accent/50 transition-colors">
              <div className="p-2 bg-accent/30 rounded-lg mt-1 shadow-sm">
                <Pill className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Save Time & Effort</h3>
                <p className="text-muted-foreground">
                  No more calling multiple pharmacies or wasting time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <Card className="border-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome back!</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>I am a</Label>
                      <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="patient" id="login-patient" />
                          <Label htmlFor="login-patient" className="font-normal cursor-pointer">Patient</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pharmacist" id="login-pharmacist" />
                          <Label htmlFor="login-pharmacist" className="font-normal cursor-pointer">Pharmacist</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="driver" id="login-driver" />
                          <Label htmlFor="login-driver" className="font-normal cursor-pointer">Delivery Driver</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Login with</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={loginMethod === 'email' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setLoginMethod('email')}
                        >
                          Email
                        </Button>
                        <Button
                          type="button"
                          variant={loginMethod === 'phone' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setLoginMethod('phone')}
                        >
                          Phone
                        </Button>
                      </div>
                    </div>
                    {loginMethod === 'email' ? (
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          name="login-email"
                          type="email"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="login-phone">Phone Number</Label>
                        <Input
                          id="login-phone"
                          name="login-phone"
                          type="tel"
                          placeholder="+961 70 123 456"
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        name="login-password"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Link to="/forgot-password">
                        <Button variant="link" className="px-0 text-sm">
                          Forgot password?
                        </Button>
                      </Link>
                    </div>
                    <Button
                      type="submit"
                      className="w-full shadow-lg hover:shadow-xl transition-shadow"
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sign Up Form */}
            <TabsContent value="signup">
              <Card className="border-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Create an account</CardTitle>
                  <CardDescription>
                    Join the PharmFind community!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                        {error}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstname">First Name</Label>
                        <Input
                          id="signup-firstname"
                          name="signup-firstname"
                          type="text"
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-lastname">Last Name</Label>
                        <Input
                          id="signup-lastname"
                          name="signup-lastname"
                          type="text"
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone Number</Label>
                      <Input
                        id="signup-phone"
                        name="signup-phone"
                        type="tel"
                        placeholder="+961 70 123 456"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>I am a</Label>
                      <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="patient" id="signup-patient" />
                          <Label htmlFor="signup-patient" className="font-normal cursor-pointer">Patient</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pharmacist" id="signup-pharmacist" />
                          <Label htmlFor="signup-pharmacist" className="font-normal cursor-pointer">Pharmacist</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="driver" id="signup-driver" />
                          <Label htmlFor="signup-driver" className="font-normal cursor-pointer">Delivery Driver</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Pharmacy Registration Fields - Only show for pharmacists */}
                    {selectedRole === 'pharmacist' && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <Label className="text-base font-semibold">Pharmacy Information</Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pharmacy-name">Pharmacy Name *</Label>
                          <Input
                            id="pharmacy-name"
                            name="pharmacy-name"
                            type="text"
                            placeholder="My Pharmacy"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pharmacy-address">Pharmacy Address *</Label>
                          <Input
                            id="pharmacy-address"
                            name="pharmacy-address"
                            type="text"
                            placeholder="123 Main St, Beirut, Lebanon"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pharmacy-phone">Pharmacy Phone *</Label>
                          <Input
                            id="pharmacy-phone"
                            name="pharmacy-phone"
                            type="tel"
                            placeholder="+961 1 234 567"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hours-open">Opening Time</Label>
                            <Input
                              id="hours-open"
                              name="hours-open"
                              type="time"
                              defaultValue="08:00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="hours-close">Closing Time</Label>
                            <Input
                              id="hours-close"
                              name="hours-close"
                              type="time"
                              defaultValue="22:00"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="delivery-fee">Delivery Fee (LBP)</Label>
                            <Input
                              id="delivery-fee"
                              name="delivery-fee"
                              type="number"
                              placeholder="15.00"
                              defaultValue="15"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="license-number">License Number</Label>
                            <Input
                              id="license-number"
                              name="license-number"
                              type="text"
                              placeholder="PH-2024-12345"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Driver Registration Fields - Only show for drivers */}
                    {selectedRole === 'driver' && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="h-4 w-4 text-primary" />
                          <Label className="text-base font-semibold">Driver Information</Label>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicle-type">Vehicle Type *</Label>
                          <Input
                            id="vehicle-type"
                            name="vehicle-type"
                            type="text"
                            placeholder="Motorcycle, Car, or Van"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="license-plate">License Plate Number *</Label>
                          <Input
                            id="license-plate"
                            name="license-plate"
                            type="text"
                            placeholder="ABC-123"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="driver-license">Driver License Number *</Label>
                          <Input
                            id="driver-license"
                            name="driver-license"
                            type="text"
                            placeholder="DL-123456"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="insurance-expiry">Vehicle Insurance Expiry</Label>
                          <Input
                            id="insurance-expiry"
                            name="insurance-expiry"
                            type="date"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        name="signup-password"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" required />
                      <label
                        htmlFor="terms"
                        className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the terms and conditions
                      </label>
                    </div>
                    <Button
                      type="submit"
                      className="w-full shadow-lg hover:shadow-xl transition-shadow"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Mobile branding */}
          <div className="lg:hidden mt-8 flex justify-center">
            <Logo size="small" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
