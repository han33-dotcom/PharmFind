import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types";
import { Package, CheckCircle, Clock, Truck, MapPin, XCircle, LucideIcon } from "lucide-react";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; icon: LucideIcon; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  "Pending": { label: "Pending", icon: Clock, variant: "outline" },
  "Confirmed": { label: "Confirmed", icon: CheckCircle, variant: "secondary" },
  "Preparing": { label: "Preparing", icon: Package, variant: "secondary" },
  "Out for Delivery": { label: "Out for Delivery", icon: Truck, variant: "default" },
  "Delivered": { label: "Delivered", icon: MapPin, variant: "default" },
  "Cancelled": { label: "Cancelled", icon: XCircle, variant: "destructive" },
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
