import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

export const CartIcon = () => {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const count = getCartCount();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate("/cart")}
      className="relative"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
          {count}
        </Badge>
      )}
    </Button>
  );
};
