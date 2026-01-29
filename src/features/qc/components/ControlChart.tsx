"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { MOCK_PARAMETERS, MOCK_MATRICES } from "@/data/mock-db";
import { cn } from "@/lib/utils";

interface DataPoint {
    x: number;
    y: number;
    value: number;
    date: string;
    batch: string;
    instrument: string;
    status: "PASS" | "FAIL" | "WARNING";
}

// Mock batches
const MOCK_BATCHES = [
    { id: "batch-001", name: "QC-2026-001", date: "2026-01-15" },
    { id: "batch-002", name: "QC-2026-002", date: "2026-01-22" },
    { id: "batch-003", name: "QC-2026-003", date: "2026-01-29" },
];

// Mock instruments
const MOCK_INSTRUMENTS = [
    { id: "inst-001", name: "Spectrophotometer DR-6000" },
    { id: "inst-002", name: "AA Graphite 240" },
    { id: "inst-003", name: "ICP-OES 5110" },
];

export default function ControlChart() {
    const [filterParameter, setFilterParameter] = useState("");
    const [filterMatrix, setFilterMatrix] = useState("");
    const [filterBatch, setFilterBatch] = useState("");
    const [filterInstrument, setFilterInstrument] = useState("");
    const [showLastN, setShowLastN] = useState(20);
    const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

    // Mock control chart data with batch info
    const mockData: DataPoint[] = useMemo(() => {
        const data: DataPoint[] = [];
        const now = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - (30 - i));
            const value = 95 + Math.random() * 15 - 5;
            const isOutlier = i === 15;
            const finalValue = isOutlier ? 125 : value;
            const batchIdx = Math.floor(i / 10);
            data.push({
                x: (i / 29) * 500,
                y: 200 - ((finalValue - 70) / 60) * 200,
                value: parseFloat(finalValue.toFixed(1)),
                date: date.toLocaleDateString(),
                batch: MOCK_BATCHES[batchIdx % MOCK_BATCHES.length].id,
                instrument: MOCK_INSTRUMENTS[i % MOCK_INSTRUMENTS.length].id,
                status: finalValue > 120 || finalValue < 80 ? "FAIL" : finalValue > 115 || finalValue < 85 ? "WARNING" : "PASS"
            });
        }

        // Apply filters
        let filtered = data;
        if (filterBatch) {
            filtered = filtered.filter(d => d.batch === filterBatch);
        }
        if (filterInstrument) {
            filtered = filtered.filter(d => d.instrument === filterInstrument);
        }

        // Recalculate x positions after filtering
        const finalData = filtered.slice(-showLastN).map((d, i, arr) => ({
            ...d,
            x: (i / Math.max(arr.length - 1, 1)) * 500
        }));

        return finalData;
    }, [showLastN, filterBatch, filterInstrument]);

    const mean = 100;
    const ucl = 120;
    const lcl = 80;
    const warningUpper = 115;
    const warningLower = 85;

    const meanY = 200 - ((mean - 70) / 60) * 200;
    const uclY = 200 - ((ucl - 70) / 60) * 200;
    const lclY = 200 - ((lcl - 70) / 60) * 200;
    const warnUpperY = 200 - ((warningUpper - 70) / 60) * 200;
    const warnLowerY = 200 - ((warningLower - 70) / 60) * 200;

    const polylinePoints = mockData.map(d => `${d.x},${d.y}`).join(" ");

    return (
        <PremiumCard
            title="Control Chart: QC Recovery"
            subtitle="Method: SNI 6989.2:2009"
            action={
                <select
                    className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                    value={showLastN}
                    onChange={(e) => setShowLastN(Number(e.target.value))}
                >
                    <option value={10}>Last 10</option>
                    <option value={20}>Last 20</option>
                    <option value={30}>Last 30</option>
                </select>
            }
        >
            {/* Filters - Enhanced with Batch & Instrument */}
            <div className="flex flex-wrap gap-2 mb-4">
                <select
                    className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                    value={filterParameter}
                    onChange={(e) => setFilterParameter(e.target.value)}
                >
                    <option value="">All Parameters</option>
                    {MOCK_PARAMETERS.slice(0, 5).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <select
                    className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                    value={filterMatrix}
                    onChange={(e) => setFilterMatrix(e.target.value)}
                >
                    <option value="">All Matrices</option>
                    {MOCK_MATRICES.slice(0, 3).map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
                <select
                    className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                >
                    <option value="">All Batches</option>
                    {MOCK_BATCHES.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
                <select
                    className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                    value={filterInstrument}
                    onChange={(e) => setFilterInstrument(e.target.value)}
                >
                    <option value="">All Instruments</option>
                    {MOCK_INSTRUMENTS.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                </select>
                {(filterBatch || filterInstrument || filterParameter || filterMatrix) && (
                    <button
                        onClick={() => {
                            setFilterBatch("");
                            setFilterInstrument("");
                            setFilterParameter("");
                            setFilterMatrix("");
                        }}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Chart */}
            <div className="relative h-64 w-full bg-slate-50 rounded-lg p-4 border border-border-light overflow-hidden dark:bg-black/20 dark:border-border-dark">
                {/* Control Zones */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Warning zone */}
                    <div
                        className="absolute left-0 w-full bg-warning/10"
                        style={{ top: `${(warnUpperY / 200) * 100}%`, height: `${((warnLowerY - warnUpperY) / 200) * 100}%` }}
                    />
                    {/* Control zone */}
                    <div
                        className="absolute left-0 w-full bg-success/10"
                        style={{ top: `${(uclY / 200) * 100}%`, height: `${((lclY - uclY) / 200) * 100}%` }}
                    />
                </div>

                {/* SVG Chart */}
                <svg
                    className="w-full h-full relative z-10"
                    viewBox="0 0 500 200"
                    preserveAspectRatio="none"
                >
                    {/* Control Limit Lines */}
                    <line x1="0" y1={uclY} x2="500" y2={uclY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1={lclY} x2="500" y2={lclY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1={warnUpperY} x2="500" y2={warnUpperY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
                    <line x1="0" y1={warnLowerY} x2="500" y2={warnLowerY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
                    <line x1="0" y1={meanY} x2="500" y2={meanY} stroke="#22c55e" strokeWidth="1.5" />

                    {/* Data Line */}
                    <polyline
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        points={polylinePoints}
                    />

                    {/* Data Points */}
                    {mockData.map((point, i) => (
                        <g key={i}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={hoveredPoint === point ? 6 : 4}
                                fill={
                                    point.status === "FAIL" ? "#ef4444" :
                                        point.status === "WARNING" ? "#f59e0b" : "#0ea5e9"
                                }
                                className={cn(
                                    "cursor-pointer transition-all",
                                    point.status === "FAIL" && "animate-pulse"
                                )}
                                onMouseEnter={() => setHoveredPoint(point)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        </g>
                    ))}
                </svg>

                {/* Labels */}
                <span className="absolute top-1 right-2 text-[10px] font-bold text-danger">UCL (120%)</span>
                <span className="absolute bottom-1 right-2 text-[10px] font-bold text-danger">LCL (80%)</span>
                <span className="absolute right-2 text-[10px] font-bold text-success" style={{ top: `${(meanY / 200) * 100}%` }}>Mean (100%)</span>

                {/* Tooltip */}
                {hoveredPoint && (
                    <div
                        className="absolute z-20 bg-white border border-border-light rounded-lg shadow-lg p-2 text-xs pointer-events-none dark:bg-surface-dark dark:border-border-dark"
                        style={{
                            left: Math.min(hoveredPoint.x, 400),
                            top: Math.max(hoveredPoint.y - 60, 10)
                        }}
                    >
                        <p className="font-bold text-text-main dark:text-white">{hoveredPoint.value}%</p>
                        <p className="text-text-secondary">{hoveredPoint.date}</p>
                        <p className={cn(
                            "font-bold",
                            hoveredPoint.status === "FAIL" ? "text-danger" :
                                hoveredPoint.status === "WARNING" ? "text-warning" : "text-success"
                        )}>
                            {hoveredPoint.status}
                        </p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-danger" /> OOS (UCL/LCL)
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning" /> Warning (±2SD)
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" /> In Control
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-success" /> Mean
                </div>
            </div>

            {/* Statistics */}
            <div className="mt-4 pt-4 border-t border-border-light grid grid-cols-4 gap-4 text-center dark:border-border-dark">
                <div>
                    <p className="text-xs text-text-secondary">Points</p>
                    <p className="font-bold text-text-main dark:text-white">{mockData.length}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary">In Control</p>
                    <p className="font-bold text-success">{mockData.filter(d => d.status === "PASS").length}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary">Warnings</p>
                    <p className="font-bold text-warning">{mockData.filter(d => d.status === "WARNING").length}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary">OOS</p>
                    <p className="font-bold text-danger">{mockData.filter(d => d.status === "FAIL").length}</p>
                </div>
            </div>
        </PremiumCard>
    );
}
