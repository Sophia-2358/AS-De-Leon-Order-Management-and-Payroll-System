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
router.post('/:id/install-date',         setInstallDate);


export default router;
