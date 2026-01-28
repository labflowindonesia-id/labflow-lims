import { cn } from "@/lib/utils";

interface ActionToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
}

export function ActionToolbar({ className, title, description, actions, children, ...props }: ActionToolbarProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 border-b border-border-light bg-surface-light/50 px-6 py-4 backdrop-blur-sm dark:bg-surface-dark/50 dark:border-border-dark md:flex-row md:items-center md:justify-between",
                className
            )}
            {...props}
        >
            <div className="space-y-1">
                {title && <h1 className="text-xl font-bold font-display text-text-main">{title}</h1>}
                {description && <p className="text-sm text-text-secondary">{description}</p>}
                {children} {/* For extra content like breadcrumbs if needed */}
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}

interface SmartFilterProps {
    placeholder?: string;
    onSearch?: (term: string) => void;
    filters?: React.ReactNode;
    className?: string;
}

export function SmartFilter({ placeholder = "Search...", onSearch, filters, className }: SmartFilterProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    search
                </span>
                <input
                    type="text"
                    placeholder={placeholder}
                    className="h-9 w-64 rounded-lg border border-border-color bg-white pl-9 pr-4 text-sm text-text-main placeholder-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-white/5 dark:border-white/10"
                    onChange={(e) => onSearch && onSearch(e.target.value)}
                />
            </div>
            {filters && (
                <div className="flex items-center gap-2 border-l border-border-color pl-2 dark:border-white/10">
                    {filters}
                </div>
            )}
        </div>
    )
}
