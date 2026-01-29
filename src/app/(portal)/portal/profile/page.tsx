"use client";

export default function ProfilePage() {
    // Mock customer data - in production this would come from auth/API
    const customer = {
        name: "Budi Santoso",
        company: "PT. Indofood Sukses Makmur",
        email: "budi.santoso@indofood.co.id",
        phone: "+62 812 3456 7890",
        address: "Jl. Sudirman No. 123, Jakarta Selatan 12190",
        joinedDate: "March 2024",
        totalOrders: 47,
        lastOrderDate: "January 25, 2026",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500">Your account information</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                            {customer.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">{customer.name}</h2>
                            <p className="text-slate-500">{customer.company}</p>
                            <p className="mt-1 text-sm text-slate-400">Customer since {customer.joinedDate}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">Account Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-3xl font-bold text-primary">{customer.totalOrders}</p>
                            <p className="text-sm text-slate-500">Total Orders</p>
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-slate-700">{customer.lastOrderDate}</p>
                            <p className="text-sm text-slate-500">Last Order</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Contact Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                            <span className="material-symbols-outlined text-slate-600">mail</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Email</p>
                            <p className="font-medium text-slate-900">{customer.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                            <span className="material-symbols-outlined text-slate-600">phone</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="font-medium text-slate-900">{customer.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:col-span-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                            <span className="material-symbols-outlined text-slate-600">location_on</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Address</p>
                            <p className="font-medium text-slate-900">{customer.address}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Help Section */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <span className="material-symbols-outlined text-blue-600">help</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900">Need to update your information?</h3>
                        <p className="mt-1 text-sm text-blue-700">
                            Please contact our customer service team at{" "}
                            <a href="mailto:support@labflow.id" className="font-medium underline">
                                support@labflow.id
                            </a>{" "}
                            or call <span className="font-medium">+62 21 1234 5678</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
