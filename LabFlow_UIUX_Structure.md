# LabFlow UI/UX Documentation Structure

## 1. Ringkasan Produk & Prinsip UX

### Objective UI/UX
LabFlow LIMS dirancang sebagai aplikasi manajemen laboratorium single-tenant yang berfokus pada efisiensi operasional pengujian (testing), integritas data (ISO 17025 compliance), dan kemudahan monitoring. UI harus mengurangi beban kognitif Analyst dengan input yang jelas dan validasi real-time, serta memberikan kontrol penuh kepada Manager melalui dashboard review yang cerdas.

### Prinsip "Anti Silent Edit"
Integritas data adalah prioritas utama. Dalam UI, prinsip ini diterjemahkan menjadi:
*   **Audit Trail Visualization:** Setiap perubahan state vital (Status Order, Hasil Uji) harus memiliki jejak yang terlihat (siapa, kapan, dari apa menjadi apa).
*   **Locked States:** Input field otomatis menjadi *read-only* atau *disabled* setelah tahap tertentu (misal: setelah `Order Approved` atau `Result Submitted`).
*   **Explicit Revision:** Koreksi data yang sudah dikunci tidak bisa dilakukan dengan overwrite diam-diam. User harus melalui tombol aksi "Change Request" atau "Request Revision" yang memunculkan modal validasi dan alasan.

### Konsep Entity Utama (Mental Model)
*   **Quotation:** Penawaran komersial yang berisi daftar paket/parameter uji dan harga.
*   **Work Order (WO):** Representasi penerimaan sampel fisik. 1 WO = 1 Sampel fisik unik.
*   **Task:** Unit pekerjaan terkecil untuk Analyst (1 Parameter = 1 Task).
*   **Run:** Sesi pengerjaan Task (bisa multiple runs untuk re-check).
*   **Result:** Data hasil uji (numerik/teks) yang melekat pada Run.
*   **Report (CoA):** Dokumen final hasil kompilasi dari Task/Result yang valid.
*   **Change Request (CR):** Dokumen formal perubahan data pasca-approval.

---

## 2. Information Architecture

### Sitemap (By Role)

#### 1. Admin (Commercial & Registration)
*   **/dashboard**: Overview order, TAT warning, revenue estimasi.
*   **/quotations**: List penawaran.
    *   **/quotations/create**: Quotation Builder.
    *   **/quotations/[id]**: Detail view & status tracking.
*   **/receiving**: List penerimaan sampel (Work Order).
    *   **/receiving/create**: Sample Reception Wizard (Fetch Quote / Manual).
    *   **/receiving/[id]**: Detail sampel & cetak barcode.
*   **/scheduling**: Workload management & assignment worklist.
*   **/clients**: Database customer & contact person.
*   **/settings**: Master data (Matrix, Parameter, Price, User).

#### 2. Analyst (Lab Execution)
*   **/worklist**: Halaman utama tugas harian.
    *   Tabs: My Tasks, Overdue, Completed.
*   **/testing/[taskId]**: Workspace input data, raw data upload, & submit.
*   **/samples**: Pencarian sampel untuk cek metadata (read-only).

#### 3. Manager (Approver)
*   **/review**: Dashboard antrian approval (Review Queue).
    *   **/review/[submissionId]**: Smart Review screen (hasil + QC audit).
*   **/approval/contract**: Antrian approval Contract Review (Quotation).
*   **/approval/cr**: Antrian approval Change Request.
*   **/reports**: Repository laporan (Lock & Sign).

#### 4. Customer (Portal)
*   **/portal/tracker**: Status real-time sampel.
*   **/portal/repository**: Arsip & download PDF laporan.

### Global Components
*   **Primary Navigation (Sidebar):** Collapsible sidebar dengan icon untuk modul utama.
*   **Top Bar:** Global Search (cari Sample ID/Quote No), Notification Bell (Assign job, Revision request), User Profile.
*   **Activity/Audit Panel (Drawer):** Komponen drawer reusable di kanan layar untuk melihat log aktivitas per entity.

