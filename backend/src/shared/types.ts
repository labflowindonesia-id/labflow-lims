// User roles
export type UserRole = 'ADMIN' | 'MANAGER' | 'ANALYST';

// Status types
export type QuotationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
export type WorkOrderStatus = 'RECEIVED_DRAFT' | 'RECEIVED_CONFIRMED' | 'IN_ANALYSIS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_RECHECK' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type SubmissionStatus = 'SUBMITTED' | 'RETURNED' | 'APPROVED';
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'LOCKED' | 'RELEASED';
export type ChangeRequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'APPLIED';
export type ConditionStatus = 'INTACT' | 'LEAK' | 'DAMAGED' | 'OTHER';
export type SamplingMethod = 'GRAB' | 'COMPOSITE';
export type LimitType = 'MAX' | 'MIN' | 'RANGE' | 'NONE';
export type ComplianceStatus = 'PASS' | 'FAIL' | 'NOT_EVALUATED';
export type QCStatus = 'PASS' | 'FAIL' | 'NONE';
export type NDReportingStyle = 'ND_TEXT' | 'LT_LOD' | 'LT_LOQ';
export type RevisionScope = 'ENTIRE_REPORT' | 'SPECIFIC_TESTS';
export type ChangeType = 'ADD_TEST' | 'REMOVE_TEST' | 'UPDATE_TEST_DUE_DATE' | 'UPDATE_METHOD_INSTRUMENT' | 'UPDATE_SAMPLE_METADATA' | 'UPDATE_STORAGE_LOCATION' | 'UPDATE_CUSTOMER_CONTACT' | 'OTHER';
export type EntityType = 'QUOTATION' | 'QUOTATION_LINE' | 'WORK_ORDER' | 'SAMPLE' | 'REQUESTED_TEST' | 'TEST_TASK' | 'REPORT';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'GENERATE_PDF' | 'LOCK' | 'UNLOCK';
export type NotificationChannel = 'EMAIL';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
export type TimelineStage = 'RECEIVED' | 'LAB_ANALYSIS' | 'REVIEW' | 'COMPLETED';

// Auth types
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
}

export interface JWTPayload {
    sub: string;
    email: string;
    role: UserRole;
    fullName: string;
    iat: number;
    exp: number;
}

// Portal auth
export interface PortalUser {
    id: string;
    customerId: string;
    customerName: string;
    email: string;
}

// Pagination
export interface PaginationParams {
    page: number;
    perPage: number;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}
