import { DeliveryOrder } from "@/types/driver.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Phone, DollarSign, Clock } from "lucide-react";

interface DeliveryOrderCardProps {
  order: DeliveryOrder;
  onAccept?: (orderId: string) => void;
  onViewDetails?: (orderId: string) => void;
  showAcceptButton?: boolean;
}

const DeliveryOrderCard = ({ 
  order, 
  onAccept, 
  onViewDetails,
  showAcceptButton = false 
}: DeliveryOrderCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-secondary text-secondary-foreground';
      case 'assigned':
        return 'bg-primary text-primary-foreground';
      case 'picked_up':
        return 'bg-accent text-accent-foreground';
      case 'in_transit':
        return 'bg-primary text-primary-foreground';
      case 'delivered':
        return 'bg-secondary text-secondary-foreground';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{order.customerName}</CardTitle>
            <p className="text-sm text-muted-foreground">Order #{order.orderId}</p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">{order.deliveryAddress}</p>
            <p className="text-muted-foreground">{order.pharmacyName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {order.items.length} item{order.items.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {order.deliveryFee.toLocaleString()} LBP delivery fee
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{order.customerPhone}</span>
        </div>

        {order.estimatedDeliveryTime && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Est. {order.estimatedDeliveryTime}
            </span>
          </div>
        )}

        {order.specialInstructions && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Special Instructions:</p>
            <p className="text-sm text-foreground">{order.specialInstructions}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {showAcceptButton && onAccept && (
            <Button 
              onClick={() => onAccept(order.id)} 
              className="flex-1"
            >
              Accept Order
            </Button>
          )}
          {onViewDetails && (
            <Button 
              variant="outline" 
              onClick={() => onViewDetails(order.id)}
              className="flex-1"
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryOrderCard;