---

## 3. Design System & Interaction Rules (shadcn/ui-friendly)

### Layout Patterns
*   **Page Header:** Judul H2, Breadcrumbs, dan Primary Actions (diletakkan di kanan atas).
*   **Summary Cards:** Grid card di atas tabel untuk metrik kunci (misal: "Total Samples", "Pending Approval").
*   **Dense Data Tables:** Tabel data padat untuk Worklist/Quotation Line Items. Gunakan font tabular (monospaced numbers) untuk kolom numerik.
*   **Drawers (Sheet):** Digunakan untuk form "Quick Edit", detail filter, atau Audit Log agar user tidak kehilangan konteks halaman utama.
*   **Dialogs:** Hanya untuk konfirmasi kritis (Approve/Reject/Lock) atau form pendek (Add Contact).

### Form Patterns (RHF + Zod)
*   **Validation Mode:** `onBlur` untuk field berat, `onChange` untuk feedback format instan.
*   **Error Message:** Inline di bawah field (text merah text-xs).
*   **Auto-save/Draft:** Indikator "Saved..." atau "Unsaved changes" di pojok form.

### Status Representations (Badges)
*   **DRAFT / PENDING:** `Badge variant="outline"` (Slate/Gray border).
*   **SUBMITTED / IN REVIEW:** `Badge variant="secondary"` (Yellow/Blue background).
*   **APPROVED / COMPLETED:** `Badge variant="default"` atau `bg-green-100 text-green-800`.
*   **REJECTED / FAILED:** `Badge variant="destructive"` (Red).
*   **LOCKED:** Icon gembok kecil di samping status.
*   **OVERDUE:** Badge merah solid dengan icon jam.

### PDF Patterns
*   **Draft Preview:** Menggunakan iframe atau custom PDF viewer component dengan watermark besar "DRAFT".
*   **Final Action:** Tombol "Sign & Lock" yang memicu endpoint backend generat final PDF signature.

### Permission UX
*   **Hidden:** Menu navigasi yang tidak relevan dengan role user.
*   **Disabled:** Tombol aksi yang tidak valid pada state saat ini (misal: tombol "Approve" pada Quotation berstatus "Draft").
*   **Read-only:** Form field dirender sebagai text biasa (`div`) atau disabled input dengan background abu-abu tipis (shadcn `muted`).

---

## 4. Screen Dictionary

| Screen ID | Route | Role Access | Entity | Tujuan Utama |
| :--- | :--- | :--- | :--- | :--- |
| **DASH-01** | `/dashboard` | All | Summary | Overview KPI dan Shortcut. |
| **QUO-LIST** | `/quotations` | Admin | Quotation | List & filter semua penawaran. |
| **QUO-BUILD** | `/quotations/create` | Admin | Quotation | Membuat penawaran baru (wizard flow). |
| **QUO-REV** | `/approval/contract/[id]` | Manager | Quotation | Contract review (cek kapabilitas lab). |
| **REC-WIZ** | `/receiving/create` | Admin | Work Order | Input sampel masuk (Fetch Quote/Manual). |
| **REC-DET** | `/receiving/[id]` | Admin | Work Order | Detail sampel, cetak label, edit metadata. |
| **SCH-MAIN** | `/scheduling` | Admin | Task | Assign analyst & set due date. |
| **WRK-LIST** | `/worklist` | Analyst | Task | Monitoring tugas mandiri (To-do list). |
| **TEST-WS** | `/testing/[taskId]` | Analyst | Run/Result | Input hasil uji, QC check, upload raw data. |
| **REV-DASH** | `/review` | Manager | Submission | Antrian hasil yang perlu diperiksa. |
| **REV-DET** | `/review/[id]` | Manager | Submission | Smart check hasil & approval detail. |
| **RPT-GEN** | `/reports/builder` | Manager | Report | Kompilasi sampel ke format laporan multi-page. |
| **PORT-DASH**| `/portal` | Customer | Tracking | Cek status sampel sendiri. |
| **SET-MAT** | `/settings/master` | Admin | Master Data | Konfigurasi limit, parameter, harga. |
| **CR-FORM** | `/change-request/new` | Admin/Analyst | Change Request | Request perubahan data sensitif. |

