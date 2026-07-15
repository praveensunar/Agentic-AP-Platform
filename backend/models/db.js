const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Ensure database directory exists
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Seed initial mock data
const SEED_DATA = {
  vendors: [
    {
      _id: "v1",
      vendorName: "Acme Corporation",
      vendorCode: "ACME001",
      gstNumber: "27AAAAA1111A1Z1",
      panNumber: "AAAAA1111A",
      email: "billing@acme.com",
      phone: "+91 98765 43210",
      country: "India",
      status: "Active",
      createdAt: new Date(new Date().setDate(new Date().getDate() - 40)).toISOString(),
      updatedAt: new Date(new Date().setDate(new Date().getDate() - 40)).toISOString()
    },
    {
      _id: "v2",
      vendorName: "Globex Industries",
      vendorCode: "GLOBEX02",
      gstNumber: "",
      panNumber: "BBBBB2222B",
      email: "finance@globex.com",
      phone: "+1 555-0199",
      country: "United States",
      status: "Active",
      createdAt: new Date(new Date().setDate(new Date().getDate() - 25)).toISOString(),
      updatedAt: new Date(new Date().setDate(new Date().getDate() - 25)).toISOString()
    },
    {
      _id: "v3",
      vendorName: "Initech Corp",
      vendorCode: "INITECH3",
      gstNumber: "27BBBBB2222B2Z2",
      panNumber: "CCCCC3333C",
      email: "invoices@initech.com",
      phone: "+91 87654 32109",
      country: "India",
      status: "Inactive",
      createdAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
      updatedAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString()
    },
    {
      _id: "v4",
      vendorName: "Stark Enterprises",
      vendorCode: "STARK99",
      gstNumber: "",
      panNumber: "DDDDD4444D",
      email: "accounts@stark.com",
      phone: "+1 800-IRONMAN",
      country: "United States",
      status: "Pending",
      createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
      updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString()
    }
  ],
  invoices: [
    {
      _id: "i1",
      invoiceNumber: "INV-2026-001",
      vendor: "v1",
      amount: 45000,
      currency: "INR",
      status: "Approved",
      confidenceScore: 92,
      fileName: "invoice_acme_jan.pdf",
      uploadedAt: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(),
      createdAt: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString(),
      updatedAt: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString()
    },
    {
      _id: "i2",
      invoiceNumber: "INV-2026-002",
      vendor: "v2",
      amount: 1250,
      currency: "USD",
      status: "Approved",
      confidenceScore: 88,
      fileName: "globex_q1_hosting.pdf",
      uploadedAt: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
      createdAt: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
      updatedAt: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString()
    },
    {
      _id: "i3",
      invoiceNumber: "INV-2026-003",
      vendor: "v1",
      amount: 62000,
      currency: "INR",
      status: "Failed",
      confidenceScore: 42,
      fileName: "invoice_acme_feb.pdf",
      uploadedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
      createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
      updatedAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString()
    },
    {
      _id: "i4",
      invoiceNumber: "INV-2026-004",
      vendor: "v3",
      amount: 18000,
      currency: "INR",
      status: "Human Review",
      confidenceScore: 68,
      fileName: "initech_setup_fees.png",
      uploadedAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
      createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
      updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
    }
  ],
  notifications: [
    {
      _id: "n1",
      title: "Invoice Approved",
      message: "Invoice INV-2026-001 from Acme Corporation has been approved.",
      type: "invoice",
      isRead: true,
      createdAt: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString()
    },
    {
      _id: "n2",
      title: "Invoice Validation Failed",
      message: "Invoice INV-2026-003 failed automated business validation.",
      type: "alert",
      isRead: false,
      createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString()
    },
    {
      _id: "n3",
      title: "New Vendor Added",
      message: "Vendor Stark Enterprises (STARK99) has been added to the system.",
      type: "vendor",
      isRead: false,
      createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString()
    }
  ],
  users: [
    {
      _id: "u1",
      email: "admin@ap.com",
      password: "admin",
      name: "AP Admin",
      role: "Admin"
    },
    {
      _id: "u2",
      email: "user@ap.com",
      password: "user",
      name: "AP User",
      role: "User"
    }
  ]
};

// Helper to read database
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(SEED_DATA);
      return SEED_DATA;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DB] Error reading JSON file database:', err);
    return SEED_DATA;
  }
}

// Helper to write database
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error writing JSON file database:', err);
  }
}

// Generic CRUD operations
const db = {
  find: (collectionName, filterFn = () => true) => {
    const data = readDb();
    return data[collectionName] ? data[collectionName].filter(filterFn) : [];
  },

  findOne: (collectionName, filterFn) => {
    const data = readDb();
    return data[collectionName] ? data[collectionName].find(filterFn) : null;
  },

  findById: (collectionName, id) => {
    const data = readDb();
    return data[collectionName] ? data[collectionName].find(item => item._id === id) : null;
  },

  create: (collectionName, itemData) => {
    const data = readDb();
    if (!data[collectionName]) data[collectionName] = [];
    
    const newItem = {
      _id: `${collectionName.charAt(0)}${Math.random().toString(36).substr(2, 9)}`,
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data[collectionName].push(newItem);
    writeDb(data);
    return newItem;
  },

  findByIdAndUpdate: (collectionName, id, updateData) => {
    const data = readDb();
    if (!data[collectionName]) return null;
    
    const index = data[collectionName].findIndex(item => item._id === id);
    if (index === -1) return null;
    
    const updatedItem = {
      ...data[collectionName][index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    data[collectionName][index] = updatedItem;
    writeDb(data);
    return updatedItem;
  },

  findByIdAndDelete: (collectionName, id) => {
    const data = readDb();
    if (!data[collectionName]) return null;
    
    const index = data[collectionName].findIndex(item => item._id === id);
    if (index === -1) return null;
    
    const deleted = data[collectionName].splice(index, 1)[0];
    writeDb(data);
    return deleted;
  },

  updateMany: (collectionName, filterFn, updateFields) => {
    const data = readDb();
    if (!data[collectionName]) return 0;
    
    let count = 0;
    data[collectionName] = data[collectionName].map(item => {
      if (filterFn(item)) {
        count++;
        return {
          ...item,
          ...updateFields,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    
    if (count > 0) writeDb(data);
    return count;
  },

  countDocuments: (collectionName, filterFn = () => true) => {
    const data = readDb();
    return data[collectionName] ? data[collectionName].filter(filterFn).length : 0;
  }
};

module.exports = db;
