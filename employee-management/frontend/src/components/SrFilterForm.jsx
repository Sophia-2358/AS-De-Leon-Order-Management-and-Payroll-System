// WBS 1.2.1 - Implement sales report generation and filtering

import OwnerMessage from '../OwnerMessage'

// WBS 1.2.1 - Render the date range and product filter form for the sales report
export default function SrFilterForm({ form, msg, loading, onChange, onSubmit }) {
    return (
        <div className="sr-form-card no-print">
            <form className="sr-form" onSubmit={onSubmit}>
                {/* WBS 1.2.1 - Start date filter input */}
                <div className="sr-field">
                    <label htmlFor="date_from">From</label>
                    <input type="date" id="date_from" name="date_from"
                           value={form.date_from} onChange={onChange} />
                </div>
                {/* WBS 1.2.1 - End date filter input */}
                <div className="sr-field">
                    <label htmlFor="date_to">To</label>
                    <input type="date" id="date_to" name="date_to"
                           value={form.date_to} onChange={onChange} />
                </div>
                {/* WBS 1.2.1 - Optional product type filter */}
                <div className="sr-field grow">
                    <label htmlFor="product">Product</label>
                    <select id="product" name="product"
                            value={form.product} onChange={onChange}>
                        <option value="">All products</option>
                        <option>Sliding window</option>
                        <option>Jalousie</option>
                        <option>Fixed window</option>
                        <option>Sliding door</option>
                        <option>Estante</option>
                        <option>Wall Mirror</option>
                        <option>Candy Case</option>
                        <option>Aquarium</option>
                        <option>Shower Enclosure</option>
                        <option>Glass Railing</option>
                    </select>
                </div>
                {/* WBS 1.2.1 - Submit button that triggers report generation */}
                <div>
                    <button type="submit" className="sr-submit" disabled={loading}>
                        {loading ? 'Generating…' : 'Generate report'}
                    </button>
                </div>
            </form>
            <OwnerMessage msg={msg} />
        </div>
    )
}
