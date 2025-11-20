import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Pill, CheckCircle, Clock, ShoppingCart, Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/Logo";
import { CartIcon } from "@/components/CartIcon";
import { useOrders, OrderStatus } from "@/contexts/OrdersContext";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { format } from "date-fns";
import { MockOrderControls } from "@/components/MockOrderControls";
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

const statusTimeline: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready'];
const deliveryStatuses: OrderStatus[] = ['out_for_delivery', 'delivered'];

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrder, markOrderAsRead } = useOrders();
  const { addToCart } = useCart();
  const { addFavorite, isFavorite } = useFavorites();

  const order = orderId ? getOrder(orderId) : undefined;

  useEffect(() => {
    if (!order) {
      navigate("/orders");
    } else if (orderId) {
      markOrderAsRead(orderId);
    }
  }, [order, navigate, orderId, markOrderAsRead]);

  if (!order) {
    return null;
  }

  const hasDelivery = order.items.some((item) => item.type === 'delivery');
  const timeline = hasDelivery ? [...statusTimeline, ...deliveryStatuses] : statusTimeline;
  const currentStatusIndex = timeline.indexOf(order.status);

  const handleReorderAll = () => {
    let itemCount = 0;
    order.items.forEach((item) => {
      addToCart(
        {
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          category: item.category,
          pharmacyId: item.pharmacyId,
          pharmacyName: item.pharmacyName,
          price: item.price,
          quantity: item.quantity,
          type: item.type,
          stockStatus: "In Stock",
        },
        item.quantity
      );
      itemCount += item.quantity;
    });

    toast({
      title: "Items Added to Cart",
      description: `${itemCount} items from order ${order.orderId} added to cart`,
    });

    navigate("/cart");
  };

  const handleReorderItem = (item: any) => {
    addToCart(
      {
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        category: item.category,
        pharmacyId: item.pharmacyId,
        pharmacyName: item.pharmacyName,
        price: item.price,
        quantity: item.quantity,
        type: item.type,
        stockStatus: "In Stock",
      },
      item.quantity
    );

    toast({
      title: "Added to Cart",
      description: `${item.medicineName} has been added to your cart`,
    });
  };

  const handleAddToFavorites = (item: any) => {
    addFavorite({
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      category: item.category,
      lastPharmacyId: item.pharmacyId,
      lastPharmacyName: item.pharmacyName,
      lastPrice: item.price,
    });

    toast({
      title: "Added to Favorites",
      description: `${item.medicineName} has been added to your favorites`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
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

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Order Tracking</h1>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{order.orderId}</span>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Mock Controls - Hidden in production */}
        <MockOrderControls orderId={order.orderId} />

        {/* Quick Reorder Section */}
        <Card className="border-primary/20 bg-primary/5 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Reorder this order</h3>
                <p className="text-sm text-muted-foreground">
                  Add all items to cart with same quantities
                </p>
              </div>
              <Button onClick={handleReorderAll}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Order Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((status, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const statusHistory = order.statusHistory.find((h) => h.status === status);

                return (
                  <div key={status} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-12 ${
                            isCompleted && !isCurrent ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                        <OrderStatusBadge status={status} />
                      </div>
                      {statusHistory && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(statusHistory.timestamp), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        {Object.entries(order.itemsByPharmacy).map(([pharmacyId, items]) => {
          const pharmacy = pharmacyDetails[pharmacyId];
          const isDelivery = items.some((item) => item.type === 'delivery');

          return (
            <Card key={pharmacyId} className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{pharmacy.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {pharmacy.address}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {pharmacy.phone}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <Pill className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.medicineName}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} • ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorderItem(item)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddToFavorites(item)}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              isFavorite(item.medicineId) ? "fill-primary text-primary" : ""
                            }`}
                          />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Delivery/Pickup Info */}
                {isDelivery && order.deliveryForm ? (
                  <div>
                    <h4 className="font-semibold mb-2">Delivery Address</h4>
                    <p className="text-sm">{order.deliveryForm.fullName}</p>
                    <p className="text-sm text-muted-foreground">{order.deliveryForm.address}</p>
                    {order.deliveryForm.building && (
                      <p className="text-sm text-muted-foreground">{order.deliveryForm.building}</p>
                    )}
                    {order.deliveryForm.floor && (
                      <p className="text-sm text-muted-foreground">Floor: {order.deliveryForm.floor}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{order.deliveryForm.phone}</p>
                  </div>
                ) : order.reservationForm ? (
                  <div>
                    <h4 className="font-semibold mb-2">Pickup Information</h4>
                    <p className="text-sm">{order.reservationForm.fullName}</p>
                    <p className="text-sm text-muted-foreground">{order.reservationForm.phone}</p>
                    {order.pickupTimes[Number(pharmacyId)] && (
                      <p className="text-sm text-muted-foreground">
                        {timeSlotLabels[order.pickupTimes[Number(pharmacyId)]]}
                      </p>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.deliveryFees > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>${order.deliveryFees.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Payment: {order.paymentMethod.replace('_', ' ')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderTracking;
