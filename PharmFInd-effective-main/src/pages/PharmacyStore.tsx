import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Pill,
  Truck,
  Package,
  CheckCircle,
  Plus,
  Minus,
  Heart,
} from "lucide-react";

// Mock pharmacy data
const pharmacyDetails: Record<string, any> = {
  "1": {
    id: 1,
    name: "Habib Pharmacy",
    address: "Hamra Street, Beirut",
    phone: "+961 1 340555",
    distance: "1.2 km",
    hours: "Mon-Sat: 8:00 AM - 10:00 PM, Sun: 9:00 AM - 8:00 PM",
    isOpen: true,
    services: ["Delivery Available", "Pharmacist Consultation", "Accepts Insurance"],
    description: "Habib Pharmacy has been serving the Hamra community for over 30 years. We pride ourselves on professional service and competitive prices.",
  },
  "2": {
    id: 2,
    name: "Wardieh Pharmacy",
    address: "Achrafieh, Beirut",
    phone: "+961 1 200300",
    distance: "0.8 km",
    hours: "Open 24 hours, 7 days a week",
    isOpen: true,
    services: ["24/7 Service", "Delivery Available", "Pharmacist Consultation", "Accepts Insurance"],
    description: "Wardieh Pharmacy offers round-the-clock pharmaceutical services in Achrafieh. Our experienced pharmacists are always ready to assist you.",
  },
  "3": {
    id: 3,
    name: "Raouche Pharmacy",
    address: "Raouche, Beirut",
    phone: "+961 1 789456",
    distance: "2.1 km",
    hours: "Mon-Sun: 8:00 AM - 9:00 PM",
    isOpen: true,
    services: ["Delivery Available", "Accepts Insurance"],
    description: "Located in the heart of Raouche, we provide quality pharmaceutical services with a focus on customer care and convenience.",
  },
  "4": {
    id: 4,
    name: "Verdun Pharmacy",
    address: "Verdun Street, Beirut",
    phone: "+961 1 456789",
    distance: "1.5 km",
    hours: "Mon-Sat: 9:00 AM - 8:00 PM, Sun: Closed",
    isOpen: false,
    services: ["Pharmacist Consultation", "Accepts Insurance"],
    description: "Verdun Pharmacy specializes in prescription medications and personalized pharmaceutical care for our community.",
  },
  "5": {
    id: 5,
    name: "Mazraa Pharmacy",
    address: "Mazraa, Beirut",
    phone: "+961 1 654321",
    distance: "2.8 km",
    hours: "Mon-Sat: 8:00 AM - 11:00 PM, Sun: 10:00 AM - 7:00 PM",
    isOpen: true,
    services: ["Delivery Available", "Pharmacist Consultation"],
    description: "Serving the Mazraa neighborhood with dedication, we offer a wide range of medications and health products at competitive prices.",
  },
  "6": {
    id: 6,
    name: "Clemenceau Pharmacy",
    address: "Clemenceau Street, Beirut",
    phone: "+961 1 987654",
    distance: "1.0 km",
    hours: "Mon-Sat: 8:30 AM - 9:30 PM, Sun: 9:00 AM - 6:00 PM",
    isOpen: true,
    services: ["Delivery Available", "Pharmacist Consultation", "Accepts Insurance"],
    description: "Clemenceau Pharmacy combines modern pharmaceutical services with traditional care, ensuring you receive the best healthcare support.",
  },
};

