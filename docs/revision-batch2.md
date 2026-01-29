# UI Route Map and Gap Analysis for LabFlow-LIMS Project

## Introduction

This report analyses the current **LabFlow-LIMS** Next.js project (folder `src/app`) against the planned end-to-end laboratory information management system described in `Labflow-LIMS-Project.md`. Only **UI/UX** aspects are assessed. The goal is to identify existing routes, describe their purpose and note where functionality is missing or incomplete relative to the blueprint. The final section proposes an enhanced UI route map that aligns with the planned flow.

## Existing Routes and Observations

The project uses the new Next.js App Router. Each `page.tsx` under `src/app` defines a route. Routes are grouped under `(dashboard)` and `(portal)` layouts. Below is a summary of each route and key observations.

### Public & Portal

| / → redirects to /dashboard | Landing page. | Simply redirects; no public marketing site. |
| --- | --- | --- |
| Route | Purpose | Key Observations |
| /portal/login | Customer login page. | Presents email/password form and mock authentication; no password reset or registration. |
| /portal | Customer portal dashboard. | Shows basic statistics for the logged in customer, sample progress cards, and a repository list with search and bulk download. Missing features: cannot view individual reports in PDF viewer; cannot see progress statuses “Received → Lab Analysis → Review → Completed” as a tracker; no user profile management. |

### Dashboard Layout

All `/dashboard/*` routes share the `(dashboard)/layout.tsx`, which provides a topbar, sidebar navigation and scrollable main area. Below, routes are grouped by functional area.


1

# Quotation & Contract Review

| Route | Purpose | Observations & Gaps |
| --- | --- | --- |
| Route | Purpose | Observations & Gaps |
| `/dashboard/quotations` | List of quotations. | Displays mock quotations and status chips. Can click a row to open the detail page, but there is no filtering/search. |
| `/dashboard/quotations/create` | Quotation builder. | Provides client selector, analysis request line items with automatic price and lead time, terms & conditions editor and internal remarks. Allows saving draft, submitting for review and creating revisions. Missing items from blueprint: ability to select predefined packages, auto-populate fields based on matrix-parameter rules (currently uses mocks), generating a PDF preview/draft, and adding attachments. |
| `/dashboard/quotations/[id]` | Quotation detail/edit. | Uses the same `QuotationForm` used in creation; there is no separate read-only view. |
| `/dashboard/quotations/review` | Contract review queue. | Lists quotations with status `SUBMITTED`. The Review button links back to the editable quotation form. There is no dedicated contract review page with checklists (lab capable, matrix compatibility, deadline realism, decision rule) and no approve/reject controls. |

# Receiving Sample / Work Order

| Route | Purpose | Observations & Gaps |
| --- | --- | --- |
| Route | Purpose | Observations & Gaps |
| `/dashboard/receiving` | Index of received samples. | Shows a table of mock work orders. Lacks filters for status or search. |
| `/dashboard/receiving/create` | Accessioning wizard. | A five-step wizard covering: (1) link quotation, (2) sampling info, (3) upload chain-of-custody document, (4) sample accessioning form and (5) completion. Sampling info and CoC steps exist, but some blueprint fields are missing (sampling coordinates, sampler name, weather conditions, field measurements like pH and DO, photo uploads, and requested tests review). The final step displays a static Work Order number and provides Print Labels but does not generate a sample receipt PDF. |
| `/dashboard/receiving/[id]` | Work order details. | Provides a summary view of a work order. Missing features: ability to view uploaded photos/CoC, change status, or see timeline. |


2

### Scheduling & Worklist

| Route | Purpose | Observations & Gaps |
| --- | --- | --- |
| `/dashboard/scheduling` | Resource planning and task assignment. | Shows a table of all test tasks with filters for instrument, status, priority and search. Allows assigning analysts individually or in bulk, changing priorities and due dates. However, it does not start from confirmed work orders to generate tasks; tasks are pre-mocked. There is no mechanism to create test tasks based on requested tests, nor to indicate whether tasks come from change requests. |
| `/dashboard/worklist` | Analyst's task board. | Displays tasks assigned to the current analyst with boards for categories (e.g., My Tasks, Overdue, Completed). Missing ability to view raw data attachments or quick actions (start run, upload results) directly from the board. |

