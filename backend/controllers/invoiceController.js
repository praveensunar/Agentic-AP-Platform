const db = require('../models/db');
const { startProcessingPipeline } = require('../sockets/invoiceProcessor');

// Holds the Socket.IO server instance, injected from server.js
let socketIOInstance = null;

const setIO = (socketServer) => {
  socketIOInstance = socketServer;
};

// POST /api/invoices
const createInvoice = async (request, response, next) => {
  try {
    const { invoiceNumber, vendor, amount, currency } = request.body;

    if (!invoiceNumber || !amount) {
      return response.status(400).json({
        success: false,
        message: 'invoiceNumber and amount are required.',
      });
    }

    // Check unique invoice number
    const existing = db.findOne('invoices', inv => inv.invoiceNumber === invoiceNumber);
    if (existing) {
      return response.status(400).json({
        success: false,
        message: `Invoice number ${invoiceNumber} already exists.`,
      });
    }

    // Use the uploaded file name if a file was attached, otherwise fallback
    const uploadedFileName = request.file
      ? request.file.filename
      : request.body.fileName || 'manual-entry';

    const newInvoice = db.create('invoices', {
      invoiceNumber,
      vendor: vendor || null,
      amount: parseFloat(amount),
      currency: currency || 'INR',
      fileName: uploadedFileName,
      status: 'Uploaded',
      confidenceScore: null,
      uploadedAt: new Date().toISOString()
    });

    const invoiceWithVendor = {
      ...newInvoice,
      vendor: db.findById('vendors', newInvoice.vendor) || null
    };

    // Kick off the async AI processing pipeline in the background
    if (socketIOInstance) {
      startProcessingPipeline(socketIOInstance, newInvoice._id);
    }

    response.status(201).json({ success: true, data: invoiceWithVendor });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices
const getInvoices = async (request, response, next) => {
  try {
    const {
      status,
      vendor,
      search,
      page = 1,
      limit = 20,
      sort = '-uploadedAt',
    } = request.query;

    const filterConditions = (invoice) => {
      if (status && invoice.status !== status) return false;
      if (vendor && invoice.vendor !== vendor) return false;
      if (search) {
        const regex = new RegExp(search, 'i');
        if (!regex.test(invoice.invoiceNumber)) return false;
      }
      return true;
    };

    const invoices = db.find('invoices', filterConditions);

    // Populate vendor
    const invoicesWithVendor = invoices.map(inv => ({
      ...inv,
      vendor: db.findById('vendors', inv.vendor) || null
    }));

    // Sorting
    const isDesc = sort.startsWith('-');
    const sortField = isDesc ? sort.substring(1) : sort;

    invoicesWithVendor.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle vendor sorting nested object
      if (sortField === 'vendor') {
        valA = a.vendor ? a.vendor.vendorName : '';
        valB = b.vendor ? b.vendor.vendorName : '';
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return isDesc ? 1 : -1;
      if (valA > valB) return isDesc ? -1 : 1;
      return 0;
    });

    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const totalInvoices = invoicesWithVendor.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedInvoices = invoicesWithVendor.slice(startIndex, startIndex + itemsPerPage);

    response.json({
      success: true,
      data: paginatedInvoices,
      pagination: {
        total: totalInvoices,
        page: currentPage,
        limit: itemsPerPage,
        pages: Math.ceil(totalInvoices / itemsPerPage),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/:id
const getInvoiceById = async (request, response, next) => {
  try {
    const invoiceId = request.params.id;
    const foundInvoice = db.findById('invoices', invoiceId);

    if (!foundInvoice) {
      return response.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const populatedInvoice = {
      ...foundInvoice,
      vendor: db.findById('vendors', foundInvoice.vendor) || null
    };

    response.json({ success: true, data: populatedInvoice });
  } catch (error) {
    next(error);
  }
};

// PUT /api/invoices/:id
const updateInvoice = async (request, response, next) => {
  try {
    const invoiceId = request.params.id;
    const updatedFields = request.body;

    // Remove populated vendor object if it was sent by client
    if (updatedFields.vendor && typeof updatedFields.vendor === 'object') {
      updatedFields.vendor = updatedFields.vendor._id;
    }

    const updatedInvoice = db.findByIdAndUpdate('invoices', invoiceId, updatedFields);

    if (!updatedInvoice) {
      return response.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const populatedInvoice = {
      ...updatedInvoice,
      vendor: db.findById('vendors', updatedInvoice.vendor) || null
    };

    response.json({ success: true, data: populatedInvoice });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/invoices/:id
const deleteInvoice = async (request, response, next) => {
  try {
    const invoiceId = request.params.id;
    const deletedInvoice = db.findByIdAndDelete('invoices', invoiceId);

    if (!deletedInvoice) {
      return response.status(404).json({ success: false, message: 'Invoice not found' });
    }

    response.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  setIO,
};
