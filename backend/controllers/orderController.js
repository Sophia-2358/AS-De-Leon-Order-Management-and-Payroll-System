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

// WBS 1.1.3 - Approve an order and advance it from for_approval to approved
export const approveOrder  = async (req, res) => {
    try { await orderService.approveOrder(Number(req.params.id)); return res.status(200).json({ success: true, message: 'Order approved.' }); }
    catch (e) { return sendError(res, 'Approve Order', e, 'Could not approve order.'); }
};

// WBS 1.1.3 - Decline an order and set its status to declined
export const declineOrder  = async (req, res) => {
    try { await orderService.declineOrder(Number(req.params.id)); return res.status(200).json({ success: true, message: 'Order declined.' }); }
    catch (e) { return sendError(res, 'Decline Order', e, 'Could not decline order.'); }
};// WBS 1.1.3 - Advance an order to its next workflow status step
export const nextStatus    = async (req, res) => {
    try {
        const next = await orderService.updateOrderStatus(Number(req.params.id));
        return res.status(200).json({ success: true, message: `Status updated to ${next}.`, status: next });
    } catch (e) { return sendError(res, 'Update Status', e, 'Could not update status.'); }
};
// WBS 1.1.4 - Record a payment against an order and update payment status
export const recordPayment = async (req, res) => {
    try { await orderService.recordPayment(Number(req.params.id), req.body.amount); return res.status(201).json({ success: true, message: 'Payment recorded.' }); }
    catch (e) { return sendError(res, 'Record Payment', e, 'Could not record payment.'); }
};
// WBS 1.1.3 - Set the installation date for a ready or completed order
export const setInstallDate = async (req, res) => {
    try {
        await orderService.setInstallDate(Number(req.params.id), req.body.install_date);
        return res.status(200).json({ success: true, message: 'Installation date set.' });
    } catch (e) { return sendError(res, 'Set Install Date', e, 'Could not set installation date.'); }
};

