export type AddressNickname = "Home" | "Work" | "Mom's" | "Other";

export interface Address {
  id: string;
  nickname: AddressNickname;
  fullName: string;
  address: string;
  building: string;
  floor: string;
  phoneNumber: string;
  additionalDetails: string;
}

export interface CreateAddressData extends Omit<Address, "id"> {}
