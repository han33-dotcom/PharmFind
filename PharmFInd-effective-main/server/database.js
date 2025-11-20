/**
 * Simple JSON file-based database for PharmFind
 * In production, replace with a real database (PostgreSQL, MongoDB, etc.)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_DIR = path.join(__dirname, 'data');
const DB_FILES = {
  users: path.join(DB_DIR, 'users.json'),
  medicines: path.join(DB_DIR, 'medicines.json'),
  pharmacies: path.join(DB_DIR, 'pharmacies.json'),
  pharmacyInventory: path.join(DB_DIR, 'pharmacy_inventory.json'),
  orders: path.join(DB_DIR, 'orders.json'),
  addresses: path.join(DB_DIR, 'addresses.json'),
  favorites: path.join(DB_DIR, 'favorites.json'),
  emailVerifications: path.join(DB_DIR, 'email_verifications.json'),
};

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database files if they don't exist
Object.entries(DB_FILES).forEach(([key, filePath]) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
});

class Database {
  static read(collection) {
    try {
      const data = fs.readFileSync(DB_FILES[collection], 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${collection}:`, error);
      return [];
    }
  }

  static write(collection, data) {
    try {
      fs.writeFileSync(DB_FILES[collection], JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${collection}:`, error);
      return false;
    }
  }

  // User operations
  static createUser(user) {
    const users = this.read('users');
    users.push(user);
    this.write('users', users);
    return user;
  }

  static findUserByEmail(email) {
    const users = this.read('users');
    return users.find(u => u.email === email);
  }

  static findUserById(id) {
    const users = this.read('users');
    return users.find(u => u.id === id);
  }

  static updateUser(id, updates) {
    const users = this.read('users');
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...updates };
    this.write('users', users);
    return users[index];
  }

  // Email verification operations
  static createVerificationToken(userId, token) {
    const verifications = this.read('emailVerifications');
    // Remove old tokens for this user
    const filtered = verifications.filter(v => v.userId !== userId);
    
    const verification = {
      userId,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
    
    filtered.push(verification);
    this.write('emailVerifications', filtered);
    return verification;
  }

  static findVerificationToken(token) {
    const verifications = this.read('emailVerifications');
    return verifications.find(v => v.token === token);
  }

  static deleteVerificationToken(token) {
    const verifications = this.read('emailVerifications');
    const filtered = verifications.filter(v => v.token !== token);
    this.write('emailVerifications', filtered);
    return true;
  }

  // Medicine operations
  static getAllMedicines() {
    return this.read('medicines');
  }

  static findMedicineById(id) {
    const medicines = this.read('medicines');
    return medicines.find(m => m.id === id);
  }

  static searchMedicines(query) {
    const medicines = this.read('medicines');
    const queryLower = query.toLowerCase();
    return medicines.filter(m => 
      m.name.toLowerCase().includes(queryLower) ||
      m.category.toLowerCase().includes(queryLower)
    );
  }

  // Pharmacy operations
  static getAllPharmacies() {
    return this.read('pharmacies');
  }

  static findPharmacyById(id) {
    const pharmacies = this.read('pharmacies');
    return pharmacies.find(p => p.id === id);
  }

  static findPharmacyByOwnerId(ownerUserId) {
    const pharmacies = this.read('pharmacies');
    return pharmacies.find(p => p.ownerUserId === ownerUserId);
  }

  static createPharmacy(pharmacy) {
    const pharmacies = this.read('pharmacies');
    // Get next ID
    const maxId = pharmacies.length > 0 ? Math.max(...pharmacies.map(p => p.id || 0)) : 0;
    const newPharmacy = {
      ...pharmacy,
      id: maxId + 1,
      verified: pharmacy.verified !== undefined ? pharmacy.verified : false,
      verificationStatus: pharmacy.verificationStatus || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    pharmacies.push(newPharmacy);
    this.write('pharmacies', pharmacies);
    return newPharmacy;
  }

  static updatePharmacy(id, updates) {
    const pharmacies = this.read('pharmacies');
    const index = pharmacies.findIndex(p => p.id === id);
    if (index === -1) return null;

    pharmacies[index] = { 
      ...pharmacies[index], 
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.write('pharmacies', pharmacies);
    return pharmacies[index];
  }

  static verifyPharmacy(id, verified = true) {
    return this.updatePharmacy(id, { 
      verified,
      verificationStatus: verified ? 'approved' : 'rejected',
    });
  }

  // Pharmacy inventory operations
  static getPharmacyInventory() {
    return this.read('pharmacyInventory');
  }

  static getMedicinesByPharmacy(pharmacyId) {
    const inventory = this.read('pharmacyInventory');
    const medicines = this.read('medicines');
    const pharmacies = this.read('pharmacies');
    
    const pharmacy = pharmacies.find(p => p.id === pharmacyId);
    if (!pharmacy) return [];

    const inventoryEntries = inventory.filter(inv => inv.pharmacyId === pharmacyId);
    
    return inventoryEntries.map(inv => {
      const medicine = medicines.find(m => m.id === inv.medicineId);
      if (!medicine) return null;
      
      return {
        ...medicine,
        pharmacyId: pharmacyId,
        pharmacyName: pharmacy.name,
        price: inv.price || medicine.basePrice,
        stockStatus: inv.stockStatus || 'In Stock',
        lastUpdated: inv.lastUpdated || new Date().toISOString(),
      };
    }).filter(Boolean);
  }

  // Order operations
  static createOrder(order) {
    const orders = this.read('orders');
    orders.push(order);
    this.write('orders', orders);
    return order;
  }

  static getUserOrders(userId) {
    const orders = this.read('orders');
    return orders.filter(o => o.userId === userId);
  }

  static findOrderById(orderId) {
    const orders = this.read('orders');
    return orders.find(o => o.orderId === orderId);
  }

  static updateOrderStatus(orderId, status, note) {
    const orders = this.read('orders');
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return null;

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note,
    });
    
    this.write('orders', orders);
    return order;
  }

  // Address operations
  static getUserAddresses(userId) {
    const addresses = this.read('addresses');
    return addresses.filter(a => a.userId === userId);
  }

  static createAddress(address) {
    const addresses = this.read('addresses');
    addresses.push(address);
    this.write('addresses', addresses);
    return address;
  }

  static findAddressById(id) {
    const addresses = this.read('addresses');
    return addresses.find(a => a.id === id);
  }

  static updateAddress(id, updates) {
    const addresses = this.read('addresses');
    const index = addresses.findIndex(a => a.id === id);
    if (index === -1) return null;

    addresses[index] = { ...addresses[index], ...updates };
    this.write('addresses', addresses);
    return addresses[index];
  }

  static deleteAddress(id) {
    const addresses = this.read('addresses');
    const filtered = addresses.filter(a => a.id !== id);
    this.write('addresses', filtered);
    return true;
  }

  // Favorite operations
  static getUserFavorites(userId) {
    const favorites = this.read('favorites');
    return favorites.filter(f => f.userId === userId);
  }

  static createFavorite(favorite) {
    const favorites = this.read('favorites');
    // Check if already exists
    const existingIndex = favorites.findIndex(
      f => f.userId === favorite.userId && f.medicineId === favorite.medicineId
    );
    
    if (existingIndex !== -1) {
      // Update existing
      favorites[existingIndex] = favorite;
    } else {
      // Add new
      favorites.push(favorite);
    }
    
    this.write('favorites', favorites);
    return favorite;
  }

  static removeFavorite(userId, medicineId) {
    const favorites = this.read('favorites');
    const filtered = favorites.filter(
      f => !(f.userId === userId && f.medicineId === medicineId)
    );
    this.write('favorites', filtered);
    return true;
  }

  static isFavorite(userId, medicineId) {
    const favorites = this.read('favorites');
    return favorites.some(
      f => f.userId === userId && f.medicineId === medicineId
    );
  }

  // Initialize with sample data
  static initializeSampleData() {
    // Check if already initialized
    const medicines = this.read('medicines');
    if (medicines.length > 0) return;

    // Initialize medicines
    const sampleMedicines = [
      { id: 1, name: "Panadol Extra", category: "Pain Relief", basePrice: 25, description: "Fast relief from headaches and pain", manufacturer: "GSK", requiresPrescription: false },
      { id: 2, name: "Augmentin 1g", category: "Antibiotics", basePrice: 85, description: "Broad-spectrum antibiotic", manufacturer: "GSK", requiresPrescription: true },
      { id: 3, name: "Vitamin C 1000mg", category: "Vitamins", basePrice: 45, description: "Immune system support", manufacturer: "Various", requiresPrescription: false },
      { id: 4, name: "Congestal", category: "Cold & Flu", basePrice: 30, description: "Relief from cold and flu symptoms", manufacturer: "Various", requiresPrescription: false },
      { id: 5, name: "Claritine", category: "Allergy", basePrice: 55, description: "24-hour allergy relief", manufacturer: "Bayer", requiresPrescription: false },
      { id: 6, name: "Antinal", category: "Digestive Health", basePrice: 35, description: "Treatment for diarrhea", manufacturer: "Various", requiresPrescription: false },
      { id: 7, name: "Band-Aid Pack", category: "First Aid", basePrice: 20, description: "Sterile adhesive bandages", manufacturer: "Johnson & Johnson", requiresPrescription: false },
      { id: 8, name: "Hand Sanitizer", category: "Hygiene", basePrice: 15, description: "70% alcohol hand sanitizer", manufacturer: "Various", requiresPrescription: false },
    ];
    this.write('medicines', sampleMedicines);

    // Initialize pharmacies
    const samplePharmacies = [
      { id: 1, name: "El Ezaby Pharmacy", address: "123 Main St, Beirut, Lebanon", phone: "+961 1 123 456", rating: 4.5, distance: "0.8 km", deliveryTime: "20-30 min", deliveryFee: 15, isOpen: true, latitude: 33.8938, longitude: 35.5018, hours: { open: "08:00", close: "23:00" }, verified: true, verificationStatus: 'approved', ownerUserId: null },
      { id: 2, name: "Seif Pharmacy", address: "456 Downtown, Beirut, Lebanon", phone: "+961 1 234 567", rating: 4.3, distance: "1.2 km", deliveryTime: "25-35 min", deliveryFee: 20, isOpen: true, latitude: 33.8938, longitude: 35.5018, hours: { open: "09:00", close: "22:00" }, verified: true, verificationStatus: 'approved', ownerUserId: null },
      { id: 3, name: "19011 Pharmacy", address: "789 Hamra, Beirut, Lebanon", phone: "+961 1 345 678", rating: 4.7, distance: "2.5 km", deliveryTime: "30-40 min", deliveryFee: 25, isOpen: true, latitude: 33.8938, longitude: 35.5018, hours: { open: "00:00", close: "23:59" }, verified: true, verificationStatus: 'approved', ownerUserId: null },
      { id: 4, name: "Alfa Pharmacy", address: "321 Achrafieh, Beirut, Lebanon", phone: "+961 1 456 789", rating: 4.2, distance: "3.0 km", deliveryTime: "35-45 min", deliveryFee: 30, isOpen: false, latitude: 33.8938, longitude: 35.5018, hours: { open: "08:00", close: "20:00" }, verified: true, verificationStatus: 'approved', ownerUserId: null },
    ];
    this.write('pharmacies', samplePharmacies);

    // Initialize pharmacy inventory
    const sampleInventory = [
      { pharmacyId: 1, medicineId: 1, price: 27, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 1, medicineId: 2, price: 90, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 1, medicineId: 3, price: 50, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 1, medicineId: 4, price: 32, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 1, medicineId: 5, price: 60, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 1, medicineId: 6, price: 38, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 2, medicineId: 1, price: 26, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 2, medicineId: 3, price: 48, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 2, medicineId: 4, price: 31, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 2, medicineId: 7, price: 22, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 2, medicineId: 8, price: 17, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 3, medicineId: 1, price: 28, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 3, medicineId: 2, price: 88, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 3, medicineId: 3, price: 52, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 3, medicineId: 4, price: 33, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 3, medicineId: 5, price: 58, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 3, medicineId: 6, price: 36, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 3, medicineId: 7, price: 21, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 3, medicineId: 8, price: 16, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 4, medicineId: 2, price: 92, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 4, medicineId: 3, price: 47, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 4, medicineId: 5, price: 62, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
      { pharmacyId: 4, medicineId: 6, price: 37, stockStatus: "In Stock", lastUpdated: new Date().toISOString() },
    ];
    this.write('pharmacyInventory', sampleInventory);
  }
}

// Initialize sample data on import
Database.initializeSampleData();

export default Database;