// Mock medicines data
const allMedicines = [
  {
    id: 1,
    name: "Panadol 500mg",
    category: "Pain Relief",
    basePrice: 9.99,
    pharmacies: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 2,
    name: "Advil 200mg",
    category: "Pain Relief",
    basePrice: 12.50,
    pharmacies: [1, 2, 3, 5, 6],
  },
  {
    id: 3,
    name: "Aspirin 100mg",
    category: "Pain Relief",
    basePrice: 8.99,
    pharmacies: [1, 3, 4, 5, 6],
  },
  {
    id: 4,
    name: "Augmentin 625mg",
    category: "Antibiotics",
    basePrice: 24.99,
    pharmacies: [1, 2, 4, 6],
  },
  {
    id: 5,
    name: "Amoxicillin 500mg",
    category: "Antibiotics",
    basePrice: 18.50,
    pharmacies: [2, 3, 4, 5, 6],
  },
  {
    id: 6,
    name: "Omeprazole 20mg",
    category: "Digestive Health",
    basePrice: 15.99,
    pharmacies: [1, 2, 3, 5],
  },
  {
    id: 7,
    name: "Vitamin D3 1000IU",
    category: "Vitamins",
    basePrice: 22.00,
    pharmacies: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 8,
    name: "Zinc Tablets 50mg",
    category: "Vitamins",
    basePrice: 16.50,
    pharmacies: [1, 3, 4, 5, 6],
  },
  {
    id: 9,
    name: "Cough Syrup",
    category: "Cold & Flu",
    basePrice: 11.99,
    pharmacies: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 10,
    name: "Antihistamine 10mg",
    category: "Allergy",
    basePrice: 13.50,
    pharmacies: [2, 3, 4, 5, 6],
  },
  {
    id: 11,
    name: "Ibuprofen 400mg",
    category: "Pain Relief",
    basePrice: 11.00,
    pharmacies: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 12,
    name: "Multivitamin Tablets",
    category: "Vitamins",
    basePrice: 18.50,
    pharmacies: [1, 2, 4, 5, 6],
  },
  {
    id: 13,
    name: "Nasal Spray",
    category: "Cold & Flu",
    basePrice: 8.00,
    pharmacies: [1, 2, 3, 5, 6],
  },
  {
    id: 14,
    name: "Bandages Pack",
    category: "First Aid",
    basePrice: 6.50,
    pharmacies: [1, 3, 4, 5, 6],
  },
  {
    id: 15,
    name: "Hand Sanitizer",
    category: "Hygiene",
    basePrice: 4.99,
    pharmacies: [1, 2, 3, 4, 5, 6],
  },
];

const getStockStatus = (medicineId: number, pharmacyId: number) => {
  const seed = medicineId * pharmacyId;
  const random = (seed * 9301 + 49297) % 233280;
  const value = random / 233280;
  
  if (value < 0.7) return "In Stock";
  if (value < 0.9) return "Low Stock";
  return "Out of Stock";
};

const getPriceVariation = (basePrice: number, pharmacyId: number) => {
  const variation = (pharmacyId % 3) - 1; // -1, 0, or 1
  return (basePrice + variation).toFixed(2);
};

