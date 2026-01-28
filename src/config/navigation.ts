export type NavItem = {
    title: string;
    href: string;
    icon: string; // Material symbol name
    roles: ("admin" | "analyst" | "manager")[];
};

export const NAV_ITEMS: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: "dashboard",
        roles: ["admin", "manager"]
    },
    {
        title: "Quotations",
        href: "/quotations",
        icon: "request_quote",
        roles: ["admin"]
    },
    {
        title: "Receiving",
        href: "/receiving",
        icon: "move_to_inbox",
        roles: ["admin", "analyst"]
    },
    {
        title: "Worklist",
        href: "/worklist",
        icon: "playlist_add_check",
        roles: ["analyst"]
    },
    {
        title: "Testing",
        href: "/testing",
        icon: "biotech",
        roles: ["analyst"]
    },
    {
        title: "Review",
        href: "/review",
        icon: "fact_check",
        roles: ["manager", "analyst"]
    },
    {
        title: "Reports",
        href: "/reports",
        icon: "summarize",
        roles: ["admin", "manager"]
    },
    {
        title: "Settings",
        href: "/settings",
        icon: "settings",
        roles: ["admin"]
    },
];
