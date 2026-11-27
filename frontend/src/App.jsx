import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Welcome        from './pages/Welcome'
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import VerifyOtp      from './pages/VerifyOtp'
import SetPin         from './pages/employee/SetPin'
import VerifyPin      from './pages/employee/VerifyPin'
import QrCode         from './pages/employee/QrCode'
import Attendance     from './pages/employee/Attendance'
import Deduction      from './pages/employee/Deduction'
import ScanAttendance  from './pages/owner/ScanAttendance'
import OwnerAttendance from './pages/owner/Attendance'
import EmployeePayroll from './pages/owner/EmployeePayroll'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/"                          element={<Welcome />} />
                <Route path="/login"                     element={<Login />} />
                <Route path="/signup"                    element={<Signup />} />
                <Route path="/verify-otp"                element={<VerifyOtp />} />
                <Route path="/employee/set-pin"          element={<SetPin />} />
                <Route path="/employee/verify-pin"       element={<VerifyPin />} />
                <Route path="/employee/qr-code"          element={<QrCode />} />
                <Route path="/employee/attendance"       element={<Attendance />} />
                <Route path="/employee/deduction"        element={<Deduction />} />
                <Route path="/owner/scan-attendance"     element={<ScanAttendance />} />
                <Route path="/owner/attendance"          element={<OwnerAttendance />} />
                <Route path="/owner/employee-payroll"    element={<EmployeePayroll />} />
                <Route path="*"                          element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
