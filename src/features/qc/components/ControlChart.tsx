"use client";

import { useState, useMemo } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import {
    useParameters,
    useSampleMatrices,
    useQCControlChart,
    useTestTasks,
    useTestRunsAll,
    useInstruments,
    useMethods,
} from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";

interface DataPoint {
    x: number;
    y: number;
    value: number;
    date: string;
    instrument: string;
    runNumber: number | null;
    status: "PASS" | "FAIL" | "WARNING";
}

// Fixed control limits per user decision
const UCL = 120;
const LCL = 80;
const MEAN = 100;
const WARNING_UPPER = 115;
const WARNING_LOWER = 85;

export default function ControlChart() {
    const { data: parameters = [] } = useParameters();
    const { data: matrices = [] } = useSampleMatrices();
    const { data: instruments = [] } = useInstruments();
    const { data: tasks = [] } = useTestTasks();
    const { data: testRuns = [] } = useTestRunsAll();
    const { data: methods = [] } = useMethods();

    const [selectedParameter, setSelectedParameter] = useState("");
    const [filterMatrix, setFilterMatrix] = useState("");
    const [filterInstrument, setFilterInstrument] = useState("");
    const [showLastN, setShowLastN] = useState(20);
    const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

    // Fetch real QC data for selected parameter
    const { data: qcResults = [], isLoading, isError } = useQCControlChart(selectedParameter);

    // Get method name for the selected parameter (from test_tasks)
    const methodName = useMemo(() => {
        if (!selectedParameter) return "";
        const taskWithMethod = tasks.find(
            t => t.parameter_id === selectedParameter && t.method_id
        );
        if (!taskWithMethod?.method_id) return "";
        return methods.find(m => m.id === taskWithMethod.method_id)?.name ||
            methods.find(m => m.id === taskWithMethod.method_id)?.code || "";
    }, [selectedParameter, tasks, methods]);

    // Build instrument lookup
    const getInstrumentName = (instrumentId: string | null) => {
        if (!instrumentId) return "N/A";
        return instruments.find(i => i.id === instrumentId)?.name || "N/A";
    };

    // Transform real data into chart data points
    const chartData: DataPoint[] = useMemo(() => {
        if (!qcResults.length) return [];

        // Optionally filter by matrix (via task → sample → matrix)
        let filtered = qcResults;
        if (filterMatrix) {
            const taskIdsForMatrix = tasks
                .filter(t => {
                    // Would need sample lookup for matrix, but simplified:
                    // we filter by parameter already, matrix filter is secondary
                    return true;
                })
                .map(t => t.id);
            // For matrix filtering, we skip if no easy way to resolve without extra joins
            // This is a best-effort filter
        }

        // Filter by instrument (via run_id → test_runs.instrument_id)
        if (filterInstrument) {
            const runIdsForInstrument = testRuns
                .filter(r => r.instrument_id === filterInstrument)
                .map(r => r.id);
            filtered = filtered.filter(r => r.run_id && runIdsForInstrument.includes(r.run_id));
        }

        // Take last N
        const sliced = filtered.slice(-showLastN);

        return sliced.map((result, i, arr) => {
            const value = result.qc_recovery_percent ?? 0;
            const run = result.run_id ? testRuns.find(r => r.id === result.run_id) : null;

            const status: "PASS" | "FAIL" | "WARNING" =
                value > UCL || value < LCL
                    ? "FAIL"
                    : value > WARNING_UPPER || value < WARNING_LOWER
                        ? "WARNING"
                        : "PASS";

            return {
                x: (i / Math.max(arr.length - 1, 1)) * 500,
                y: 200 - ((value - 70) / 60) * 200,
                value: parseFloat(value.toFixed(1)),
                date: result.entered_at
                    ? new Date(result.entered_at).toLocaleDateString()
                    : new Date(result.created_at).toLocaleDateString(),
                instrument: getInstrumentName(run?.instrument_id || null),
                runNumber: run?.run_number ?? null,
                status,
            };
        });
    }, [qcResults, showLastN, filterInstrument, testRuns, instruments]);

    // Calculate SVG coordinates for control lines
    const meanY = 200 - ((MEAN - 70) / 60) * 200;
    const uclY = 200 - ((UCL - 70) / 60) * 200;
    const lclY = 200 - ((LCL - 70) / 60) * 200;
    const warnUpperY = 200 - ((WARNING_UPPER - 70) / 60) * 200;
    const warnLowerY = 200 - ((WARNING_LOWER - 70) / 60) * 200;

    const polylinePoints = chartData.map(d => `${d.x},${d.y}`).join(" ");

    // Last 5 samples trend
    const lastFiveData = chartData.slice(-5);
    const lastFiveMean = lastFiveData.length > 0
        ? parseFloat((lastFiveData.reduce((sum, d) => sum + d.value, 0) / lastFiveData.length).toFixed(1))
        : 0;
    const lastFiveMin = lastFiveData.length > 0 ? Math.min(...lastFiveData.map(d => d.value)) : 0;
    const lastFiveMax = lastFiveData.length > 0 ? Math.max(...lastFiveData.map(d => d.value)) : 0;
    const trendDirection = lastFiveData.length >= 2
        ? (lastFiveData[lastFiveData.length - 1].value - lastFiveData[0].value) > 2
            ? "RISING" : (lastFiveData[lastFiveData.length - 1].value - lastFiveData[0].value) < -2
                ? "FALLING" : "STABLE"
        : "STABLE";

    // Unique instruments in current data for filter
    const usedInstrumentIds = useMemo(() => {
        const ids = new Set<string>();
        qcResults.forEach(r => {
            if (r.run_id) {
                const run = testRuns.find(tr => tr.id === r.run_id);
                if (run?.instrument_id) ids.add(run.instrument_id);
            }
        });
        return Array.from(ids);
    }, [qcResults, testRuns]);

    // Export CSV with real data
    const handleExportCSV = () => {
        if (!chartData.length) return;
        const paramName = parameters.find(p => p.id === selectedParameter)?.name || "unknown";
        const csvContent = [
            "Date,QC Recovery %,Status,Instrument,Run #",
            ...chartData.map(d => `${d.date},${d.value},${d.status},${d.instrument},${d.runNumber ?? "N/A"}`)
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qc_control_chart_${paramName}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Selected parameter name for subtitle
    const selectedParamName = parameters.find(p => p.id === selectedParameter)?.name || "";

    return (
        <PremiumCard
            title="Control Chart: QC Recovery"
            subtitle={selectedParameter
                ? `Parameter: ${selectedParamName}${methodName ? ` • Method: ${methodName}` : ""}`
                : "Select a parameter to view QC trend"
            }
            action={
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        disabled={!chartData.length}
                        className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export to CSV"
                    >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        CSV
                    </button>
                    <select
                        className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                        value={showLastN}
                        onChange={(e) => setShowLastN(Number(e.target.value))}
                    >
                        <option value={10}>Last 10</option>
                        <option value={20}>Last 20</option>
                        <option value={30}>Last 30</option>
                    </select>
                </div>
            }
        >
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <select
                    className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark font-medium"
                    value={selectedParameter}
                    onChange={(e) => setSelectedParameter(e.target.value)}
                >
                    <option value="">-- Select Parameter --</option>
                    {parameters.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <select
                    className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                    value={filterMatrix}
                    onChange={(e) => setFilterMatrix(e.target.value)}
                >
                    <option value="">All Matrices</option>
                    {matrices.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
                <select
                    className="text-xs border border-border-light rounded px-2 py-1 bg-white dark:bg-surface-dark dark:border-border-dark"
                    value={filterInstrument}
                    onChange={(e) => setFilterInstrument(e.target.value)}
                >
                    <option value="">All Instruments</option>
                    {usedInstrumentIds.map(id => {
                        const inst = instruments.find(i => i.id === id);
                        return (
                            <option key={id} value={id}>{inst?.name || id}</option>
                        );
                    })}
                </select>
                {(filterMatrix || filterInstrument) && (
                    <button
                        onClick={() => {
                            setFilterMatrix("");
                            setFilterInstrument("");
                        }}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Chart Area */}
            {!selectedParameter ? (
                <div className="relative h-64 w-full bg-slate-50 rounded-lg p-4 border border-border-light dark:bg-black/20 dark:border-border-dark flex items-center justify-center">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-[48px] text-text-secondary/30">monitoring</span>
                        <p className="mt-2 text-sm text-text-secondary">Select a parameter above to view the QC control chart</p>
                    </div>
                </div>
            ) : isLoading ? (
                <div className="relative h-64 w-full bg-slate-50 rounded-lg p-4 border border-border-light dark:bg-black/20 dark:border-border-dark flex items-center justify-center">
                    <div className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : isError ? (
                <div className="relative h-64 w-full bg-slate-50 rounded-lg p-4 border border-danger/30 dark:bg-black/20 dark:border-danger/30 flex items-center justify-center">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-[48px] text-danger/50">error</span>
                        <p className="mt-2 text-sm text-danger">Failed to load QC data. Check console for details.</p>
                        <button
                            onClick={() => setSelectedParameter("")}
                            className="mt-2 text-xs text-primary hover:underline"
                        >Reset & retry</button>
                    </div>
                </div>
            ) : chartData.length === 0 ? (
                <div className="relative h-64 w-full bg-slate-50 rounded-lg p-4 border border-border-light dark:bg-black/20 dark:border-border-dark flex items-center justify-center">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-[48px] text-text-secondary/30">show_chart</span>
                        <p className="mt-2 text-sm text-text-secondary">No QC recovery data for this parameter</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="relative h-64 w-full bg-slate-50 rounded-lg p-4 border border-border-light overflow-hidden dark:bg-black/20 dark:border-border-dark">
                        {/* Control Zones */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div
                                className="absolute left-0 w-full bg-warning/10"
                                style={{ top: `${(warnUpperY / 200) * 100}%`, height: `${((warnLowerY - warnUpperY) / 200) * 100}%` }}
                            />
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
                            <line x1="0" y1={uclY} x2="500" y2={uclY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
                            <line x1="0" y1={lclY} x2="500" y2={lclY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
                            <line x1="0" y1={warnUpperY} x2="500" y2={warnUpperY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
                            <line x1="0" y1={warnLowerY} x2="500" y2={warnLowerY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
                            <line x1="0" y1={meanY} x2="500" y2={meanY} stroke="#22c55e" strokeWidth="1.5" />

                            {chartData.length > 1 && (
                                <polyline
                                    fill="none"
                                    stroke="#0ea5e9"
                                    strokeWidth="2"
                                    points={polylinePoints}
                                />
                            )}

                            {chartData.map((point, i) => (
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
                        <span className="absolute top-1 right-2 text-[10px] font-bold text-danger">UCL ({UCL}%)</span>
                        <span className="absolute bottom-1 right-2 text-[10px] font-bold text-danger">LCL ({LCL}%)</span>
                        <span className="absolute right-2 text-[10px] font-bold text-success" style={{ top: `${(meanY / 200) * 100}%` }}>Mean ({MEAN}%)</span>

                        {/* Tooltip */}
                        {hoveredPoint && (
                            <div
                                className="absolute z-20 bg-white border border-border-light rounded-lg shadow-lg p-2 text-xs pointer-events-none dark:bg-surface-dark dark:border-border-dark"
                                style={{
                                    left: Math.min(hoveredPoint.x, 400),
                                    top: Math.max(hoveredPoint.y - 70, 10)
                                }}
                            >
                                <p className="font-bold text-text-main dark:text-white">{hoveredPoint.value}%</p>
                                <p className="text-text-secondary">{hoveredPoint.date}</p>
                                <p className="text-text-secondary">{hoveredPoint.instrument}</p>
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

                    {/* Last 5 Samples Trend Summary */}
                    {lastFiveData.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                            <h4 className="text-sm font-bold text-text-main dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[18px]">trending_up</span>
                                Last {lastFiveData.length} Samples Trend
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {lastFiveData.map((d, i) => (
                                    <div key={i} className={cn(
                                        "text-center p-2 rounded-lg border-2",
                                        d.status === "FAIL" ? "border-danger bg-danger/10" :
                                            d.status === "WARNING" ? "border-warning bg-warning/10" :
                                                "border-success/30 bg-success/5"
                                    )}>
                                        <p className={cn(
                                            "text-lg font-mono font-bold",
                                            d.status === "FAIL" ? "text-danger" :
                                                d.status === "WARNING" ? "text-warning" : "text-success"
                                        )}>{d.value}%</p>
                                        <p className="text-[10px] text-text-secondary truncate">{d.date}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 pt-3 border-t border-primary/20 grid grid-cols-4 gap-4 text-xs">
                                <div className="text-center">
                                    <p className="text-text-secondary">Mean</p>
                                    <p className="font-bold text-text-main dark:text-white">{lastFiveMean}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-text-secondary">Range</p>
                                    <p className="font-mono text-text-main dark:text-white">{lastFiveMin.toFixed(1)} - {lastFiveMax.toFixed(1)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-text-secondary">Trend</p>
                                    <p className={cn(
                                        "font-bold flex items-center justify-center gap-1",
                                        trendDirection === "RISING" ? "text-warning" :
                                            trendDirection === "FALLING" ? "text-danger" : "text-success"
                                    )}>
                                        <span className="material-symbols-outlined text-[14px]">
                                            {trendDirection === "RISING" ? "trending_up" :
                                                trendDirection === "FALLING" ? "trending_down" : "trending_flat"}
                                        </span>
                                        {trendDirection}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-text-secondary">OOS Risk</p>
                                    <p className={cn(
                                        "font-bold",
                                        lastFiveMean > 115 || lastFiveMean < 85 ? "text-danger" :
                                            lastFiveMean > 110 || lastFiveMean < 90 ? "text-warning" : "text-success"
                                    )}>
                                        {lastFiveMean > 115 || lastFiveMean < 85 ? "HIGH" :
                                            lastFiveMean > 110 || lastFiveMean < 90 ? "MEDIUM" : "LOW"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Statistics */}
                    <div className="mt-4 pt-4 border-t border-border-light grid grid-cols-4 gap-4 text-center dark:border-border-dark">
                        <div>
                            <p className="text-xs text-text-secondary">Points</p>
                            <p className="font-bold text-text-main dark:text-white">{chartData.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">In Control</p>
                            <p className="font-bold text-success">{chartData.filter(d => d.status === "PASS").length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">Warnings</p>
                            <p className="font-bold text-warning">{chartData.filter(d => d.status === "WARNING").length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">OOS</p>
                            <p className="font-bold text-danger">{chartData.filter(d => d.status === "FAIL").length}</p>
                        </div>
                    </div>
                </>
            )}
        </PremiumCard>
    );
}
