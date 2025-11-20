import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Address = {
  id: string;
  nickname: "Home" | "Work" | "Mom's" | "Other";
  fullName: string;
  address: string; // Street address
  building: string;
  floor: string;
  phoneNumber: string;
  additionalDetails: string;
};

type AddressContextType = {
  addresses: Address[];
  saveAddress: (address: Omit<Address, "id"> | Address) => void;
  deleteAddress: (id: string) => void;
  getAddresses: () => Address[];
  getAddressById: (id: string) => Address | undefined;
};

const AddressContext = createContext<AddressContextType | undefined>(undefined);

const STORAGE_KEY = "pharmfind_addresses";

export const AddressProvider = ({ children }: { children: ReactNode }) => {
  const [addresses, setAddresses] = useState<Address[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  }, [addresses]);

  const saveAddress = (addressData: Omit<Address, "id"> | Address) => {
    if ("id" in addressData) {
      // Update existing address
      setAddresses((prev) =>
        prev.map((addr) => (addr.id === addressData.id ? addressData : addr))
      );
    } else {
      // Add new address
      const newAddress: Address = {
        ...addressData,
        id: Date.now().toString(),
      };
      setAddresses((prev) => [...prev, newAddress]);
    }
  };

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== id));
  };

  const getAddresses = () => addresses;

  const getAddressById = (id: string) => {
    return addresses.find((addr) => addr.id === id);
  };

  return (
    <AddressContext.Provider
      value={{ addresses, saveAddress, deleteAddress, getAddresses, getAddressById }}
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
