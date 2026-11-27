// WBS 1.1.6 - Implement product measurement details

import pool from '../../db.js';

// WBS 1.1.6 - Retrieve all measurement items for a given order
export const fetchByOrderId = async (order_id) => {
    const [rows] = await pool.query(
        `SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC`,
        [order_id]
    );
    return rows;
};

// WBS 1.1.6 - Insert a new measurement item record for an order
export const insert = async (item) => {
    const [result] = await pool.query(
        `INSERT INTO order_items (order_id, product, width, height, unit, quantity, material, color, notes, price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            item.order_id,
            item.product,
            item.width,
            item.height,
            item.unit     ?? 'ft',
            item.quantity ?? 1,
            item.material ?? null,
            item.color    ?? null,
            item.notes    ?? null,
            item.price    ?? 0
        ]
    );
    return result.insertId;
};

// WBS 1.1.6 - Update all editable fields of an existing measurement item
export const update = async (item) => {
    const [result] = await pool.query(
        `UPDATE order_items
         SET product=?, width=?, height=?, unit=?, quantity=?,
             material=?, color=?, notes=?, price=?
         WHERE id=?`,
        [
            item.product,
            item.width,
            item.height,
            item.unit     ?? 'ft',
            item.quantity ?? 1,
            item.material ?? null,
            item.color    ?? null,
            item.notes    ?? null,
            item.price    ?? 0,
            item.id
        ]
    );
    return result.affectedRows;
};

export const updatePrice = async (id, price) => {
    const [result] = await pool.query(
        `UPDATE order_items SET price = ? WHERE id = ?`,
        [price, id]
    );
    return result.affectedRows;
};

// WBS 1.1.6 - Delete a measurement item record by its ID
export const remove = async (id) => {
    const [result] = await pool.query(
        `DELETE FROM order_items WHERE id = ?`, [id]
    );
    return result.affectedRows;
};
