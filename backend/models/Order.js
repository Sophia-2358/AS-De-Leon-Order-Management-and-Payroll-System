import pool from '../../../db.js';


export const fetchAll = async () => {
    const [rows] = await pool.query(
        `SELECT
            o.id, o.order_no, o.product, o.product_type, o.status, o.payment_status,
            o.total_amount, o.amount_paid, o.material_total, o.labor_amount,
            o.labor_percentage, o.contact_no, o.site_address, o.order_date, o.created_at,
            COALESCE(o.customer_name, u.full_name) AS customer_name
         FROM orders o
         LEFT JOIN users u ON u.id = o.customer_id
         ORDER BY o.created_at DESC`
    );
    return rows;
};

export const insert = async (order) => {
    const [result] = await pool.query(
        `INSERT INTO orders
            (order_no, customer_id, product_type, product, contact_no, site_address, install_date, message, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'for_approval')`,
        [
            order.order_no,
            order.customer_id,
            order.product_type ?? 'glass_aluminum',
            order.product      ?? null,
            order.contact_no   ?? null,
            order.site_address ?? null,
            order.install_date ?? null,
            order.message      ?? null
        ]
    );
    return result.insertId;
};

export const insertDirect = async (order) => {
    const [result] = await pool.query(
        `INSERT INTO orders
            (order_no, customer_name, product_type, product, order_date, contact_no, site_address, message, status)
         VALUES (?, ?, 'glass_aluminum', ?, ?, ?, ?, ?, 'for_approval')`,
        [
            order.order_no,
            order.customer_name,
            order.product      ?? null,
            order.order_date   ?? null,
            order.contact_no   ?? null,
            order.site_address ?? null,
            order.message      ?? null
        ]
    );
    return result.insertId;
};

// Retrieve a single order by ID with customer email for the details panel
export const findById = async (id) => {
    const [rows] = await pool.query(
        `SELECT o.*,
            COALESCE(o.customer_name, u.full_name) AS customer_name,
            u.email AS customer_email
         FROM orders o
         LEFT JOIN users u ON u.id = o.customer_id
         WHERE o.id = ? LIMIT 1`,
        [id]
    );
    return rows[0] ?? null;
};

// WBS 1.1.3 - Count active (non-completed, non-declined) orders for capacity enforcement
export const countActive = async () => {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM orders WHERE status NOT IN ('completed','declined')`
    );
    return Number(rows[0].cnt);
};

// WBS 1.1.3 - Update the status (and optional decline reason) of an order
export const updateStatus = async (id, status, decline_reason = null) => {
    const [result] = await pool.query(
        `UPDATE orders SET status = ?, decline_reason = ? WHERE id = ?`,
        [status, decline_reason, id]
    );
    return result.affectedRows;
};

// WBS 1.1.4 - Insert a payment record and recompute amount_paid and payment_status
export const recordPayment = async (id, amount) => {
    await pool.query(
        `INSERT INTO order_payments (order_id, amount) VALUES (?, ?)`,
        [id, amount]
    );
    await pool.query(
        `UPDATE orders o
         SET
            amount_paid    = (SELECT COALESCE(SUM(p.amount),0) FROM order_payments p WHERE p.order_id = o.id),
            payment_status = CASE
                WHEN (SELECT COALESCE(SUM(p.amount),0) FROM order_payments p WHERE p.order_id = o.id) <= 0 THEN 'unpaid'
                WHEN (SELECT COALESCE(SUM(p.amount),0) FROM order_payments p WHERE p.order_id = o.id) >= o.total_amount THEN 'paid'
                ELSE 'partial'
            END
         WHERE o.id = ?`,
        [id]
    );
};

/*WBS 1.1.5 - Recalculate material_total from items, then recompute labor and total*/
export const recalcTotals = async (id) => {
    // Sum all item prices (price is already the total for that line, not per unit)
    await pool.query(
        `UPDATE orders
         SET material_total = (
             SELECT COALESCE(SUM(price), 0)
             FROM order_items WHERE order_id = ?
         )
         WHERE id = ?`,
        [id, id]
    );
    // Recompute labor and total if labor_percentage is set
    await pool.query(
        `UPDATE orders
         SET
            labor_amount  = CASE WHEN labor_percentage IS NOT NULL
                                 THEN ROUND(material_total * labor_percentage / 100, 2)
                                 ELSE 0 END,
            total_amount  = material_total +
                            CASE WHEN labor_percentage IS NOT NULL
                                 THEN ROUND(material_total * labor_percentage / 100, 2)
                                 ELSE 0 END
         WHERE id = ?`,
        [id]
    );
};

// WBS 1.1.5 - Set labor percentage and recompute amounts
export const setLaborPercentage = async (id, percentage) => {
    const [rows] = await pool.query(
        `SELECT material_total FROM orders WHERE id = ?`, [id]
    );
    const materialTotal = Number(rows[0]?.material_total ?? 0);
    const laborAmount   = Math.round(materialTotal * percentage / 100 * 100) / 100;
    const totalAmount   = Math.round((materialTotal + laborAmount) * 100) / 100;

    await pool.query(
        `UPDATE orders
         SET labor_percentage = ?, labor_amount = ?, total_amount = ?,
             payment_status = CASE
                WHEN amount_paid <= 0 THEN 'unpaid'
                WHEN amount_paid >= ? THEN 'paid'
                ELSE 'partial'
             END
         WHERE id = ?`,
        [percentage, laborAmount, totalAmount, totalAmount, id]
    );
};
