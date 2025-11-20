import { useNavigate } from "react-router-dom";
import DriverLayout from "@/components/driver/DriverLayout";
import { DriverService } from "@/services/driver.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Package, Navigation, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";

const ActiveDelivery = () => {
  const navigate = useNavigate();
  const activeDelivery = DriverService.getMyActiveDelivery();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  if (!activeDelivery) {
    return (
      <DriverLayout>
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">No Active Delivery</h2>
          <p className="text-muted-foreground mb-6">
            You don't have any active deliveries at the moment.
          </p>
          <Button onClick={() => navigate("/driver/available")}>
            View Available Orders
          </Button>
        </div>
      </DriverLayout>
    );
  }

  const handlePickedUp = () => {
    DriverService.startDelivery(activeDelivery.id);
    toast.success("Marked as picked up from pharmacy");
    window.location.reload();
  };

  const handleInTransit = () => {
    DriverService.markInTransit(activeDelivery.id);
    toast.success("You're now in transit to customer");
    window.location.reload();
  };

  const handleComplete = () => {
    DriverService.completeDelivery(activeDelivery.id);
    setShowCompleteDialog(true);
  };

  const navigateToLocation = (lat: number, lng: number, label: string) => {
    // Try to open in native maps app first (mobile), fallback to web
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try native app first
      const nativeUrl = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
      const googleMapsUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
      const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
      
      // Try Google Maps app, then Apple Maps, then web
      const link = document.createElement('a');
      link.href = googleMapsUrl;
      link.click();
      
      setTimeout(() => {
        // If Google Maps didn't open, try Apple Maps
        const appleLink = document.createElement('a');
        appleLink.href = appleMapsUrl;
        appleLink.click();
        
        setTimeout(() => {
          // Fallback to web Google Maps
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
          window.open(webUrl, '_blank');
        }, 500);
      }, 500);
    } else {
      // Desktop: open in new tab
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
    
    toast.success(`Opening navigation to ${label}`, {
      description: "Google Maps will open in a new window",
    });
  };

  const callCustomer = () => {
    window.location.href = `tel:${activeDelivery.customerPhone}`;
  };

  return (
    <DriverLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Active Delivery</h1>
          <p className="text-muted-foreground">Order #{activeDelivery.orderId}</p>
        </div>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Customer Details</CardTitle>
              <Badge>
                {activeDelivery.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer Name</p>
              <p className="text-lg font-medium text-foreground">{activeDelivery.customerName}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-medium text-foreground">{activeDelivery.customerPhone}</p>
                <Button size="sm" variant="outline" onClick={callCustomer}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="text-lg font-medium text-foreground">{activeDelivery.deliveryAddress}</p>
            </div>

            {activeDelivery.specialInstructions && (
              <div>
                <p className="text-sm text-muted-foreground">Special Instructions</p>
                <p className="text-foreground">{activeDelivery.specialInstructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeDelivery.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{item.name}</span>
                  </div>
                  <span className="text-muted-foreground">x{item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium text-foreground">{activeDelivery.totalAmount.toLocaleString()} LBP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-medium text-secondary">{activeDelivery.deliveryFee.toLocaleString()} LBP</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation - Enhanced with Quick Access */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                Navigation
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                Tap to open in Google Maps
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pharmacy Navigation */}
            <div className="p-4 border border-border rounded-lg bg-muted/30">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pickup Location</p>
                  <p className="text-lg font-semibold text-foreground mt-1">{activeDelivery.pharmacyName}</p>
                  <p className="text-sm text-muted-foreground">{activeDelivery.pharmacyAddress}</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                size="lg"
                onClick={() => navigateToLocation(
                  activeDelivery.pharmacyCoordinates.lat,
                  activeDelivery.pharmacyCoordinates.lng,
                  activeDelivery.pharmacyName
                )}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate to Pharmacy
              </Button>
            </div>

            {/* Customer Navigation - Primary Action */}
            <div className="p-4 border-2 border-secondary rounded-lg bg-secondary/5">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-secondary/20 rounded-full">
                  <MapPin className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Location</p>
                  <p className="text-lg font-semibold text-foreground mt-1">{activeDelivery.customerName}</p>
                  <p className="text-sm text-muted-foreground">{activeDelivery.deliveryAddress}</p>
                </div>
              </div>
              <Button 
                className="w-full"
                size="lg"
                onClick={() => navigateToLocation(
                  activeDelivery.addressCoordinates.lat,
                  activeDelivery.addressCoordinates.lng,
                  activeDelivery.deliveryAddress
                )}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate to Customer Address
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeDelivery.status === 'assigned' && (
              <Button className="w-full" onClick={handlePickedUp}>
                <Package className="h-4 w-4 mr-2" />
                Picked Up from Pharmacy
              </Button>
            )}
            
            {activeDelivery.status === 'picked_up' && (
              <Button className="w-full" onClick={handleInTransit}>
                <Navigation className="h-4 w-4 mr-2" />
                In Transit to Customer
              </Button>
            )}
            
            {(activeDelivery.status === 'in_transit' || activeDelivery.status === 'picked_up') && (
              <Button className="w-full" variant="secondary" onClick={handleComplete}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Delivered
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completion Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delivery Completed!</AlertDialogTitle>
            <AlertDialogDescription>
              You've successfully completed this delivery. Great job!
              <br /><br />
              <strong>Earnings: {activeDelivery.deliveryFee.toLocaleString()} LBP</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/driver/dashboard")}>
              Back to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DriverLayout>
  );
};

export default ActiveDelivery;
