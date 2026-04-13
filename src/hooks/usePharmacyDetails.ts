import { useEffect, useState } from "react";
import { PharmaciesService } from "@/services/pharmacies.service";

export type PharmacyDetails = {
  id: number;
  name: string;
  address: string;
  phone: string;
};

type PharmacyDetailsMap = Record<number, PharmacyDetails>;

export const usePharmacyDetails = (pharmacyIds: number[]) => {
  const [pharmacyDetails, setPharmacyDetails] = useState<PharmacyDetailsMap>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const uniquePharmacyIds = [...new Set(pharmacyIds)].filter((pharmacyId) => Number.isFinite(pharmacyId));

    if (uniquePharmacyIds.length === 0) {
      setPharmacyDetails({});
      setIsLoading(false);
      return;
    }

    const loadPharmacyDetails = async () => {
      setIsLoading(true);
      try {
        const details = await Promise.all(
          uniquePharmacyIds.map(async (pharmacyId) => {
            const pharmacy = await PharmaciesService.getPharmacyById(pharmacyId);
            return pharmacy
              ? [
                  pharmacyId,
                  {
                    id: pharmacy.id,
                    name: pharmacy.name,
                    address: pharmacy.address,
                    phone: pharmacy.phone,
                  },
                ]
              : null;
          }),
        );

        setPharmacyDetails(
          details.reduce((acc, entry) => {
            if (entry) {
              acc[entry[0]] = entry[1];
            }
            return acc;
          }, {} as PharmacyDetailsMap),
        );
      } catch (error) {
        console.error("Failed to load pharmacy details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPharmacyDetails();
  }, [pharmacyIds]);

  return {
    pharmacyDetails,
    isLoading,
  };
};
