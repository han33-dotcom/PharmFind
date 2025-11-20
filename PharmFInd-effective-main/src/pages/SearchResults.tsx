import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Pill, MapPin, Phone, Clock, ChevronDown, ChevronUp, ArrowLeft, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { CartIcon } from "@/components/CartIcon";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "@/hooks/use-toast";

// Mock medicines data
const mockMedicines = [
  { id: 1, name: "Panadol 500mg", price: "$8.99", availableAt: 5, category: "Pain Relief", pharmacies: [1, 2, 3, 4, 6] },
  { id: 2, name: "Advil 200mg", price: "$12.50", availableAt: 4, category: "Pain Relief", pharmacies: [1, 3, 4, 5] },
  { id: 3, name: "Aspirin 100mg", price: "$6.00", availableAt: 6, category: "Pain Relief", pharmacies: [1, 2, 3, 4, 5, 6] },
  { id: 4, name: "Vitamin C 1000mg", price: "$15.00", availableAt: 3, category: "Vitamins", pharmacies: [2, 3, 6] },
  { id: 5, name: "Cough Syrup", price: "$10.50", availableAt: 4, category: "Cold & Flu", pharmacies: [1, 2, 4, 5] },
  { id: 6, name: "Antibiotic Cream", price: "$18.00", availableAt: 2, category: "First Aid", pharmacies: [3, 6] },
  { id: 7, name: "Eye Drops", price: "$9.99", availableAt: 5, category: "Eye Care", pharmacies: [1, 2, 3, 5, 6] },
  { id: 8, name: "Allergy Relief", price: "$14.00", availableAt: 4, category: "Allergy", pharmacies: [1, 2, 4, 6] },
  { id: 9, name: "Antacid Tablets", price: "$7.50", availableAt: 6, category: "Digestive", pharmacies: [1, 2, 3, 4, 5, 6] },
  { id: 10, name: "Throat Lozenges", price: "$5.00", availableAt: 5, category: "Cold & Flu", pharmacies: [1, 3, 4, 5, 6] },
];

// Mock pharmacies data (Real Beirut pharmacies)
const mockPharmacies = [
  { id: 1, name: "Habib Pharmacy", address: "Hamra Street, Hamra, Beirut", distance: "1.8 km", phone: "+961 1 340 555", matches: 12, isOpen: true },
  { id: 2, name: "Wardieh Pharmacy", address: "Achrafieh Main Road, Achrafieh, Beirut", distance: "2.4 km", phone: "+961 1 200 800", matches: 8, isOpen: true },
  { id: 3, name: "Verdun Pharmacy", address: "Verdun Street, Verdun, Beirut", distance: "3.2 km", phone: "+961 1 803 900", matches: 15, isOpen: true },
  { id: 4, name: "Pharmacie Hamra", address: "Bliss Street, Hamra, Beirut", distance: "1.5 km", phone: "+961 1 350 200", matches: 10, isOpen: true },
  { id: 5, name: "Gefinor Pharmacy", address: "Clemenceau Street, Hamra, Beirut", distance: "2.1 km", phone: "+961 1 369 400", matches: 6, isOpen: false },
  { id: 6, name: "ABC Achrafieh Pharmacy", address: "ABC Mall, Achrafieh, Beirut", distance: "3.8 km", phone: "+961 1 209 100", matches: 9, isOpen: true },
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [expandedMedicine, setExpandedMedicine] = useState<number | null>(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const toggleMedicineExpand = (id: number) => {
    setExpandedMedicine(expandedMedicine === id ? null : id);
  };

  const getPharmacyById = (id: number) => mockPharmacies.find(p => p.id === id);

  const toggleFavorite = (medicine: any) => {
    const pharmacy = getPharmacyById(medicine.pharmacies[0]);
    if (!pharmacy) return;

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
        lastPharmacyId: pharmacy.id,
        lastPharmacyName: pharmacy.name,
        lastPrice: parseFloat(medicine.price.replace("$", "")),
      });
      toast({
        title: "Added to Favorites",
        description: `${medicine.name} has been added to your favorites.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Logo />
            </div>
            <div className="flex items-center gap-2">
              <CartIcon />
              <Button variant="ghost" onClick={() => navigate("/user-settings")}>
                Settings
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for medicines or pharmacies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-12 text-base"
              />
            </div>
          </form>

          {query && (
            <p className="text-center mt-4 text-muted-foreground">
              Search results for: <span className="font-semibold text-foreground">"{query}"</span>
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!query ? (
          // Empty State
          <div className="text-center py-12">
            <Pill className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Start searching</h2>
            <p className="text-muted-foreground mb-6">Find medicines or pharmacies near you</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Panadol", "Aspirin", "Vitamin C", "Cough Syrup"].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          // Results Tabs
          <Tabs defaultValue="medicines" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="medicines">Medicines</TabsTrigger>
              <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
            </TabsList>

            {/* Medicines Tab */}
            <TabsContent value="medicines" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockMedicines.map((medicine) => (
                  <Card key={medicine.id} className="cursor-pointer hover:shadow-lg transition-shadow relative">
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
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Pill className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{medicine.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">{medicine.category}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-primary">{medicine.price}</span>
                        <span className="text-sm text-muted-foreground">
                          Available at {medicine.availableAt} pharmacies
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => toggleMedicineExpand(medicine.id)}
                      >
                        {expandedMedicine === medicine.id ? (
                          <>
                            Hide Pharmacies <ChevronUp className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            View Pharmacies <ChevronDown className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>

                      {expandedMedicine === medicine.id && (
                        <div className="mt-4 space-y-3 pt-4 border-t">
                          <p className="font-semibold text-sm">Available at:</p>
                          {medicine.pharmacies.slice(0, 3).map((pharmacyId) => {
                            const pharmacy = getPharmacyById(pharmacyId);
                            if (!pharmacy) return null;
                            return (
                              <div key={pharmacy.id} className="flex items-start justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{pharmacy.name}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {pharmacy.distance}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/pharmacy/${pharmacy.id}?search=${medicine.name}`)}
                                >
                                  View Store
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Pharmacies Tab */}
            <TabsContent value="pharmacies" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockPharmacies.map((pharmacy) => (
                  <Card
                    key={pharmacy.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/pharmacy/${pharmacy.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{pharmacy.name}</CardTitle>
                        <Badge variant={pharmacy.isOpen ? "default" : "secondary"}>
                          {pharmacy.isOpen ? "Open" : "Closed"}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="w-fit mt-2">
                        {pharmacy.matches} matches found
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span>{pharmacy.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{pharmacy.phone}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{pharmacy.distance}</span>
                        </div>
                        <Button size="sm">View Store</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
