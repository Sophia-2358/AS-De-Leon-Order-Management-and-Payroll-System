// WBS 1.1.5 - Format a number as Philippine Peso currency
function peso(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
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
       
        