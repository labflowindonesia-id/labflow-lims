"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Mock search data - would come from API in production
const mockSearchData = {
    orders: [
        { id: "WO-2024-0042", type: "order", title: "Water Analysis - PT Maju Jaya", status: "In Progress", date: "2024-01-26" },
        { id: "WO-2024-0041", type: "order", title: "Soil Testing - Mining Corp", status: "Completed", date: "2024-01-25" },
        { id: "WO-2024-0040", type: "order", title: "Air Quality - Factory A", status: "Pending Review", date: "2024-01-24" },
        { id: "WO-2024-0039", type: "order", title: "Food Safety - Resto Chain", status: "Completed", date: "2024-01-23" },
        { id: "WO-2024-0038", type: "order", title: "Wastewater - Chemical Plant", status: "In Progress", date: "2024-01-22" },
    ],
    reports: [
        { id: "RPT-2024-0042", type: "report", title: "CoA - PT Maju Jaya Water", status: "Draft", date: "2024-01-26" },
        { id: "RPT-2024-0041", type: "report", title: "CoA - Mining Corp Soil", status: "Published", date: "2024-01-25" },
        { id: "RPT-2024-0039", type: "report", title: "CoA - Resto Chain Food", status: "Published", date: "2024-01-23" },
    ],
    customers: [
        { id: "C-001", type: "customer", title: "PT Maju Jaya Industries", status: "Active", date: "2023-01-15" },
        { id: "C-002", type: "customer", title: "Mining Corporation Ltd", status: "Active", date: "2023-02-20" },
        { id: "C-003", type: "customer", title: "Factory A Engineering", status: "Active", date: "2023-03-10" },
    ],
    samples: [
        { id: "S-2024-0150", type: "sample", title: "Inlet Water Sample", status: "Testing", date: "2024-01-26" },
        { id: "S-2024-0149", type: "sample", title: "Treated Effluent", status: "Completed", date: "2024-01-25" },
        { id: "S-2024-0148", type: "sample", title: "Soil Sample A1", status: "Completed", date: "2024-01-24" },
    ],
    archivedReports: [
        { id: "RPT-2019-0001", type: "archive", title: "CoA - Old Customer Report", status: "Archived", date: "2019-05-20" },
        { id: "RPT-2020-0155", type: "archive", title: "CoA - Legacy Project", status: "Archived", date: "2020-08-15" },
        { id: "RPT-2021-0089", type: "archive", title: "CoA - Historical Analysis", status: "Archived", date: "2021-03-22" },
    ],
};

type SearchCategory = "all" | "orders" | "reports" | "customers" | "samples" | "archive";

interface SearchResult {
    id: string;
    type: string;
    title: string;
    status: string;
    date: string;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<SearchCategory>("all");
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Get all searchable items
    const allItems = useMemo(() => {
        const items: SearchResult[] = [
            ...mockSearchData.orders,
            ...mockSearchData.reports,
            ...mockSearchData.customers,
            ...mockSearchData.samples,
            ...mockSearchData.archivedReports,
        ];
        return items;
    }, []);

