// WBS 1.1.1 - Implement transaction list and status display

import { useState } from 'react'

const STEP_LABELS = {
    for_approval:          'For approval',
    approved:              'Approved',
    measuring:             'Measuring',
    canvassing:            'Canvassing',
    for_payment_materials: 'For payment (materials)',
    fabrication:           'Fabrication',
    quality_check:         'Quality check',
    ready:                 'Ready for installation',
    completed:             'Completed',
    declined:              'Declined'
}


function statusClass(s) {
    if (['for_approval','approved'].includes(s))                        return 'ts-pending'
    if (['measuring','canvassing','for_payment_materials'].includes(s)) return 'ts-progress'
    if (['fabrication','quality_check'].includes(s))                    return 'ts-progress'
    if (s === 'ready' || s === 'completed')                             return 'ts-ready'
    if (s === 'declined')                                               return 'ts-declined'
    return ''
}


export default function TsOrderList({ orders, selectedId, onSelect }) {
    const [search, setSearch] = useState('')

    // WBS 1.1.1 - Filter the order list by customer name or order number
    const filtered = orders.filter(o =>
        o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.order_no?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="ts-card">
            <div className="ts-list-header">
                <span className="ts-list-title">Orders</span>
                <input
                    type="text"
                    placeholder="Search customer or order no."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="ts-search"
                />
            </div>
            <div className="ts-table-wrap">
                <table className="ts-table">
                    <thead>
                        <tr>
                            <th>Order no.</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Date</th>
                            <th>Payment</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="ts-empty">
                                {search ? 'No matching orders.' : 'No orders yet.'}
                            </td></tr>
                        ) : filtered.map(o => (
                            <tr key={o.id}
                                className={selectedId === o.id ? 'ts-selected' : ''}
                                onClick={() => onSelect(o.id)}>
                                <td>{o.order_no}</td>
                                <td>
                                    {o.customer_name}
                                    {o.status === 'for_approval' && <span className="ts-tag-new">New</span>}
                                </td>
                                <td>{o.product || '—'}</td>
                                <td>{o.order_date
                                        ? new Date(o.order_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                                        : new Date(o.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                                    }</td>
                                <td style={{ textTransform: 'capitalize' }}>{o.payment_status}</td>
                                <td className={`ts-status ${statusClass(o.status)}`}>
                                    {STEP_LABELS[o.status]}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