### Testing & QC

| Route | Purpose | Observations & Gaps |
| --- | --- | --- |
| `/dashboard/testing/[taskId]` and `/dashboard/testing` | Testing workspace. | The generic test page loads a single mock task. The `ResultEntryForm` component allows entering numeric results or ND, selecting LOD/LOQ, and adding remarks. There is a QC recovery input, but no file upload for raw data and no ability to handle multiple runs. The dynamic route is not used; it always loads the first task. |
| `/dashboard/qc-monitor` | QC monitor dashboard. | Shows a QC alert table and a control chart component for a single parameter. Missing features: ability to choose parameter/matrix, show last five samples overlay, apply acceptance range (e.g., 80–120%), or handle special rules (Azo dyes). |

### Review & Report Generation

| Route | Purpose | Observations & Gaps |
| --- | --- | --- |
| `/dashboard/review` | Results review queue. | Lists work orders pending review using mock data. Progress bars and QC status are hard-coded. No filter/search or ability to order by priority. The action button directs to the work order detail instead of a dedicated review page. |
| `/dashboard/review/[id]` | Smart review detail. | Shows a list of test results with compliance and QC status indicators. Includes basic Approve & Sign and Request Revision actions. Missing features: automated checklist (all tests finalized, QC flags, raw data attached, sample metadata complete), ability to open a draft PDF for preview, or comment on individual parameters. There is no support for strict revision loop (version snapshots and status transitions). |


3

| Route | Purpose | Observations & Gaps |
| --- | --- | --- |
| `/dashboard/reports` | Report repository (admin view). | Displays a list of reports with filters for customer, matrix, status and date range. Allows navigation to create a new report for a work order. Missing search by report number or sample name, and the ability to download or view existing PDFs. |
| `/dashboard/reports/create/[woId]` | Report builder / CoA generator. | Provides template selection, signature capture, publish & lock actions and the ability to print. There is no multi-sample selection from an order as described in the blueprint, and no ability to customise report content (e.g., include QC charts). Email notifications are not handled. |

### Change Requests

| Route | Purpose | Observations & Gaps |
| --- | --- | --- |
| `/dashboard/change-requests` | Manage change requests (CR). | Lists CRs with status chips and provides a modal to create new CRs (add test, cancel test, change due date, edit metadata). Shows history and allows selection for approval or rejection with manager notes. Missing: integration with work orders to actually update tasks/tests upon approval and to trigger revision cycles if a report is already submitted or locked. |

### Settings / Master Data

| Route | Purpose | Observations & Gaps |
| --- | --- | --- |
| `/dashboard/settings` | Master data management. | Provides tabbed tables for users, customers, parameters, matrices, methods, instruments, units and test packages. Basic CRUD operations are missing (no add/edit/delete forms). The blueprint lists extensive master data (departments, analyst profiles, matrix-parameter rules, price list, packages). None of those relations are configurable from the UI yet. |

## Key Missing or Incomplete UI Pieces

1. **Contract Review page** – There is no page allowing managers to review submitted quotations with checklists (lab capability, matrix compatibility, realistic TAT, decision rule). Approve/reject actions are also missing.
2. **Quotation PDF preview and versioning** – The UI doesn't generate or display a draft quotation PDF. Revision management only increments a version number; there is no history of changes.
3. **Sample receiving details** – The receiving wizard omits sampling location coordinates, sampler name, weather conditions and field measurements (pH, temperature, DO, etc.). It also doesn't allow photo uploads or final test review before confirmation. After completion, no sample receipt PDF is generated.
4. **Task generation** – Scheduling page operates on mocked `MOCK_TASKS`; there is no UI to create test tasks from requested tests on a work order nor to confirm that all tasks are created. The blueprint states each requested test becomes a task upon scheduling.


