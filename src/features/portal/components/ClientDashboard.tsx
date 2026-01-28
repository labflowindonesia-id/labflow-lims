import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { MOCK_WORK_ORDERS } from "@/data/mock-db";
import Link from "next/link";

export default function ClientDashboard() {
    // Filter for logged in customer (Mock: cust-001)
    const myOrders = MOCK_WORK_ORDERS.filter(w => w.customer_id === "cust-001");

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Active Orders</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{myOrders.filter(w => w.status !== "COMPLETED").length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Completed</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">{myOrders.filter(w => w.status === "COMPLETED").length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Total Spent</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">IDR 12.5M</p>
                </div>
            </div>

            {/* Orders Table */}
            <PremiumCard title="Recent Orders" subtitle="Track progress and download reports">
                <DenseTable
                    data={myOrders}
                    keyExtractor={w => w.id}
                    columns={[
                        { header: "Order ID", accessorKey: "work_order_no", className: "font-mono font-medium" },
                        {
                            header: "Date Received",
                            accessorKey: "received_date",
                            cell: w => w.received_date.toLocaleDateString()
                        },
                        {
                            header: "Status",
                            accessorKey: "status",
                            cell: (w) => (
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${w.status === "COMPLETED" ? "bg-green-50 text-green-700 ring-green-600/20" :
                                        w.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 ring-blue-700/10" :
                                            "bg-yellow-50 text-yellow-800 ring-yellow-600/20"
                                    }`}>
                                    {w.status.replace("_", " ")}
                                </span>
                            )
                        },
                        {
                            header: "Samples",
                            accessorKey: "sample_count",
                            className: "text-center"
                        },
                        {
                            header: "Action",
                            accessorKey: "id",
                            className: "text-right",
                            cell: (w) => (
                                <div className="flex justify-end gap-2">
                                    {w.status === "COMPLETED" ? (
                                        <Link href={`/reports/create/${w.id}`}>
                                            <button className="flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-green-700">
                                                <span className="material-symbols-outlined text-[14px]">download</span>
                                                CoA
                                            </button>
                                        </Link>
                                    ) : (
                                        <button className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 cursor-not-allowed">
                                            Processing
                                        </button>
                                    )}
                                </div>
                            )
                        }
                    ]}
                    className="border-0"
                />
            </PremiumCard>
        </div>
    );
}
