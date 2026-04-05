import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Clock, Heart, MapPin, Phone, Pill, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { CartIcon } from "@/components/CartIcon";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "@/hooks/use-toast";
import { MedicinesService } from "@/services/medicines.service";
import { PharmaciesService } from "@/services/pharmacies.service";
import { Pharmacy, PharmacyMedicine } from "@/types";

type SearchMedicineResult = {
  id: number;
  name: string;
  category: string;
  lowestPrice: number;
  availableAt: number;
  pharmacies: Pharmacy[];
};

const suggestedSearches = ["Panadol", "Aspirin", "Vitamin C", "Cough Syrup"];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [expandedMedicine, setExpandedMedicine] = useState<number | null>(null);
  const [medicines, setMedicines] = useState<SearchMedicineResult[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setMedicines([]);
      setPharmacies([]);
      setLoadError(null);
      return;
    }

    const loadResults = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [medicineResults, pharmacyResults] = await Promise.all([
          MedicinesService.searchMedicines(trimmedQuery),
          PharmaciesService.searchPharmacies(),
        ]);

        const groupedMedicines = groupMedicineResults(medicineResults, pharmacyResults);
        const filteredPharmacies = filterPharmacies(pharmacyResults, trimmedQuery, groupedMedicines);

        setMedicines(groupedMedicines);
        setPharmacies(filteredPharmacies);
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        setLoadError("Failed to load search results.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [query]);

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

  const toggleFavorite = async (medicine: SearchMedicineResult) => {
    const preferredPharmacy = medicine.pharmacies[0];
    if (!preferredPharmacy) {
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
        lastPharmacyId: preferredPharmacy.id,
        lastPharmacyName: preferredPharmacy.name,
        lastPrice: medicine.lowestPrice,
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

  return (
    <div className="min-h-screen bg-background">
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

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
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

      <main className="container mx-auto px-4 py-8">
        {!query ? (
          <div className="text-center py-12">
            <Pill className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Start searching</h2>
            <p className="text-muted-foreground mb-6">Find medicines or pharmacies near you</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedSearches.map((suggestion) => (
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
        ) : isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading search results...</div>
        ) : loadError ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{loadError}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="medicines" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="medicines">Medicines</TabsTrigger>
              <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
            </TabsList>

            <TabsContent value="medicines" className="mt-6">
              {medicines.length === 0 ? (
                <EmptyState message={`No medicines found for "${query}".`} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medicines.map((medicine) => (
                    <Card key={medicine.id} className="cursor-pointer hover:shadow-lg transition-shadow relative">
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
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Pill className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{medicine.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {medicine.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-primary">
                            ${medicine.lowestPrice.toFixed(2)}
                          </span>
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
                            {medicine.pharmacies.slice(0, 5).map((pharmacy) => (
                              <div
                                key={pharmacy.id}
                                className="flex items-start justify-between gap-2 p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{pharmacy.name}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {pharmacy.distance || pharmacy.address}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/pharmacy/${pharmacy.id}?search=${encodeURIComponent(medicine.name)}`)}
                                >
                                  View Store
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pharmacies" className="mt-6">
              {pharmacies.length === 0 ? (
                <EmptyState message={`No pharmacies found for "${query}".`} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pharmacies.map((pharmacy) => {
                    const matchCount = medicines.filter((medicine) =>
                      medicine.pharmacies.some((candidate) => candidate.id === pharmacy.id)
                    ).length;

                    return (
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
                            {matchCount > 0 ? `${matchCount} medicine matches` : "Pharmacy match"}
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
                              <span>{pharmacy.distance || pharmacy.deliveryTime || "Available now"}</span>
                            </div>
                            <Button size="sm">View Store</Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12">
    <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

const groupMedicineResults = (
  medicineResults: PharmacyMedicine[],
  pharmacies: Pharmacy[],
): SearchMedicineResult[] => {
  const pharmacyMap = new Map(pharmacies.map((pharmacy) => [pharmacy.id, pharmacy]));
  const grouped = new Map<number, SearchMedicineResult>();

  medicineResults.forEach((result) => {
    const pharmacy = pharmacyMap.get(result.pharmacyId) || {
      id: result.pharmacyId,
      name: result.pharmacyName,
      address: "",
      phone: "",
      rating: 0,
      distance: "",
      deliveryTime: "",
      deliveryFee: 0,
      isOpen: true,
    };

    const existing = grouped.get(result.id);
    if (!existing) {
      grouped.set(result.id, {
        id: result.id,
        name: result.name,
        category: result.category,
        lowestPrice: result.price,
        availableAt: 1,
        pharmacies: [pharmacy],
      });
      return;
    }

    const alreadyIncluded = existing.pharmacies.some((candidate) => candidate.id === pharmacy.id);
    if (!alreadyIncluded) {
      existing.pharmacies.push(pharmacy);
      existing.availableAt += 1;
    }
    existing.lowestPrice = Math.min(existing.lowestPrice, result.price);
  });

  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const filterPharmacies = (
  pharmacies: Pharmacy[],
  query: string,
  medicines: SearchMedicineResult[],
): Pharmacy[] => {
  const normalizedQuery = query.toLowerCase();
  const pharmaciesWithMedicineMatches = new Set(
    medicines.flatMap((medicine) => medicine.pharmacies.map((pharmacy) => pharmacy.id)),
  );

  return pharmacies
    .filter((pharmacy) => {
      const directMatch =
        pharmacy.name.toLowerCase().includes(normalizedQuery) ||
        pharmacy.address.toLowerCase().includes(normalizedQuery);

      return directMatch || pharmaciesWithMedicineMatches.has(pharmacy.id);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

export default SearchResults;
