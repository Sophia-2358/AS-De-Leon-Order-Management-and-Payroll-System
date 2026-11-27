// WBS 2.1.2 - Attendance Scan Rules and Validation
import * as attendanceModel from '../models/Attendance.js';
import * as userModel from '../models/User.js';
import pool from '../db.js';

const fail = (status, message) => Object.assign(new Error(message), { status });

const pad = (n) => String(n).padStart(2, '0');
const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatDateTime = (d) =>
    `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

// Work start time from the settings table (HH:MM:SS), 08:00:00 if not set
const getWorkStart = async () => {
    const [rows] = await pool.query(
        `SELECT setting_value FROM settings WHERE setting_key = 'work_start' LIMIT 1`
    );
    return rows.length > 0 ? rows[0].setting_value : '08:00:00';
};

// Late status and late minutes for a time in
const computeLate = (timeIn, work_start) => {
    const [hours, minutes, seconds] = work_start.split(':').map(Number);
    const workStartDate = new Date(timeIn);
    workStartDate.setHours(hours, minutes, seconds || 0, 0);

    const diffMs = timeIn - workStartDate;
    if (diffMs <= 0) return { status: 'on_time', late_minutes: 0 };
    return { status: 'late', late_minutes: Math.ceil(diffMs / 60000) };
};

// Hours between two times, to one decimal
const hoursBetween = (timeIn, timeOut) =>
    Math.round((new Date(timeOut) - new Date(timeIn)) / 360000) / 10;

// Today's attendance record of an employee, or null
const findToday = async (user_id, work_date) => {
    const found = await attendanceModel.findByUserAndDate(user_id, work_date);
    if (found.length === 0) return null;
    const rows = await attendanceModel.findById(found[0].id);
    return rows[0] ?? null;
};

// ==========================================
// RECORD A SCAN (TIME IN OR TIME OUT)
// mode: 'auto' | 'in' | 'out'
// ==========================================
export const recordScan = async ({ code, mode = 'auto' }) => {
    const text = String(code ?? '').trim();
    if (!text) throw fail(400, 'Enter the employee ID.');
    if (!['auto', 'in', 'out'].includes(mode)) throw fail(400, 'Invalid scan mode.');

    const found = await userModel.findByEmployeeCode(text);
    const employee = found[0];
    if (!employee || employee.role !== 'employee') {
        throw fail(404, 'QR code not recognized. Nothing was recorded.');
    }
    if (employee.status && employee.status !== 'active') {
        throw fail(403, `${employee.full_name}'s account is not active.`);
    }

    const now       = new Date();
    const work_date = formatDate(now);
    const record    = await findToday(employee.id, work_date);

    // Auto: the first scan of the day is time in, the next is time out.
    let type = mode;
    if (mode === 'auto') type = record && record.time_in ? 'out' : 'in';

    const info = {
        id:            employee.id,
        full_name:     employee.full_name,
        position:      employee.position,
        employee_code: employee.employee_code
    };

    if (type === 'in') {
        if (record && record.time_in) throw fail(409, `${employee.full_name} already timed in today.`);

        const { status, late_minutes } = computeLate(now, await getWorkStart());
        await attendanceModel.insert({
            user_id:   employee.id,
            work_date,
            time_in:   formatDateTime(now),
            time_out:  null,
            status,
            late_minutes
        });

        return { type: 'in', employee: info, work_date, time: now.toISOString(), status, late_minutes };
    }

    if (!record || !record.time_in) throw fail(409, `${employee.full_name} has no time in today.`);
    if (record.time_out)            throw fail(409, `${employee.full_name} already timed out today.`);

    await attendanceModel.update({
        id:           record.id,
        time_in:      record.time_in,
        time_out:     formatDateTime(now),
        status:       record.status,
        late_minutes: record.late_minutes
    });

    return {
        type: 'out',
        employee: info,
        work_date,
        time: now.toISOString(),
        status: record.status,
        late_minutes: record.late_minutes,
        hours: hoursBetween(record.time_in, now)
    };
};

// ==========================================
// UNDO THE LAST SCAN OF AN EMPLOYEE TODAY
// type: 'in' removes today's record, 'out' clears the time out
// ==========================================
export const undoScan = async ({ user_id, type }) => {
    if (!user_id || !['in', 'out'].includes(type)) {
        throw fail(400, 'user_id and type (in or out) are required.');
    }

    const record = await findToday(Number(user_id), formatDate(new Date()));
    if (!record) throw fail(404, 'There is nothing to undo.');

    if (type === 'in') {
        await attendanceModel.remove(record.id);
    } else {
        await attendanceModel.update({
            id:           record.id,
            time_in:      record.time_in,
            time_out:     null,
            status:       record.status,
            late_minutes: record.late_minutes
        });
    }
};
