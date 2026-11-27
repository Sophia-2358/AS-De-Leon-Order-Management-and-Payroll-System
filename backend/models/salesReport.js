import pool from '../../db.js';

// WBS 1.2.1 - Query completed orders within a date range and optional product filter for the sales report
export const fetchForReport = async (date_from, date_to, product) => {
    let sql = `
        SELECT o.id, o.order_no, o.product, o.total_amount, o.amount_paid,
               o.status, o.created_at,
               COALESCE(o.customer_name, u.full_name) AS customer_name,
               DATE_FORMAT(o.created_at, '%Y-%m') AS month_key
        FROM orders o
        LEFT JOIN users u ON u.id = o.customer_id
        WHERE o.status = 'completed'
          AND DATE(o.created_at) BETWEEN ? AND ?`;
    const params = [date_from, date_to];
    if (product) { sql += ` AND o.product = ?`; params.push(product); }
    sql += ` ORDER BY o.created_at ASC`;
    const [rows] = await pool.query(sql, params);
    return rows;
};
