const db = require('../models/db');

// Holds the Socket.IO server instance, injected from server.js
let socketIOInstance = null;

const setIO = (socketServer) => {
  socketIOInstance = socketServer;
};

// POST /api/vendors
const createVendor = async (request, response, next) => {
  try {
    const { vendorName, vendorCode, email, gstNumber, panNumber, phone, country, status } = request.body;

    if (!vendorName || !vendorCode || !email) {
      return response.status(400).json({
        success: false,
        message: 'vendorName, vendorCode, and email are required.',
      });
    }

    // Check if vendor code is unique
    const existing = db.findOne('vendors', v => v.vendorCode.toUpperCase() === vendorCode.toUpperCase());
    if (existing) {
      return response.status(400).json({
        success: false,
        message: `Vendor code ${vendorCode} already exists.`,
      });
    }

    const newVendor = db.create('vendors', {
      vendorName,
      vendorCode: vendorCode.toUpperCase(),
      email,
      gstNumber: gstNumber || '',
      panNumber: panNumber || '',
      phone: phone || '',
      country: country || 'India',
      status: status || 'Pending',
    });

    // Emit a real-time notification after successful vendor creation
    if (socketIOInstance) {
      const vendorNotification = db.create('notifications', {
        title: 'New Vendor Added',
        message: `Vendor "${newVendor.vendorName}" (${newVendor.vendorCode}) has been added to the system.`,
        type: 'vendor',
        isRead: false,
      });
      socketIOInstance.emit('notification:new', vendorNotification);
    }

    response.status(201).json({ success: true, data: newVendor });
  } catch (error) {
    next(error);
  }
};

// GET /api/vendors
const getVendors = async (request, response, next) => {
  try {
    const {
      search,
      status,
      country,
      page = 1,
      limit = 20,
      sort = 'vendorName',
      order = 'asc',
    } = request.query;

    const filterFn = (vendor) => {
      if (status && vendor.status !== status) return false;
      if (country && !new RegExp(country, 'i').test(vendor.country)) return false;
      if (search) {
        const regex = new RegExp(search, 'i');
        const matches = regex.test(vendor.vendorName) ||
                        regex.test(vendor.vendorCode) ||
                        regex.test(vendor.email);
        if (!matches) return false;
      }
      return true;
    };

    const vendors = db.find('vendors', filterFn);

    // Sorting
    vendors.sort((a, b) => {
      let valA = a[sort] || '';
      let valB = b[sort] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return order === 'desc' ? 1 : -1;
      if (valA > valB) return order === 'desc' ? -1 : 1;
      return 0;
    });

    // Pagination
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const totalVendors = vendors.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedVendors = vendors.slice(startIndex, startIndex + itemsPerPage);

    response.json({
      success: true,
      data: paginatedVendors,
      pagination: {
        total: totalVendors,
        page: currentPage,
        limit: itemsPerPage,
        pages: Math.ceil(totalVendors / itemsPerPage),
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/vendors/:id
const updateVendor = async (request, response, next) => {
  try {
    const vendorId = request.params.id;
    const updatedFields = request.body;

    const updatedVendor = db.findByIdAndUpdate('vendors', vendorId, updatedFields);

    if (!updatedVendor) {
      return response.status(404).json({ success: false, message: 'Vendor not found' });
    }

    response.json({ success: true, data: updatedVendor });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/vendors/:id
const deleteVendor = async (request, response, next) => {
  try {
    const vendorId = request.params.id;
    const deletedVendor = db.findByIdAndDelete('vendors', vendorId);

    if (!deletedVendor) {
      return response.status(404).json({ success: false, message: 'Vendor not found' });
    }

    response.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createVendor, getVendors, updateVendor, deleteVendor, setIO };