4

5. **Dynamic testing workspace** – `/testing/[taskId]` doesn't dynamically load based on the `taskId` in the URL. Users cannot upload raw data files, record multiple runs or override LOD/LOQ with justification.
6. **QC trending & special rules** – QC monitor page lacks controls to choose a parameter/instrument and view last five samples. Acceptance range warnings (80–120%) are not clearly indicated, and there's no interface for special rules like Azo dyes.
7. **Smart review dashboard** – The review list and detail pages lack automated checklists (tests finalized, QC flags, raw data attached, metadata complete), preview of a draft report and ability to request revisions per test or across the report. There is no status timeline or audit trail.
8. **Strict revision loop** – While the review detail page allows requesting a revision with a reason, there's no UI to track revision cycles or to compare original and revised results. Tasks are not rolled back to `IN_PROGRESS` status upon rejection.
9. **Reporting** – Report builder does not support multi-sample selection (picking multiple samples from one order) and doesn't integrate QC charts or metadata. It doesn't send email notifications upon publish or lock, and there is no archive/search view for administrators.
10. **Customer portal limitations** – The portal only lists orders and simple stats. It lacks a progress tracker with stages (Received → Lab Analysis → Review → Completed), PDF preview/download for each report and the ability to update contact info or reset passwords.
11. **Master data administration** – The settings page lists master data but doesn't allow creation or editing. Tables like matrix-parameter rules, price lists, departments, analyst profiles and test packages have no UI representation.

# Proposed Final UI Route Map

The following route map aligns with the blueprint's flow and highlights the enhancements needed. It focuses on UI/UX only; backend integration is outside scope.

## Public & Portal

| Route | Description |
| --- | --- |
| `/` | Redirects to `/dashboard`. A future marketing home page can live here. |
| `/portal/login` | Customer login (with password reset link). |
| `/portal` | Customer dashboard showing order status cards, a progress tracker for each sample (Received → Lab Analysis → Review → Completed) and a repository of reports with search and filters. Each report row should link to `/portal/reports/[reportId]` for PDF viewing. Bulk download should allow selecting date ranges. |
| `/portal/reports/[reportId]` | View and download a signed report PDF. Show metadata (sample name, matrix, method) and version history if applicable. |

## Quotation & Contract Review

| Route | Description |
| --- | --- |
| `/dashboard/quotations` | Lists quotations with filters (customer, status, date). Each row links to view/edit. |


5

| Route | Description |
| --- | --- |
| `/dashboard/quotations/create` | Quotation builder. Must include: customer/contact selection, matrix and parameter/package selection (multi-select with rules), auto price & lead time from matrix-parameter rules, quantity fields, optional notes, PDF preview button and ability to save draft or submit for review. |
| `/dashboard/quotations/[quoteId]` | View/edit a quotation. Shows line items and history of revisions. Only editable when in `DRAFT` status; otherwise read-only. Includes button to open PDF preview and controls to create new revision. |
| `/dashboard/quotations/[quoteId]/review` | Contract review page for managers. Displays checklist items (lab capability, matrix compatibility, deadline realism, decision rule). Includes approve/reject buttons with optional notes. Once approved, status changes to `APPROVED`; rejections return the quote to admin for editing. |

## Sample Receiving / Work Orders

| Route | Description |
| --- | --- |
| `/dashboard/receiving` | Work order index with filters (status, customer, date). New button links to wizard. |
| `/dashboard/receiving/create` | Accessioning wizard: (1) fetch from quotation; (2) sampling information (datetime, location, coordinates, sampler name, weather); (3) field measurements (pH, temperature, DO, etc.); (4) upload CoC and sample photos; (5) sample accessioning (generate sample ID, sample name, quantity & unit, storage location, storage condition, due date); (6) review requested tests; (7) confirmation. On finish, generate sample receipt PDF and print barcode. |
| `/dashboard/receiving/[woId]` | Work order detail showing sample metadata, list of requested tests, accessioning timeline, uploaded documents/photos and status history. Includes a button to Create Change Request. |

