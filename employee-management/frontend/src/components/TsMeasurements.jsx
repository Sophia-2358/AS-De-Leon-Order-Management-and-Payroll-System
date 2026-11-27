// WBS 1.1.5 - Format a number as Philippine Peso currency
function peso(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
// WBS 1.1.6 - Render the measurement items table with inline price entry and edit controls
export default function TsMeasurements({
    items, materialTotal, canEdit, canPrice,
    onAdd, onEdit, onPriceChange, onPriceSave
}) {
    return (
        <section>
            <div className="ts-meas-header">
                <h3>Measurements</h3>
                {/* WBS 1.1.6 - Show the add item button only when editing is allowed and no items exist */}
                {canEdit && items.length === 0 && (
                    <button type="button" className="btn-outline btn-small" onClick={onAdd}>
                        Add item
                    </button>
                )}
            </div>

            <div className="ts-table-wrap">
                <table className="ts-meas-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Size (W × H)</th>
                            <th>Unit</th>
                            <th>Qty</th>
                            <th>Material</th>
                            <th className="num">Price</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="ts-empty">No items yet.</td>
                            </tr>
                        ) : items.map(item => (
                            <tr key={item.id}>
                                <td>{item.product}</td>
                                <td>{item.width} × {item.height}</td>
                                <td>{item.unit}</td>
                                <td>{item.quantity}</td>
                                <td>{item.material || '—'}</td>
                                <td className="num">
                                    {/* WBS 1.1.5 - Inline price input for the canvassing stage */}
                                    {canPrice ? (
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                defaultValue={Number(item.price) || ''}
                                                placeholder="0.00"
                                                style={{ width: 90, padding: '4px 6px', border: '1px solid #dde2ec', borderRadius: 4, fontSize: 13 }}
                                                onBlur={e => onPriceSave(item.id, e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        Number(item.price) > 0 ? peso(item.price) : '—'
                                    )}
                                </td>
                                <td>
                                    {/* WBS 1.1.6 - Open the item dialog to view or edit this item */}
                                    <button className="ts-link-btn" onClick={() => onEdit(item)}>
                                        View / Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

                                    {/* WBS 1.1.5 - Display the computed material total below the items table */}
            <div className="ts-meas-total">
                <span>Material total</span>
                <strong>{peso(materialTotal)}</strong>
            </div>
            {canPrice && (
                <p className="ts-meas-note">
                    Enter the canvassed price per item then click outside the field to save.
                </p>
            )}
            {!canPrice && (
                <p className="ts-meas-note">
                    Prices are entered during the canvassing stage.
                </p>
            )}
       </section>
    )
}

    