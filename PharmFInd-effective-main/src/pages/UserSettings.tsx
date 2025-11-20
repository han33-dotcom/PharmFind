import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Settings, LogOut, Home, Edit, Trash2, Plus, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Logo from "@/components/Logo";
import { useAddresses, Address } from "@/contexts/AddressContext";

const settingsSchema = z.object({
  // Account Info
  fullName: z.string().default(""),
  email: z.string().email().default(""),
  phoneNumber: z.string().default(""),
  currentPassword: z.string().default(""),
  newPassword: z.string().default(""),
  confirmPassword: z.string().default(""),
  twoFactorAuth: z.boolean().default(false),
  
  // Notifications
  orderStatusUpdates: z.boolean().default(true),
  promotionalOffers: z.boolean().default(true),
  notificationMethod: z.string().default("All"),
  
  // Accessibility
  largeTextMode: z.boolean().default(false),
  highContrastMode: z.boolean().default(false),
  
  // Delivery Preferences
  defaultHomeDelivery: z.boolean().default(false),
  deliveryInstructions: z.string().default(""),
  preferredDeliveryTime: z.string().default("No preference"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultValues: SettingsFormValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  twoFactorAuth: false,
  orderStatusUpdates: true,
  promotionalOffers: true,
  notificationMethod: "All",
  largeTextMode: false,
  highContrastMode: false,
  defaultHomeDelivery: false,
  deliveryInstructions: "",
  preferredDeliveryTime: "No preference",
};

const UserSettings = () => {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  // Address management using context
  const { addresses, saveAddress, deleteAddress } = useAddresses();

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({
    nickname: "Home",
    fullName: "",
    address: "",
    building: "",
    floor: "",
    phoneNumber: "",
    additionalDetails: "",
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Address handler functions
  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setCurrentAddress(address);
    setIsAddingAddress(true);
  };

  const handleDeleteAddress = (id: string) => {
    deleteAddress(id);
    setDeleteAddressId(null);
  };

  const handleSaveAddress = () => {
    if (editingAddressId) {
      // Update existing address
      saveAddress({ ...currentAddress, id: editingAddressId } as Address);
    } else {
      // Add new address
      saveAddress(currentAddress as Omit<Address, "id">);
    }
    
    // Reset form
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setCurrentAddress({
      nickname: "Home",
      fullName: "",
      address: "",
      building: "",
      floor: "",
      phoneNumber: "",
      additionalDetails: "",
    });
  };

  const handleCancelEdit = () => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setCurrentAddress({
      nickname: "Home",
      fullName: "",
      address: "",
      building: "",
      floor: "",
      phoneNumber: "",
      additionalDetails: "",
    });
  };

  const handleLogout = () => {
    window.location.href = "/";
  };

  // Watch accessibility settings and apply visual changes
  const largeTextMode = form.watch("largeTextMode");
  const highContrastMode = form.watch("highContrastMode");

  useEffect(() => {
    if (largeTextMode) {
      document.documentElement.classList.add("large-text-mode");
    } else {
      document.documentElement.classList.remove("large-text-mode");
    }
  }, [largeTextMode]);

  useEffect(() => {
    if (highContrastMode) {
      document.documentElement.classList.add("high-contrast-mode");
    } else {
      document.documentElement.classList.remove("high-contrast-mode");
    }
  }, [highContrastMode]);

  // Reset address form when component mounts
  useEffect(() => {
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setCurrentAddress({
      nickname: "Home",
      fullName: "",
      address: "",
      building: "",
      floor: "",
      phoneNumber: "",
      additionalDetails: "",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard">
            <Logo size="small" />
          </Link>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <Form {...form}>
          <div className="space-y-6">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="account">Account Info</TabsTrigger>
                <TabsTrigger value="delivery">Delivery</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
              </TabsList>

              {/* Account Info Tab */}
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Manage your personal details and security settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormDescription>
                            This email is used for login and notifications
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormDescription>
                            For order updates and delivery notifications
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormLabel>Change Password</FormLabel>
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="password" placeholder="Enter current password" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="password" placeholder="Enter new password" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="password" placeholder="Confirm new password" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="twoFactorAuth"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Two-Factor Authentication (2FA)</FormLabel>
                            <FormDescription>
                              Add an extra layer of security to your account
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button variant="destructive">Delete Account</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Delivery Preferences Tab */}
              <TabsContent value="delivery">
                <Card>
                  <CardHeader>
                    <CardTitle>{isAddingAddress ? "Address" : "Delivery Addresses"}</CardTitle>
                    <CardDescription>
                      {isAddingAddress ? "Add or edit your delivery address" : "Manage your saved delivery addresses"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!isAddingAddress ? (
                      /* Address List View */
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {addresses.map((address) => (
                            <div
                              key={address.id}
                              className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <Home className="h-5 w-5 text-muted-foreground mt-1" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold">{address.nickname}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {address.building}, {address.floor}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary"
                                  onClick={() => handleEditAddress(address)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteAddressId(address.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button
                          className="w-full"
                          size="lg"
                          onClick={() => setIsAddingAddress(true)}
                        >
                          <Plus className="mr-2 h-5 w-5" />
                          Add new address
                        </Button>
                      </div>
                    ) : (
                      /* Address Form View */
                      <div className="space-y-6">
                        {/* Location Pin Placeholder */}
                        <div className="relative h-40 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          <MapPin className="h-12 w-12 text-primary" />
                          <span className="absolute top-2 right-2 text-sm text-primary font-medium">
                            Refine map
                          </span>
                        </div>

                        {/* Nickname Selection */}
                        <div className="space-y-2">
                          <label className="text-lg font-semibold">Choose a Nickname</label>
                          <div className="grid grid-cols-4 gap-2">
                            {(["Home", "Work", "Mom's", "Other"] as const).map((nickname) => (
                              <button
                                key={nickname}
                                type="button"
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                                  currentAddress.nickname === nickname
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => setCurrentAddress({ ...currentAddress, nickname })}
                              >
                                <Home className={currentAddress.nickname === nickname ? "text-primary" : "text-muted-foreground"} />
                                <span className={currentAddress.nickname === nickname ? "text-primary font-medium" : "text-muted-foreground"}>
                                  {nickname}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Address Details */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Give us the Details</h3>
                          
                          <Input
                            placeholder="Full Name"
                            value={currentAddress.fullName || ""}
                            onChange={(e) => setCurrentAddress({ ...currentAddress, fullName: e.target.value })}
                          />
                          
                          <Input
                            placeholder="Street Address"
                            value={currentAddress.address || ""}
                            onChange={(e) => setCurrentAddress({ ...currentAddress, address: e.target.value })}
                          />
                          
                          <Input
                            placeholder="Building/Apartment"
                            value={currentAddress.building || ""}
                            onChange={(e) => setCurrentAddress({ ...currentAddress, building: e.target.value })}
                          />
                          
                          <Input
                            placeholder="Floor/Unit"
                            value={currentAddress.floor || ""}
                            onChange={(e) => setCurrentAddress({ ...currentAddress, floor: e.target.value })}
                          />
                          
                          <Input
                            placeholder="Phone Number (e.g., LB +961 70256649)"
                            value={currentAddress.phoneNumber || ""}
                            onChange={(e) => setCurrentAddress({ ...currentAddress, phoneNumber: e.target.value })}
                          />
                          
                          <Textarea
                            placeholder="Additional Details (e.g., Building to the left of ogero)"
                            value={currentAddress.additionalDetails || ""}
                            onChange={(e) => setCurrentAddress({ ...currentAddress, additionalDetails: e.target.value })}
                            className="resize-none"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button className="flex-1" size="lg" onClick={handleSaveAddress}>
                            Confirm
                          </Button>
                          <Button variant="outline" size="lg" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={!!deleteAddressId} onOpenChange={() => setDeleteAddressId(null)}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Address</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this address? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAddressId && handleDeleteAddress(deleteAddressId)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Choose what notifications you want to receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="orderStatusUpdates"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Order status updates</FormLabel>
                            <FormDescription>
                              Receive notifications about your order status
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="promotionalOffers"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Promotional offers</FormLabel>
                            <FormDescription>
                              Get notified about special deals and discounts
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notificationMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select notification method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="Push">Push</SelectItem>
                              <SelectItem value="All">All</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose how you'd like to receive notifications
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accessibility Tab */}
              <TabsContent value="accessibility">
                <Card>
                  <CardHeader>
                    <CardTitle>Accessibility Settings</CardTitle>
                    <CardDescription>Customize the interface to your needs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="largeTextMode"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Large text mode</FormLabel>
                            <FormDescription>
                              Increase font size for better readability
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="highContrastMode"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">High contrast mode</FormLabel>
                            <FormDescription>
                              Enhance color contrast for better visibility
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </Form>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-primary hover:bg-primary/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserSettings;
