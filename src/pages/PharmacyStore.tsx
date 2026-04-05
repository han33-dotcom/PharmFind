import { ReactNode, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, Heart, MapPin, Minus, Package, Phone, Pill, Plus, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CartIcon } from "@/components/CartIcon";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import Logo from "@/components/Logo";
import { MedicinesService } from "@/services/medicines.service";
import { PharmaciesService } from "@/services/pharmacies.service";
import { Pharmacy, PharmacyMedicine } from "@/types";

const PharmacyStore = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightedSearch = searchParams.get("search") || "";
  const { addToCart } = useCart();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const highlightRef = useRef<HTMLDivElement>(null);

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [medicines, setMedicines] = useState<PharmacyMedicine[]>([]);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<PharmacyMedicine | null>(null);
  const [orderType, setOrderType] = useState<"delivery" | "reservation">("delivery");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const pharmacyId = Number(id);
    if (!pharmacyId) {
      setLoadError("Pharmacy not found.");
      setIsLoading(false);
      return;
    }

    const loadPharmacy = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [pharmacyResponse, medicinesResponse] = await Promise.all([
          PharmaciesService.getPharmacyById(pharmacyId),
          MedicinesService.getMedicinesByPharmacy(pharmacyId),
        ]);

        if (!pharmacyResponse) {
          setLoadError("Pharmacy not found.");
          return;
        }

        setPharmacy(pharmacyResponse);
        setMedicines(medicinesResponse);
      } catch (error) {
        console.error("Failed to fetch pharmacy data:", error);
        setLoadError("Failed to load pharmacy details.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPharmacy();
  }, [id]);

  useEffect(() => {
    if (highlightedSearch && highlightRef.current) {
      const timeoutId = window.setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);

      return () => window.clearTimeout(timeoutId);
    }
  }, [highlightedSearch, medicines]);

  const filteredMedicines = medicines.filter((medicine) => {
    const normalizedSearch = medicineSearch.toLowerCase();
    return (
      medicine.name.toLowerCase().includes(normalizedSearch) ||
      medicine.category.toLowerCase().includes(normalizedSearch)
    );
  });

  const handleCall = () => {
    if (pharmacy?.phone) {
      window.location.href = `tel:${pharmacy.phone}`;
    }
  };

  const handleDirections = () => {
    if (!pharmacy) {
      return;
    }

    const destination = pharmacy.latitude && pharmacy.longitude
      ? `${pharmacy.latitude},${pharmacy.longitude}`
      : pharmacy.address;

    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`, "_blank");
  };

  const handleOpenDialog = (medicine: PharmacyMedicine) => {
    setSelectedMedicine(medicine);
    setOrderType("delivery");
    setQuantity(1);
    setDialogOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedMedicine || !pharmacy) {
      return;
    }

    addToCart(
      {
        medicineId: selectedMedicine.id,
        medicineName: selectedMedicine.name,
        category: selectedMedicine.category,
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        price: Number(selectedMedicine.price),
        quantity,
        type: orderType,
        stockStatus: selectedMedicine.stockStatus,
      },
      quantity,
    );

    toast({
      title: "Added to Cart",
      description: `${selectedMedicine.name} has been added to your cart for ${orderType}.`,
    });

    setDialogOpen(false);
  };

  const toggleFavorite = async (medicine: PharmacyMedicine) => {
    if (!pharmacy) {
      return;
    }

    try {
      if (isFavorite(medicine.id)) {
        await removeFavorite(medicine.id);
        toast({
          title: "Removed from Favorites",
          description: `${medicine.name} has been removed from your favorites.`,
        });
        return;
      }

      await addFavorite({
        medicineId: medicine.id,
        medicineName: medicine.name,
        category: medicine.category,
        lastPharmacyId: pharmacy.id,
        lastPharmacyName: pharmacy.name,
        lastPrice: Number(medicine.price),
      });
      toast({
        title: "Added to Favorites",
        description: `${medicine.name} has been added to your favorites.`,
      });
    } catch (error) {
      toast({
        title: "Favorite Update Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <CenteredState message="Loading pharmacy..." />;
  }

  if (loadError || !pharmacy) {
    return (
      <CenteredState message={loadError || "Pharmacy not found"}>
        <Button onClick={() => navigate("/dashboard")} className="w-full mt-4">
          Return to Dashboard
        </Button>
      </CenteredState>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{pharmacy.name}</h1>
                <Badge variant={pharmacy.isOpen ? "default" : "secondary"}>
                  {pharmacy.isOpen ? "Open" : "Closed"}
                </Badge>
                {pharmacy.verified && <Badge variant="outline">Verified</Badge>}
              </div>
            </div>
            <CartIcon />
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{pharmacy.address}</span>
              {pharmacy.distance && (
                <Badge variant="outline" className="ml-2">
                  {pharmacy.distance}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>{pharmacy.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{formatHours(pharmacy)}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            <Button onClick={handleCall} className="flex-1 min-w-[140px]">
              <Phone className="h-4 w-4 mr-2" />
              Call Pharmacy
            </Button>
            <Button onClick={handleDirections} variant="outline" className="flex-1 min-w-[140px]">
              <MapPin className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <InfoCard title="Delivery Fee" value={formatCurrency(pharmacy.deliveryFee ?? 0)} />
          <InfoCard title="Delivery Time" value={pharmacy.deliveryTime || "Not specified"} />
          <InfoCard title="Rating" value={pharmacy.rating ? pharmacy.rating.toFixed(1) : "New"} />
        </div>

        <Separator className="my-6" />

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available Medicines</h2>
            <span className="text-sm text-muted-foreground">
              Showing {filteredMedicines.length} of {medicines.length} medicines
            </span>
          </div>

          <Input
            type="search"
            placeholder="Search medicines in this pharmacy..."
            value={medicineSearch}
            onChange={(e) => setMedicineSearch(e.target.value)}
            className="mb-6"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedicines.map((medicine) => {
              const isHighlighted = highlightedSearch.toLowerCase() === medicine.name.toLowerCase();
              const deliveryOptionId = `delivery-${medicine.id}`;
              const reservationOptionId = `reservation-${medicine.id}`;

              return (
                <Card
                  key={medicine.id}
                  ref={isHighlighted ? highlightRef : null}
                  className={isHighlighted ? "animate-pulse border-primary shadow-lg relative" : "relative"}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleFavorite(medicine);
                    }}
                  >
                    <Heart
                      className={`h-5 w-5 ${isFavorite(medicine.id) ? "fill-primary text-primary" : ""}`}
                    />
                  </Button>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Pill className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-2">{medicine.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {medicine.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(Number(medicine.price))}
                      </span>
                      <Badge
                        variant={
                          medicine.stockStatus === "In Stock"
                            ? "default"
                            : medicine.stockStatus === "Low Stock"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {medicine.stockStatus}
                      </Badge>
                    </div>
                    <Dialog
                      open={dialogOpen && selectedMedicine?.id === medicine.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setDialogOpen(false);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleOpenDialog(medicine)}
                          disabled={medicine.stockStatus === "Out of Stock"}
                        >
                          Add to Cart
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add {medicine.name} to Cart</DialogTitle>
                          <DialogDescription>Choose how you'd like to get this medicine</DialogDescription>
                        </DialogHeader>

                        <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as "delivery" | "reservation")}>
                          <div className="flex items-center space-x-2 p-3 border rounded-lg">
                            <RadioGroupItem value="delivery" id={deliveryOptionId} />
                            <Label htmlFor={deliveryOptionId} className="flex-1 cursor-pointer">
                              <Truck className="inline h-4 w-4 mr-2" />
                              Delivery
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border rounded-lg">
                            <RadioGroupItem value="reservation" id={reservationOptionId} />
                            <Label htmlFor={reservationOptionId} className="flex-1 cursor-pointer">
                              <Package className="inline h-4 w-4 mr-2" />
                              Reservation
                            </Label>
                          </div>
                        </RadioGroup>

                        <div className="flex items-center gap-4">
                          <Label>Quantity:</Label>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-semibold">{quantity}</span>
                            <Button size="icon" variant="outline" onClick={() => setQuantity(quantity + 1)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span>Price per unit:</span>
                            <span className="font-semibold">{formatCurrency(Number(medicine.price))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Quantity:</span>
                            <span className="font-semibold">{quantity}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>{formatCurrency(Number(medicine.price) * quantity)}</span>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddToCart}>Add to Cart</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredMedicines.length === 0 && (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No medicines found matching "{medicineSearch}"
              </p>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>Pharmacy Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{pharmacy.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Hours</p>
                <p className="text-sm text-muted-foreground">{formatHours(pharmacy)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CenteredState = ({
  message,
  children,
}: {
  message: string;
  children?: ReactNode;
}) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Card className="w-full max-w-md mx-4">
      <CardContent className="pt-6">
        <p className="text-center text-muted-foreground">{message}</p>
        {children}
      </CardContent>
    </Card>
  </div>
);

const InfoCard = ({ title, value }: { title: string; value: string }) => (
  <Card>
    <CardContent className="pt-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </CardContent>
  </Card>
);

const formatHours = (pharmacy: Pharmacy) => {
  if (pharmacy.hours?.open && pharmacy.hours?.close) {
    return `${pharmacy.hours.open} - ${pharmacy.hours.close}`;
  }

  return "Hours not available";
};

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

export default PharmacyStore;
