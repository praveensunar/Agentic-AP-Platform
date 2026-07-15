const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  createInvoice, getInvoices, getInvoiceById, updateInvoice, deleteInvoice,
} = require('../controllers/invoiceController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Require authentication for all invoice routes
router.use(requireAuth);

router.post('/', upload.single('file'), createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);

// Only Admin can update or delete invoices
router.put('/:id', requireRole(['Admin']), updateInvoice);
router.delete('/:id', requireRole(['Admin']), deleteInvoice);

module.exports = router;
