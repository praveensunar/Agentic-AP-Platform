const db = require('../models/db');

// Pipeline steps that the invoice goes through before the final decision
const PROCESSING_STATUS_STEPS = [
  { status: 'Processing',           delayMs: 2500 },
  { status: 'OCR Complete',         delayMs: 4000 },
  { status: 'PII Masked',           delayMs: 5500 },
  { status: 'Extraction Complete',  delayMs: 7000 },
  { status: 'Validation Complete',  delayMs: 8500 },
  { status: 'Human Review',         delayMs: 10000 },
];

// Delay before making the final Approved/Failed decision
const FINAL_DECISION_DELAY_MS = 12000;

/**
 * Helper: Saves a notification to the database and broadcasts it to all Socket.IO clients.
 */
async function saveAndBroadcastNotification(socketServer, { title, message, type }) {
  try {
    const savedNotification = db.create('notifications', {
      title,
      message,
      type,
      isRead: false
    });
    socketServer.emit('notification:new', savedNotification);
    return savedNotification;
  } catch (notificationError) {
    console.error('[Socket] Failed to save notification:', notificationError.message);
  }
}

/**
 * Helper: Returns a Promise that resolves after a given number of milliseconds.
 */
function waitFor(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Starts the mock AI processing pipeline for a given invoice.
 * Automatically steps through all statuses and emits real-time updates via Socket.IO.
 *
 * @param {object} socketServer - The Socket.IO server instance
 * @param {string} invoiceId    - The ID of the invoice to process
 */
async function startProcessingPipeline(socketServer, invoiceId) {
  try {
    const invoiceRecord = db.findById('invoices', invoiceId);
    if (!invoiceRecord) return;

    const vendor = db.findById('vendors', invoiceRecord.vendor);
    const vendorDisplayName = vendor ? vendor.vendorName : 'Unknown Vendor';

    // Notify that the invoice has been received and queued
    await saveAndBroadcastNotification(socketServer, {
      title:   'Invoice Uploaded',
      message: `Invoice ${invoiceRecord.invoiceNumber} from ${vendorDisplayName} has been uploaded and queued for processing.`,
      type:    'invoice',
    });

    const startTime = Date.now();

    // Step through each processing status with timed delays
    for (const processingStep of PROCESSING_STATUS_STEPS) {
      const elapsed = Date.now() - startTime;
      const remaining = processingStep.delayMs - elapsed;
      if (remaining > 0) {
        await waitFor(remaining);
      }

      // Check if the invoice has been deleted in the meantime
      const currentRecord = db.findById('invoices', invoiceId);
      if (!currentRecord) {
        console.log(`[Pipeline] Invoice ${invoiceId} was deleted. Stopping processing pipeline.`);
        return;
      }

      // Update the invoice status in database
      db.findByIdAndUpdate('invoices', invoiceId, { status: processingStep.status });

      // Broadcast the status change to all connected clients
      socketServer.emit('invoice:status_update', {
        invoiceId,
        status:        processingStep.status,
        invoiceNumber: invoiceRecord.invoiceNumber,
        timestamp:     new Date().toISOString(),
      });

      // Send a notification for each step
      await saveAndBroadcastNotification(socketServer, {
        title:   `Invoice ${processingStep.status}`,
        message: `Invoice ${invoiceRecord.invoiceNumber} status updated to "${processingStep.status}".`,
        type:    'invoice',
      });
    }

    // ── Final Decision: Approved or Failed ────────────────────────────────────
    const elapsed = Date.now() - startTime;
    const remaining = FINAL_DECISION_DELAY_MS - elapsed;
    if (remaining > 0) {
      await waitFor(remaining);
    }

    // Check if the invoice has been deleted in the meantime
    const currentRecord = db.findById('invoices', invoiceId);
    if (!currentRecord) {
      console.log(`[Pipeline] Invoice ${invoiceId} was deleted before final decision. Stopping pipeline.`);
      return;
    }

    const invoicePassedValidation = Math.random() < 0.85; // 85% approval rate
    const finalStatus = invoicePassedValidation ? 'Approved' : 'Failed';

    // Approved invoices get a high confidence score; failed ones get low
    const confidenceScore = invoicePassedValidation
      ? Math.floor(Math.random() * 15) + 85 // Range: 85–100
      : Math.floor(Math.random() * 40) + 20; // Range: 20–60

    db.findByIdAndUpdate('invoices', invoiceId, { status: finalStatus, confidenceScore });

    socketServer.emit('invoice:status_update', {
      invoiceId,
      status:        finalStatus,
      invoiceNumber: invoiceRecord.invoiceNumber,
      confidenceScore,
      timestamp:     new Date().toISOString(),
    });

    await saveAndBroadcastNotification(socketServer, {
      title: `Invoice ${finalStatus}`,
      message: invoicePassedValidation
        ? `Invoice ${invoiceRecord.invoiceNumber} has been approved with a confidence score of ${confidenceScore}%.`
        : `Invoice ${invoiceRecord.invoiceNumber} failed validation. Manual review is required.`,
      type: invoicePassedValidation ? 'invoice' : 'alert',
    });
  } catch (pipelineError) {
    console.error('[Pipeline] Error while processing invoice:', pipelineError.message);
  }
}

module.exports = { startProcessingPipeline };
