import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => ReactNode;
    className?: string; // For setting width or alignment
}

interface DenseTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string | number;
    onRowClick?: (item: T) => void;
    className?: string;
}

export function DenseTable<T>({ data, columns, keyExtractor, onRowClick, className }: DenseTableProps<T>) {
    return (
        <div className={cn("w-full overflow-hidden rounded-xl border border-border-light bg-surface-light shadow-sm dark:bg-surface-dark dark:border-border-dark", className)}>
            <div className="overflow-x-auto scroller">
                <table className="w-full text-left text-sm">
                    <thead className="bg-background-light text-text-secondary dark:bg-black/20">
                        <tr>
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    className={cn(
                                        "whitespace-nowrap border-b border-border-light px-6 py-3 text-left font-medium text-text-secondary dark:border-border-dark",
                                        col.className
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color dark:divide-white/5">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-secondary">
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={keyExtractor(item)}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={cn(
                                        "group transition-colors hover:bg-primary/5 dark:hover:bg-primary/5",
                                        onRowClick && "cursor-pointer"
                                    )}
                                >
                                    {columns.map((col, index) => (
                                        <td
                                            key={index}
                                            className={cn(
                                                "whitespace-nowrap px-6 py-3 text-text-main dark:text-white", // Matched padding to dashboard
                                                "font-normal", // Removed mono default, let columns specify tabular-nums if needed or use tabular-nums globally for numbers
                                                col.className
                                            )}
                                        >
                                            {col.cell ? col.cell(item) : (item[col.accessorKey as keyof T] as ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
