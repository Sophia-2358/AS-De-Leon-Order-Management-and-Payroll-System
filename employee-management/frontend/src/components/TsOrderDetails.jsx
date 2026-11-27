const STEPS = [
    'for_approval','approved','measuring','canvassing',
    'for_payment_materials','fabrication','quality_check','ready','completed'
]
const STEP_LABELS = {
    for_approval:          'For approval',
    approved:              'Approved',
    measuring:             'Measuring',
    canvassing:            'Canvassing',
    for_payment_materials: 'For payment (materials)',
    fabrication:           'Fabrication',
    quality_check:         'Quality check',
    ready:                 'Ready for installation',
    completed:             'Completed'
}

const CAPACITY_LIMIT = 10

export default function TsOrderDetails({
    order, msg, showPayForm, payAmt,
    laborInput, onLaborChange, onLaborSave,
    installDate, onInstallDateChange, onInstallDateSave,
    onPayAmtChange, onShowPayForm,
    onApprove, onNextStatus, onRecordPayment
}) 

{
    // WBS 1.1.3 - Compute capacity usage to guard against over-approving orders
    const activeCount  = order.active_count ?? 0
    const capPct       = Math.min(100, Math.round((activeCount / CAPACITY_LIMIT) * 100))
    const capFull      = activeCount >= CAPACITY_LIMIT

    const isForApproval = order.status === 'for_approval'
    const isApproved    = !['for_approval','declined','completed'].includes(order.status)
}
return (
        <div>
            {/* WBS 1.1.3 - Display active order count and capacity bar */}
            <div className={`ts-capacity${capFull ? ' full' : ''}`}>
                <div className="ts-cap-row">
                    <span>Active orders</span>
                    <strong>{activeCount} of {CAPACITY_LIMIT}</strong>
                </div>
                <div className="ts-cap-bar-wrap">
                    <div className="ts-cap-bar" style={{ width: `${capPct}%` }} />
                </div>
                <p className="ts-cap-note">
                    {capFull
                        ? 'Limit reached — cannot approve more orders'
                        : `${CAPACITY_LIMIT - activeCount} slot${CAPACITY_LIMIT - activeCount !== 1 ? 's' : ''} left`}
                </p>
            </div>
            <div className="ts-stepper">
                {STEPS.map((step, i) => {
                    const idx     = STEPS.indexOf(order.status)
                    const done    = i < idx
                    const current = i === idx
                    const isLast  = i === STEPS.length - 1
                    return (
                        <div key={step} className="ts-stepper-item">
                            <div className="ts-stepper-line-wrap">
                                <div className={`ts-stepper-circle ${done ? 'done' : current ? 'current' : ''}`}>
                                    {done ? '✓' : i + 1}
                                </div>
                                {!isLast && <div className={`ts-stepper-track ${done ? 'done' : ''}`} />}
                            </div>
                            <span className={`ts-stepper-label ${done ? 'done' : current ? 'current' : ''}`}>
                                {STEP_LABELS[step]}
                            </span>
                        </div>
                    )
                })}
            </div>
             {/* WBS 1.1.3 - Installation date input for ready and completed orders */}
            {canSetInstall && (
                <div className="ts-labor-box">
                    <div className="ts-labor-header">
                        <span>Installation date</span>
                        {order.install_date && (
                            <strong>{new Date(order.install_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                        )}
                    </div>
                    <div className="ts-labor-row">
                        <input
                            type="date"
                            value={installDate}
                            onChange={e => onInstallDateChange(e.target.value)}
                            style={{ padding: '6px 8px', border: '1px solid #dde2ec', borderRadius: 5, fontSize: 13 }}
                        />
                        <button type="button" className="btn-outline btn-small" onClick={onInstallDateSave}>
                            Set
                        </button>
                    </div>
                </div>
            )}
        
           {/* WBS 1.1.4 - Payment amount form for recording a new payment */}
            {showPayForm && (
                <form className="ts-pay-form" onSubmit={onRecordPayment}>
                    <label htmlFor="paymentAmount">Amount received (₱)</label>
                    <input id="paymentAmount" type="number" min="0.01" step="0.01"
                           value={payAmt} onChange={e => onPayAmtChange(e.target.value)}
                           required autoFocus />
                    <div className="ts-pay-btns">
                        <button type="submit" className="btn-primary">Save payment</button>
                        <button type="button" className="btn-outline"
                                onClick={() => onShowPayForm(false)}>Cancel</button>
                    </div>
                </form>
            )}
        
       /* WBS 1.1.2 / 1.1.3 - Confirmation and error message banner */
            {msg.text && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    marginBottom: 12,
                    fontWeight: 600,
                    fontSize: 14,
                    background: msg.ok ? '#e3f5e8' : '#fce4e2',
                    color:      msg.ok ? '#1d5e33' : '#8d1d18',
                    border:     `1px solid ${msg.ok ? '#7cc596' : '#efa9a5'}`
                }}>
                    {msg.ok ? '✓ ' : '✕ '}{msg.text}
                </div>
            )}

            {/* WBS 1.1.3 - Approve, advance status, and record payment action buttons */}
            <div className="ts-actions">
                {isForApproval && (
                    <>
                        <button className="btn-primary" onClick={onApprove} disabled={capFull}>
                            Approve order
                        </button>
                    </>
                )}
                {isApproved && (
                    <>
                        <button className="btn-primary" onClick={onNextStatus}
                                disabled={order.status === 'completed'}>
                            Update status
                        </button>
                        {canPay && (
                            <button className="btn-outline" onClick={() => onShowPayForm(true)}>
                                Record payment
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    )


