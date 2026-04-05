import { useEffect, useMemo, useState } from 'react';
import PharmacistLayout from '@/components/pharmacist/PharmacistLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, AlertCircle, Package, Loader2 } from 'lucide-react';
import { InventoryItem } from '@/types/pharmacist.types';
import { PharmacistOrdersService } from '@/services/pharmacist-orders.service';
import { toast } from 'sonner';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setInventory(await PharmacistOrdersService.getInventory());
      } catch (error) {
        console.error('Failed to load inventory:', error);
        toast.error('Failed to load inventory');
      } finally {
        setIsLoading(false);
      }
    };

    void loadInventory();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(inventory.map(item => item.category));
    return ['all', ...Array.from(cats)];
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = 
        item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const toggleStock = async (itemId: string) => {
    const item = inventory.find((entry) => entry.id === itemId);
    if (!item) return;

    try {
      const updated = await PharmacistOrdersService.updateInventoryAvailability(item, item.stockLevel === 0);
      setInventory((previous) =>
        previous.map((entry) => (entry.id === itemId ? updated : entry))
      );
      toast.success(
        updated.stockLevel > 0
          ? `${updated.medicineName} is now available`
          : `${updated.medicineName} is now out of stock`
      );
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      toast.error('Failed to update inventory item');
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stockLevel === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (item.stockLevel < item.minStockLevel) return { label: 'Low Stock', variant: 'outline' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const lowStockCount = inventory.filter(item => 
    item.stockLevel > 0 && item.stockLevel < item.minStockLevel
  ).length;

  const outOfStockCount = inventory.filter(item => item.stockLevel === 0).length;

  if (isLoading) {
    return (
      <PharmacistLayout>
        <div className="container py-8 px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PharmacistLayout>
    );
  }

  return (
    <PharmacistLayout>
      <div className="container py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{outOfStockCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Price (LBP)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.medicineName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.scientificName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{item.stockLevel} units</p>
                          {item.stockLevel < item.minStockLevel && item.stockLevel > 0 && (
                            <p className="text-xs text-orange-500">
                              Min: {item.minStockLevel}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.stockLevel > 0}
                          onCheckedChange={() => toggleStock(item.id)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredInventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No medicines found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PharmacistLayout>
  );
};

export default InventoryManagement;
