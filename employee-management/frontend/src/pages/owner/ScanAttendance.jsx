// WBS 2.1.3 - Manual ID Entry and Undo Scan
import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import OwnerLayout  from '../../components/OwnerLayout'
import OwnerMessage from '../../components/OwnerMessage'
import OwnerPill    from '../../components/OwnerPill'

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

const MODES = [
    { key: 'auto', label: 'Auto' },
    { key: 'in',   label: 'Time in' },
    { key: 'out',  label: 'Time out' }
]

export default function ScanAttendance() {
    const [mode, setMode]         = useState('auto')   // auto, in, or out
    const [msg, setMsg]           = useState(null)
    const [last, setLast]         = useState(null)     // last recorded scan (for the card and Undo)
    const [events, setEvents]     = useState([])       // today's time ins and time outs
    const [showId, setShowId]     = useState(false)
    const [code, setCode]         = useState('')

    const modeRef       = useRef('auto')
    const lastResultRef = useRef(null)   // the last QR text that was read
    const lastTimeRef   = useRef(0)      // when it was last seen
    const recordRef     = useRef(null)   // always points to the newest recordScan

    // Lists every time in and time out recorded today, newest first.
    const loadToday = useCallback(async () => {
        try {
            const res = await api('/api/attendance')
            const today = todayKey()
            const list = []
            ;(res.data || []).filter(r => toDateKey(r.work_date) === today).forEach(r => {
                if (r.time_in)  list.push({ id: `${r.id}-in`,  name: r.full_name, type: 'Time in',  time: r.time_in })
                if (r.time_out) list.push({ id: `${r.id}-out`, name: r.full_name, type: 'Time out', time: r.time_out })
            })
            list.sort((a, b) => new Date(b.time) - new Date(a.time))
            setEvents(list)
        } catch (err) {
            setMsg({ text: err.message, ok: false })
        }
    }, [])

    // Sends the QR text (or typed ID) to the backend, which records the time in or time out.
    async function recordScan(scanCode) {
        try {
            const res = await api('/api/attendance-scan', {
                method: 'POST',
                body:   { code: scanCode, mode: modeRef.current }
            })
            setMsg(null)
            setLast(res.data)
            loadToday()
        } catch (err) {
            setMsg({ text: err.message, ok: false })
        }
    }

    useEffect(() => { recordRef.current = recordScan })

    useEffect(() => { loadToday() }, [loadToday])

    // Start the camera scanner.
    useEffect(() => {
        let scanner = null

        function onScanSuccess(decodedText) {
            // The camera reads the same code many times a second. While it stays in view
            // (and for 3 seconds after), it counts as one scan.
            const now = Date.now()
            const sameCode = decodedText === lastResultRef.current && now - lastTimeRef.current < 3000
            lastResultRef.current = decodedText
            lastTimeRef.current   = now
            if (sameCode) return

            recordRef.current(decodedText)
        }

        // Created on the next tick so React StrictMode's double mount doesn't start two cameras.
        const timer = setTimeout(() => {
            scanner = new Html5QrcodeScanner(
                'qr-reader',
                { fps: 10, qrbox: 250, showTorchButtonIfSupported: true },
                false
            )
            scanner.render(onScanSuccess, () => {})
        }, 0)

        return () => {
            clearTimeout(timer)
            if (scanner) scanner.clear().catch(() => {})
        }
    }, [])

    function chooseMode(key) {
        modeRef.current = key
        setMode(key)
    }

    // Undo the last recorded scan.
    async function handleUndo() {
        if (!last) return
        try {
            await api('/api/attendance-scan/undo', {
                method: 'POST',
                body:   { user_id: last.employee.id, type: last.type }
            })
            setLast(null)
            setMsg({ text: 'Last scan undone.', ok: true })
            loadToday()
        } catch (err) {
            setMsg({ text: err.message, ok: false })
        }
    }

    // Type the employee ID when the camera cannot be used.
    function handleIdSubmit(e) {
        e.preventDefault()
        const value = code.trim()
        if (!value) return setMsg({ text: 'Enter the employee ID.', ok: false })
        recordScan(value)
        setCode('')
    }

    return (
        <OwnerLayout active="attendance">
            <h1>Scan attendance</h1>
            <p className="em-sub">Scan an employee's QR code to record their time in or time out</p>
            <OwnerMessage msg={msg} />

            <div className="em-row">
                {/* Camera */}
                <div className="em-card" style={{ flex: 2 }}>
                    <div className="em-card-head">
                        <h2>Camera</h2>
                        <div className="em-toggle">
                            {MODES.map(m => (
                                <button
                                    key={m.key}
                                    type="button"
                                    className={mode === m.key ? 'em-active' : undefined}
                                    onClick={() => chooseMode(m.key)}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div id="qr-reader"></div>
                    <p className="em-muted">Point the camera at the employee's QR code and hold it inside the frame. It records automatically.</p>

                    <button type="button" className="em-light" onClick={() => setShowId(v => !v)}>
                        Enter ID instead
                    </button>
                    {showId && (
                        <form onSubmit={handleIdSubmit}>
                            <label htmlFor="employee_code">Employee ID</label>
                            <div className="em-row">
                                <input id="employee_code" name="employee_code" autoFocus
                                       value={code} onChange={e => setCode(e.target.value)} />
                                <button>Record</button>
                            </div>
                        </form>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    {/* Last scan */}
                    <div className="em-card">
                        <h2>Last scan</h2>
                        {!last ? (
                            <p className="em-muted">No scan yet.</p>
                        ) : (
                            <div>
                                <div className="em-who">
                                    <div className="em-check">âœ“</div>
                                    <div>
                                        <div className="em-name">{last.employee.full_name}</div>
                                        <div className="em-muted">
                                            {last.employee.position} Â· {last.employee.employee_code}
                                        </div>
                                    </div>
                                </div>
                                <p>
                                    <OwnerPill color={last.type === 'in' ? 'green' : 'grey'}>
                                        {last.type === 'in' ? 'Timed in' : 'Timed out'}
                                    </OwnerPill>{' '}
                                    <strong>
                                        {formatClock(last.time)} Â·{' '}
                                        {last.type === 'in'
                                            ? (last.status === 'late' ? 'Late' : 'On time')
                                            : `${Number(last.hours).toFixed(1)} hours`}
                                    </strong>
                                </p>
                                <button type="button" className="em-light" onClick={handleUndo}>Undo</button>
                            </div>
                        )}
                    </div>

                    {/* Scanned today */}
                    <div className="em-card">
                        <h2>Scanned today</h2>
                        <div>
                            {events.length === 0 ? (
                                <p className="em-muted">No scans yet today.</p>
                            ) : events.map(ev => (
                                <div className="em-event" key={ev.id}>
                                    <span>{ev.name}</span>
                                    <OwnerPill color={ev.type === 'Time in' ? 'green' : 'grey'}>{ev.type}</OwnerPill>
                                    <strong>{formatClock(ev.time)}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </OwnerLayout>
    )
}
