// WBS 1.2.1 - Implement sales report generation and filtering

import express from 'express';
import { getReport } from '../../controllers/salesReportController.js';

const router = express.Router();

// WBS 1.2.1 - Route: generate a filtered sales report (query params: date_from, date_to, product)
// GET /api/sales-report?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&product_type=
router.get('/', getReport);

export default router;