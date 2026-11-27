// WBS 2.4.1 - Payroll Records View
// ==========================================
// PAYROLL RECORD CONTROLLER
// WBS 2.3.2 - Payroll Validation and Saving
// WBS 2.4.1 - Payroll Records View
// ==========================================
import * as payrollRecordService from '../services/payrollRecordService.js';

// ==========================================
// GET ALL PAYROLL RECORDS
// GET /api/payroll-records
// WBS 2.4.1 - retrieves all saved payroll records sorted by latest week first
// ==========================================
export const getPayrollRecords = async (req, res) => {
    try {
        const records = await payrollRecordService.fetchPayrollRecords();
        return res.status(200).json({ success: true, data: records });
    } catch (error) {
        console.error('Get Payroll Records Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Could not retrieve payroll records.'
        });
    }
};

// ==========================================
// SAVE ONE WEEKLY PAYROLL RECORD
// POST /api/payroll-records
// WBS 2.3.2 - validates all fields and blocks a duplicate record for the same employee and week;
//             saves the weekly payroll record and returns "Payroll record saved."
// ==========================================
export const createPayrollRecord = async (req, res) => {
    try {
        const id = await payrollRecordService.createPayrollRecord(req.body);
        return res.status(201).json({
            success: true,
            message: 'Payroll record saved.',
            data: { id }
        });
    } catch (error) {
        console.error('Create Payroll Record Error:', error);

        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }

        return res.status(500).json({
            success: false,
            message: 'Could not save the payroll record.'
        });
    }
};
