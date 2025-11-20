import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/contexts/OrdersContext";
import { Package, CheckCircle, Clock, Truck, MapPin } from "lucide-react";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; icon: any; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", icon: Clock, variant: "outline" },
  confirmed: { label: "Confirmed", icon: CheckCircle, variant: "secondary" },
  preparing: { label: "Preparing", icon: Package, variant: "secondary" },
  ready: { label: "Ready", icon: CheckCircle, variant: "default" },
  out_for_delivery: { label: "Out for Delivery", icon: Truck, variant: "default" },
  delivered: { label: "Delivered", icon: MapPin, variant: "default" },
  completed: { label: "Completed", icon: CheckCircle, variant: "default" },
};

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
