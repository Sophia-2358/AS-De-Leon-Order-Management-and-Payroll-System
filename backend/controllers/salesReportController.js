import * as salesReportService from '../../services/financial-report/salesReportService.js';

// WBS 1.2.1 - Accept filter parameters and delegate report generation to the service layer
export const getReport = async (req, res) => {
    try {
        const { date_from, date_to, product } = req.query;
        const data = await salesReportService.generateReport(date_from, date_to, product);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Sales Report Error:', error);
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        return res.status(500).json({ success: false, message: 'Could not generate report.' });
    }
};