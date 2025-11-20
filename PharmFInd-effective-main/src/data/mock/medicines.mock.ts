/**
 * Mock Medicine Data
 * 
 * TODO (Backend): Delete this file when real API is implemented
 * This data is used by services when API_CONFIG.useMockData = true
 */

import { Medicine } from "@/types";

export const mockMedicines: Medicine[] = [
  {
    id: 1,
    name: "Panadol Extra",
    category: "Pain Relief",
    basePrice: 25,
    description: "Fast relief from headaches and pain",
    manufacturer: "GSK",
    requiresPrescription: false,
  },
  {
    id: 2,
    name: "Augmentin 1g",
    category: "Antibiotics",
    basePrice: 85,
    description: "Broad-spectrum antibiotic",
    manufacturer: "GSK",
    requiresPrescription: true,
  },
  {
    id: 3,
    name: "Vitamin C 1000mg",
    category: "Vitamins",
    basePrice: 45,
    description: "Immune system support",
    manufacturer: "Various",
    requiresPrescription: false,
  },
  {
    id: 4,
    name: "Congestal",
    category: "Cold & Flu",
    basePrice: 30,
    description: "Relief from cold and flu symptoms",
    manufacturer: "Various",
    requiresPrescription: false,
  },
  {
    id: 5,
    name: "Claritine",
    category: "Allergy",
    basePrice: 55,
    description: "24-hour allergy relief",
    manufacturer: "Bayer",
    requiresPrescription: false,
  },
  {
    id: 6,
    name: "Antinal",
    category: "Digestive Health",
    basePrice: 35,
    description: "Treatment for diarrhea",
    manufacturer: "Various",
    requiresPrescription: false,
  },
  {
    id: 7,
    name: "Band-Aid Pack",
    category: "First Aid",
    basePrice: 20,
    description: "Sterile adhesive bandages",
    manufacturer: "Johnson & Johnson",
    requiresPrescription: false,
  },
  {
    id: 8,
    name: "Hand Sanitizer",
    category: "Hygiene",
    basePrice: 15,
    description: "70% alcohol hand sanitizer",
    manufacturer: "Various",
    requiresPrescription: false,
  },
];
