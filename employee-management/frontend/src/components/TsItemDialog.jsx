import { forwardRef } from 'react'

// WBS 1.1.6 - Modal dialog for adding, editing, or viewing a single measurement item
const TsItemDialog = forwardRef(function TsItemDialog(
    { form, editingId, readOnly, onChange, onSave, onCancel }, ref
) {
    const ro = readOnly ? { readOnly: true, style: { background: '#f1f3fb' } } : {}

    return (
        <dialog ref={ref} className="ts-dialog">
            <form className="ts-dform" onSubmit={readOnly ? e => e.preventDefault() : onSave}>
                <h2>{readOnly ? 'View item' : editingId ? 'Edit item' : 'Add item'}</h2>
                <p className="ts-dnote">
                    {readOnly
                        ? 'This order is past the measuring stage — measurements are locked.'
                        : 'Record the measurements. Prices will be entered after canvassing.'}
                </p>

                {/* WBS 1.1.6 - Product name (read-only, inherited from the order) and quantity fields */}
                <div className="ts-dgrid2">
                    <div className="ts-dfield">
                        <label htmlFor="itemProduct">Product</label>
                        <input id="itemProduct" type="text" value={form.product}
                               readOnly style={{ background: '#f1f3fb' }} />
                    </div>
                    <div className="ts-dfield">
                        <label htmlFor="itemQty">Quantity</label>
                        <input id="itemQty" type="number" min="1" step="1"
                               value={form.quantity}
                               onChange={e => onChange('quantity', e.target.value)}
                               {...ro} required={!readOnly} />
                    </div>
                </div>

                {/* WBS 1.1.6 - Width, height, and unit fields for the measurement dimensions */}
                <div className="ts-dgrid4">
                    <div className="ts-dfield">
                        <label htmlFor="itemW">Width</label>
                        <input id="itemW" type="number" min="0.01" step="0.01"
                               value={form.width}
                               onChange={e => onChange('width', e.target.value)}
                               {...ro} required={!readOnly} />
                    </div>
                    <div className="ts-dfield">
                        <label htmlFor="itemH">Height</label>
                        <input id="itemH" type="number" min="0.01" step="0.01"
                               value={form.height}
                               onChange={e => onChange('height', e.target.value)}
                               {...ro} required={!readOnly} />
                    </div>
                    <div className="ts-dfield" style={{ gridColumn: 'span 2' }}>
                        <label htmlFor="itemUnit">Unit</label>
                        <select id="itemUnit" value={form.unit}
                                onChange={e => onChange('unit', e.target.value)}
                                disabled={readOnly}
                                style={readOnly ? { background: '#f1f3fb' } : {}}>
                            <option>ft</option>
                            <option>inch</option>
                            <option>cm</option>
                        </select>
                    </div>
                </div>

                {/* WBS 1.1.6 - Material specification for the item */}
                <div className="ts-dfield">
                    <label htmlFor="itemMat">Material</label>
                    <input id="itemMat" type="text"
                           placeholder="e.g. Aluminum frame, clear glass"
                           value={form.material}
                           onChange={e => onChange('material', e.target.value)}
                           {...ro} />
                </div>

                {/* WBS 1.1.6 - Optional notes for special customer requests */}
                <div className="ts-dfield">
                    <label htmlFor="itemNotes">Notes</label>
                    <textarea id="itemNotes" rows={3}
                              placeholder="Special requests from the customer"
                              value={form.notes}
                              onChange={e => onChange('notes', e.target.value)}
                              {...ro} />
                </div>

                <div className="ts-dbtns">
                    <div className="ts-dactions">
                        <button type="button" className="btn-outline" onClick={onCancel}>
                            {readOnly ? 'Close' : 'Cancel'}
                        </button>
                        {!readOnly && (
                            <button type="submit" className="btn-primary">Save</button>
                        )}
                    </div>
                </div>
            </form>
        </dialog>
    )
})

export default TsItemDialog
