import { useState } from "react";
import DriverLayout from "@/components/driver/DriverLayout";
import { DriverService } from "@/services/driver.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, TrendingUp } from "lucide-react";

const DeliveryHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  
  const allHistory = DriverService.getDeliveryHistory();

  const filteredHistory = allHistory.filter(delivery => {
    const matchesSearch = 
      delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterPeriod === "all") return matchesSearch;

    const deliveryDate = delivery.deliveredAt ? new Date(delivery.deliveredAt) : new Date();
    const now = new Date();
    
    switch (filterPeriod) {
      case "today":
        return matchesSearch && deliveryDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return matchesSearch && deliveryDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return matchesSearch && deliveryDate >= monthAgo;
      default:
        return matchesSearch;
    }
  });

  const totalDeliveries = filteredHistory.length;
  const totalEarnings = filteredHistory.reduce((sum, d) => sum + d.deliveryFee, 0);
  const successRate = totalDeliveries > 0 
    ? ((filteredHistory.filter(d => d.status === 'delivered').length / totalDeliveries) * 100).toFixed(1)
    : '0.0';

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Delivery History</h1>
          <p className="text-muted-foreground">View your past deliveries</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Deliveries
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalDeliveries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalEarnings.toLocaleString()} LBP
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{successRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by order ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Records</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No deliveries found for the selected criteria.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell>
                          {delivery.deliveredAt 
                            ? new Date(delivery.deliveredAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-medium">{delivery.orderId}</TableCell>
                        <TableCell>{delivery.customerName}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {delivery.deliveryAddress}
                        </TableCell>
                        <TableCell>{delivery.items.length}</TableCell>
                        <TableCell>{delivery.totalAmount.toLocaleString()} LBP</TableCell>
                        <TableCell className="font-medium text-secondary">
                          {delivery.deliveryFee.toLocaleString()} LBP
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={delivery.status === 'delivered' ? 'default' : 'destructive'}
                          >
                            {delivery.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
};

export default DeliveryHistory;
