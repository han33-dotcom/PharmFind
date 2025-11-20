import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Truck, Package, CheckCircle, MapPin, Phone, Pill, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { CartIcon } from "@/components/CartIcon";
import { useCart } from "@/contexts/CartContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useAddresses } from "@/contexts/AddressContext";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import PrescriptionUpload from "@/components/checkout/PrescriptionUpload";
import { PrescriptionsService } from "@/services/prescriptions.service";
import { mockMedicines } from "@/data/mock/medicines.mock";

const pharmacyDetails: Record<string, any> = {
  "1": { id: 1, name: "Habib Pharmacy", address: "Hamra Street, Beirut", phone: "+961 1 340555" },
  "2": { id: 2, name: "Wardieh Pharmacy", address: "Achrafieh, Beirut", phone: "+961 1 200300" },
  "3": { id: 3, name: "Raouche Pharmacy", address: "Raouche, Beirut", phone: "+961 1 789456" },
  "4": { id: 4, name: "Verdun Pharmacy", address: "Verdun Street, Beirut", phone: "+961 1 456789" },
  "5": { id: 5, name: "Mazraa Pharmacy", address: "Mazraa, Beirut", phone: "+961 1 654321" },
  "6": { id: 6, name: "Clemenceau Pharmacy", address: "Clemenceau Street, Beirut", phone: "+961 1 987654" },
};

const deliverySchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "Invalid phone number"),
  address: z.string().min(5, "Address is required"),
  building: z.string().optional(),
  floor: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

const reservationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "Invalid phone number"),
  pickupNotes: z.string().optional(),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getItemsByPharmacy, clearCart } = useCart();
  const { saveOrder } = useOrders();
  const { addresses } = useAddresses();
  const itemsByPharmacy = getItemsByPharmacy();

  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  const [deliveryForm, setDeliveryForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    building: "",
    floor: "",
    deliveryNotes: "",
  });

  // Update delivery form when saved address is selected
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses.find((addr) => addr.id === addressId);
    if (address) {
      setDeliveryForm({
        fullName: address.fullName,
        phone: address.phoneNumber,
        address: address.address,
        building: address.building,
        floor: address.floor,
        deliveryNotes: deliveryForm.deliveryNotes, // Keep existing notes
      });
    }
  };

  // Effect to set initial address mode based on saved addresses
  useEffect(() => {
    if (addresses.length > 0 && addressMode === "new" && !selectedAddressId) {
      setAddressMode("saved");
      handleAddressSelect(addresses[0].id);
    }
  }, [addresses]);

  const [reservationForm, setReservationForm] = useState({
    fullName: "",
    phone: "",
    pickupNotes: "",
  });

  const [pickupTimes, setPickupTimes] = useState<Record<number, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delivery scheduling
  const [deliveryScheduleMode, setDeliveryScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledDeliveryAt, setScheduledDeliveryAt] = useState<string>("");

  // Prescription upload
  const [prescriptionFile, setPrescriptionFile] = useState<{ file: File; preview: string } | null>(null);
  
  const hasDelivery = cartItems.some((item) => item.type === 'delivery');
  const hasReservation = cartItems.some((item) => item.type === 'reservation');
  
  // Check if any item requires prescription
  const requiresPrescription = cartItems.some((item) => {
    const medicine = mockMedicines.find(m => m.id === item.medicineId);
    return medicine?.requiresPrescription;
  });

  const reservationPharmacies = Object.entries(itemsByPharmacy).filter(([, items]) =>
    items.some((item) => item.type === 'reservation')
  );

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryPharmacies = new Set(
    cartItems.filter((item) => item.type === 'delivery').map((item) => item.pharmacyId)
  );
  const deliveryFees = deliveryPharmacies.size * 1;
  const total = subtotal + deliveryFees;

  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  const validateForms = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate delivery form if has delivery items
    if (hasDelivery) {
      try {
        deliverySchema.parse(deliveryForm);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[`delivery_${err.path[0]}`] = err.message;
            }
          });
        }
      }
    }

    // Validate reservation form if has reservation items
    if (hasReservation) {
      try {
        reservationSchema.parse(reservationForm);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[`reservation_${err.path[0]}`] = err.message;
            }
          });
        }
      }

      // Validate pickup times
      reservationPharmacies.forEach(([pharmacyId]) => {
        if (!pickupTimes[Number(pharmacyId)]) {
          newErrors[`pickup_${pharmacyId}`] = "Please select a pickup time";
        }
      });
    }

    // Validate delivery schedule
    if (hasDelivery && deliveryScheduleMode === 'scheduled') {
      if (!scheduledDeliveryAt) {
        newErrors.delivery_scheduledAt = "Please select a delivery date & time";
      } else {
        const selected = new Date(scheduledDeliveryAt).getTime();
        const now = Date.now();
        if (isNaN(selected) || selected <= now) {
          newErrors.delivery_scheduledAt = "Scheduled time must be in the future";
        }
      }
    }

    // Validate prescription upload
    if (requiresPrescription && !prescriptionFile) {
      newErrors.prescription = "Please upload a valid prescription for prescription-required medicines";
    }

    // Validate payment method
    if (!paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForms()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Upload prescription if required
    let prescriptionId: string | undefined;
    if (requiresPrescription && prescriptionFile) {
      try {
        const prescription = await PrescriptionsService.uploadPrescription(prescriptionFile);
        prescriptionId = prescription.id;
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload prescription. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Save new address if requested
    if (hasDelivery && saveNewAddress && addressMode === "new") {
      const newAddress = {
        nickname: "Home" as const,
        fullName: deliveryForm.fullName,
        address: deliveryForm.address,
        building: deliveryForm.building,
        floor: deliveryForm.floor,
        phoneNumber: deliveryForm.phone,
        additionalDetails: deliveryForm.deliveryNotes || "",
      };
      
      const existingAddresses = JSON.parse(localStorage.getItem("pharmfind_addresses") || "[]");
      existingAddresses.push({
        ...newAddress,
        id: Date.now().toString(),
      });
      localStorage.setItem("pharmfind_addresses", JSON.stringify(existingAddresses));
      
      toast({
        title: "Address Saved",
        description: "Your address has been saved for future orders.",
      });
    }

    const orderId = `ORD-${Date.now()}`;
    
    // Save order using OrdersContext
    saveOrder({
      orderId,
      items: cartItems,
      itemsByPharmacy,
      deliveryForm: hasDelivery ? deliveryForm : null,
      reservationForm: hasReservation ? reservationForm : null,
      pickupTimes,
      deliverySchedule: hasDelivery
        ? {
            mode: deliveryScheduleMode,
            scheduledAt: deliveryScheduleMode === 'scheduled' ? new Date(scheduledDeliveryAt).toISOString() : undefined,
          }
        : undefined,
      paymentMethod,
      subtotal,
      deliveryFees,
      total,
      prescriptionId,
    });
    
    // Store order data for confirmation page (for backward compatibility)
    const orderData = {
      orderId,
      items: cartItems,
      itemsByPharmacy,
      deliveryForm: hasDelivery ? deliveryForm : null,
      reservationForm: hasReservation ? reservationForm : null,
      pickupTimes,
      deliverySchedule: hasDelivery
        ? {
            mode: deliveryScheduleMode,
            scheduledAt: deliveryScheduleMode === 'scheduled' ? new Date(scheduledDeliveryAt).toISOString() : undefined,
          }
        : undefined,
      paymentMethod,
      subtotal,
      deliveryFees,
      total,
      prescriptionId,
    };
    localStorage.setItem('current_order', JSON.stringify(orderData));
    
    clearCart();
    navigate(`/order-confirmation?orderId=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/cart")}>
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

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Cart</span>
            <div className="h-px w-12 bg-primary" />
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Checkout</span>
            <div className="h-px w-12 bg-border" />
            <div className="h-5 w-5 rounded-full border-2" />
            <span className="text-sm text-muted-foreground">Confirmation</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Form */}
            {hasDelivery && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                  <CardDescription>Where should we deliver your order?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address Selection */}
                  {addresses.length > 0 && (
                    <div className="space-y-4 pb-4 border-b">
                      <RadioGroup value={addressMode} onValueChange={(value: "saved" | "new") => {
                        setAddressMode(value);
                        if (value === "new") {
                          setSelectedAddressId("");
                          setDeliveryForm({
                            fullName: "",
                            phone: "",
                            address: "",
                            building: "",
                            floor: "",
                            deliveryNotes: "",
                          });
                        }
                      }}>
                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <RadioGroupItem value="saved" id="saved-address" className="mt-1" />
                            <div className="flex-1 space-y-2">
                              <Label htmlFor="saved-address" className="cursor-pointer font-medium">
                                Use saved address
                              </Label>
                              {addressMode === "saved" && (
                                <Select value={selectedAddressId} onValueChange={handleAddressSelect}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an address" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {addresses.map((addr) => (
                                      <SelectItem key={addr.id} value={addr.id}>
                                        {addr.nickname} - {addr.building}, {addr.floor}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {addressMode === "saved" && selectedAddressId && (
                                <div className="p-3 bg-muted rounded-lg text-sm">
                                  <p className="font-medium">{deliveryForm.fullName}</p>
                                  <p className="text-muted-foreground">{deliveryForm.phone}</p>
                                  <p className="text-muted-foreground">{deliveryForm.address}</p>
                                  <p className="text-muted-foreground">
                                    {deliveryForm.building}, {deliveryForm.floor}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new" id="new-address" />
                            <Label htmlFor="new-address" className="cursor-pointer font-medium">
                              Enter new address
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Manual Address Input Fields */}
                  {addressMode === "new" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="delivery-name">Full Name *</Label>
                          <Input
                            id="delivery-name"
                            value={deliveryForm.fullName}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, fullName: e.target.value })}
                            placeholder="John Doe"
                          />
                          {errors.delivery_fullName && (
                            <p className="text-sm text-destructive">{errors.delivery_fullName}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delivery-phone">Phone Number *</Label>
                          <Input
                            id="delivery-phone"
                            value={deliveryForm.phone}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, phone: e.target.value })}
                            placeholder="+961 1 234567"
                          />
                          {errors.delivery_phone && (
                            <p className="text-sm text-destructive">{errors.delivery_phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery-address">Street Address *</Label>
                        <Input
                          id="delivery-address"
                          value={deliveryForm.address}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, address: e.target.value })}
                          placeholder="123 Main Street"
                        />
                        {errors.delivery_address && (
                          <p className="text-sm text-destructive">{errors.delivery_address}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="delivery-building">Building Name/Number</Label>
                          <Input
                            id="delivery-building"
                            value={deliveryForm.building}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, building: e.target.value })}
                            placeholder="Building A"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delivery-floor">Floor</Label>
                          <Input
                            id="delivery-floor"
                            value={deliveryForm.floor}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, floor: e.target.value })}
                            placeholder="3rd Floor"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery-notes">Delivery Notes</Label>
                        <Textarea
                          id="delivery-notes"
                          value={deliveryForm.deliveryNotes}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryNotes: e.target.value })}
                          placeholder="Any special instructions for delivery..."
                          rows={3}
                        />
                      </div>

                      {/* Save Address Checkbox */}
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          id="save-address"
                          checked={saveNewAddress}
                          onChange={(e) => setSaveNewAddress(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="save-address" className="cursor-pointer font-normal">
                          Save this address for future use
                        </Label>
                      </div>
                    </>
                  )}

                  {/* Delivery Timing */}
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <Label>Delivery Time</Label>
                    <RadioGroup value={deliveryScheduleMode} onValueChange={(v: 'now' | 'scheduled') => setDeliveryScheduleMode(v)}>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <input
                          type="radio"
                          id="deliver-now"
                          checked={deliveryScheduleMode === 'now'}
                          onChange={() => setDeliveryScheduleMode('now')}
                        />
                        <Label htmlFor="deliver-now" className="cursor-pointer font-normal flex-1">Deliver now</Label>
                      </div>
                      <div className="space-y-2 p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="deliver-scheduled"
                            checked={deliveryScheduleMode === 'scheduled'}
                            onChange={() => setDeliveryScheduleMode('scheduled')}
                          />
                          <Label htmlFor="deliver-scheduled" className="cursor-pointer font-normal flex-1">Schedule for later</Label>
                        </div>
                        {deliveryScheduleMode === 'scheduled' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="scheduled-at">Delivery date & time *</Label>
                              <Input
                                id="scheduled-at"
                                type="datetime-local"
                                value={scheduledDeliveryAt}
                                onChange={(e) => setScheduledDeliveryAt(e.target.value)}
                                min={new Date().toISOString().slice(0,16)}
                              />
                              {errors.delivery_scheduledAt && (
                                <p className="text-sm text-destructive">{errors.delivery_scheduledAt}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reservation Form */}
            {hasReservation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Pickup Information
                  </CardTitle>
                  <CardDescription>When would you like to pick up your order?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reservation-name">Full Name *</Label>
                      <Input
                        id="reservation-name"
                        value={reservationForm.fullName}
                        onChange={(e) => setReservationForm({ ...reservationForm, fullName: e.target.value })}
                        placeholder="John Doe"
                      />
                      {errors.reservation_fullName && (
                        <p className="text-sm text-destructive">{errors.reservation_fullName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reservation-phone">Phone Number *</Label>
                      <Input
                        id="reservation-phone"
                        value={reservationForm.phone}
                        onChange={(e) => setReservationForm({ ...reservationForm, phone: e.target.value })}
                        placeholder="+961 1 234567"
                      />
                      {errors.reservation_phone && (
                        <p className="text-sm text-destructive">{errors.reservation_phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Pickup times for each pharmacy */}
                  {reservationPharmacies.map(([pharmacyId, items]) => {
                    const pharmacy = pharmacyDetails[pharmacyId];
                    return (
                      <div key={pharmacyId} className="p-4 border rounded-lg space-y-3">
                        <div>
                          <h4 className="font-semibold mb-1">{pharmacy.name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {pharmacy.address}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`pickup-${pharmacyId}`}>Preferred Pickup Time *</Label>
                          <Select
                            value={pickupTimes[Number(pharmacyId)] || ""}
                            onValueChange={(value) => setPickupTimes({ ...pickupTimes, [Number(pharmacyId)]: value })}
                          >
                            <SelectTrigger id={`pickup-${pharmacyId}`}>
                              <SelectValue placeholder="Select time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                              <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                              <SelectItem value="evening">Evening (5 PM - 9 PM)</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors[`pickup_${pharmacyId}`] && (
                            <p className="text-sm text-destructive">{errors[`pickup_${pharmacyId}`]}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="space-y-2">
                    <Label htmlFor="pickup-notes">Notes</Label>
                    <Textarea
                      id="pickup-notes"
                      value={reservationForm.pickupNotes}
                      onChange={(e) => setReservationForm({ ...reservationForm, pickupNotes: e.target.value })}
                      placeholder="Any special instructions..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prescription Upload */}
            {requiresPrescription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Prescription Upload
                  </CardTitle>
                  <CardDescription>
                    Your order contains prescription-required medicines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PrescriptionUpload
                    selectedFile={prescriptionFile}
                    onFileSelect={(file, preview) => setPrescriptionFile({ file, preview })}
                    onFileRemove={() => setPrescriptionFile(null)}
                    error={errors.prescription}
                  />
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {hasDelivery && (
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="cash_delivery" id="cash_delivery" />
                      <Label htmlFor="cash_delivery" className="flex-1 cursor-pointer">
                        Cash on Delivery
                      </Label>
                    </div>
                  )}
                  {hasReservation && (
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="cash_pickup" id="cash_pickup" />
                      <Label htmlFor="cash_pickup" className="flex-1 cursor-pointer">
                        Cash on Pickup
                      </Label>
                    </div>
                  )}
                </RadioGroup>
                {errors.paymentMethod && (
                  <p className="text-sm text-destructive mt-2">{errors.paymentMethod}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items grouped by pharmacy */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(itemsByPharmacy).map(([pharmacyId, items]) => {
                    const pharmacy = pharmacyDetails[pharmacyId];
                    return (
                      <div key={pharmacyId} className="border-b pb-3 last:border-0">
                        <h4 className="font-semibold text-sm mb-2">{pharmacy.name}</h4>
                        {items.map((item) => (
                          <div key={item.id} className="flex items-start gap-2 text-sm mb-2">
                            <Pill className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{item.medicineName}</p>
                              <p className="text-xs text-muted-foreground">
                                ${item.price} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery fees:</span>
                    <span>${deliveryFees.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
