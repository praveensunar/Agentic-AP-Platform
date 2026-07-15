const db = require('../models/db');

// GET /api/dashboard
const getDashboard = async (request, response, next) => {
  try {
    const invoices = db.find('invoices');
    const vendors = db.find('vendors');

    const totalInvoiceCount = invoices.length;
    const totalVendorCount = vendors.length;

    // Group invoices by status
    const statusCounts = {};
    invoices.forEach(inv => {
      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
    });
    const statusBreakdownList = Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status]
    }));

    // Fetch the 5 most recently uploaded invoices
    const sortedInvoices = [...invoices].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    const recentInvoiceList = sortedInvoices.slice(0, 5).map(inv => ({
      ...inv,
      vendor: db.findById('vendors', inv.vendor) || null
    }));

    // Group invoices by year+month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = {};
    invoices.forEach(inv => {
      const date = new Date(inv.uploadedAt);
      if (date >= sixMonthsAgo) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;
        if (!monthlyData[key]) {
          monthlyData[key] = { year, month, count: 0, amount: 0 };
        }
        monthlyData[key].count++;
        monthlyData[key].amount += inv.amount;
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyChartData = Object.values(monthlyData)
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
      .map(entry => ({
        month: monthNames[entry.month - 1],
        count: entry.count,
        amount: entry.amount
      }));

    // Calculate total approved amount
    const approvedInvoices = invoices.filter(inv => inv.status === 'Approved');
    const totalApprovedAmount = approvedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const approvedInvoiceCount = approvedInvoices.length;

    const failedInvoiceCount = invoices.filter(inv => inv.status === 'Failed').length;
    const pendingInvoiceCount = totalInvoiceCount - approvedInvoiceCount - failedInvoiceCount;

    response.json({
      success: true,
      data: {
        summary: {
          totalInvoices: totalInvoiceCount,
          totalVendors: totalVendorCount,
          approvedAmount: totalApprovedAmount,
          approvedCount: approvedInvoiceCount,
          failedCount: failedInvoiceCount,
          pendingCount: pendingInvoiceCount,
        },
        statusBreakdown: statusBreakdownList,
        monthlyChart: monthlyChartData,
        recentInvoices: recentInvoiceList,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/vendor-dashboard
const getVendorDashboard = async (request, response, next) => {
  try {
    const invoices = db.find('invoices');
    const vendors = db.find('vendors');

    // Counts for cards
    const totalVendors = vendors.length;
    const activeVendors = vendors.filter(v => v.status === 'Active').length;
    const inactiveVendors = vendors.filter(v => v.status === 'Inactive').length;
    const pendingVendors = vendors.filter(v => v.status === 'Pending').length;

    // Vendor performance stats
    const vendorStatsList = vendors.map(vendor => {
      const vendorInvoices = invoices.filter(inv => inv.vendor === vendor._id);
      const invoiceCount = vendorInvoices.length;
      const totalAmount = vendorInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const approvedCount = vendorInvoices.filter(inv => inv.status === 'Approved').length;
      const failedCount = vendorInvoices.filter(inv => inv.status === 'Failed').length;

      const confScores = vendorInvoices.filter(inv => inv.confidenceScore !== null && inv.confidenceScore !== undefined).map(inv => inv.confidenceScore);
      const avgConfidenceScore = confScores.length > 0
        ? Math.round(confScores.reduce((sum, val) => sum + val, 0) / confScores.length)
        : null;

      const approvalRate = invoiceCount > 0 ? Math.round((approvedCount / invoiceCount) * 100) : 0;

      return {
        _id: vendor._id,
        vendorName: vendor.vendorName,
        vendorCode: vendor.vendorCode,
        country: vendor.country || 'India',
        status: vendor.status,
        createdAt: vendor.createdAt,
        invoiceCount,
        totalAmount,
        approvedCount,
        failedCount,
        avgConfidenceScore,
        approvalRate
      };
    });

    // Sort by invoice count descending
    vendorStatsList.sort((a, b) => b.invoiceCount - a.invoiceCount);

    // Country Distribution Grouping
    const countryCounts = {};
    vendors.forEach(v => {
      const country = v.country || 'India';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    const countryDistribution = Object.keys(countryCounts).map(country => ({
      country,
      count: countryCounts[country]
    }));

    // Monthly Creation Grouping (Last 12 months registration)
    const monthlyCreationCounts = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    vendors.forEach(v => {
      const date = new Date(v.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthlyCreationCounts[key]) {
        monthlyCreationCounts[key] = { year: date.getFullYear(), monthIndex: date.getMonth(), count: 0 };
      }
      monthlyCreationCounts[key].count++;
    });
    const monthlyCreation = Object.values(monthlyCreationCounts)
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.monthIndex - b.monthIndex))
      .map(entry => ({
        month: `${monthNames[entry.monthIndex]} ${entry.year}`,
        count: entry.count
      }));

    response.json({
      success: true,
      data: {
        summary: {
          totalVendors,
          activeVendors,
          inactiveVendors,
          pendingVendors
        },
        countryDistribution,
        monthlyCreation,
        performance: vendorStatsList
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getVendorDashboard };
