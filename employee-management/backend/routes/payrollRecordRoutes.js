// WBS 2.4.1 - Payroll Records View
// ==========================================
// PAYROLL RECORD ROUTES
// WBS 2.3.2 - Payroll Validation and Saving
// WBS 2.4.1 - Payroll Records View
// ==========================================
import express from 'express';
import {
    getPayrollRecords,
    createPayrollRecord
} from '../controllers/payrollRecordController.js';

const router = express.Router();

// GET  /api/payroll-records  - retrieve all saved weekly payroll records (WBS 2.4.1)
router.get('/', getPayrollRecords);

// POST /api/payroll-records  - validate and save one weekly payroll record (WBS 2.3.2)
router.post('/', createPayrollRecord);

export default router;
