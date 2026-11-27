// WBS 1.2.3 - Implement sales by month analysis

import { useState } from 'react'

// WBS 1.2.3 - Format a number as Philippine Peso currency for tooltip display
function peso(n) {
    return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// WBS 1.2.3 - Format large peso values as abbreviated labels for the Y-axis
function shortPeso(n) {
    if (n >= 1000000) return '₱' + (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000)    return '₱' + (n / 1000).toFixed(1)    + 'K'
    return '₱' + Number(n).toFixed(0)
}

const CHART_HEIGHT = 200
const Y_STEPS      = 5

// WBS 1.2.3 - Render a bar chart of monthly sales totals with Y-axis, gridlines, and hover tooltips
export default function SrBarChart({ monthly }) {
    const [tooltip, setTooltip] = useState(null) // { data, x, y }

    const isEmpty  = !monthly || monthly.length === 0

    // WBS 1.2.3 - Determine the chart's Y-axis maximum from the highest monthly total
    const maxValue = isEmpty ? 1 : Math.max(...monthly.map(m => m.total), 1)

    // WBS 1.2.3 - Round the max value up to a clean magnitude for Y-axis ticks
    const niceMax = (() => {
        const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
        return Math.ceil(maxValue / magnitude) * magnitude
    })()

    // WBS 1.2.3 - Generate evenly spaced Y-axis tick values from niceMax down to 0
    const yTicks = Array.from({ length: Y_STEPS + 1 }, (_, i) =>
        Math.round((niceMax / Y_STEPS) * (Y_STEPS - i))
    )

    return (
        <div className="sr-detail-card sr-chart-card" style={{ position: 'relative' }}>
            <h2>Sales by month</h2>

            {isEmpty ? (
                <p className="sr-chart-empty">No data yet. Generate a report above.</p>
            ) : (
                <div className="sr-chart-wrap">
                    {/* WBS 1.2.3 - Y-axis labels */}
                    <div className="sr-y-axis">
                        {yTicks.map(tick => (
                            <span key={tick} className="sr-y-tick">{shortPeso(tick)}</span>
                        ))}
                    </div>

                    {/* WBS 1.2.3 - Chart area with horizontal gridlines and monthly bars */}
                    <div className="sr-chart-area">
                        <div className="sr-gridlines">
                            {yTicks.map(tick => (
                                <div key={tick} className="sr-gridline" />
                            ))}
                        </div>

                        <div className="sr-bars">
                            {monthly.map(m => {
                                // WBS 1.2.3 - Compute bar height proportional to this month's total
                                const barH = Math.max(4, Math.round((m.total / niceMax) * CHART_HEIGHT))
                                return (
                                    <div key={m.month} className="sr-bar-col"
                                         onMouseEnter={e => {
                                             const rect = e.currentTarget.closest('.sr-chart-card').getBoundingClientRect()
                                             const bar  = e.currentTarget.getBoundingClientRect()
                                             setTooltip({
                                                 data: m,
                                                 x: bar.left - rect.left + bar.width / 2,
                                                 y: bar.top  - rect.top  - 8
                                             })
                                         }}
                                         onMouseLeave={() => setTooltip(null)}>
                                        <div className="sr-bar-inner" style={{ height: barH }} />
                                        <span className="sr-bar-month">
                                            {new Date(m.month + '-01T00:00:00').toLocaleDateString('en-PH', {
                                                month: 'short', year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* WBS 1.2.3 - Hover tooltip showing month, total, order count, and average */}
                        {tooltip && (
                            <div className="sr-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
                                <strong>
                                    {new Date(tooltip.data.month + '-01T00:00:00').toLocaleDateString('en-PH', {
                                        month: 'long', year: 'numeric'
                                    })}
                                </strong>
                                <span>Total: {peso(tooltip.data.total)}</span>
                                <span>Orders: {tooltip.data.count}</span>
                                <span>Avg: {peso(tooltip.data.total / tooltip.data.count)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
