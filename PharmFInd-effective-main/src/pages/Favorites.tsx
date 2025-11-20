import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Trash2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { CartIcon } from "@/components/CartIcon";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "@/hooks/use-toast";

const Favorites = () => {
  const navigate = useNavigate();
  const { getFavorites, removeFavorite } = useFavorites();
  const favorites = getFavorites();

  const handleRemove = (medicineId: number, medicineName: string) => {
    removeFavorite(medicineId);
    toast({
      title: "Removed from Favorites",
      description: `${medicineName} has been removed from your favorites.`,
    });
  };

  const handleViewStores = (medicineName: string) => {
    navigate(`/search?q=${encodeURIComponent(medicineName)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Favorite Medicines</h1>
          <p className="text-muted-foreground">Quick access to your frequently used items</p>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
              <p className="text-muted-foreground mb-4">Start adding your frequently used medicines!</p>
              <Button onClick={() => navigate("/dashboard")}>Browse Medicines</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((favorite) => (
              <Card key={favorite.medicineId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{favorite.medicineName}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {favorite.category}
                      </Badge>
                    </div>
                    <Heart className="h-5 w-5 fill-primary text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">
                      ${favorite.lastPrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last from: {favorite.lastPharmacyName}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewStores(favorite.medicineName)}
                    >
                      <Store className="mr-2 h-4 w-4" />
                      View Stores
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(favorite.medicineId, favorite.medicineName)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
