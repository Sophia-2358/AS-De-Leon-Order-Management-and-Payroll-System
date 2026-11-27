// WBS 2.2.2 - Attendance Summary and Status
// WBS 2.2.1 - Daily Attendance View
// WBS 2.2.1 - Daily Attendance View
// WBS 2.2.2 - Attendance Summary and Status
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import OwnerLayout   from '../../components/OwnerLayout'
import OwnerMessage  from '../../components/OwnerMessage'
import OwnerPill     from '../../components/OwnerPill'
import OwnerStatCard from '../../components/OwnerStatCard'

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

function dateKey(d) {
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mm}-${dd}`
}

// Today's date as 2026-10-19 (local time).
function todayKey() {
    return dateKey(new Date())
}

// Turns a date from the backend (ISO text or Date) into 2026-10-19 (local time).
function toDateKey(value) {
    if (!value) return ''
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    return dateKey(new Date(value))
}

// Turns a date/time from the backend into '7:58 AM'. Empty values show a dash.
function formatClock(value) {
    if (!value) return 'â€”'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'â€”'
    const h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'AM' : 'PM'}`
}

// Hours between two date/times, to one decimal.
function hoursBetween(timeIn, timeOut) {
    if (!timeIn || !timeOut) return 0
    const minutes = (new Date(timeOut) - new Date(timeIn)) / 60000
    return Math.round(minutes / 6) / 10
}

const PILL = {
    'On time': 'green',
    'Late':    'amber',
    'Absent':  'red'
}

export default function Attendance() {
    const [date, setDate]           = useState(todayKey())
    const [search, setSearch]       = useState('')
    const [employees, setEmployees] = useState([])
    const [records, setRecords]     = useState([])
    const [msg, setMsg]             = useState(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const [emp, att] = await Promise.all([
                    api('/api/employee'),
                    api('/api/attendance')
                ])
                if (cancelled) return
                setEmployees(emp.data || [])
                setRecords(att.data || [])
            } catch (err) {
                if (!cancelled) setMsg({ text: err.message, ok: false })
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    // WBS 2.2.2 - Absent if no time in, Late if time in after 8:00 AM, On time otherwise
    const rows = useMemo(() => {
        const term = search.toLowerCase()
        return employees
            .filter(e => e.full_name.toLowerCase().includes(term))
            .map(e => {
                const a = records.find(r => r.user_id === e.id && toDateKey(r.work_date) === date)
                const status = !a ? 'Absent' : a.status === 'late' ? 'Late' : 'On time'
                return {
                    id:       e.id,
                    name:     e.full_name,
                    position: e.position,
                    time_in:  a ? a.time_in  : null,
                    time_out: a ? a.time_out : null,
                    hours:    a ? hoursBetween(a.time_in, a.time_out) : 0,
                    status
                }
            })
    }, [employees, records, date, search])

    // WBS 2.2.2 - counts for the summary cards
    const present  = rows.filter(r => r.time_in).length
    const late     = rows.filter(r => r.status === 'Late').length
    const notIn    = rows.filter(r => r.status === 'Absent').length
    const timedOut = rows.filter(r => r.time_out).length

    return (
        <OwnerLayout active="attendance">
            <div className="em-top">
                <div>
                    <h1>Attendance</h1>
                    <p className="em-sub">Time in and time out of your crew, recorded from QR scans</p>
                </div>
                <div className="em-no-print">
                    <Link className="em-btn em-light" to="/owner/employee-payroll">Send to payroll</Link>
                    {' '}
                    <Link className="em-btn" to="/owner/scan-attendance">Scan attendance</Link>
                </div>
            </div>

            <OwnerMessage msg={msg} />

            <div className="em-stats">
                <OwnerStatCard label="Present today" value={present}  sub={`of ${rows.length} employees`} />
                <OwnerStatCard label="Late"          value={late}     sub="after 8:00 AM" />
                <OwnerStatCard label="Not yet in"    value={notIn}    sub="no scan so far" />
                <OwnerStatCard label="Timed out"     value={timedOut} sub="finished for the day" />
            </div>

            <div className="em-card">
                <h2>Daily attendance</h2>
                <div className="em-row">
                    <div>
                        <label htmlFor="date">Date</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="search">Employee</label>
                        <input id="search" placeholder="Search name" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <br />
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th><th>Position</th><th>Time in</th>
                            <th>Time out</th><th>Hours</th><th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={6}>No attendance records yet.</td></tr>
                        ) : rows.map(r => (
                            <tr key={r.id}>
                                <td>{r.name}</td>
                                <td>{r.position}</td>
                                <td>{formatClock(r.time_in)}</td>
                                <td>{formatClock(r.time_out)}</td>
                                <td>{r.hours.toFixed(1)}</td>
                                <td><OwnerPill color={PILL[r.status]}>{r.status}</OwnerPill></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </OwnerLayout>
    )
}
