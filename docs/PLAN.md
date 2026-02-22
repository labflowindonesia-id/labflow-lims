# PLAN: Archive Page Reactivation

## Task Analysis
**Goal**: Reactivate the `archive/page.tsx` page to use real data from the database, specifically showing reports with `RELEASED` or `COMPLETED` status. Add functional-looking UI for downloading related documents (Sample Form, Quotation Form, Test Result Form) per row, while removing the hardcoded 5-year document retention logic.

### User Requirements
1. The archive page automatically includes reports that have a status of `RELEASED` or `COMPLETED`.
2. Document downloads (Sample Form, Quotation Form, Test Result Form, etc.) will have UI buttons, but for now, they don't need to fetch from Supabase Storage—a simple placeholder UI is sufficient until PDF generation is implemented later.
3. No document age tracking or expiration logic is needed (remove 5-year retention).

## Proposed Changes

### UI Refactoring (Frontend)
- **Target File**: `src/app/(dashboard)/archive/page.tsx`
  - **Remove Mock Data**: Delete the `mockArchivedData` array and remove the complex retention logic (`filterYear`, `Expiring Soon`, `Expired`, `active` status mapping, 5-year retention banners).
  - **Integrate Real Data**: Utilize existing data hooks (`useWorkOrders`, `useCustomers`, `useSampleMatrices`, `useReports`) to map database reports to the Archive view.
  - **Filtering**: Filter the real reports to show ONLY those with `status === 'RELEASED'` (and `COMPLETED` if that status is applicable to reports/work orders).
  - **Search & Sort**: Keep the search functionality working for Report Number, Work Order Number, and Customer Name based on the real data.
  - **Download UI**: Within the table rows, add a dropdown or group of buttons for downloading related documents:
    - Sample Form
    - Quotation Form
    - Test Result Form
    - CoA / Final Report
    *(These downloads will trigger a simple UI toast/alert for now).*
  - **Cleanup UI**: Remove the "Archive Info Banner" about the 5-year document retention policy. Simplify the stats cards to show total archived reports.

## Verification Plan

### Automated Verification
- Run `npm run lint` and TypeScript checks (`tsc --noEmit`).
- Ensure no mock data leftovers.

### Manual Verification
- View `/dashboard/archive` and confirm only RELEASED/COMPLETED reports are visible.
- Click the download buttons and see the placeholder actions (alerts or toasts).
- Confirm Search and general UI functionality.
