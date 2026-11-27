import { useState } from 'react'
import OwnerLayout    from '../../components/OwnerLayout'
import SrFilterForm   from '../../components/financial-report/SrFilterForm'
import SrSummaryCards from '../../components/financial-report/SrSummaryCards'
import SrBarChart     from '../../components/financial-report/SrBarChart'
import SrOrdersTable  from '../../components/financial-report/SrOrdersTable'
import '../../styles/salesReport.css'

// WBS 1.2.1 - Generic fetch helper for the sales report API
async function api(url) {
    const res  = await fetch(url, { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) throw new Error(data.message || 'Something went wrong.')
    return data
}

// WBS 1.2.1 - Root page component that orchestrates filter, summary, chart, table, and export
export default function SalesReport() {
    const [form, setForm]       = useState({ date_from: '', date_to: '', product: '' })
    const [result, setResult]   = useState(null)
    const [msg, setMsg]         = useState(null)
    const [loading, setLoading] = useState(false)

    // WBS 1.2.1 - Sync filter form field changes into local state
    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    // WBS 1.2.1 - Validate the filter inputs and fetch the sales report from the API
    async function handleSubmit(e) {
        e.preventDefault()
        setMsg(null)
        if (!form.date_from || !form.date_to)
            return setMsg({ text: 'Please select both a start and end date.', ok: false })
        if (form.date_to < form.date_from)
            return setMsg({ text: 'The end date cannot be before the start date.', ok: false })
        setLoading(true)
        try {
            const params = new URLSearchParams({
                date_from: form.date_from, date_to: form.date_to, product: form.product
            })
            const data = await api(`/api/sales-report?${params}`)
            setResult(data.data)
        } catch (err) {
            setMsg({ text: err.message, ok: false })
        } finally {
            setLoading(false)
        }
    }
 // WBS 1.2.2 - Write summary section: total sales, order count, average order value
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Summary', 14, 50)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(`Total Sales:         ${peso(result.summary.total_sales)}`, 14, 57)
        doc.text(`Orders in Period:    ${result.summary.order_count}`, 14, 63)
        doc.text(`Average Order Value: ${peso(result.summary.avg_order)}`, 14, 69)

    return (
        <OwnerLayout active="sales-reports">
            <div className="sr-page">
                <div className="sr-header">
                    <div>
                        <h1>Sales report</h1>
                        <p>Built from recorded customer orders</p>
                    </div>
    {/* WBS 1.2.1 - Date range and product filter form */}
                <SrFilterForm
                    form={form} msg={msg} loading={loading}
                    onChange={handleChange} onSubmit={handleSubmit}
                />
                 {/* WBS 1.2.2 - Summary cards: total sales, order count, average order value */}
                <SrSummaryCards summary={result?.summary ?? null} />
                {/* WBS 1.2.3 - Monthly sales bar chart */}
                    <SrBarChart monthly={result?.monthly ?? []} />

                </div>
            </div>
        </OwnerLayout>
    )
}
