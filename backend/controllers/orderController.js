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
// WBS 1.1.5 - Set the labor percentage and trigger total amount recomputation
export const setLabor      = async (req, res) => {
    try {
        await orderService.setLabor(Number(req.params.id), req.body.percentage);
        return res.status(200).json({ success: true, message: 'Labor percentage set.' });
    } catch (e) { return sendError(res, 'Set Labor', e, 'Could not set labor percentage.'); }
};
// WBS 1.1.6 - Add a new measurement item to an order
export const addItem       = async (req, res) => {
    try { const id = await orderService.addItem(Number(req.params.id), req.body); return res.status(201).json({ success: true, message: 'Item added.', data: { id } }); }
    catch (e) { return sendError(res, 'Add Item', e, 'Could not add item.'); }
};

// WBS 1.1.6 - Edit the dimensions and details of an existing measurement item
export const editItem      = async (req, res) => {
    try { await orderService.editItem(Number(req.params.item_id), Number(req.params.id), req.body); return res.status(200).json({ success: true, message: 'Item updated.' }); }
    catch (e) { return sendError(res, 'Edit Item', e, 'Could not update item.'); }
};

// WBS 1.1.5 - Set the canvassed price for a specific measurement item
export const setItemPrice  = async (req, res) => {
    try {
        await orderService.setItemPrice(Number(req.params.item_id), Number(req.params.id), req.body.price);
        return res.status(200).json({ success: true, message: 'Item price updated.' });
    } catch (e) { return sendError(res, 'Set Item Price', e, 'Could not update item price.'); }
};
// WBS 1.1.6 - Delete a measurement item from an order
export const deleteItem    = async (req, res) => {
    try { await orderService.deleteItem(Number(req.params.item_id), Number(req.params.id)); return res.status(200).json({ success: true, message: 'Item deleted.' }); }
    catch (e) { return sendError(res, 'Delete Item', e, 'Could not delete item.'); }
};

