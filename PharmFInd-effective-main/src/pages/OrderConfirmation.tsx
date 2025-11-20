import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, MapPin, Phone, Clock, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/Logo";
import { toast } from "@/hooks/use-toast";

const pharmacyDetails: Record<string, any> = {
  "1": { id: 1, name: "Habib Pharmacy", address: "Hamra Street, Beirut", phone: "+961 1 340555" },
  "2": { id: 2, name: "Wardieh Pharmacy", address: "Achrafieh, Beirut", phone: "+961 1 200300" },
  "3": { id: 3, name: "Raouche Pharmacy", address: "Raouche, Beirut", phone: "+961 1 789456" },
  "4": { id: 4, name: "Verdun Pharmacy", address: "Verdun Street, Beirut", phone: "+961 1 456789" },
  "5": { id: 5, name: "Mazraa Pharmacy", address: "Mazraa, Beirut", phone: "+961 1 654321" },
  "6": { id: 6, name: "Clemenceau Pharmacy", address: "Clemenceau Street, Beirut", phone: "+961 1 987654" },
};

const timeSlotLabels: Record<string, string> = {
  morning: "Morning (9 AM - 12 PM)",
  afternoon: "Afternoon (12 PM - 5 PM)",
  evening: "Evening (5 PM - 9 PM)",
};

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    // Load order data from localStorage
    const savedOrder = localStorage.getItem('current_order');
    if (savedOrder) {
      const data = JSON.parse(savedOrder);
      setOrderData(data);
      // Clear the order data after loading
      localStorage.removeItem('current_order');
    } else {
      // If no order data, redirect to dashboard
      navigate("/dashboard");
    }
  }, [navigate]);

  if (!orderData) {
    return null;
  }

  const handleTrackOrder = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Logo />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground text-lg">
            Order #{orderId}
          </p>
        </div>

        {/* Order Details by Pharmacy */}
        <div className="space-y-6 mb-8">
          {Object.entries(orderData.itemsByPharmacy).map(([pharmacyId, items]: [string, any]) => {
            const pharmacy = pharmacyDetails[pharmacyId];
            const hasDelivery = items.some((item: any) => item.type === 'delivery');
            const hasReservation = items.some((item: any) => item.type === 'reservation');

            return (
              <Card key={pharmacyId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{pharmacy.name}</CardTitle>
                    <Badge variant={hasDelivery ? 'default' : 'secondary'}>
                      {hasDelivery ? 'Delivery' : 'Pickup'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items List */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Items Ordered:</h4>
                    {items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-muted-foreground" />
                          <span>{item.medicineName} × {item.quantity}</span>
                        </div>
                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Delivery Info */}
                  {hasDelivery && orderData.deliveryForm && (
                    <div className="space-y-2 text-sm">
                      <h4 className="font-semibold">Delivery Address:</h4>
                      <p className="text-muted-foreground">
                        {orderData.deliveryForm.fullName}<br />
                        {orderData.deliveryForm.address}
                        {orderData.deliveryForm.building && `, ${orderData.deliveryForm.building}`}
                        {orderData.deliveryForm.floor && `, Floor ${orderData.deliveryForm.floor}`}
                      </p>
                      <p className="text-muted-foreground">
                        Phone: {orderData.deliveryForm.phone}
                      </p>
                      <p className="text-green-600 dark:text-green-500 font-semibold mt-2 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Estimated delivery: 30-60 minutes
                      </p>
                    </div>
                  )}

                  {/* Pickup Info */}
                  {hasReservation && orderData.reservationForm && (
                    <div className="space-y-2 text-sm">
                      <h4 className="font-semibold">Pickup Information:</h4>
                      <p className="text-muted-foreground">
                        {orderData.reservationForm.fullName}<br />
                        Phone: {orderData.reservationForm.phone}
                      </p>
                      <div className="space-y-1">
                        <p className="font-medium">Pickup Location:</p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {pharmacy.address}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {pharmacy.phone}
                        </p>
                      </div>
                      <p className="text-green-600 dark:text-green-500 font-semibold mt-2 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Pickup time: {timeSlotLabels[orderData.pickupTimes[pharmacyId]] || "As selected"}
                      </p>
                      <p className="text-amber-600 dark:text-amber-500 text-xs mt-1">
                        Please pick up within 24 hours
                      </p>
                    </div>
                  )}

                  {/* Contact Pharmacy Button */}
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${pharmacy.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call {pharmacy.name}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Total */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${orderData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery fees:</span>
              <span>${orderData.deliveryFees.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${orderData.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={() => navigate("/dashboard")} className="w-full">
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={handleTrackOrder} className="w-full">
            Track Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
