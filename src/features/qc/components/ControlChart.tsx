import { PremiumCard } from "@/components/ui/PremiumCard";

export default function ControlChart() {
    return (
        <PremiumCard title="Control Chart: COD Recovery" subtitle="Method: SNI 6989.2:2009 (Last 20 batches)">
            <div className="relative h-64 w-full bg-slate-50 rounded-lg p-4 border border-border-light overflow-hidden">
                {/* Zones */}
                <div className="absolute top-[20%] left-0 w-full h-[60%] bg-green-500/5"></div>
                <div className="absolute top-[50%] left-0 w-full h-[1px] bg-green-500 border-t border-dashed border-green-500 opacity-50"></div> {/* Mean */}

                {/* SVG Chart */}
                <svg className="w-full h-full" preserveAspectRatio="none">
                    <polyline
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        points="0,150 50,140 100,160 150,130 200,145 250,50 300,140 350,155 400,135 450,145 500,150"
                    />
                    {/* Points */}
                    <circle cx="250" cy="50" r="4" fill="#ef4444" className="animate-pulse" /> {/* Outlier */}
                </svg>

                {/* Labels */}
                <span className="absolute top-2 right-2 text-xs font-bold text-red-500">UCL (+3SD)</span>
                <span className="absolute bottom-2 right-2 text-xs font-bold text-red-500">LCL (-3SD)</span>
                <span className="absolute top-[50%] right-2 text-xs font-bold text-green-600">Mean</span>
            </div>

            <div className="mt-4 flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span> OOS
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span> In Control
                </div>
            </div>
        </PremiumCard>
    );
}
