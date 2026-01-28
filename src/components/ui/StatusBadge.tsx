import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            status: {
                default: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 ring-1 ring-inset ring-slate-500/10",
                success: "bg-success/10 text-success hover:bg-success/20 ring-1 ring-inset ring-success/20",
                warning: "bg-warning/10 text-warning hover:bg-warning/20 ring-1 ring-inset ring-warning/20",
                danger: "bg-danger/10 text-danger hover:bg-danger/20 ring-1 ring-inset ring-danger/20",
                info: "bg-primary/10 text-primary hover:bg-primary/20 ring-1 ring-inset ring-primary/20",
                pending: "bg-lab-gray/10 text-lab-gray hover:bg-lab-gray/20 ring-1 ring-inset ring-lab-gray/20",
            },
            size: {
                sm: "px-2 py-0.5 text-[10px]",
                md: "px-2.5 py-0.5 text-xs",
                lg: "px-3 py-1 text-sm",
            },
        },
        defaultVariants: {
            status: "default",
            size: "md",
        },
    }
);

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    label?: string;
    icon?: string;
}

export function StatusBadge({ className, status, size, label, icon, children, ...props }: StatusBadgeProps) {
    return (
        <div className={cn(badgeVariants({ status, size }), className)} {...props}>
            {icon && (
                <span className={cn(
                    "material-symbols-outlined mr-1",
                    size === 'sm' ? "text-[12px]" : size === 'lg' ? "text-[16px]" : "text-[14px]"
                )}>
                    {icon}
                </span>
            )}
            {label || children}
        </div>
    );
}
