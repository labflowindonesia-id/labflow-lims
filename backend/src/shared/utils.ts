import { nanoid } from 'nanoid';

// Generate unique IDs with optional prefix
export function generateId(prefix?: string): string {
    const id = nanoid(12);
    return prefix ? `${prefix}-${id}` : id;
}

// Generate formatted document numbers
export function generateDocNumber(prefix: string, sequence: number, year?: number): string {
    const y = year ?? new Date().getFullYear();
    const seq = sequence.toString().padStart(4, '0');
    return `${prefix}-${y}-${seq}`;
}

// Generate sample lab ID: R/YYYYMMXXXX
export function generateSampleLabId(sequence: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const seq = sequence.toString().padStart(4, '0');
    return `R/${year}${month}${seq}`;
}

// Date utilities
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function formatDateTime(date: Date): string {
    return date.toISOString();
}

// Calculate due date from TAT days
export function calculateDueDate(receivedDate: Date, tatDays: number): Date {
    return addDays(receivedDate, tatDays);
}

// Check if date is overdue
export function isOverdue(dueDate: Date): boolean {
    return new Date() > dueDate;
}

// String utilities
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}

export function slugify(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Number utilities
export function roundToDecimals(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

// Currency formatting (IDR)
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Pagination helper
export function getPaginationMeta(page: number, perPage: number, total: number) {
    return {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
    };
}

// Calculate offset for SQL
export function getOffset(page: number, perPage: number): number {
    return (page - 1) * perPage;
}