## Scheduling & Worklist

| Route | Description |
| --- | --- |
| `/dashboard/scheduling` | Scheduling console. Allows filtering confirmed work orders, viewing requested tests, and generating test tasks (one per parameter). Lets admin assign analysts, priorities and due dates. Bulk assignment and rescheduling should be possible. |
| `/dashboard/worklist` | Analyst worklist board with tabs (My Tasks, Overdue, Completed). Each card links to the testing workspace. Supports inline actions such as starting a run, uploading raw data and marking as complete. |


6

# Testing & QC

| Route | Description |
| --- | --- |
| Route | Description |
| `/dashboard/` `testing/` `[taskId]` | Testing workspace for a specific task. Should dynamically load the task by ID. Provides controls to start a run, enter numeric results or mark as ND, override LOD/LOQ (with reason), record multiple runs, enter remarks, upload raw data, input QC recovery and mark the run complete. Displays method/instrument info and warns when QC recovery is outside 80–120%. |
| `/dashboard/` `qc-monitor` | QC monitor. Allows selecting parameter/method/instrument, viewing control charts over the last N samples and listing QC flags. Highlights warnings when recovery is out-of-range and implements special rules (e.g., Azo dyes). Supports exporting QC reports. |

# Review & Reporting

| Route | Description |
| --- | --- |
| Route | Description |
| `/dashboard/` `review` | Smart review dashboard. Lists submissions ready for review with filters (customer, matrix, status). Each row shows progress, QC summary and red/green indicators. |
| `/dashboard/` `review/` `[submissionId]` | Review detail page. Shows test results for the submission, including compliance (pass/fail), QC status and remarks. Provides an automatic checklist (all tests completed, QC flagged, raw data attached, sample metadata complete). Includes actions to generate a draft PDF preview, request revision (with scope and reason) or approve and sign. On approval, changes status to `APPROVED`, generates a final locked PDF and records signature. |
| `/dashboard/` `reports` | Report repository for administrators. Lists all reports with filters (customer, matrix, status, date range, report number). Each row allows viewing/download and shows version history. A “Create Report” button appears for completed work orders without reports. |
| `/dashboard/` `reports/create/` `[woId]` | Report builder. Allows selecting one or more samples from the work order, choosing a report template, editing report content (e.g., adding QC charts), capturing digital signatures and publishing the report. After publishing, the report can be locked. |

# Change Requests

| Route | Description |
| --- | --- |
| Route | Description |
| `/dashboard/` `change-requests` | CR dashboard. Lists change requests with filters and search. Provides a form to create a new CR linked to a work order. Managers can approve or reject CRs with notes. Approved CRs update the requested tests/tasks and, if the related report is submitted or locked, create a new revision cycle. History/audit trail is displayed in each CR detail. |


7

### Settings / Master Data

| Route | Description |
| --- | --- |
| `/dashboard/settings` | Tabbed interface to manage master data: departments, users (roles and analyst profiles), customers and contacts, matrices, parameters (and sub-parameters), methods, instruments, units, matrix-parameter rules (limit ranges, default method/instrument, TAT, LOD/LOQ), price lists and test packages. Each tab should support viewing, adding, editing and inactivating records. Matrix-parameter rules need forms for specifying limits and defaults. |

---

## Conclusion

The current UI skeleton provides a good starting point for a LIMS application but lacks many features described in the blueprint. The **final route map** above outlines the necessary pages and functionality to align the UI with the planned end-to-end laboratory workflow. Future iterations should prioritise implementing dedicated contract review, richer sample receiving, dynamic test task generation, QC trend analysis, a comprehensive review dashboard and master data management. Adding these will move the application closer to a production-ready LIMS that supports the intended laboratory operations.


8