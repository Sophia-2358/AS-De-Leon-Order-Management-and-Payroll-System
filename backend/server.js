import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import pool from './db.js';

import authRoutes            from './routes/authRoutes.js';
import employeeRoutes        from './routes/employeeRoutes.js';
import attendanceRoutes      from './routes/attendanceRoutes.js';
import payrollRoutes         from './routes/payrollRoutes.js';
import attendanceScanRoutes  from './routes/attendanceScanRoutes.js';
import payrollRecordRoutes   from './routes/payrollRecordRoutes.js';

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure:   false,
        sameSite: 'lax',
        maxAge:   1000 * 60 * 60 * 2
    }
}));

// ==========================================
// ROUTES
// ==========================================
app.use('/api/auth',            authRoutes);
app.use('/api/employee',        employeeRoutes);
app.use('/api/attendance',      attendanceRoutes);
app.use('/api/payroll',         payrollRoutes);
app.use('/api/attendance-scan', attendanceScanRoutes);
app.use('/api/payroll-records', payrollRecordRoutes);

// ==========================================
// DATABASE TEST
// ==========================================
app.get('/api/test', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS test');
        res.json({ success: true, message: 'Server and database are working!', data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Database error.' });
    }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
