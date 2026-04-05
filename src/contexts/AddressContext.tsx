import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Address, CreateAddressData } from "@/types";
import { AddressesService } from "@/services/addresses.service";

type AddressContextType = {
  addresses: Address[];
  isLoading: boolean;
  saveAddress: (address: Omit<Address, "id"> | Address) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  getAddresses: () => Address[];
  getAddressById: (id: string) => Address | undefined;
  refreshAddresses: () => Promise<void>;
};

const AddressContext = createContext<AddressContextType | undefined>(undefined);

const hasAuthToken = () => Boolean(localStorage.getItem("auth_token"));

export const AddressProvider = ({ children }: { children: ReactNode }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAddresses = async () => {
    if (!hasAuthToken()) {
      setAddresses([]);
      return;
    }

    setIsLoading(true);
    try {
      const nextAddresses = await AddressesService.getAddresses();
      setAddresses(nextAddresses);
    } catch (error) {
      console.error("Failed to load addresses:", error);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshAddresses();

    const handleAuthChange = () => {
      void refreshAddresses();
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const saveAddress = async (addressData: Omit<Address, "id"> | Address) => {
    try {
      if ("id" in addressData) {
        const updatedAddress = await AddressesService.updateAddress(addressData.id, addressData);
        setAddresses((prev) =>
          prev.map((address) => (address.id === updatedAddress.id ? updatedAddress : address))
        );
        return;
      }

      const createdAddress = await AddressesService.createAddress(addressData as CreateAddressData);
      setAddresses((prev) => [...prev, createdAddress]);
    } catch (error) {
      console.error("Failed to save address:", error);
      throw error;
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await AddressesService.deleteAddress(id);
      setAddresses((prev) => prev.filter((address) => address.id !== id));
    } catch (error) {
      console.error("Failed to delete address:", error);
      throw error;
    }
  };

  const getAddresses = () => addresses;
  const getAddressById = (id: string) => addresses.find((address) => address.id === id);

  return (
    <AddressContext.Provider
      value={{ addresses, isLoading, saveAddress, deleteAddress, getAddresses, getAddressById, refreshAddresses }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddresses = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error("useAddresses must be used within AddressProvider");
  }
  return context;
};
