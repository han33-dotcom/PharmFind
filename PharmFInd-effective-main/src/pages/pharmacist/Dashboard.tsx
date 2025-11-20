import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ClipboardList, AlertCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import PharmacistLayout from '@/components/pharmacist/PharmacistLayout';
import { mockPharmacistOrders, mockInventory } from '@/data/mock/pharmacist.mock';

const Dashboard = () => {
  const pendingOrders = mockPharmacistOrders.filter(o => o.status === 'pending').length;
  const lowStockItems = mockInventory.filter(i => i.stockLevel <= i.minStockLevel).length;
  const todayRevenue = mockPharmacistOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <PharmacistLayout>
      <div className="container py-8 px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacist Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your orders, inventory, and pharmacy profile
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires immediate attention
              </p>
              <Link to="/pharmacist/orders">
                <Button size="sm" className="w-full mt-3">
                  View Orders
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowStockItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Items below minimum level
              </p>
              <Link to="/pharmacist/inventory">
                <Button size="sm" variant="outline" className="w-full mt-3">
                  Check Inventory
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockInventory.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                In your inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayRevenue.toLocaleString()} LBP
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From completed orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPharmacistOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.patientName} • {order.items.length} items
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">{order.totalAmount.toLocaleString()} LBP</p>
                      <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                    </div>
                    <Link to={`/pharmacist/orders/${order.id}`}>
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/pharmacist/orders">
              <Button variant="outline" className="w-full mt-4">
                View All Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PharmacistLayout>
  );
};

export default Dashboard;
