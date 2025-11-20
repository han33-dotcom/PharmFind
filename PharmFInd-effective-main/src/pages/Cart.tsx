import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, MapPin, Phone, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Pill } from "lucide-react";
import Logo from "@/components/Logo";
import { CartIcon } from "@/components/CartIcon";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

// Import pharmacy details from PharmacyStore
const pharmacyDetails: Record<string, any> = {
  "1": { id: 1, name: "Habib Pharmacy", address: "Hamra Street, Beirut", phone: "+961 1 340555" },
  "2": { id: 2, name: "Wardieh Pharmacy", address: "Achrafieh, Beirut", phone: "+961 1 200300" },
  "3": { id: 3, name: "Raouche Pharmacy", address: "Raouche, Beirut", phone: "+961 1 789456" },
  "4": { id: 4, name: "Verdun Pharmacy", address: "Verdun Street, Beirut", phone: "+961 1 456789" },
  "5": { id: 5, name: "Mazraa Pharmacy", address: "Mazraa, Beirut", phone: "+961 1 654321" },
  "6": { id: 6, name: "Clemenceau Pharmacy", address: "Clemenceau Street, Beirut", phone: "+961 1 987654" },
};

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, getItemsByPharmacy } = useCart();
  const itemsByPharmacy = getItemsByPharmacy();

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryPharmacies = new Set(
    cartItems.filter((item) => item.type === 'delivery').map((item) => item.pharmacyId)
  );
  const deliveryFees = deliveryPharmacies.size * 1;
  const total = subtotal + deliveryFees;

  const handleClearCart = () => {
    clearCart();
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
    });
  };

  const handleRemoveItem = (itemId: string, medicineName: string) => {
    removeFromCart(itemId);
    toast({
      title: "Item removed",
      description: `${medicineName} has been removed from your cart.`,
    });
  };

  const handleUpdateQuantity = (itemId: string, change: number, currentQuantity: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Logo />
              </div>
              <Button variant="ghost" onClick={() => navigate("/user-settings")}>
                Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <ShoppingCart className="h-24 w-24 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add medicines to get started</p>
          <Button onClick={() => navigate("/dashboard")} size="lg">
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Logo />
            </div>
            <div className="flex items-center gap-2">
              <CartIcon />
              <Button variant="ghost" onClick={() => navigate("/user-settings")}>
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Your Cart</h1>
          <p className="text-muted-foreground">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {Object.entries(itemsByPharmacy).map(([pharmacyId, items]) => {
              const pharmacy = pharmacyDetails[pharmacyId];
              const hasDelivery = items.some((item) => item.type === 'delivery');
              const hasReservation = items.some((item) => item.type === 'reservation');
              const pharmacySubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

              return (
                <Collapsible key={pharmacyId} defaultOpen>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">{pharmacy.name}</CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {pharmacy.address}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {hasDelivery && (
                              <Badge variant="default" className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                Delivery
                              </Badge>
                            )}
                            {hasReservation && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Pickup
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 py-3 border-b last:border-0">
                            {/* Medicine Icon */}
                            <div className="bg-primary/10 p-3 rounded-lg">
                              <Pill className="h-6 w-6 text-primary" />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold">{item.medicineName}</h4>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                              <Badge
                                variant={item.type === 'delivery' ? 'default' : 'secondary'}
                                className="mt-1"
                              >
                                {item.type === 'delivery' ? 'Delivery' : 'Pickup'}
                              </Badge>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(item.id, -1, item.quantity)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleUpdateQuantity(item.id, 1, item.quantity)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Price & Remove */}
                            <div className="text-right">
                              <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">${item.price} each</p>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id, item.medicineName)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}

                        {/* Pharmacy Subtotal */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span className="font-semibold">${pharmacySubtotal.toFixed(2)}</span>
                          </div>
                          {hasDelivery && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Delivery fee:</span>
                              <span>$1.00</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartItems.length} items):</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery fees ({deliveryPharmacies.size} {deliveryPharmacies.size === 1 ? 'pharmacy' : 'pharmacies'}):</span>
                    <span>${deliveryFees.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={() => navigate("/checkout")}>
                  Proceed to Checkout
                </Button>

                <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
                  Continue Shopping
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                      Clear Cart
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all items from your cart. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearCart}>Clear Cart</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
