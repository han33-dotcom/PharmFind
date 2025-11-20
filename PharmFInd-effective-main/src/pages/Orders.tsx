import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { CartIcon } from "@/components/CartIcon";
import { useOrders } from "@/contexts/OrdersContext";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { format } from "date-fns";

const Orders = () => {
  const navigate = useNavigate();
  const { orders, markOrderAsRead } = useOrders();

  const handleOrderClick = (orderId: string) => {
    markOrderAsRead(orderId);
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
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
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-4">Start shopping to place your first order!</p>
              <Button onClick={() => navigate("/dashboard")}>Browse Pharmacies</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              
              return (
                <Card
                  key={order.orderId}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOrderClick(order.orderId)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{order.orderId}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.createdAt), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                        <span className="mx-2">•</span>
                        <span className="font-semibold">${order.total.toFixed(2)}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
