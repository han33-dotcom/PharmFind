import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, FileText, Phone, MapPin } from 'lucide-react';
import PharmacistLayout from '@/components/pharmacist/PharmacistLayout';
import { mockPharmacistOrders } from '@/data/mock/pharmacist.mock';
import { PharmacistOrder } from '@/types/pharmacist.types';

const OrdersQueue = () => {
  const [orders] = useState<PharmacistOrder[]>(mockPharmacistOrders);

  const filterOrdersByStatus = (status: PharmacistOrder['status'][]) => {
    return orders.filter(o => status.includes(o.status));
  };

  const getStatusColor = (status: PharmacistOrder['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      reviewing: 'bg-blue-100 text-blue-800 border-blue-300',
      accepted: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      preparing: 'bg-purple-100 text-purple-800 border-purple-300',
      ready: 'bg-teal-100 text-teal-800 border-teal-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status];
  };

  const OrderCard = ({ order }: { order: PharmacistOrder }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{order.patientName}</span>
            <span className="text-muted-foreground">• {order.patientPhone}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">{order.deliveryAddress}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Items ({order.items.length})</p>
          <div className="space-y-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.medicineName} x{item.quantity}
                  {item.requiresPrescription && (
                    <FileText className="inline h-3 w-3 ml-1 text-primary" />
                  )}
                </span>
                <span className="font-medium">{item.price.toLocaleString()} LBP</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t">
            <span>Total</span>
            <span>{order.totalAmount.toLocaleString()} LBP</span>
          </div>
        </div>

        {order.prescriptionRequired && (
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded border border-primary/20">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Prescription Required</span>
          </div>
        )}

        {order.notes && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <span className="font-medium">Notes:</span> {order.notes}
          </div>
        )}

        <Link to={`/pharmacist/orders/${order.id}`}>
          <Button className="w-full">
            Review Order
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <PharmacistLayout>
      <div className="container py-8 px-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage incoming orders
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({filterOrdersByStatus(['pending']).length})
            </TabsTrigger>
            <TabsTrigger value="reviewing">
              Reviewing ({filterOrdersByStatus(['reviewing']).length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({filterOrdersByStatus(['accepted', 'preparing', 'ready']).length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterOrdersByStatus(['completed', 'rejected']).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {filterOrdersByStatus(['pending']).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending orders
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterOrdersByStatus(['pending']).map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewing" className="space-y-4">
            {filterOrdersByStatus(['reviewing']).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No orders under review
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterOrdersByStatus(['reviewing']).map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {filterOrdersByStatus(['accepted', 'preparing', 'ready']).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No active orders
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterOrdersByStatus(['accepted', 'preparing', 'ready']).map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterOrdersByStatus(['completed', 'rejected']).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No completed orders
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterOrdersByStatus(['completed', 'rejected']).map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PharmacistLayout>
  );
};

export default OrdersQueue;
