import { useEffect, useMemo, useState } from 'react';
import PharmacistLayout from '@/components/pharmacist/PharmacistLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Search, AlertCircle, Package, Loader2, Pencil, Save, Trash2, X } from 'lucide-react';
import { InventoryItem } from '@/types/pharmacist.types';
import { PharmacistOrdersService } from '@/services/pharmacist-orders.service';
import { MedicinesService } from '@/services/medicines.service';
import { Medicine } from '@/types';
import { toast } from 'sonner';

const sortInventory = (items: InventoryItem[]) =>
  [...items].sort((left, right) => left.medicineName.localeCompare(right.medicineName));

const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [catalog, setCatalog] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [itemPendingDelete, setItemPendingDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const [inventoryData, catalogData] = await Promise.all([
          PharmacistOrdersService.getInventory(),
          MedicinesService.getCatalog(),
        ]);
        setInventory(sortInventory(inventoryData));
        setCatalog(catalogData);
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
      const stockStatus = item.stockStatus;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'in-stock' && stockStatus === 'In Stock') ||
        (statusFilter === 'low-stock' && stockStatus === 'Low Stock') ||
        (statusFilter === 'out-of-stock' && stockStatus === 'Out of Stock');

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchQuery, categoryFilter, statusFilter]);

  const availableMedicinesToAdd = useMemo(() => {
    const stockedMedicineIds = new Set(
      inventory.map((item) => Number(item.medicineId ?? item.id))
    );

    return catalog.filter((medicine) => !stockedMedicineIds.has(medicine.id));
  }, [catalog, inventory]);

  const toggleStock = async (itemId: string) => {
    const item = inventory.find((entry) => entry.id === itemId);
    if (!item) return;

    try {
      const updated = await PharmacistOrdersService.updateInventoryAvailability(item, item.stockLevel === 0);
      setInventory((previous) =>
        sortInventory(previous.map((entry) => (entry.id === itemId ? updated : entry)))
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

  const handleAddInventoryItem = async () => {
    const medicineId = Number(selectedMedicineId);
    const price = Number(newPrice);
    const quantity = Number(newQuantity);

    if (!Number.isFinite(medicineId) || !Number.isFinite(price) || !Number.isFinite(quantity)) {
      toast.error('Select a medicine and enter valid price and quantity values');
      return;
    }

    setIsAdding(true);
    try {
      const createdItem = await PharmacistOrdersService.addInventoryItem({
        medicineId,
        price,
        quantity,
      });
      setInventory((previous) => sortInventory([...previous, createdItem]));
      setSelectedMedicineId('');
      setNewPrice('');
      setNewQuantity('');
      toast.success(`${createdItem.medicineName} added to inventory`);
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      toast.error('Failed to add inventory item');
    } finally {
      setIsAdding(false);
    }
  };

  const startEditing = (item: InventoryItem) => {
    setEditingMedicineId(item.id);
    setEditPrice(String(item.price));
    setEditQuantity(String(item.stockLevel));
  };

  const cancelEditing = () => {
    setEditingMedicineId(null);
    setEditPrice('');
    setEditQuantity('');
  };

  const handleSaveInventoryItem = async (item: InventoryItem) => {
    const price = Number(editPrice);
    const quantity = Number(editQuantity);

    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(quantity) || quantity < 0) {
      toast.error('Enter a valid non-negative price and quantity');
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedItem = await PharmacistOrdersService.updateInventoryItem(item.medicineId ?? item.id, {
        price,
        quantity,
      });
      setInventory((previous) =>
        sortInventory(previous.map((entry) => (entry.id === item.id ? updatedItem : entry)))
      );
      cancelEditing();
      toast.success(`${updatedItem.medicineName} updated`);
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      toast.error('Failed to update inventory item');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteInventoryItem = async () => {
    if (!itemPendingDelete) return;

    setIsDeleting(true);
    try {
      await PharmacistOrdersService.deleteInventoryItem(itemPendingDelete.medicineId ?? itemPendingDelete.id);
      setInventory((previous) =>
        previous.filter((entry) => entry.id !== itemPendingDelete.id)
      );
      if (editingMedicineId === itemPendingDelete.id) {
        cancelEditing();
      }
      toast.success(`${itemPendingDelete.medicineName} removed from inventory`);
      setItemPendingDelete(null);
    } catch (error) {
      console.error('Failed to remove inventory item:', error);
      toast.error('Failed to remove inventory item');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stockStatus === 'Out of Stock') return { label: 'Out of Stock', variant: 'destructive' as const };
    if (item.stockStatus === 'Low Stock') return { label: 'Low Stock', variant: 'outline' as const };
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

        <Card>
          <CardHeader>
            <CardTitle>Add Medicine</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <Select value={selectedMedicineId} onValueChange={setSelectedMedicineId}>
              <SelectTrigger className="md:col-span-2">
                <SelectValue placeholder="Select medicine" />
              </SelectTrigger>
              <SelectContent>
                {availableMedicinesToAdd.map((medicine) => (
                  <SelectItem key={medicine.id} value={String(medicine.id)}>
                    {medicine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={newPrice}
              onChange={(event) => setNewPrice(event.target.value)}
            />
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Quantity"
              value={newQuantity}
              onChange={(event) => setNewQuantity(event.target.value)}
            />
            <div className="md:col-span-4 flex justify-end">
              <Button
                type="button"
                onClick={() => void handleAddInventoryItem()}
                disabled={isAdding || availableMedicinesToAdd.length === 0}
              >
                {isAdding ? 'Adding...' : 'Add Medicine'}
              </Button>
            </div>
            {availableMedicinesToAdd.length === 0 && (
              <p className="md:col-span-4 text-sm text-muted-foreground">
                All medicines from the current catalog are already in this pharmacy inventory.
              </p>
            )}
          </CardContent>
        </Card>

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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by stock status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Statuses</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const isEditing = editingMedicineId === item.id;
                  return (
                    <TableRow key={item.id} data-testid={`inventory-item-${item.id}`}>
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
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={editQuantity}
                              onChange={(event) => setEditQuantity(event.target.value)}
                              data-testid={`inventory-quantity-input-${item.id}`}
                            />
                            <p className="text-xs text-muted-foreground">Minimum: {item.minStockLevel}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-medium">{item.stockLevel} units</p>
                            {item.stockLevel < item.minStockLevel && item.stockLevel > 0 && (
                              <p className="text-xs text-orange-500">
                                Min: {item.minStockLevel}
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editPrice}
                            onChange={(event) => setEditPrice(event.target.value)}
                            data-testid={`inventory-price-input-${item.id}`}
                          />
                        ) : (
                          item.price.toLocaleString()
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.stockLevel > 0}
                          onCheckedChange={() => toggleStock(item.id)}
                          disabled={isEditing || isSavingEdit || isDeleting}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => void handleSaveInventoryItem(item)}
                                disabled={isSavingEdit}
                                data-testid={`save-inventory-item-${item.id}`}
                              >
                                <Save className="h-4 w-4" />
                                <span className="sr-only">Save inventory item</span>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                disabled={isSavingEdit}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Cancel inventory edit</span>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(item)}
                                data-testid={`edit-inventory-item-${item.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit inventory item</span>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setItemPendingDelete(item)}
                                data-testid={`delete-inventory-item-${item.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete inventory item</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredInventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {inventory.length === 0
                        ? 'Your pharmacy has no inventory yet. Add your first medicine above.'
                        : 'No medicines found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={itemPendingDelete !== null} onOpenChange={(isOpen) => !isOpen && setItemPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove medicine from inventory?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemPendingDelete
                ? `${itemPendingDelete.medicineName} will be removed from this pharmacy inventory. You can add it again later from the catalog.`
                : 'This item will be removed from the pharmacy inventory.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteInventoryItem();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PharmacistLayout>
  );
};

export default InventoryManagement;