    // Filter results based on query and category
    const filteredResults = useMemo(() => {
        let items = allItems;

        // Filter by category
        if (category !== "all") {
            const categoryMap: Record<string, string[]> = {
                orders: ["order"],
                reports: ["report"],
                customers: ["customer"],
                samples: ["sample"],
                archive: ["archive"],
            };
            items = items.filter((item) => categoryMap[category]?.includes(item.type));
        }

        // Filter by search query
        if (query.trim()) {
            const searchLower = query.toLowerCase();
            items = items.filter(
                (item) =>
                    item.id.toLowerCase().includes(searchLower) ||
                    item.title.toLowerCase().includes(searchLower) ||
                    item.status.toLowerCase().includes(searchLower)
            );
        }

        return items.slice(0, 10); // Limit to 10 results
    }, [allItems, category, query]);

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredResults]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.max(prev - 1, 0));
                    break;
                case "Enter":
                    e.preventDefault();
                    if (filteredResults[selectedIndex]) {
                        navigateToResult(filteredResults[selectedIndex]);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    onClose();
                    break;
            }
        },
        [isOpen, filteredResults, selectedIndex, onClose]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Navigate to result
    const navigateToResult = (item: SearchResult) => {
        let path = "/";
        switch (item.type) {
            case "order":
                path = `/worklist/${item.id}`;
                break;
            case "report":
                path = `/reports`;
                break;
            case "customer":
                path = `/settings`;
                break;
            case "sample":
                path = `/receiving`;
                break;
            case "archive":
                path = `/archive?id=${item.id}`;
                break;
        }
        router.push(path);
        onClose();
        setQuery("");
    };

    // Get icon and color for item type
    const getTypeInfo = (type: string) => {
        switch (type) {
            case "order":
                return { icon: "assignment", color: "text-blue-600 bg-blue-100" };
            case "report":
                return { icon: "description", color: "text-green-600 bg-green-100" };
            case "customer":
                return { icon: "business", color: "text-purple-600 bg-purple-100" };
            case "sample":
                return { icon: "science", color: "text-amber-600 bg-amber-100" };
            case "archive":
                return { icon: "inventory_2", color: "text-slate-600 bg-slate-100" };
            default:
                return { icon: "search", color: "text-slate-500 bg-slate-100" };
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white dark:bg-surface-dark rounded-xl shadow-2xl overflow-hidden">
                {/* Search Header */}
                <div className="p-4 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-text-secondary">search</span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search orders, reports, customers, samples..."
                            className="flex-1 text-lg bg-transparent outline-none text-text-main dark:text-white placeholder:text-text-secondary"
                            autoFocus
                        />
                        <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-white/10 rounded text-text-secondary">
                            ESC
                        </kbd>
                    </div>

                    {/* Category Filters */}
                    <div className="flex gap-2 mt-3">
                        {(["all", "orders", "reports", "customers", "samples", "archive"] as SearchCategory[]).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={cn(
                                    "px-3 py-1 text-xs rounded-full font-medium transition-colors capitalize",
                                    category === cat
                                        ? "bg-primary text-white"
                                        : "bg-slate-100 text-text-secondary hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20"
                                )}
                            >
                                {cat === "all" ? "All" : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {filteredResults.length > 0 ? (
                        <div className="p-2">
                            {filteredResults.map((item, index) => {
                                const typeInfo = getTypeInfo(item.type);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => navigateToResult(item)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                                            index === selectedIndex
                                                ? "bg-primary/10 dark:bg-primary/20"
                                                : "hover:bg-slate-50 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", typeInfo.color)}>
                                            <span className="material-symbols-outlined text-[20px]">{typeInfo.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-primary font-bold">{item.id}</span>
                                                <span
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                                        item.status === "Completed" || item.status === "Published"
                                                            ? "bg-green-100 text-green-700"
                                                            : item.status === "In Progress" || item.status === "Testing"
                                                                ? "bg-blue-100 text-blue-700"
                                                                : item.status === "Archived"
                                                                    ? "bg-slate-100 text-slate-600"
                                                                    : "bg-amber-100 text-amber-700"
                                                    )}
                                                >
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-main dark:text-white truncate">{item.title}</p>
                                            <p className="text-xs text-text-secondary">{item.date}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-text-secondary text-[18px]">
                                            arrow_forward
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <span className="material-symbols-outlined text-[48px] text-slate-300">search_off</span>
                            <p className="text-sm text-text-secondary mt-2">
                                {query ? `No results for "${query}"` : "Start typing to search..."}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-black/20">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded shadow-sm">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded shadow-sm">↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded shadow-sm">Enter</kbd>
                                Open
                            </span>
                        </div>
                        <span>{filteredResults.length} results</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
