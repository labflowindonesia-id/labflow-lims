import { useState } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { searchApprovedQuotations, type QuotationSearchResult } from "../services/receivingService";

interface QuotationFetcherProps {
    onQuotationFound: (data: QuotationSearchResult) => void;
}

export function QuotationFetcher({ onQuotationFound }: QuotationFetcherProps) {
    const [quoteId, setQuoteId] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<QuotationSearchResult[]>([]);
    const [searched, setSearched] = useState(false);

    const handleFetch = async () => {
        if (!quoteId.trim()) return;
        setLoading(true);
        setSearched(true);

        try {
            const data = await searchApprovedQuotations(quoteId.trim());
            setResults(data);

            if (data.length === 1) {
                onQuotationFound(data[0]);
            }
        } catch (err) {
            console.error("Failed to search quotations:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PremiumCard title="Step 1: Link to Quotation" subtitle="Fetch client and test details from approved quote">
            <div className="grid gap-6 md:grid-cols-2 items-end">
                <div className="space-y-2">
                    <Label>Quotation Number / ID</Label>
                    <div className="relative">
                        <Input
                            placeholder="e.g. QT-2026-001"
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

            {/* Results list for multiple results */}
            {searched && results.length > 1 && (
                <div className="mt-4 space-y-2">
                    <p className="text-sm text-text-secondary font-medium">
                        Found {results.length} approved quotations. Select one:
                    </p>
                    {results.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => onQuotationFound(r)}
                            className="w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-semibold text-sm">{r.quotation_number}</span>
                                    <span className="text-xs text-text-secondary ml-2">— {r.customer_name}</span>
                                </div>
                                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                    {r.matrix_name}
                                </span>
                            </div>
                            <p className="text-xs text-text-secondary mt-1">{r.lines.length} test parameter(s)</p>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {searched && !loading && results.length === 0 && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <p>No approved quotation found for &ldquo;{quoteId}&rdquo;. Only quotations with status &ldquo;APPROVED&rdquo; can be used.</p>
                </div>
            )}

            {/* Single result auto-selected */}
            {searched && results.length === 1 && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <p>Quotation <strong>{results[0].quotation_number}</strong> loaded — {results[0].customer_name} ({results[0].lines.length} tests)</p>
                </div>
            )}

            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                <p>Pro Tip: Fetching will auto-lock the Price and Method to ensure consistency with the agreed Contract Review.</p>
            </div>
        </PremiumCard>
    );
}
