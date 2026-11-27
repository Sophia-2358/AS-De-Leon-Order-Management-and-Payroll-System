
import { useCallback, useEffect, useRef, useState } from 'react'
import OwnerLayout     from '../../components/OwnerLayout'
import TsOrderList     from '../../components/transaction-status/TsOrderList'
import TsMeasurements  from '../../components/transaction-status/TsMeasurements'
import TsOrderDetails  from '../../components/transaction-status/TsOrderDetails'
import TsItemDialog    from '../../components/transaction-status/TsItemDialog'
import '../../styles/transactionStatus.css'

// WBS 1.1.1 - Generic fetch helper used for all order API calls
async function api(url, { method = 'GET', body } = {}) {
    const res  = await fetch(url, {
        method,
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body:    body ? JSON.stringify(body) : undefined
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) throw new Error(data.message || 'Something went wrong.')
    return data
}

const STEP_LABELS = {
    for_approval: 'For approval', approved: 'Approved', measuring: 'Measuring',
    canvassing: 'Canvassing', for_payment_materials: 'For payment (materials)',
    fabrication: 'Fabrication', quality_check: 'Quality check',
    ready: 'Ready for installation', completed: 'Completed', declined: 'Declined'
}

const EMPTY_ITEM = {
    product: 'Sliding window', width: '', height: '',
    unit: 'ft', quantity: 1, material: '', notes: ''
}

// WBS 1.1.1 - Root page component that orchestrates all transaction status sub-features
export default function TransactionStatus() {
    const [orders, setOrders]           = useState([])
    const [selected, setSelected]       = useState(null)
    const [msg, setMsg]                 = useState({ text: '', ok: true })
    const [payAmt, setPayAmt]           = useState('')
    const [showPayForm, setShowPayForm] = useState(false)
    const [itemForm, setItemForm]       = useState(EMPTY_ITEM)
    const [editingItem, setEditingItem] = useState(null)
    const [laborInput, setLaborInput]   = useState('')
    const [installDate, setInstallDate] = useState('')

    const itemDialogRef = useRef(null)

    // WBS 1.1.1 - Load all orders from the API to populate the transaction list
    const loadOrders = useCallback(async () => {
        try {
            const data = await api('/api/orders')
            setOrders(data.data || [])
        } catch (err) { setMsg({ text: err.message, ok: false }) }
    }, [])

    useEffect(() => { loadOrders() }, [loadOrders])
    // WBS 1.1.2 - Fetch and display the full details for the selected order
    async function selectOrder(id) {
        try {
            const data = await api(`/api/orders/${id}`)
            setSelected(data.data)
            setMsg({ text: '', ok: true })
            setShowPayForm(false)
            setLaborInput(data.data.labor_percentage != null ? String(data.data.labor_percentage) : '')
            setInstallDate('')
        } catch (err) { setMsg({ text: err.message, ok: false }) }
    }
// WBS 1.1.3 - Send an approve request for the selected order
    async function handleApprove() {
        try {
            await api(`/api/orders/${selected.id}/approve`, { method: 'POST' })
            setMsg({ text: 'Order approved.', ok: true })
            await selectOrder(selected.id); loadOrders()
        } catch (err) { setMsg({ text: err.message, ok: false }) }
    }

    // WBS 1.1.3 - Advance the selected order to the next workflow status
    async function handleNextStatus() {
        try {
            const data = await api(`/api/orders/${selected.id}/next-status`, { method: 'POST' })
            setMsg({ text: `Status updated to: ${STEP_LABELS[data.status]}.`, ok: true })
            await selectOrder(selected.id); loadOrders()
        } catch (err) { setMsg({ text: err.message, ok: false }) }
    }
    // WBS 1.1.4 - Submit the payment amount and record it against the selected order
    async function handleRecordPayment(e) {
        e.preventDefault()
        try {
            await api(`/api/orders/${selected.id}/payment`, { method: 'POST', body: { amount: Number(payAmt) } })
            setMsg({ text: 'Payment recorded.', ok: true })
            setPayAmt(''); setShowPayForm(false)
            await selectOrder(selected.id); loadOrders()
        } catch (err) { setMsg({ text: err.message, ok: false }) }
    }

      // WBS 1.1.3 - Save the installation date for the selected order
    async function handleInstallDateSave() {
        try {
            await api(`/api/orders/${selected.id}/install-date`, { method: 'POST', body: { install_date: installDate } })
            setMsg({ text: 'Installation date saved.', ok: true })
            await selectOrder(selected.id)
            setInstallDate('')
        } catch (err) { setMsg({ text: err.message, ok: false }) }
    }

    // WBS 1.1.5 - Save the labor percentage input and trigger total recomputation
    async function handleLaborSave() {
        try {
            await api(`/api/orders/${selected.id}/labor`, { method: 'POST', body: { percentage: Number(laborInput) } })
            setMsg({ text: `Labor set to ${laborInput}%.`, ok: true })
            await selectOrder(selected.id)
        } catch (err) { setMsg({ text: err.message, ok: false }) }
    }

    // WBS 1.1.5 - Save a canvassed price for a specific measurement item
    async function handlePriceSave(item_id, price) {
        try {
            await api(`/api/orders/${selected.id}/items/${item_id}/price`, {
                method: 'PUT', body: { price: Number(price) }
            })
            await selectOrder(selected.id)
        } catch (err) { setMsg({ text: err.message, ok: false }) }
    }


    return (
    <OwnerLayout active="transaction-status">
            <div className="ts-page">
                <div className="ts-header">
                    <div>
                        <h1>Transaction status</h1>
                        <p>Approve new orders, then track their progress, measurements, and payments</p>
                    </div>
                </div>

                <div className="ts-content">

                    <TsOrderList
                        orders={orders}
                        selectedId={selected?.id}
                        onSelect={selectOrder}
                    />
                    {selected && (
                        <div className="ts-card">
                            <p className="ts-panel-label">Transaction details</p>
                            <h2 className="ts-detail-name">{selected.customer_name}</h2>
                            {/* WBS 1.1.2 - Display order metadata in the details panel */}
                            <dl className="ts-info">
                                <div><dt>Order no.</dt>    <dd>{selected.order_no}</dd></div>
                                <div><dt>Product</dt>      <dd>{selected.product || '—'}</dd></div>
                                <div><dt>Contact no.</dt>  <dd>{selected.contact_no   || '—'}</dd></div>
                                <div><dt>Site address</dt> <dd>{selected.site_address  || '—'}</dd></div>
                            </dl>
                            {selected.message && <p className="ts-message">{selected.message}</p>}

                            {/* WBS 1.1.2 - Render the progress stepper, payment summary, and action buttons */}
                            <TsOrderDetails
                                order={selected}
                                msg={msg}
                                showPayForm={showPayForm}
                                payAmt={payAmt}
                                laborInput={laborInput}
                                onLaborChange={setLaborInput}
                                onLaborSave={handleLaborSave}
                                installDate={installDate}
                                onInstallDateChange={setInstallDate}
                                onInstallDateSave={handleInstallDateSave}
                                onPayAmtChange={setPayAmt}
                                onShowPayForm={setShowPayForm}
                                onApprove={handleApprove}
                                onNextStatus={handleNextStatus}
                                onRecordPayment={handleRecordPayment}
                            />
                        </div>
                    )}
                </div>
            </div>
                            
        </OwnerLayout>
    )
}