---

## 5. UI/UX Detail per Screen

### 5.1 Quotation Builder (QUO-BUILD)
*   **Route:** `/quotations/create` atau `/quotations/[id]/edit`
*   **Role:** Admin
*   **Primary Jobs-to-be-done:** Membuat penawaran harga yang akurat secara teknis dan komersial dengan cepat.
*   **Entry points:** Tombol "+ New Quotation" di `QUO-LIST`.
*   **Data shown:**
    *   **Header:** Quotation No (Auto), Date, Valid Until.
    *   **Customer Info:** Selector Customer & Contact Person (Auto-fill address properties).
    *   **Line Items:** Tabel dinamis input Matrix, Parameter/Package, Qty.
    *   **Pricing Summary:** Subtotal, Tax, Discount, Grand Total.
*   **Main components:**
    *   `Combobox` (Searchable dropdown) untuk Customer & Matrix.
    *   `MultiSelect` untuk Parameter.
    *   `DataTable` editable untuk line items.
*   **Form schema:**
    *   `customer_id`: Required, select.
    *   `matrix_id`: Required, select (Trigger filter parameter).
    *   `parameters`: Multi-select array. Validation: minimal 1 parameter dipilih.
    *   `qty`: Number, min 1, default 1.
*   **States:**
    *   *Loading:* Saat fetch price list.
    *   *Partial:* Bisa simpan "Save as Draft" kapan saja.
*   **Primary actions + outcomes:**
    *   **"Save Draft"**: Simpan ke database, status `DRAFT`.
    *   **"Generate Preview"**: Buka PDF preview di modal.
    *   **"Submit for Review"**: Validasi form lengkap -> Status update ke `SUBMITTED_FOR_REVIEW` -> Redirect ke List.
*   **Acceptance criteria:**
    *   Customer contact auto-populate saat Customer dipilih.
    *   Harga dan TAT otomatis muncul sesuai `matrix_parameter_rules`.
    *   Tidak bisa Submit jika line item kosong.
    *   PDF preview menampilkan watermark "DRAFT".

### 5.2 Receiving Sample (REC-WIZ)
*   **Route:** `/receiving/create`
*   **Role:** Admin
*   **Primary Jobs-to-be-done:** Meregistrasi sampel fisik, mencocokkan dengan quotation, dan mencetak label barcode.
*   **Data shown (Stepper):**
    *   **Step 1: Reference:** Input Quotation ID -> Tombol "Fetch Data".
    *   **Step 2: Sample Identity:** Sample Name, Qty, Storage Loc, Condition (Dropdown: Intact/Leak/Damaged).
    *   **Step 3: Sampling Details:** Date, Sampler Name, Photo Upload.
    *   **Step 4: Tests:** Tabel review parameter uji (Read-only jika dari Quote, Editable jika manual).
*   **Main components:**
    *   `Stepper` (navigasi langkah).
    *   `Card` untuk detail fetch (Quote info).
    *   `FileUpload` (Dropzone) untuk foto sampel.
*   **Alerts & confirmations:**
    *   Warning jika kondisi sampel "Damaged" -> "Apakah anda yakin menerima sampel rusak? Catatan wajib diisi."
*   **Audit/activity snippet:** "Fetched from Quotation Q-2024-001 by Admin".
*   **Primary actions + outcomes:**
    *   **"Confirm Receipt"**: Generate WO ID -> Status `RECEIVED_CONFIRMED` -> Trigger Print Label Dialog.
*   **Acceptance criteria:**
    *   Fetch quotation menyalin semua parameter dan data customer dengan benar.
    *   Foto sampel wajib di-upload (jika dikonfigurasi demikian).
    *   Barcode label tercetak sesuai format.

