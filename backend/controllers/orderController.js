import * as orderService from '../../services/transaction-status/orderService.js';

const sendError = (res, label, error, fallback) => {
    console.error(`${label}:`, error);
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: fallback });
};


export const getAllOrders  = async (req, res) => {
    try { return res.status(200).json({ success: true, data: await orderService.fetchAllOrders() }); }
    catch (e) { return sendError(res, 'Get Orders', e, 'Could not retrieve orders.'); }
};


export const getCustomers  = async (req, res) => {
    try {
        const { default: pool } = await import('../../../db.js');
        const [rows] = await pool.query(
            `SELECT id, full_name, email FROM users WHERE role != 'owner' ORDER BY full_name ASC`
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (e) { return sendError(res, 'Get Customers', e, 'Could not retrieve customers.'); }
};


export const createOrder   = async (req, res) => {
    try {
        const result = await orderService.createOrder(req.body);
        return res.status(201).json({ success: true, message: 'Order created.', data: result });
    } catch (e) { return sendError(res, 'Create Order', e, 'Could not create order.'); }
};

//  Retrieve full order details including items, payments, and progress
export const getOrderById  = async (req, res) => {
    try { return res.status(200).json({ success: true, data: await orderService.fetchOrderById(Number(req.params.id)) }); }
    catch (e) { return sendError(res, 'Get Order', e, 'Could not retrieve order.'); }
};

