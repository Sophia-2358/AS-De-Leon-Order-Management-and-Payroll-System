import * as orderModel from '../../models/transaction-status/Order.js';
import pool from '../../../db.js';

export const fetchAllOrders = async () => await orderModel.fetchAll();

// ==========================================
// CREATE ORDER
// ==========================================

export const createOrder = async (data) => {
    const { customer_name, product, order_date, contact_no, site_address, message } = data;

    if (!customer_name || !customer_name.trim()) throw fail(400, 'Please enter a customer name.');
    if (!product)                                throw fail(400, 'Please select a product.');
    if (!order_date)                             throw fail(400, 'Please enter the order date.');

    const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM orders`);
    const orderNo = `ORD-${String(Number(rows[0].cnt) + 1).padStart(4, '0')}`;

    const insertId = await orderModel.insertDirect({
        order_no:      orderNo,
        customer_name: customer_name.trim(),
        product:       product,
        order_date:    order_date,
        contact_no:    contact_no   ?? null,
        site_address:  site_address ?? null,
        message:       message      ?? null
    });
    return { id: insertId, order_no: orderNo };
};

// ==========================================
// FETCH ONE ORDER
// ==========================================
export const fetchOrderById = async (id) => {
    const order = await orderModel.findById(id);
    if (!order) throw fail(404, 'Order not found.');
    const items    = await itemModel.fetchByOrderId(id);
    const [payments] = await pool.query(
        `SELECT * FROM order_payments WHERE order_id = ? ORDER BY recorded_at ASC`, [id]
    );
    const activeCount = await orderModel.countActive();
    return { ...order, items, payments, active_count: activeCount, capacity_limit: CAPACITY_LIMIT };
};
// ==========================================
// APPROVE / DECLINE
// ==========================================
// WBS 1.1.3 - Approve an order, enforce capacity limit, and seed the first measurement item
export const approveOrder = async (id) => {
    const order = await orderModel.findById(id);
    if (!order) throw fail(404, 'Order not found.');
    if (order.status !== 'for_approval') throw fail(400, 'Only orders awaiting approval can be approved.');
    const active = await orderModel.countActive();
    if (active >= CAPACITY_LIMIT) throw fail(400, 'Capacity limit reached. Cannot approve more orders.');
    await orderModel.updateStatus(id, 'approved');

    // Auto-insert the order's product as the first measurement item
    if (order.product) {
        await itemModel.insert({
            order_id: id,
            product:  order.product,
            width:    0,
            height:   0,
            unit:     'ft',
            quantity: 1,
            material: null,
            notes:    null,
            price:    0
        });
    }
};

// ==========================================
// UPDATE STATUS (advance to next step)
// ==========================================
// WBS 1.1.3 - Advance the order through workflow steps, enforcing stage-specific business rules
export const updateOrderStatus = async (id) => {
    const order = await orderModel.findById(id);
    if (!order) throw fail(404, 'Order not found.');
    const idx = ORDER_STEPS.indexOf(order.status);
    if (idx === -1 || order.status === 'completed') throw fail(400, 'This order cannot be advanced further.');
    if (order.status === 'for_approval') throw fail(400, 'Approve or decline the order first.');
    // Before moving from canvassing to for_payment_materials, all items must have a price
    if (order.status === 'canvassing') {
        const items = await itemModel.fetchByOrderId(id);
        if (items.length === 0) throw fail(400, 'Add at least one item before proceeding.');
        const unpriced = items.filter(i => Number(i.price) <= 0);
        if (unpriced.length > 0) throw fail(400, 'All items must have a price before proceeding.');
    }
    // Before moving from for_payment_materials, labor % must be set and materials must be paid
    if (order.status === 'for_payment_materials') {
        if (!order.labor_percentage) throw fail(400, 'Set the labor percentage before proceeding.');
        if (Number(order.amount_paid) < Number(order.material_total)) {
            throw fail(400, 'Materials must be fully paid before proceeding to fabrication.');
        }
    }
    // Before completing, the full total (materials + labor) must be paid
    if (order.status === 'ready') {
        if (Number(order.amount_paid) < Number(order.total_amount)) {
            throw fail(400, 'The remaining balance must be fully paid before completing the order.');
        }
    }
    const next = ORDER_STEPS[idx + 1];
    await orderModel.updateStatus(id, next);
    return next;
};
// ==========================================
// RECORD PAYMENT
// ==========================================
// WBS 1.1.4 - Validate and record a payment, enforcing balance limits
export const recordPayment = async (id, amount) => {
    const order = await orderModel.findById(id);
    if (!order) throw fail(404, 'Order not found.');
    if (['for_approval','declined'].includes(order.status)) throw fail(400, 'Cannot record payment for this order.');
    const amt = Number(amount);
    if (!amt || amt <= 0) throw fail(400, 'Amount must be greater than 0.');
    const balance = Number(order.total_amount) - Number(order.amount_paid);
    if (amt > balance) throw fail(400, `Amount exceeds the balance of ₱${balance.toFixed(2)}.`);
    await orderModel.recordPayment(id, amt);
};

// WBS 1.1.3 - Set the installation date for an order that is ready or completed
export const setInstallDate = async (id, install_date) => {
    const order = await orderModel.findById(id);
    if (!order) throw fail(404, 'Order not found.');
    if (!['ready','completed'].includes(order.status))
        throw fail(400, 'Installation date can only be set when the order is ready for installation.');
    if (!install_date) throw fail(400, 'Please provide a valid date.');
    await pool.query(`UPDATE orders SET install_date = ? WHERE id = ?`, [install_date, id]);
};

// WBS 1.1.5 - Validate and persist the labor percentage for an order
export const setLabor = async (id, percentage) => {
    const order = await orderModel.findById(id);
    if (!order) throw fail(404, 'Order not found.');
    if (!['canvassing','for_payment_materials'].includes(order.status)) {
        throw fail(400, 'Labor can only be set during canvassing or payment stage.');
    }
    const pct = Number(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) throw fail(400, 'Labor percentage must be between 0 and 100.');
    await orderModel.setLaborPercentage(id, pct);
};

// ==========================================
// SET ITEM PRICE (canvassing stage)
// ==========================================
// WBS 1.1.5 - Set the canvassed price on an item and recalculate the order material total
export const setItemPrice = async (item_id, order_id, price) => {
    const order = await orderModel.findById(order_id);
    if (!order) throw fail(404, 'Order not found.');
    if (!['canvassing','for_payment_materials'].includes(order.status))
        throw fail(400, 'Prices can only be set during canvassing.');
    const p = Number(price);
    if (isNaN(p) || p < 0) throw fail(400, 'Price must be 0 or greater.');
    await itemModel.updatePrice(item_id, p);
    await orderModel.recalcTotals(order_id);
};