### 5.3 Worklist & Testing Workspace (TEST-WS)
*   **Route:** `/testing/[taskId]`
*   **Role:** Analyst
*   **Primary Jobs-to-be-done:** Input hasil uji numerik/kualitatif dan validasi terhadap limit/QC.
*   **Layout:** Split View. Kiri: List Task dalam WO yang sama. Kanan: Form input hasil aktif.
*   **Data shown:**
    *   **Header:** Sample ID, Parameter, Method, Due Date.
    *   **Input Section:** Result (Number), Unit (Fixed), LOD (Auto).
    *   **ND Toggle:** Switch "Not Detected".
    *   **Upload:** Raw data attachment area.
*   **Form schema:**
    *   `result_value`: Numeric. Required jika `is_nd` false. Disabled jika `is_nd` true.
    *   `is_nd`: Boolean switch.
*   **States:**
    *   *System Flag:* Jika input > Limit -> Badge "Out of Range" merah muncul instan.
    *   *Locked:* Jika status sudah `COMPLETED`, form jadi read-only.
*   **Primary actions + outcomes:**
    *   **"Start Run"**: Timer/Timestamp start tercatat.
    *   **"Mark Completed"**: Validasi (Result ada OR ND checked) -> Status `COMPLETED` -> Prompt "Move to next task?".
*   **Alerts:**
    *   Toast Warning: "Recovery result is 75% (Standard: 80-120%). Please confirm if valid."
*   **Acceptance criteria:**
    *   Input angka memvalidasi format desimal.
    *   ND toggle menonaktifkan input result.
    *   Warning QC muncul saat value di luar range acceptance.

### 5.4 Smart Review Dashboard (REV-DET)
*   **Route:** `/review/[id]`
*   **Role:** Manager
*   **Primary Jobs-to-be-done:** Memeriksa validitas hasil tanpa harus input ulang, dan ambil keputusan Approval.
*   **Data shown:**
    *   **Checklist Panel:** "All Tests Completed", "QC Passed", "Raw Data Attached".
    *   **Results Table:** Tabel hasil uji dengan conditional formatting (Merah=Fail, Hijau=Pass).
    *   **Audit Log:** Riwayat siapa yang input dan kapan.
*   **Main components:**
    *   `Accordion` per sampel (jika multiple).
    *   `Popover` Chart untuk melihat trend 5 sampel terakhir (QC Monitoring).
*   **Primary actions:**
    *   **"Request Revision"**: Membuka modal -> Wajib isi alasan -> Pilih scope (All/Specific Test).
    *   **"Approve & Sign"**: Membuka modal preview final -> Input PIN/Konfirmasi -> Bubuhkan TTD -> Lock Report.
*   **Acceptance criteria:**
    *   Tombol Approve disabled jika ada Test yang belum selesai.
    *   Request revision mewajibkan input alasan.
    *   Approve mengubah status menjadi `LOCKED`.

---

## 6. Cross-cutting Flows

### Flow 1: Quotation → Contract Review → Order Approved
1.  Admin buat Quotation di **QUO-BUILD**. Klik "Submit for Review".
2.  Status jadi `SUBMITTED`. Notifikasi masuk ke Manager.
3.  Manager buka **QUO-REV**. Lihat ringkasan. Ceklis "Lab Capable", "Timeline OK".
4.  Manager klik "Approve". Status jadi `APPROVED`.
5.  State Quotation dikunci (Read-only). Data siap di-fetch oleh Receiving.

### Flow 2: Receiving → Scheduling → Worklist → Testing
1.  Admin di **REC-WIZ** fetch Quote Approved tadi. Lengkapi data fisik sampel. "Confirm".
2.  Admin buka **SCH-MAIN**, lihat Task status `RECEIVED`. Pilih Analyst, klik "Assign".
3.  Task muncul di **WRK-LIST** milik Analyst (Tab: My Tasks).
4.  Analyst buka **TEST-WS**, kerjakan, input hasil, upload raw data. Klik "Mark Completed".
5.  Task hilang dari My Tasks, masuk ke Completed tab.

