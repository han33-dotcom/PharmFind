import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Clock, MapPin, Phone, Pill, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/Logo";
import { useOrders } from "@/contexts/OrdersContext";
import { usePharmacyDetails } from "@/hooks/usePharmacyDetails";
import {
  formatCurrency,
  formatDateTime,
  formatItemCount,
  formatPaymentMethod,
} from "@/lib/formatters";

const timeSlotLabels: Record<string, string> = {
  morning: "Morning (9 AM - 12 PM)",
  afternoon: "Afternoon (12 PM - 5 PM)",
  evening: "Evening (5 PM - 9 PM)",
};

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { getOrder, isLoading, errorMessage, refreshOrders } = useOrders();
  const orderData = orderId ? getOrder(orderId) : undefined;
  const { pharmacyDetails, isLoading: isLoadingPharmacies } = usePharmacyDetails(
    orderData ? Object.keys(orderData.itemsByPharmacy).map((pharmacyId) => Number(pharmacyId)) : [],
  );

  useEffect(() => {
    if (!orderId) {
      navigate("/dashboard");
      return;
    }

    if (!orderData) {
      void refreshOrders();
    }
  }, [navigate, orderData, orderId, refreshOrders]);

  if (!orderData && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading your order...</p>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{errorMessage ?? "We could not load that order."}</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => void refreshOrders()}>
              Try Again
            </Button>
            <Button onClick={() => navigate("/orders")}>Go to My Orders</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleTrackOrder = () => {
    navigate(`/orders/${orderData.orderId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Logo />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order placed successfully</h1>
          <p className="text-muted-foreground text-lg">{orderData.orderNumber || orderData.orderId}</p>
          <p className="text-sm text-muted-foreground mt-2">{formatDateTime(orderData.createdAt)}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-5 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Items</p>
              <p className="font-semibold">
                {formatItemCount(orderData.items.reduce((sum, item) => sum + item.quantity, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Payment</p>
              <p className="font-semibold">{formatPaymentMethod(orderData.paymentMethod)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="font-semibold">{formatCurrency(orderData.total)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 mb-8">
          {Object.entries(orderData.itemsByPharmacy).map(([pharmacyId, items]) => {
            const pharmacy = pharmacyDetails[Number(pharmacyId)] ?? {
              id: Number(pharmacyId),
              name: items[0]?.pharmacyName || `Pharmacy ${pharmacyId}`,
              address: isLoadingPharmacies ? "Loading pharmacy address..." : "Address unavailable",
              phone: isLoadingPharmacies ? "Loading pharmacy phone..." : "Phone unavailable",
            };
            const hasDelivery = items.some((item) => item.type === "delivery");
            const hasReservation = items.some((item) => item.type === "reservation");

            return (
              <Card key={pharmacyId}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>{pharmacy.name}</CardTitle>
                    <Badge variant={hasDelivery ? "default" : "secondary"}>
                      {hasDelivery ? "Delivery" : "Pickup"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Items ordered</h4>
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <Pill className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">
                            {item.medicineName} x {item.quantity}
                          </span>
                        </div>
                        <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {hasDelivery && orderData.deliveryForm ? (
                    <div className="space-y-2 text-sm">
                      <h4 className="font-semibold">Delivery address</h4>
                      <p className="text-muted-foreground">
                        {orderData.deliveryForm.fullName}
                        <br />
                        {orderData.deliveryForm.address}
                        {orderData.deliveryForm.building && `, ${orderData.deliveryForm.building}`}
                        {orderData.deliveryForm.floor && `, Floor ${orderData.deliveryForm.floor}`}
                      </p>
                      <p className="text-muted-foreground">Phone: {orderData.deliveryForm.phone}</p>
                      <p className="text-green-600 dark:text-green-500 font-semibold mt-2 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Estimated delivery: 30 to 60 minutes
                      </p>
                    </div>
                  ) : null}

                  {hasReservation && orderData.reservationForm ? (
                    <div className="space-y-2 text-sm">
                      <h4 className="font-semibold">Pickup information</h4>
                      <p className="text-muted-foreground">
                        {orderData.reservationForm.fullName}
                        <br />
                        Phone: {orderData.reservationForm.phone}
                      </p>
                      <div className="space-y-1">
                        <p className="font-medium">Pickup location</p>
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
                    </div>
                  ) : null}

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

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Order summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(orderData.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery fees</span>
              <span>{formatCurrency(orderData.deliveryFees)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(orderData.total)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Payment: {formatPaymentMethod(orderData.paymentMethod)}
            </p>
          </CardContent>
        </Card>

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
