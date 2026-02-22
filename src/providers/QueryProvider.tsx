"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface QueryProviderProps {
    children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data is fresh for 5 minutes
                        staleTime: 5 * 60 * 1000,
                        // Keep unused data in cache for 30 minutes
                        gcTime: 30 * 60 * 1000,
                        // Retry failed requests up to 2 times, but skip AbortErrors
                        retry: (failureCount, error) => {
                            // Don't retry AbortErrors (caused by React Strict Mode double-mount)
                            if (error instanceof DOMException && error.name === "AbortError") return false;
                            if (error && typeof error === "object" && "name" in error && (error as { name: string }).name === "AbortError") return false;
                            return failureCount < 2;
                        },
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
                        // Don't refetch on window focus in development
                        refetchOnWindowFocus: process.env.NODE_ENV === "production",
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
