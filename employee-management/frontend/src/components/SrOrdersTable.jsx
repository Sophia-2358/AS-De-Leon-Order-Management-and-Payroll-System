// WBS 1.2.4 - Format a number as Philippine Peso currency
function peso(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function productLabel(type) {
    return type === 'glass_aluminum' ? 'Glass & Aluminum' : 'Service'
}

// WBS 1.2.4 - Render the orders table with a totals row in the footer for the sales report
export default function SrOrdersTable({ orders, totalSales }) {
    const isEmpty = !orders || orders.length === 0
    return (
        <div className="sr-detail-card sr-list-card">
            <h2>Orders included in this report</h2>
            <div className="sr-table-wrap">
                <table className="sr-table">
                    <thead>
                        <tr>
                            <th>Order no.</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th className="num">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* WBS 1.2.4 - Render each order row or an empty-state message */}
                        {isEmpty ? (
                            <tr><td colSpan={4} className="sr-empty">No orders to show.</td></tr>
                        ) : orders.map(o => (
                            <tr key={o.id}>
                                <td>{o.order_no}</td>
                                <td>{o.customer_name}</td>
                                <td>{o.product || '—'}</td>
                                <td className="num">{peso(o.total_amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                    {/* WBS 1.2.4 - Footer row showing the grand total of all listed orders */}
                    <tfoot>
                        <tr>
                            <td colSpan={3}>Total</td>
                            <td className="num">{peso(totalSales)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}
