import * as orderModel from '../../models/SalesReport.js';

const fail = (status, message) => Object.assign(new Error(message), { status });

export const generateReport = async (date_from, date_to, product) => {
    if (!date_from || !date_to) throw fail(400, 'date_from and date_to are required.');
    if (date_to < date_from)   throw fail(400, 'The end date cannot be before the start date.');

    // WBS 1.2.1 - Retrieve completed orders within the specified date range and product filter
    const orders      = await orderModel.fetchForReport(date_from, date_to, product || null);
};

// WBS 1.2.2 - Aggregate total sales, order count, and average order value
    const total_sales = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const order_count = orders.length;
    const avg_order   = order_count > 0 ? total_sales / order_count : 0;
 

    return {
        // WBS 1.2.2 - Return the computed summary metrics
        summary: {
            total_sales:  parseFloat(total_sales.toFixed(2)),
            order_count,
            avg_order:    parseFloat(avg_order.toFixed(2))
        },

    }   
