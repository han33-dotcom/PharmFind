import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrders, OrderStatus } from "@/contexts/OrdersContext";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

interface MockOrderControlsProps {
  orderId: string;
}

export const MockOrderControls = ({ orderId }: MockOrderControlsProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { getOrder, updateOrderStatus } = useOrders();
  const order = getOrder(orderId);

  if (!order) return null;

  const statuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
  ];

  const handleStatusChange = (newStatus: string) => {
    updateOrderStatus(orderId, newStatus as OrderStatus);
  };

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2"
      >
        <Settings className="h-4 w-4 mr-2" />
        Dev Controls
      </Button>

      {isVisible && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge variant="outline">Demo Mode</Badge>
              Mock Order Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Update Order Status:</label>
              <Select value={order.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              This control panel is for demo purposes and can be easily removed in production.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
