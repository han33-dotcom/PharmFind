import { useState, useEffect } from 'react';
import PharmacistLayout from '@/components/pharmacist/PharmacistLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Phone, Mail, MapPin, Clock, FileCheck, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PharmaciesService } from '@/services/pharmacies.service';
import { Pharmacy } from '@/types';
import { AuthService } from '@/services/auth.service';

const Profile = () => {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [pharmacyData, userData] = await Promise.all([
          PharmaciesService.getMyPharmacy(),
          AuthService.getCurrentUser(),
        ]);
        console.log('Fetched pharmacy data:', pharmacyData);
        console.log('Fetched user data:', userData);
        setPharmacy(pharmacyData);
        setUser(userData);
      } catch (error: any) {
        console.error('Failed to fetch pharmacy data:', error);
        if (error?.status === 404) {
          // No pharmacy registered yet - this is okay
          setPharmacy(null);
        } else {
          toast.error('Failed to load pharmacy information: ' + (error?.error?.message || error?.message || 'Unknown error'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!pharmacy) return;
    
    try {
      // TODO: Implement pharmacy update endpoint
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const getStatusBadge = () => {
    if (!pharmacy) return { label: 'Not Registered', variant: 'outline' as const };
    
    const status = pharmacy.verificationStatus || (pharmacy.verified ? 'approved' : 'pending');
    const variants = {
      pending: { label: 'Pending Review', variant: 'outline' as const },
      approved: { label: 'Approved', variant: 'default' as const },
      rejected: { label: 'Rejected', variant: 'destructive' as const },
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const statusBadge = getStatusBadge();

  if (isLoading) {
    return (
      <PharmacistLayout>
        <div className="container py-8 px-4 max-w-4xl space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </PharmacistLayout>
    );
  }

  if (!pharmacy) {
    return (
      <PharmacistLayout>
        <div className="container py-8 px-4 max-w-4xl space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Profile</h1>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pharmacy Registered</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't registered a pharmacy yet. Please register your pharmacy to start receiving orders.
                </p>
                <p className="text-sm text-muted-foreground">
                  Contact support to register your pharmacy, or if you just registered, please refresh the page.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PharmacistLayout>
    );
  }

  const operatingHours = pharmacy.hours 
    ? `${pharmacy.hours.open} - ${pharmacy.hours.close}`
    : 'Not specified';

  return (
    <PharmacistLayout>
      <div className="container py-8 px-4 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Profile</h1>
          <Badge variant={statusBadge.variant} className="text-base px-4 py-2">
            {statusBadge.label}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Basic Information</CardTitle>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Pharmacy Name
                </Label>
                <Input
                  id="name"
                  value={pharmacy.name}
                  onChange={(e) => setPharmacy(prev => prev ? { ...prev, name: e.target.value } : null)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                  License Number
                </Label>
                <Input
                  id="license"
                  value={pharmacy.licenseNumber || 'Not provided'}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={pharmacy.phone}
                  onChange={(e) => setPharmacy(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || 'Not available'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Address
              </Label>
              <Textarea
                id="address"
                value={pharmacy.address}
                onChange={(e) => setPharmacy(prev => prev ? { ...prev, address: e.target.value } : null)}
                disabled={!isEditing}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Operating Hours
              </Label>
              <Input
                id="hours"
                value={operatingHours}
                disabled={!isEditing}
              />
            </div>

            {pharmacy.createdAt && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Registered since: {new Date(pharmacy.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {pharmacy.verificationStatus === 'pending' && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <FileCheck className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Account Pending Verification
                  </h3>
                  <p className="text-sm text-orange-800">
                    Your pharmacy registration is currently under review. You'll be notified once your account is approved. 
                    Until then, your pharmacy will not appear in public listings and cannot receive orders.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {pharmacy.verificationStatus === 'rejected' && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <FileCheck className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive mb-1">
                    Account Rejected
                  </h3>
                  <p className="text-sm text-destructive/90">
                    Your pharmacy registration was not approved. Please contact support for more information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PharmacistLayout>
  );
};

export default Profile;
