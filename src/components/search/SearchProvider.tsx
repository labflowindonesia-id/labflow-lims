"use client";

import { useState, useEffect, useCallback } from "react";
import GlobalSearch from "@/components/search/GlobalSearch";

export default function SearchProvider({ children }: { children: React.ReactNode }) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ctrl+K or Cmd+K to open search
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            setIsSearchOpen(true);
        }
    }, []);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return (
        <>
            {children}
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Floating Search Button for mobile/touch devices */}
            <button
                onClick={() => setIsSearchOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover flex items-center justify-center md:hidden"
                aria-label="Open search"
            >
                <span className="material-symbols-outlined">search</span>
            </button>
        </>
    );
}
