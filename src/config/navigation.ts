
// Map internal roles to navigation visibility
type Role = "admin" | "manager" | "analyst";

interface NavItem {
    title: string;
    href: string;
    icon: string;
    roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: "dashboard",
        roles: ["admin", "manager", "analyst"],
    },
    {
        title: "Quotations",
        href: "/quotations", // Updated: Points to List
        icon: "request_quote",
        roles: ["admin", "manager"], // Sales/Admin only
    },
    {
        title: "Contract Review",
        href: "/quotations/review",
        icon: "fact_check", // Changed icon
        roles: ["manager"], // Manager only
    },
    {
        title: "Receiving",
        href: "/receiving", // Updated: Points to List
        icon: "inventory_2",
        roles: ["admin"],
    },
    {
        title: "Scheduling", // NEW
        href: "/scheduling",
        icon: "calendar_month",
        roles: ["admin", "manager"],
    },
    {
        title: "My Worklist", // Updated Label
        href: "/worklist",
        icon: "biotech", // Testing icon
        roles: ["analyst"], // Analyst only
    },
    {
        title: "QC Monitor",
        href: "/qc-monitor",
        icon: "analytics",
        roles: ["manager", "admin"],
    },
    {
        title: "Results Review",
        href: "/review",
        icon: "grading",
        roles: ["manager"],
    },
    {
        title: "Reports",
        href: "/reports",
        icon: "description",
        roles: ["admin", "manager"],
    },
    {
        title: "Archive",
        href: "/archive",
        icon: "inventory_2",
        roles: ["admin", "manager"],
    },
];
