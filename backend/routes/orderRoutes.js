import express from 'express';
import {
    getAllOrders, getOrderById, createOrder, getCustomers,
    approveOrder, declineOrder, nextStatus,
    recordPayment, setLabor, setInstallDate,
    addItem, editItem, setItemPrice, deleteItem
}  from '../../controllers/transaction-status/orderController.js';

const router = express.Router();

router.get('/customers',                 getCustomers);
router.get('/',                          getAllOrders);
router.get('/:id',                       getOrderById);
router.post('/',                         createOrder);
router.post('/:id/approve',              approveOrder);
router.post('/:id/next-status',          nextStatus);
router.post('/:id/payment',              recordPayment);
router.post('/:id/labor',                setLabor);
router.post('/:id/items',                addItem);
router.put('/:id/items/:item_id',        editItem);
router.post('/:id/install-date',         setInstallDate);
router.delete('/:id/items/:item_id',     deleteItem);

export default router;
