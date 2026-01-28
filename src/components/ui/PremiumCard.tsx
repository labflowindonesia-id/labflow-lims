import { cn } from "@/lib/utils";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export function PremiumCard({ className, title, subtitle, action, children, ...props }: PremiumCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-border-light bg-surface-light shadow-sm transition-all hover:shadow-md dark:bg-surface-dark dark:border-border-dark",
                className
            )}
            {...props}
        >
            {(title || subtitle || action) && (
                <div className="flex items-center justify-between border-b border-border-light px-6 py-4 dark:border-border-dark">
                    <div className="space-y-1">
                        {title && <h3 className="font-display font-semibold text-text-main">{title}</h3>}
                        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