### Flow 3: Review → Revision Loop → Approve & Sign
1.  Analyst klik "Submit for Review" untuk WO yang selesai.
2.  Manager buka **REV-DET**. Temukan kesalahan (misal: Typo unit atau QC aneh).
3.  Manager klik "Request Revision", isi note: "Cek perhitungan ulang".
4.  Status WO kembali ke `IN_PROGRESS` (atau status khusus `REVISION_REQUESTED`).
5.  Analyst dapat notifikasi. Task unlock kembali. Analyst perbaiki & submit ulang.
6.  Manager cek lagi. Kali ini OK. Klik "Approve & Sign".
7.  Report status `LOCKED`. PDF Final digenerate dengan TTD Manager.

### Flow 4: Archive & Search
1.  User klik menu "Archives".
2.  Global Search Bar dengan filter: Date Range, Customer, Sample ID, Parameter.
3.  Menggunakan fitur FTS (Full Text Search) Postgres.
4.  Hasil pencarian berupa list Report/WO. User klik untuk view detail (Read-only mode).

---

## 7. Edge Cases & Error-proofing

### ND Handling (Not Detected)
*   **UI:** Jangan biarkan user ketik manual "ND" atau "<0.01" di field numerik.
*   **Solusi:** Gunakan Toggle Switch "Not Detected". Saat aktif:
    *   Input result numerik didisabled dan dikosongkan visualnya.
    *   Sistem backend mencatat `is_nd: true`.
    *   Di report, text dirender otomatis berdasarkan rule LOD (misal: "< 0.005 mg/L").

### Method/Instrument Change (Pasca-Approve)
*   **Skenario:** Alat rusak di tengah jalan, harus ganti metode.
*   **UI:** Kolom metode di Testing Workspace read-only. Ada tombol kecil "Edit".
*   **Action:** Klik "Edit" -> Muncul Modal **Change Request**.
*   **Flow:** Analyst isi CR -> Manager Approve CR -> Baru metode di Task berubah.

### Attempt Edit after Lock
*   **Skenario:** Manager ingin ubah typo nama sampel setelah report released.
*   **UI:** Semua field form disable.
*   **Action:** Banner peringatan di atas halaman: "This report is LOCKED. To make changes, create a new Revision."
*   **Flow:** Klik tombol "Create Revision" -> Versi report naik (R0 -> R1) -> Status unlock -> Edit -> Flow approval ulang.

---

## 8. Microcopy & UX Writing

### Error & Warnings
*   **Field Kosong:** "Wajib diisi."
*   **QC Fail:** "⚠️ Warning: Recovery result is {val}% (Range: 80-120%). Data ini akan ditandai untuk review Manager."
*   **Overdue:** "⏰ Tugas ini melewati tenggat waktu (Due: {date}). Prioritaskan penyelesaian."

### Confirmations
*   **Submit Review:** "Anda akan mengirimkan **5 hasil uji** untuk ditinjau Manager. Pastikan raw data sudah diunggah. Lanjutkan?"
*   **Lock Report:** "Anda akan menyetujui dan menandatangani laporan ini. Setelah ini, laporan akan **terkunci** dan dikirim ke portal Customer. Aksi ini tidak dapat dibatalkan."

### Archive/Search
*   **Empty State:** "Belum ada sampel yang diterima hari ini. Silakan buat penerimaan baru."
*   **Search Placeholder:** "Cari No. Order, Nama Sampel, atau Customer..."

---

## 9. Appendix

### Status Glossary
*   **Quotation:** `DRAFT` -> `SUBMITTED` -> `APPROVED` -> `ORDER_CREATED`
*   **Task:** `PLANNED` -> `ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED` -> `VALIDATED`
*   **Report:** `DRAFT` -> `SUBMITTED` -> `REVISION` -> `LOCKED` -> `RELEASED`
*   **Change Request:** `OPEN` -> `APPROVED_APPLIED` -> `REJECTED`

### Role-Flow Mapping
*   **Pre-Analysis:** Admin (Quote, Receive, Schedule)
*   **Analysis:** Analyst (Test, Result, QC)
*   **Post-Analysis:** Manager (Review, Approve, Sign)
