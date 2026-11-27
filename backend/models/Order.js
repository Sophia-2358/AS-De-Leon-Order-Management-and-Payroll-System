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
