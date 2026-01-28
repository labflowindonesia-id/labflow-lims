import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

interface QuotationFetcherProps {
    onQuotationFound: (data: any) => void;
}

export function QuotationFetcher({ onQuotationFound }: QuotationFetcherProps) {
    const [quoteId, setQuoteId] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFetch = () => {
        setLoading(true);
        // Simulate API delay
        setTimeout(() => {
            // MOCK: In a real app, query Supabase for this ID
            // Here we just simulate a successful fetch for "Q-2026-001"
            if (quoteId.toUpperCase().includes("Q-")) {
                const mockData = {
                    id: quoteId,
                    customer_id: "cust-001", // Match mock-db
                    contact_id: "cc-001",
                    matrix_id: "mat-001",
                    // Pre-fill tests from quotation
                    requested_tests: [
                        { parameter_id: "par-001", method_id: "met-001" },
                        { parameter_id: "par-002", method_id: "met-002" }
                    ]
                };
                onQuotationFound(mockData);
            } else {
                alert("Quotation not found (Try Q-2026-001)");
            }
            setLoading(false);
        }, 800);
    };

    return (
        <PremiumCard title="Step 1: Link to Quotation" subtitle="Fetch client and test details from approved quote">
            <div className="grid gap-6 md:grid-cols-2 items-end">
                <div className="space-y-2">
                    <Label>Quotation Reference ID</Label>
                    <div className="relative">
                        <Input
                            placeholder="e.g. Q-2026-001"
                            icon="receipt_long"
                            value={quoteId}
                            onChange={(e) => setQuoteId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                        />
                    </div>
                </div>
                <div>
                    <button
                        onClick={handleFetch}
                        disabled={loading || !quoteId}
                        className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary-hover disabled:opacity-70 flex items-center gap-2"
                    >
                        {loading ? "Searching..." : "Fetch Data"}
                        {!loading && <span className="material-symbols-outlined text-sm">download</span>}
                    </button>
                </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                <p>Pro Tip: Fetching will auto-lock the Price and Method to ensure consistency with the agreed Contract Review.</p>
            </div>
        </PremiumCard>
    );
}
