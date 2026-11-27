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
