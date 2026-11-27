// WBS 2.4.1 - Payroll Records View
// WBS 2.3.2 - Payroll Validation and Saving
// WBS 2.3.1 - Wage Computation
// WBS 2.3.1 - Wage Computation
// WBS 2.3.2 - Payroll Validation and Saving
// WBS 2.4.1 - Payroll Records View
import { useEffect, useState } from 'react'
import OwnerLayout  from '../../components/OwnerLayout'
import OwnerMessage from '../../components/OwnerMessage'

// Calls the backend and returns the parsed JSON. Throws an Error with the
// server's message when the request fails.
async function api(url, { method = 'GET', body } = {}) {
    const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body:    body ? JSON.stringify(body) : undefined
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Something went wrong. Please try again.')
    }
    return data
}

// WBS 2.3.1 - formats a number as pesos, like P1,250.00
function peso(n) {
    return 'P' + Number(n || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

const EMPTY_FORM = {
    employee_name: '',
    position:      '',
    week_start:    '',
    week_end:      '',
    hours:         '0',
    rate:          '0',
    late:          '0',
    absence:       '0',
    wrong_project: '0'
}

export default function EmployeePayroll() {
    const [form, setForm]           = useState(EMPTY_FORM)
    const [records, setRecords]     = useState([])  // WBS 2.4.1 - saved payroll records
    const [employees, setEmployees] = useState([])
    const [msg, setMsg]             = useState(null)

    async function loadRecords() {
        try {
            const res = await api('/api/payroll-records')
            setRecords(res.data || [])
        } catch (err) {
            setMsg({ text: err.message, ok: false })
        }
    }

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const [rec, emp] = await Promise.all([
                    api('/api/payroll-records'),
                    api('/api/employee')
                ])
                if (cancelled) return
                setRecords(rec.data || [])
                setEmployees(emp.data || [])
            } catch (err) {
                if (!cancelled) setMsg({ text: err.message, ok: false })
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    // WBS 2.3.1 - compute gross, deductions and net as the owner types
    const hours      = Number(form.hours)  || 0
    const rate       = Number(form.rate)   || 0
    const deductions = (Number(form.late) || 0) + (Number(form.absence) || 0) + (Number(form.wrong_project) || 0)
    const gross      = hours * rate

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => {
            const next = { ...prev, [name]: value }
            // Picking a known employee fills in the position automatically
            if (name === 'employee_name') {
                const match = employees.find(x => x.full_name.toLowerCase() === value.trim().toLowerCase())
                if (match && match.position) next.position = match.position
            }
            return next
        })
    }

    // WBS 2.3.2 - validate fields and save the payroll record
    async function handleSubmit(e) {
        e.preventDefault()

        const name  = form.employee_name.trim()
        const position = form.position.trim()
        const h     = Number(form.hours)
        const r     = Number(form.rate)
        const late  = Number(form.late)
        const abs   = Number(form.absence)
        const wrong = Number(form.wrong_project)
        const start = form.week_start
        const end   = form.week_end

        const fail = text => setMsg({ text, ok: false })

        if (!name)                              return fail('Enter the employee name.')
        if (!position)                          return fail('Enter the position.')
        if (!start || !end)                     return fail('Enter the week starting and week ending dates.')
        if (end < start)                        return fail('The week ending date cannot be before the week starting date.')
        if (!(h > 0))                           return fail('Work hours must be more than 0.')
        if (!(r > 0))                           return fail('Rate per hour must be more than 0.')
        if (late < 0 || abs < 0 || wrong < 0)  return fail('Deductions cannot be negative.')

        const grossWage      = Math.round(h * r * 100) / 100
        const totalDeductions = Math.round((late + abs + wrong) * 100) / 100
        if (totalDeductions > grossWage)        return fail('Deductions are larger than the gross wage.')

        try {
            await api('/api/payroll-records', {
                method: 'POST',
                body: {
                    employee_name: name,
                    position,
                    week_start:    start,
                    week_end:      end,
                    hours:         h,
                    rate:          r,
                    late,
                    absence:       abs,
                    wrong_project: wrong
                }
            })
            setMsg({ text: 'Payroll record saved.', ok: true })
            setForm(EMPTY_FORM)
            loadRecords()
        } catch (err) {
            fail(err.message)
        }
    }

    return (
        <OwnerLayout active="employee-payroll">
            <div className="em-top">
                <div>
                    <h1>Weekly payroll</h1>
                    <p className="em-sub">Enter work hours, rate and deductions to compute the week's wages</p>
                </div>
            </div>

            <OwnerMessage msg={msg} />

            {/* WBS 2.3.1 - payroll entry form with wage computation card */}
            {/* WBS 2.3.2 - save payroll record button and validation */}
            <form className="em-row em-no-print" onSubmit={handleSubmit}>

                {/* Payroll entry */}
                <div className="em-card" style={{ flex: 2 }}>
                    <h2>Payroll entry</h2>
                    <div className="em-row">
                        <div>
                            <label htmlFor="employee_name">Employee name</label>
                            <input id="employee_name" name="employee_name" list="employeeNames"
                                   value={form.employee_name} onChange={handleChange} />
                            <datalist id="employeeNames">
                                {employees.map(x => <option key={x.id} value={x.full_name} />)}
                            </datalist>
                        </div>
                        <div>
                            <label htmlFor="position">Position</label>
                            <input id="position" name="position" value={form.position} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="em-row">
                        <div>
                            <label htmlFor="week_start">Week starting</label>
                            <input type="date" id="week_start" name="week_start" value={form.week_start} onChange={handleChange} />
                        </div>
                        <div>
                            <label htmlFor="week_end">Week ending</label>
                            <input type="date" id="week_end" name="week_end" value={form.week_end} onChange={handleChange} />
                        </div>
                        <div>
                            <label htmlFor="hours">Work hours</label>
                            <input type="number" id="hours" name="hours" min="0" step="0.1" value={form.hours} onChange={handleChange} />
                        </div>
                        <div>
                            <label htmlFor="rate">Rate per hour (P)</label>
                            <input type="number" id="rate" name="rate" min="0" step="0.01" value={form.rate} onChange={handleChange} />
                        </div>
                    </div>
                    <label>Deductions (P)</label>
                    <div className="em-row">
                        <div>
                            <label htmlFor="late">Late arrival</label>
                            <input type="number" id="late" name="late" min="0" step="0.01" value={form.late} onChange={handleChange} />
                        </div>
                        <div>
                            <label htmlFor="absence">Absence</label>
                            <input type="number" id="absence" name="absence" min="0" step="0.01" value={form.absence} onChange={handleChange} />
                        </div>
                        <div>
                            <label htmlFor="wrong_project">Wrong project</label>
                            <input type="number" id="wrong_project" name="wrong_project" min="0" step="0.01" value={form.wrong_project} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* WBS 2.3.1 - wage computation card, updates as the owner types */}
                <div style={{ flex: 1 }}>
                    <div className="em-card em-calc">
                        <h2>Wage computation</h2>
                        <p><span>Hours x rate</span><span>{hours} x {peso(rate)}</span></p>
                        <p><span>Gross wage</span><span>{peso(gross)}</span></p>
                        <p><span>Total deductions</span><span>{peso(deductions)}</span></p>
                        <p className="em-net"><span>Net wage</span><span>{peso(gross - deductions)}</span></p>
                    </div>
                    {/* WBS 2.3.2 - save button */}
                    <button className="em-full">Save payroll record</button>
                </div>
            </form>

            {/* WBS 2.4.1 - payroll records table, newest week first */}
            <div className="em-card">
                <h2>Payroll records</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th><th>Position</th><th>Week</th><th>Hours</th>
                            <th>Gross</th><th>Deductions</th><th>Net</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length === 0 ? (
                            <tr><td colSpan={7}>No payroll records yet.</td></tr>
                        ) : records.map(r => (
                            <tr key={r.id}>
                                <td>{r.employee_name}</td>
                                <td>{r.position}</td>
                                <td>{r.week_start} to {r.week_end}</td>
                                <td>{Number(r.hours).toFixed(1)}</td>
                                <td>{peso(r.gross)}</td>
                                <td>{peso(r.deductions)}</td>
                                <td>{peso(r.net)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </OwnerLayout>
    )
}
