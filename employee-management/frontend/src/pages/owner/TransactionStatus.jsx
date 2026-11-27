
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

}

                    <TsOrderList
                        orders={orders}
                        selectedId={selected?.id}
                        onSelect={selectOrder}
                    />

