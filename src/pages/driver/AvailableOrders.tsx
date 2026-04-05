import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DriverLayout from "@/components/driver/DriverLayout";
import DeliveryOrderCard from "@/components/driver/DeliveryOrderCard";
import { DriverService } from "@/services/driver.service";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeliveryOrder } from "@/types/driver.types";

const AvailableOrders = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const previousOrdersCountRef = useRef(0);
  const refreshIntervalRef = useRef<number | null>(null);

  const filteredOrders = availableOrders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = filterArea === "all" || 
      order.deliveryAddress.toLowerCase().includes(filterArea.toLowerCase());

    return matchesSearch && matchesArea;
  });

  // Real-time order request polling
  useEffect(() => {
    const checkForNewOrders = async () => {
      try {
        const currentOrders = await DriverService.getAvailableOrders();
        const currentCount = currentOrders.length;
        const previousCount = previousOrdersCountRef.current;

        if (currentCount > previousCount) {
          const newCount = currentCount - previousCount;
          setNewOrdersCount(newCount);
          toast.info(`New order${newCount > 1 ? 's' : ''} available!`, {
            description: `${newCount} new delivery request${newCount > 1 ? 's' : ''} just arrived.`,
            duration: 5000,
          });
          
          // Play notification sound if browser supports it
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Delivery Order', {
              body: `${newCount} new order${newCount > 1 ? 's' : ''} available`,
              icon: '/favicon.ico',
            });
          }
        }

        setAvailableOrders(currentOrders);
        previousOrdersCountRef.current = currentCount;
      } catch (error) {
        console.error("Failed to load available orders:", error);
        toast.error("Failed to load available orders");
      }
      setIsLoading(false);
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initial check
    void checkForNewOrders();

    // Poll for new orders every 10 seconds
    refreshIntervalRef.current = window.setInterval(() => {
      void checkForNewOrders();
    }, 10000);

    return () => {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const currentOrders = await DriverService.getAvailableOrders();
      setAvailableOrders(currentOrders);
      previousOrdersCountRef.current = currentOrders.length;
      setNewOrdersCount(0);
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Orders refreshed");
    } catch (error) {
      console.error("Failed to refresh available orders:", error);
      toast.error("Failed to refresh available orders");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await DriverService.acceptDelivery(orderId);
      toast.success("Order accepted! Starting delivery...");
      navigate("/driver/active");
    } catch (error: unknown) {
      console.error("Failed to accept delivery order:", error);
      toast.error("Failed to accept delivery order");
    }
  };

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Available Deliveries</h1>
            <p className="text-muted-foreground">Accept an order to start delivering</p>
          </div>
          <div className="flex items-center gap-2">
            {newOrdersCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                {newOrdersCount} New
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="beirut">Beirut</SelectItem>
              <SelectItem value="hamra">Hamra</SelectItem>
              <SelectItem value="achrafieh">Achrafieh</SelectItem>
              <SelectItem value="jounieh">Jounieh</SelectItem>
              <SelectItem value="verdun">Verdun</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading available orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              {availableOrders.length === 0 
                ? "No available orders at the moment. Check back soon!"
                : "No orders match your search criteria."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <DeliveryOrderCard
                key={order.id}
                order={order}
                showAcceptButton
                onAccept={handleAcceptOrder}
              />
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  );
};

export default AvailableOrders;
