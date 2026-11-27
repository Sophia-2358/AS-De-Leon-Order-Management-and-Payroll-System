import * as orderModel from '../../models/SalesReport.js';

const fail = (status, message) => Object.assign(new Error(message), { status });

export const generateReport = async (date_from, date_to, product) => {
    if (!date_from || !date_to) throw fail(400, 'date_from and date_to are required.');
    if (date_to < date_from)   throw fail(400, 'The end date cannot be before the start date.');

    // WBS 1.2.1 - Retrieve completed orders within the specified date range and product filter
    const orders      = await orderModel.fetchForReport(date_from, date_to, product || null);
};