const PharmacyStore = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("search") || "";
  const { addToCart } = useCart();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const [medicineSearch, setMedicineSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [orderType, setOrderType] = useState<'delivery' | 'reservation'>('delivery');
  const [quantity, setQuantity] = useState(1);
  const highlightRef = useRef<HTMLDivElement>(null);

  const pharmacy = id ? pharmacyDetails[id] : null;

  // Get medicines for this pharmacy
  const pharmacyMedicines = allMedicines
    .filter((med) => med.pharmacies.includes(Number(id)))
    .map((med) => ({
      ...med,
      price: getPriceVariation(med.basePrice, Number(id)),
      stockStatus: getStockStatus(med.id, Number(id)),
    }));

  // Filter medicines based on search
  const filteredMedicines = pharmacyMedicines.filter(
    (med) =>
      med.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
      med.category.toLowerCase().includes(medicineSearch.toLowerCase())
  );

  // Scroll to highlighted medicine
  useEffect(() => {
    if (searchQuery && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [searchQuery]);

  const handleCall = () => {
    if (pharmacy) {
      window.location.href = `tel:${pharmacy.phone}`;
    }
  };

  const handleDirections = () => {
    toast({
      title: "Directions",
      description: "Map integration coming soon!",
    });
  };

  const handleOpenDialog = (medicine: any) => {
    setSelectedMedicine(medicine);
    setOrderType('delivery');
    setQuantity(1);
    setDialogOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedMedicine || !pharmacy) return;
    
    addToCart({
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.name,
      category: selectedMedicine.category,
      pharmacyId: Number(id),
      pharmacyName: pharmacy.name,
      price: Number(selectedMedicine.price),
      quantity,
      type: orderType,
      stockStatus: selectedMedicine.stockStatus,
    }, quantity);

    toast({
      title: "Added to Cart",
      description: `${selectedMedicine.name} has been added to your cart for ${orderType}.`,
    });

    setDialogOpen(false);
  };

  const toggleFavorite = (medicine: any) => {
    if (isFavorite(medicine.id)) {
      removeFavorite(medicine.id);
      toast({
        title: "Removed from Favorites",
        description: `${medicine.name} has been removed from your favorites.`,
      });
    } else {
      addFavorite({
        medicineId: medicine.id,
        medicineName: medicine.name,
        category: medicine.category,
        lastPharmacyId: Number(id),
        lastPharmacyName: pharmacy.name,
        lastPrice: Number(medicine.price),
      });
      toast({
        title: "Added to Favorites",
        description: `${medicine.name} has been added to your favorites.`,
      });
    }
  };

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Pharmacy not found</p>
            <Button onClick={() => navigate("/dashboard")} className="w-full mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{pharmacy.name}</h1>
                <Badge variant={pharmacy.isOpen ? "default" : "secondary"}>
                  {pharmacy.isOpen ? "Open" : "Closed"}
                </Badge>
              </div>
            </div>
            <CartIcon />
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{pharmacy.address}</span>
              <Badge variant="outline" className="ml-2">
                {pharmacy.distance}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>{pharmacy.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{pharmacy.hours}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            <Button onClick={handleCall} className="flex-1 min-w-[140px]">
              <Phone className="h-4 w-4 mr-2" />
              Call Pharmacy
            </Button>
            <Button
              onClick={handleDirections}
              variant="outline"
              className="flex-1 min-w-[140px]"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Services Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Services</h2>
          <div className="flex gap-2 flex-wrap">
            {pharmacy.services.map((service: string) => (
              <Badge key={service} variant="secondary">
                <CheckCircle className="h-3 w-3 mr-1" />
                {service}
              </Badge>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Medicine Inventory Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available Medicines</h2>
            <span className="text-sm text-muted-foreground">
              Showing {filteredMedicines.length} of {pharmacyMedicines.length} medicines
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
              const isHighlighted = searchQuery.toLowerCase() === medicine.name.toLowerCase();
              
              return (
                <Card
                  key={medicine.id}
                  ref={isHighlighted ? highlightRef : null}
                  className={
                    isHighlighted
                      ? "animate-pulse border-primary shadow-lg relative"
                      : "relative"
                  }
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(medicine);
                    }}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isFavorite(medicine.id) ? "fill-primary text-primary" : ""
                      }`}
                    />
                  </Button>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Pill className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-2">
                          {medicine.name}
                        </CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {medicine.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ${medicine.price}
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
                    <Dialog open={dialogOpen && selectedMedicine?.id === medicine.id} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
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
                        
                        <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as 'delivery' | 'reservation')}>
                          <div className="flex items-center space-x-2 p-3 border rounded-lg">
                            <RadioGroupItem value="delivery" id="delivery" />
                            <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                              <Truck className="inline h-4 w-4 mr-2" />
                              Delivery - Get it delivered ($1 fee)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border rounded-lg">
                            <RadioGroupItem value="reservation" id="reservation" />
                            <Label htmlFor="reservation" className="flex-1 cursor-pointer">
                              <Package className="inline h-4 w-4 mr-2" />
                              Reservation - Pick up at pharmacy
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
                            <span className="font-semibold">${medicine.price}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Quantity:</span>
                            <span className="font-semibold">{quantity}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>${(Number(medicine.price) * quantity).toFixed(2)}</span>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
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

        {/* About Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">About {pharmacy.name}</h2>
          <p className="text-muted-foreground mb-4">{pharmacy.description}</p>
          
          <Card>
            <CardContent className="pt-6 space-y-3">
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
                  <p className="text-sm text-muted-foreground">{pharmacy.hours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PharmacyStore;
