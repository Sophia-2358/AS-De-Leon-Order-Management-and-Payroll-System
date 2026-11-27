// WBS 1.2.2 - Format a number as Philippine Peso currency
function peso(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// WBS 1.2.2 - Display the three summary metric cards: total sales, order count, and average order value
export default function SrSummaryCards({ summary }) {
    return (
        <div className="sr-summary">
            {/* WBS 1.2.2 - Total sales card */}
            <div className="sr-card">
                <span className="sr-card-label">Total sales</span>
                <strong className="sr-card-value">{summary ? peso(summary.total_sales) : '₱0'}</strong>
            </div>
            {/* WBS 1.2.2 - Order count card */}
            <div className="sr-card">
                <span className="sr-card-label">Orders in period</span>
                <strong className="sr-card-value">{summary ? summary.order_count : 0}</strong>
            </div>
            {/* WBS 1.2.2 - Average order value card */}
            <div className="sr-card">
                <span className="sr-card-label">Average order value</span>
                <strong className="sr-card-value">{summary ? peso(summary.avg_order) : '₱0'}</strong>
            </div>
        </div>
    )
}