# LabFlow LIMS Web Application

---

## FLOW LABFLOW LIMS

1. **Quotation → Contract Review → Order Approved**
2. **Receiving sample** (buat Sample ID + upload CoC + foto + lokasi)
3. **Registrasi & Scheduling** (tests dibuat, assign analyst, due date)
4. **Testing** (manual entry numeric + auto limit compare pass/fail)
5. **QC monitoring** (control chart; warning jika recovery out-of-range; rule khusus Azo dyes)
6. **Report Builder multi-sample** (pilih sample dari 1 order → compile universal template)
7. **Manager Approve & Sign** (1 tahap, lock per report)
8. **Release** (email + portal)
9. **Arsip & Search** (retensi 5 tahun; pencarian cepat)
   Regenerasi System

Berikut **flow end-to-end** aplikasi LIMS kamu (single-tenant) dari **Quotation → Receiving → Scheduling/Worklist → Testing + QC → Review → Report PDF LOCK → Customer Portal**, termasuk **master data** dan **info analyst**. Aku tulis seperti "blueprint operasional" biar gampang kamu jadikan SOP + acuan coding.

---

## A) Role & prinsip sistem

### Roles

*   **Admin**
    *   bikin quotation, contract review submission, receiving sample, scheduling/assignment, buat CR
*   **Analyst**
    *   kerjakan task di worklist, input hasil uji + upload raw data, QC input (recovery), submit hasil untuk review
*   **Manager**
    *   monitoring semua, review queue, approve/reject, approve CR, approve & sign report (tanpa input angka)

### Prinsip "anti silent edit"

*   Setelah **Order Approved**: perubahan data operasional (test list, due date, metode/instrumen, metadata sample) hanya boleh lewat **Change Request (CR)**.
*   Setelah **Report LOCKED**: perubahan apa pun harus menciptakan **revision cycle** (versioning report), bukan overwrite.

---

# B) Master Data (pondasi sebelum transaksi jalan)

## 1) Organisasi & user

*   **Departments** (dropdown)
*   **Users** (Admin/Manager/Analyst)
*   **Analyst profile** (opsional tapi recommended)
    - skill/kompetensi (matrix/parameter/method/instrument), status aktif

## 2) Customer

*   **Customers**
*   **Customer contacts** (PIC: nama, email, mobile, alamat)

## 3) Teknologi uji

*   **Sample matrices** (mis: Domestic Wastewater)
*   **Parameters** (+ optional sub-parameter)
*   **Units**
*   **Methods**
*   **Instruments**

## 4) Rules & Pricing (yang bikin sistem "auto")

*   **Matrix–Parameter Rules**
    - default method & instrument
    - TAT/lead time default
    - limit per matriks (MIN/MAX/RANGE)
    - LOD/LOQ default (untuk ND best practice)
*   **Price list**
    - harga per matriks-parameter (atau paket)
*   **Test packages** (opsional)
    - paket parameter untuk quote cepat

***

# C) Flow utama aplikasi (end-to-end)

## 1) Quotation (Admin)

### Tujuan

*   bikin penawaran resmi (PDF) berdasarkan customer + matriks + parameter (multi) dengan auto price & lead time.

### Langkah

1.  Admin masuk **Quotation Builder**
2.  Pilih **Customer + Contact**
3.  Pilih **Matrix**
4.  Pilih **Parameter/Sub-Parameter** (multi-select) atau pilih **Package**

5. Sistem auto populate:
    - method & instrument default (dari matrix-parameter rules)
    - unit price (dari price list)
    - lead time/TAT estimasi (dari rules)
6. Admin set:
    - quantity/qty (jika relevan)
    - notes/terms (opsional)
7. **Generate Draft Quotation PDF**
8. Submit ke **Contract Review**

### Output

*   Quotation status: Draft → Submitted_for_review
*   Dokumen: Draft PDF tersimpan
*   Semua line item tersimpan sebagai snapshot (harga, method, instrument, lead time)

---

## 2) Contract Review (Manager)

### Tujuan

*   validasi sebelum order dianggap "approved".

### Checklist (minimal)

*   Lab capable menjalankan metode
*   Matrix compatible
*   Deadline realistis
*   Decision rule "simple acceptance" tercatat

### Keputusan

*   **Approve**
    - quotation status → APPROVED (Order Approved)
    - mulai "anti silent edit": perubahan pasca-approve wajib lewat CR
*   **Reject**
    - kembali ke admin untuk perbaikan

---

## 3) Receiving Sample / Create Work Order (Admin)

Kamu set: **1 Work Order = 1 Sample** (tidak ada subsample).

### Tujuan

*   mencatat penerimaan sample fisik dengan lengkap sampai bisa jadi dokumen "Sample Receipt" + barcode label.

### Langkah

1. Admin masuk **Receiving / Create Sample**
2. Input/scan **Quotation ID** (jika dari quotation)
3. Klik **Fetch from Quotation**
    - sistem tarik: customer+contact, matrix, requested tests + due date/TAT
4. Admin isi **Primary sample details**
    - Sample Name
    - Quantity & unit text
    - Storage location & storage condition
    - Condition upon receipt (intact/leak/damaged) + notes
    - Upload sample photo(s)
5. Admin isi **Sampling info** (opsional jika data ada)
    - sampling datetime, lokasi, koordinat, sampler, grab/composite, weather
6. Admin isi **Field Measurements** (opsional)
    - pH, suhu, DO, debit, dll
7. Final check **Requested Tests**
    - parameter, method, instrument, due date
8. Klik **Confirm Receipt**
    - Work Order status → RECEIVED_CONFIRMED
    - generate **Sample Receipt PDF**
    - generate/print **barcode label**

### Output

*   Work Order + Sample record lengkap
*   Requested tests terbentuk (source of truth untuk scheduling)
*   Sample receipt PDF tersimpan
*   Timeline stage: RECEIVED

---

## 4) Scheduling & Assignment (Admin)

### Tujuan

*   membagi pekerjaan uji ke analyst dan membentuk Worklist.

### Langkah

1. Admin buka **Scheduling**
2. Filter work order status: RECEIVED_CONFIRMED
3. Sistem tampilkan daftar requested tests untuk WO itu
4. Admin assign:
    - analyst (dropdown)
    - priority (low/normal/high/urgent)
    - due date (default dari requested tests)
5. Klik **Create Tasks**
    - sistem buat **test_tasks** status ASSIGNED untuk masing-masing test

### Output

*   Worklist Analyst terbentuk
*   Timeline stage bisa bergeser ke LAB_ANALYSIS saat task mulai dikerjakan

# 5) Worklist Analyst (Analyst)

### Tujuan
* halaman kerja harian analyst.

### Fitur utama
* Tab:
    - My Tasks (assigned to me)
    - Overdue
    - Completed
* Sorting/filter:
    - due date, matrix, instrument, parameter
* Klik task → masuk **Testing Workspace**

---

# 6) Testing Workspace + Result Entry (Analyst)

### Tujuan
* input hasil uji yang nanti dipakai report.

### Langkah umum per task
1. Analyst klik task → **Start Run**
2. Sistem buat **test_run run_no=1**
3. Analyst input:
    - result numeric + unit, atau toggle **ND**
    - LOD/LOQ (auto dari rules, bisa override dengan alasan)
    - remarks (untuk report)
4. Upload **raw data** (optional tapi recommended)
5. QC input (jika relevan)
6. Klik **Mark Completed**
    - test_task status → COMPLETED
    - result tersimpan sebagai "report-ready source"

### ND best practice (yang kamu pilih)
* ND disimpan sebagai:
    - is_nd = true
    - numeric = null
    - display_text = "Not Detected" atau "<LOD" tergantung gaya report
    - LOD/LOQ tetap tersimpan

---

# D) QC System (terintegrasi sepanjang Testing & Review)

### QC Recovery rule

*   Recovery acceptance default: **80–120%**
*   Jika out-of-range:
    *   sistem flag merah di task/run
    *   toast warning saat analyst submit/complete
    *   tercatat sebagai QC record

### QC Trend overlay (untuk manager)

*   Manager bisa lihat “last 5 samples” trend QC (overlay chart) untuk parameter/metode/instrumen yang sama
*   Tujuan: deteksi drift kualitas lebih cepat

***

# 7) Submit Results (Analyst → Review Queue)

### Tujuan

*   mengirim 1 work order yang sudah selesai diuji ke manager untuk review.

### Langkah

1.  Analyst klik “Submit for Review”
2.  Sistem cek:
    *   semua test_task untuk WO sudah COMPLETED
    *   QC flags tercatat (jika ada)
    *   metadata sample minimal lengkap
3.  Buat **result_submission** status SUBMITTED
4.  Timeline stage → REVIEW

***

# 8) Smart Review Dashboard (Manager)

### Tujuan

*   review cepat, minim klik, tanpa input angka.

### Isi review

*   Checklist otomatis:
    *   semua test finalized?
    *   ada QC red flags?
    *   raw data attached (kalau diwajibkan)
    *   metadata sample lengkap?

*   Highlight merah/hijau per parameter
*   Aksi:
    *   **Generate Draft PDF (watermarked)** untuk preview report
    *   **Request Revision** (strict loop)
    *   **Approve & Sign**

***

# 9) Strict Revision Loop (Manager Reject → Analyst revisi)

### Tujuan

*   menjaga histori dan mencegah overwrite.

### Mekanisme

*   Manager klik **Request Revision**
    *   wajib isi reason
    *   bisa scope: seluruh report atau test tertentu
*   Sistem:
    *   buat **revision request**
    *   rollback task tertentu jadi IN_PROGRESS / WAITING_RECHECK
    *   simpan **result_versions snapshot** "versi ditolak"
*   Analyst perbaiki → submit ulang

***

# 10) Approve & Sign → Report LOCK (Manager)

### Tujuan

*   finalisasi report PDF + tanda tangan sederhana, lalu lock.

### Saat Manager approve

1.  Sistem generate **FINAL PDF**
2.  Signature image + signer name + timestamp ditempel di PDF (simple signature)
3.  Report status:
    *   APPROVED → LOCKED → RELEASED
4.  Semua data report jadi read-only
5.  Timeline stage → COMPLETED
6.  (Optional) sistem kirim email "Report ready" ke customer contact

***

# 11) Customer Portal (Customer side)

### Tujuan

*   customer bisa:
    *   lihat progress status WO/sample
    *   cari & download report PDF lama (repository)
    *   bulk download (mis: 1 bulan/1 tahun)

### Fitur utama

1.  **Login portal** (akun per customer)
2.  **Dashboard status tracker**
    *   Received → Lab Analysis → Review → Completed
3.  **Repository**
    *   search by: report no, sample name, date range, matrix
    *   view report (PDF viewer)
    *   download report (PDF)
4.  **Bulk download**
    *   select range tanggal / tahun
    *   sistem siapkan batch (ZIP) dan customer download

### Keamanan akses

*   Portal hanya bisa melihat report milik customer sendiri (filter by customer_id snapshot/report visibility)

---

## E) Change Request (CR) – jalur resmi perubahan pasca Order Approved

### Kapan dipakai

*   tambah test, cancel test, ubah due date, ubah method/instrument, koreksi metadata sample, dll.

### Alur

1.  Admin/Analyst buat CR (DRAFT)
2.  Submit CR
3.  Manager approve/reject
4.  Jika approve → sistem APPLY:
    *   update requested_tests / test_tasks (buat baru/cancel/update due date)
    *   jika report sudah submitted/locked → buat revision cycle (version increment)

---

# Data Structure and UI Information

***

Oke Farrel — kita mulai dari **Quotation** dan **Receiving Sample** dulu, tapi biar rapi aku bagi jadi:

1. **Master data minimal** (yang wajib ada supaya Quotation & Receiving bisa jalan mulus)
2. **Tabel transaksi Quotation** (plus versioning & approval)
3. **Tabel transaksi Receiving Sample** (sesuai form + flow)
4. **Gambaran UI/UX singkat per screen**

Semua ini ngikutin flow kamu: pilih customer → pilih matriks → pilih parameter (multi) → auto price+lead time → draft quotation PDF → contract review checklist → order approved → receiving sample bisa fetch data dari quotation.

***

## 1) Master data minimal (dipakai Quotation & Receiving Sample)

### A. users

* id
* full_name
* email (unique)
* password_hash / auth_provider_id
* role: ADMIN | MANAGER | ANALYST (sesuai jawabanmu)
* is_active
* created_at, updated_at

### B. departments

* id
* name (unique) — dipakai dropdown di dokumen sample receipt
* is_active

### C. customers

* id
* customer_name
* default_address
* notes (opsional)
* is_active
* created_at, updated_at

### D. customer_contacts

* id
* customer_id (FK → customers)
* contact_person_name
* mobile
* email
* address_override (kalau PIC beda alamat)
* is_primary (bool)

> Kenapa dipisah: di Sample Receipt ada “Customer Name, Contact Person, Mobile, Email, Address”.

### E. sample_matrices

* id
* matrix_name_id (mis: “Air Limbah Domestik / Domestic Wastewater”)
* category (opsional: Environment/Food, dll)
* is_active

### F. parameters (master parameter uji)

* id
* parameter_name (mis: COD, pH, Arsen)
* parameter_group (mis: Logam Berat)
* default_unit_id (FK → units) (flow: unit dropdown & wajib cocok)
* has_subparameter (bool) (karena form punya kolom Sub-Parameter)
* is_active

### G. subparameters (opsional, kalau kamu mau rapihin “Logam Berat → Arsen/Cd/...”)

* id
* parameter_id (FK → parameters) → contoh: parameter “Logam Berat”
* subparameter_name → “Arsen (As)”
* cas_number (opsional)
* is_active

### H. methods

* id
* method_code (mis: SNI 6989.82:2018)
* method_name / description
* matrix_compatibility_notes (opsional)
* is_active

### I. instruments

* id
* instrument_name (mis: ICP-OES)
* model/serial (opsional)
* is_active

### J. units

* id
* unit_symbol (mg/L, °C, m³/s, dll)
* unit_name (opsional)

### K. matrix_parameter_rules (inti dari "limit per matriks" + best practice ND nanti)

* id
* matrix_id (FK → sample_matrices)
* parameter_id (FK → parameters) *atau* subparameter_id (kalau kamu pakai subparameters)
* default_method_id (FK → methods)
* default_instrument_id (FK → instruments)
* default_turnaround_days (lead time basis) (flow: auto lead time)
* limit_type: `MAX` | `MIN` | `RANGE` | `NONE`
* limit_min_value (nullable)
* limit_max_value (nullable)
* limit_unit_id (FK → units)
* lod_default (nullable) (dipakai nanti buat hasil ND & report)
* loq_default (nullable, opsional)
* is_active

> Ini yang bikin: (1) auto populate metode+alat di receiving sample, (2) hitung PASS/FAIL simple acceptance nanti.

### L. price_list (harga per matriks-parameter)

* id
* matrix_id
* parameter_id / subparameter_id
* price_amount
* currency (default IDR)
* effective_from, effective_to (opsional)
* is_active

### M. test_packages (opsional tapi recommended, sesuai flow "Quote Builder/Test Packages")

*   id
*   package_name (mis: "Air Limbah Paket Logam Berat")
*   matrix_id
*   description
*   is_active

### N. test_package_items

*   id
*   package_id
*   parameter_id / subparameter_id
*   default_method_id
*   default_instrument_id
*   price_override (nullable)

---

## 2) Struktur database — Quotation

### A. quotations (header)

*   id
*   quotation_no (format bebas; kamu punya contoh "Q-2045-234")
*   revision_no (int) → untuk versioning "Q-2026-001-R01"
*   quotation_no_full (generated) → gabungan no + "-Rxx"
*   status:
    *   `DRAFT`
    *   `SUBMITTED_FOR_REVIEW`
    *   `APPROVED` (order approved)
    *   `REJECTED`
    *   `EXPIRED`
    *   `CANCELLED`
*   issue_date (di quotation template ada Date)
*   valid_until_date (default 90 hari sesuai template "Estimate is good for 90 days")
*   customer_id (FK → customers)
*   customer_contact_id (FK → customer_contacts)
*   requesting_customer_name_snapshot (string, untuk menjaga histori kalau customer rename)
*   requesting_email_snapshot
*   instance/company_snapshot (di template ada "Instance")
*   submission_no (opsional)
*   account_id_no (opsional)
*   department_id (FK → departments) (kalau quotation mau ditempel department)
*   notes_internal (opsional)
*   terms_text (default dari template "Additional Information...")
*   created_by_user_id (FK → users) (Admin)
*   approved_by_user_id (FK → users) (Manager)
*   approved_at (nullable)
*   created_at, updated_at

**Constraint penting**

*   (quotation_no + revision_no) unique
*   status transition tercatat ke audit trail (lihat tabel audit di bawah)

### B. quotation_lines (detail item jasa)

Template kamu menunjukkan tabel "Description of Requested Services" dengan: Product Category, Quantity Ordered, Total.

*   id
*   quotation_id (FK → quotations)
*   line_no (int)
*   service_type: <span style="color: #2E7D32">TEST | PACKAGE | OTHER</span>
*   product_category (string) (mis: Environment/Food)
*   matrix_id (FK → sample_matrices) (wajib, karena limit/price pakai matriks)
*   package_id (FK → test_packages, nullable)
*   parameter_id / subparameter_id (nullable kalau pakai package)
*   method_id (FK → methods, nullable; tapi kalau sudah dipilih di quote, nanti di-fetch ke receiving)
*   instrument_id (FK → instruments, nullable)
*   quantity_ordered (int) (di template "Quantity Ordered")
*   unit_price (money)
*   line_total (money) (di template "Total")
*   estimated_lead_time_days (int) (dipakai kalkulasi TAT)
*   due_date_estimate (date, optional)
*   remarks (opsional)

### C. quotation_totals

Template ada "Total Quote Amount".
Kalau kamu mau sederhana: totals bisa dihitung runtime, tapi biasanya lebih aman disimpan snapshot.

*   quotation_id (PK/FK)
*   subtotal_amount
*   discount_amount (nullable)
*   tax_amount (nullable)
*   grand_total_amount

### D. contract_reviews (checklist sebelum "Order Approved")

Flow kamu spesifik: Contract Review checklist minimal: lab mampu uji metode, matrix cocok, deadline realistis, decision rule simple acceptance dicatat.

*   id
*   quotation_id
*   status: <span style="color: #2E7D32">PENDING | PASSED | FAILED</span>
*   checklist_lab_capable (bool)
*   checklist_matrix_compatible (bool)
*   checklist_deadline_realistic (bool)
*   checklist_decision_rule_recorded (bool)
*   notes

*   reviewed\_by\_user\_id (Manager)
*   reviewed\_at

### E. quotation\_documents (PDF draft)

Flow: draft quotation PDF.

*   id
*   quotation\_id
*   doc\_type: `DRAFT_PDF` | `FINAL_PDF`
*   file\_path / storage\_key
*   generated\_at
*   generated\_by\_user\_id

### F. audit\_events (wajib untuk "no silent edit" + jejak versi)

Flow menekankan audit trail & tidak boleh silent edit (walau konteksnya CR, spiritnya sama).

*   id
*   entity\_type: `QUOTATION` | `QUOTATION_LINE` | `SAMPLE` | `WORK_ORDER` | ...
*   entity\_id
*   action: `CREATE` | `UPDATE` | `SUBMIT` | `APPROVE` | `REJECT` | `GENERATE_PDF` | ...
*   before\_json (nullable)
*   after\_json (nullable)
*   performed\_by\_user\_id
*   performed\_at
*   comment (nullable)

---

## 3) Struktur database — Receiving Sample (1 Work Order = 1 Sample)

Di form kamu ada: Work Order ID, Document No, Date Issued, Department, Primary Information (Sample ID, Date Received, Quotation ID, TAT), Customer Information, Sample Details, Sampling, Field Measurements, Requested Test.

### A. work\_orders (header order)

*   id
*   work\_order\_no (mis: 20260100001)
*   quotation\_id (FK → quotations, nullable tapi idealnya wajib kalau datang dari quote)
*   department\_id (FK → departments)
*   status:
    *   `RECEIVED_DRAFT` (baru input receiving, belum final)
    *   `RECEIVED_CONFIRMED` (sudah "Submit/Confirm")
    *   `IN_ANALYSIS` (nanti)
    *   `IN_REVIEW` (nanti)

*   ○ COMPLETED (nanti)
    *   ○ CANCELLED
*   `date_received` (date)
*   `tat_target_date` (Turn Around Time date)
*   `created_by_user_id` (Admin)
*   `confirmed_by_user_id` (Admin, optional)
*   `confirmed_at` (nullable)
*   `created_at`, `updated_at`

## B. samples (1:1 dengan work_orders)

Flow "Create Sample" wajib isi: customer, matriks, jumlah & unit, kondisi, parameter uji + metode, deadline, lokasi penyimpanan, foto sample.

*   `id`
*   `work_order_id` (unique FK → `work_orders`)
*   `sample_lab_id` (Sample ID; auto generate; di flow ada format R/YYYYMMXXXX... tapi kamu bilang abaikan subsample → cukup R/YYYYMMXXXX)
*   `sample_name` (mis: "Limbah Outlet IPAL", penting untuk report nanti)
*   `matrix_id` (FK → `sample_matrices`)
*   `customer_id` (FK → `customers`)
*   `customer_contact_id` (FK → `customer_contacts`)
*   `customer_name_snapshot`
*   `contact_person_snapshot`
*   `mobile_snapshot`
*   `email_snapshot`
*   `address_snapshot`

### Quantity & kemasan

*   `quantity_value` (numeric/int) (mis: 2)
*   `quantity_unit_text` (string: "1 Liter Botol Kaca" / bisa dipecah lebih granular kalau mau)
*   `container_type` (opsional: botol kaca/plastik, dll)
*   `preservation_notes` (opsional: pengawet, ice pack, dll — belum ada di form, tapi sering kepakai)

### Storage

*   `storage_location_id` (FK → `storage_locations`) *atau* `storage_location_text` (kalau belum mau master)
*   `storage_condition_text` (mis: "Chiller 4°C")

### Condition upon receipt

*   `condition_status`: INTACT | LEAK | DAMAGED | OTHER (di flow: intact/leak/damaged)
*   `condition_notes` (mis: "Suhu 6°C, segel sedikit terbuka")
*   `received_temperature_c` (nullable) (kalau mau angka terpisah)
*   `seal_status` (opsional: sealed/unsealed)

### Dates

*   sampling_datetime (nullable)
*   sampling_date_only (nullable, untuk report yang cuma pakai tanggal)
*   analysis_date_range_text (nullable, nanti diisi dari modul testing; tapi fieldnya ada di report)
*   created_at, updated_at

### C. sample_photos (multi foto)

Flow minta "foto sample" + mobile upload.

*   id
*   sample_id
*   file_path / storage_key
*   caption (optional)
*   taken_at (optional)
*   uploaded_by_user_id
*   uploaded_at

### D. storage_locations (opsional tapi enak untuk dropdown)

*   id
*   location_name (mis: "Kulkas 1 - Rak B (Chiller 4°C)")
*   location_type: CHILLER | FREEZER | ROOM | OTHER
*   temperature_setpoint_c (nullable)
*   is_active

### E. sampling_details (dipisah biar rapi & scalable)

Form punya: sampling location, sampler name, sampling method (grab/composite), weather.

*   id
*   sample_id
*   sampling_location_text
*   sampling_coordinate_lat (nullable)
*   sampling_coordinate_lng (nullable)
*   sampler_name_text
*   sampling_method: GRAB | COMPOSITE
*   weather_condition_text
*   created_at

### F. field_measurements (parameter lapangan, tabel dinamis)

Di form ada field measurements: Temperature, pH, DO, Debit; masing-masing punya result, unit, method/alat.

*   id
*   sample_id
*   measurement_name (string: "Temperature", "pH", "DO", "Debit")
*   result_value (numeric)
*   unit_id (FK → units, nullable kalau simpel)
*   instrument_text / method_text (string: "Thermometer", "pH Meter Portable")
*   measured_at (nullable)
*   notes (nullable)

### G. requested_tests (inti: parameter uji yang diminta pada work order)

Form "Requested Test" punya: Parameter Uji, Sub-Parameter, Metode, Alat/Instrumen, Due Date.

*   id
*   work_order_id
*   line_no (int)
*   parameter_group_text (mis: "Logam Berat")
*   parameter_id / subparameter_id (mis: Arsen (As))
*   method_id (FK → methods)
*   instrument_id (FK → instruments)
*   due_date (date)
*   price_snapshot (money, nullable, kalau mau ngunci harga dari quotation)
*   lead_time_days_snapshot (nullable)
*   status: `PLANNED` | `ASSIGNED` | `IN_PROGRESS` | `FINALIZED` (nanti kepakai di worklist/testing)
*   created_at, updated_at

### H. sample_receipt_documents (PDF "Sample Receipt Form")

*   id
*   work_order_id
*   document_no (di form ada Document No)
*   date_issued
*   doc_type: `SAMPLE_RECEIPT_PDF`
*   file_path / storage_key
*   generated_by_user_id
*   generated_at

### I. barcode_labels (kalau kamu mau tracking print history)

Flow minta auto barcode printing label sampel.

*   id
*   sample_id
*   barcode_value (biasanya sama dengan sample_lab_id)
*   printed_by_user_id
*   printed_at
*   printer_name (optional)

### J. receiving_sample_fetch_log (opsional, tapi enak buat audit "quote → sample")

Flow: data dari quotation bisa langsung di-fetch ke received sample.

*   id
*   quotation_id
*   work_order_id
*   fetched_by_user_id
*   fetched_at
*   mapping_summary_text (mis: "copied customer, matrix, tests, due dates")

# 4) Gambaran UI/UX singkat (Quotation & Receiving Sample)

## Screen 1 — Quotation Builder (Admin)

Sesuai flow: pilih customer → pilih matriks → pilih parameter (multi) → auto hitung lead time + price list → draft PDF.

*   **Header card:** Quotation No (auto), Date, Valid Until (auto 90 hari), Status chip (Draft)
*   **Customer selector:** dropdown customer + dropdown contact (auto isi email/phone/address, bisa override)
*   **Department:** dropdown (opsional untuk quotation)
*   **Matrix selector:** dropdown matriks → setelah dipilih:
    *   panel “Recommended Package” (kalau ada test_packages)
    *   tabel parameter (multi-select) dengan kolom: Parameter/Sub, Method (auto), Instrument (auto), Lead time, Unit price, Qty, Line total
*   **Auto calculations:**
    *   Total, plus diskon/pajak kalau kamu aktifin (optional)
    *   “Estimated TAT” = max lead time + buffer (kalau kamu mau)
*   **Actions:**
    *   Save Draft
    *   Generate Draft PDF (watermark “DRAFT”) (nyambung ke tabel quotation_documents)
    *   Submit for Contract Review

## Screen 2 — Contract Review (Manager, read-only + approve)

Checklist minimal sesuai flow.

*   **Read-only preview:** ringkas Quotation + list tests + TAT
*   **Checklist (4 toggle)** + notes
*   **Tombol:** Approve (status → APPROVED) / Reject (wajib isi alasan)

## Screen 3 — Receiving Sample / Create Sample (Admin)

Flow “Create Sample” wajib isi customer, matriks, quantity, kondisi, parameter uji+metode, deadline, lokasi, foto.

*   **Stepper 3 langkah biar nggak bikin admin “capek scroll”:**
    *   **Link to Quotation**
        *   input Quotation ID / search (kalau approved → tombol **“Fetch from Quotation”**)
        *   otomatis isi customer+contact, matrix, requested_tests, target TAT
    *   **Sample Details**
        *   Sample ID auto-generate + tombol “Print Barcode”
        *   Quantity & unit text
        *   Storage location dropdown
        *   Condition: intact/leak/damaged + notes + suhu diterima
        *   Upload foto (mobile-friendly camera permission)
    *   **Sampling & Field Measurements**

*   ■ Sampling datetime, lokasi + koordinat, sampler, metode grab/composite, cuaca
    ■ Tabel field measurements (add row) untuk suhu/pH/DO/debit dsb
*   **Requested Tests table** (final check)
    *   Kolom: Parameter/Sub, Method, Instrument, Due date
    *   Kalau data dari quotation: default locked (tapi Admin boleh edit **sebelum confirm**)
*   **Actions:**
    *   Save Draft
    *   Confirm Receipt (lock sebagian field + generate Sample Receipt PDF)

***

Kalau kamu oke dengan struktur di atas, langkah berikutnya (masih bagian Quotation+Receiving) aku bisa lanjutkan dengan:

*   **aturan status & lock field** (mis. setelah confirm receipt, field tertentu read-only)
*   **validasi wajib** (mis. receiving tidak bisa confirm kalau belum ada storage location + foto + requested tests minimal 1)
*   dan baru setelah itu kita masuk ke **Scheduling/Worklist + Testing + Review + Release**.

**Scheduling & Worklist (Analyst) → Testing.** Aku bikin struktur DB-nya supaya

*   **Manager** bisa mantau semua (tanpa input)
*   **Analyst** dapat worklist yang jelas: tugas apa, due date kapan, status apa, instrument apa, metode apa
*   Hasil bisa dicatat dengan **best practice ND (LOD/LOQ)**
*   Semua perubahan ada **audit trail**, dan data cukup untuk bikin **CoA/Final Report** nanti

---

# 1) Scheduling & Worklist — struktur database

### A. analysts (profil analyst tambahan)

Karena user role cuma 3, tapi kita tetap butuh profil analyst untuk kapasitas & skill.

*   id
*   user_id (FK → users) (role harus ANALYST)
*   employee_code (opsional)
*   department_id (FK → departments) (opsional)
*   is_active

### B. analyst_skills (opsional tapi penting untuk auto-assign)

*   id
*   analyst_id
*   matrix_id (nullable)
*   parameter_id / subparameter_id (nullable)
*   method_id (nullable)
*   instrument_id (nullable)
*   skill_level: `TRAINING` | `COMPETENT` | `EXPERT`
*   valid_from, valid_to (opsional)

### C. work_plans (jadwal/plan per work order)

1 work order = 1 sample, tapi test-nya banyak. Work plan jadi "container" scheduling.

*   id
*   work_order_id (FK → work_orders)
*   status: `DRAFT` | `SCHEDULED` | `IN_PROGRESS` | `DONE` | `CANCELLED`
*   scheduled_by_user_id (Admin) *(atau Analyst kalau kamu izinkan)*
*   scheduled_at
*   notes

### D. test_tasks (inti Worklist Analyst: 1 task per requested test)

Ini mapping langsung dari `requested_tests` (Receiving).

*   id
*   work_order_id
*   sample_id
*   requested_test_id (FK → requested_tests) [x] (biar konsisten)
*   task_code (auto) (mis: TT-2026-000123)
*   assigned_to_user_id (FK → users, role ANALYST)
*   assigned_at
*   due_date (snapshot dari requested_tests.due_date)
*   priority: `LOW` | `NORMAL` | `HIGH` | `URGENT`
*   status:
    *   `PLANNED` (belum assign)
    *   `ASSIGNED`
    *   `IN_PROGRESS`
    *   `WAITING_RECHECK` (kalau perlu repeat)
    *   `COMPLETED` (hasil final)
    *   `CANCELLED`
*   method_id_snapshot (FK → methods) (snapshot)
*   instrument_id_snapshot (FK → instruments) (snapshot)
*   matrix_id_snapshot
*   parameter_id_snapshot / subparameter_id_snapshot
*   tat_days_snapshot (nullable)
*   started_at (nullable)
*   completed_at (nullable)
*   remarks_internal

**Kenapa snapshot?** Karena kalau master berubah, histori task tetap aman.

### E. task_status_logs (jejak pergerakan task)

*   id
*   test_task_id
*   from_status
*   to_status
*   changed_by_user_id
*   changed_at
*   comment (wajib kalau cancel/recheck)

### F. worklist_views (bukan tabel, tapi konsep UI)

Dari sisi database, biasanya kamu bikin query/view.

*   My Worklist: filter assigned_to=me, status != completed/cancelled
*   Overdue Worklist: due_date < today & not completed
*   Instrument Worklist: filter instrument_id_snapshot

---

# 2) Testing — struktur database (input hasil + ND best practice)

## A. test_runs (sesi pengerjaan uji)

1 test_task bisa punya beberapa run: misalnya repeat, recheck, atau rerun.

*   id
*   test_task_id (FK → test_tasks)
*   run_no (int, mulai 1)
*   reason: INITIAL | REPEAT | RECHECK | QC_FAIL | SAMPLE_ISSUE | OTHER
*   started_at
*   ended_at (nullable)
*   performed_by_user_id (Analyst)
*   instrument_id_used (FK → instruments, default dari snapshot tapi bisa override jika alat beda)
*   method_id_used (FK → methods)
*   notes

## B. test_results (hasil utama yang dipakai report)

Ini yang nanti dipakai bikin tabel CoA/Final Report: Parameter, Result, Unit, Method, Instrument, PASS/FAIL, dll.

*   id
*   test_run_id (FK → test_runs)
*   sample_id
*   work_order_id
*   parameter_id / subparameter_id
*   result_type: NUMERIC | TEXT | BOOLEAN
*   result_value_numeric (nullable)
*   result_value_text (nullable) (mis: “Not Detected”, “<0.01”, “Positive”)
*   unit_id (FK → units)
*   decimals_display (int, opsional) (biar format report konsisten)
*   is_nd (bool) [x] best practice ND
*   lod_value (nullable) [x] simpan per-run (bisa default dari matrix_parameter_rules)
*   loq_value (nullable)
*   nd_reporting_style: ND_TEXT | LT_LOD | LT_LOQ (pilih 1 gaya tampilan di report)
*   limit_type_snapshot: MAX | MIN | RANGE | NONE
*   limit_min_snapshot (nullable)
*   limit_max_snapshot (nullable)

*   limit_unit_id_snapshot
*   compliance_status: `PASS` | `FAIL` | `NOT_EVALUATED` (simple acceptance)
*   uncertainty_value (nullable) (opsional kalau suatu saat butuh)
*   remarks_for_report (nullable) (mis: "sample turbid, diluted 10x")

**Logika ND yang rapi**

*   Kalau ND: `is_nd=true`, `result_value_numeric=NULL`, `result_value_text="Not Detected"` (atau "<LOD") tergantung `nd_reporting_style`.
*   LOD/LOQ tetap tersimpan untuk audit & transparansi.

### C. result_attachments (raw data: kromatogram, foto, dll)

*   id
*   test_run_id
*   file_path/storage_key
*   file_type: `RAW_DATA` | `PHOTO` | `CALC_SHEET` | `OTHER`
*   uploaded_by_user_id
*   uploaded_at
*   notes

### D. calculations (opsional, kalau ada rumus pengenceran/konversi)

Karena banyak lab butuh "dilution factor" & "final concentration".

*   id
*   test_run_id
*   calc_name (mis: "Dilution Factor")
*   input_json (mis: volume sample, volume final)
*   output_value_numeric
*   output_unit_id (nullable)
*   created_at

### E. qc_checks (minimal versi kamu, bisa simpel dulu)

Ini bukan QC full ISO, tapi cukup untuk "hasil valid gak".

*   id
*   test_run_id
*   qc_type: `BLANK` | `DUPLICATE` | `SPIKE` | `STANDARD` | `OTHER`
*   qc_result: `PASS` | `FAIL` | `NOT_DONE`
*   notes
*   checked_by_user_id (Analyst)
*   checked_at

### F. nonconformities (kalau ada "sample issue" / deviasi)

*   id
*   work_order_id
*   sample_id
*   related_test_task_id (nullable)

*   nc_type: `SAMPLE_LEAK` | `INSUFFICIENT_VOLUME` | `HOLD_TIME_EXCEEDED` | `METHOD_DEVIATION` | `OTHER`
*   description
*   created_by_user_id
*   created_at
*   status: `OPEN` | `CLOSED`
*   closed_by_user_id (nullable)
*   closed_at (nullable)

***

# 3) UI/UX singkat — Scheduling → Worklist → Testing

## Screen A — Scheduling (Admin)

Tujuan: dari Work Order yang sudah “RECEIVED_CONFIRMED”, Admin bikin assignment task.

*   List Work Orders (filter status Received Confirmed)
*   Klik 1 work order → muncul tabel “Requested Tests”
*   Untuk tiap test: pilih Analyst (dropdown), set priority, confirm due date
*   Tombol:
    *   “Auto-Assign” (opsional, pakai skill + workload)
    *   “Create Tasks” → generate `test_tasks` status ASSIGNED

## Screen B — Worklist Analyst (Analyst)

*   Tab:
    *   **My Tasks**
    *   **Overdue**
    *   **Completed**
*   Kolom utama:
    *   Work Order No, Sample ID, Sample Name, Matrix
    *   Parameter/Sub, Method, Instrument
    *   Due date + badge “Overdue”
    *   Status + action button
*   Klik task → masuk ke “Testing Workspace”

## Screen C — Testing Workspace (Analyst)

Layout paling enak: “form kiri + preview report kanan”

*   Header: Sample ID, WO No, Parameter, Method/Instrument, Due date
*   Section “Run”
    *   tombol Start Run (buat `test_runs`)
    *   reason (INITIAL default)
*   Section “Result Input”
    *   toggle ND (kalau ND aktif, numeric disable)
    *   numeric value + unit
    *   LOD/LOQ (auto dari rules, bisa edit)
    *   remarks for report (opsional)
*   Section “QC quick check” (optional)

*   Attachments upload (raw data)
*   Tombol:
    *   Save Draft (status run ongoing)
    *   Mark Completed (task status → COMPLETED) + lock result (sementara, sampai modul review nanti)

***

## 4) Validasi penting (biar data aman dan workflow nggak kacau)

*   Task tidak bisa COMPLETED kalau `test_results` belum ada.
*   Kalau `is_nd=true`, `result_numeric` harus null.
*   Unit hasil harus match unit rule (atau minimal `unit_id` ada).
*   Kalau `limit_type` = RANGE, min dan max wajib.
*   Semua perubahan status task masuk ke `task_status_logs`.

***

# CUSTOMER PORTAL STRUCTURE INFORMATION

Sip, kita lanjut **dari selesai Testing → Review (Manager) → Release/Report LOCK → Customer Portal**. Ini aku desain supaya sesuai flow kamu: **Smart Review Dashboard, Strict Revision Loop, Draft watermarked PDF preview, Approve & Sign → TTD muncul → LOCK → Completed, Realtime status tracker**, dan **Repository & bulk download**.

***

# 1) QC Monitoring (yang dibutuhkan untuk “Smart Review” + warning recovery 80–120%)

> Di flow: ada QC Recovery hardcoded 80–120%, kalau di luar range → toast warning + flag merah.

## A. qc_recovery_records

* id
* work_order_id
* sample_id
* test_task_id (nullable) (kalau QC menempel ke task tertentu)
* test_run_id (nullable) (kalau QC per run)
* parameter_id / subparameter_id
* method_id
* instrument_id
* recovery_percent (numeric)
* accepted_min_percent (default 80)
* accepted_max_percent (default 120)
* is_out_of_range (bool, computed)
* warning_acknowledged (bool) (kalau analis “lanjutkan?”)
* warning_acknowledged_by_user_id
* warning_acknowledged_at
* notes
* created_by_user_id (Analyst)
* created_at

## B. qc_trend_cache (opsional, buat “QC chart overlay 5 sampel terakhir” di review)

> Flow: “One Click QC Chart overlay trend 5 sampel terakhir”.

* id
* metric_key (mis: `recovery`)
* parameter_id/subparameter_id
* method_id
* instrument_id
* last_n_json (array ringkas: [{date, work_order_no, value, flag}])
* updated_at

***

# 2) Submit hasil dari Analyst ke “Review Queue” (supaya Manager tidak input data tapi bisa approve/reject)

> Flow: Manager Review Queue list report SUBMITTED + checklist: semua test finalized? QC ok? raw data attached? metadata sample lengkap?

## A. result_submissions

*   id
*   work_order_id
*   sample_id
*   submitted_by_user_id (Analyst)
*   submitted_at
*   submission_note (opsional)
*   status: SUBMITTED | RETURNED | APPROVED
*   manager_last_action_at (nullable)

### B. submission_items (snapshot ringkas untuk mempercepat review)

*   id
*   result_submission_id
*   test_task_id
*   parameter_id/subparameter_id
*   method_id_snapshot
*   instrument_id_snapshot
*   due_date_snapshot
*   has_result (bool)
*   has_raw_attachment (bool)
*   qc_flag_red (bool) (mis: recovery out-of-range)
*   pass_fail_snapshot: PASS | FAIL | NOT_EVALUATED

---

## 3) Strict Revision Loop (Manager Reject → alasan → rollback ke analyst “in-progress” + simpan versi hasil yang ditolak)

Flow: “Strict Revision Loop: Manager Reject → alasan → rollback ke analis jadi in-progress → data ditolak disimpan sebagai version 1.”

### A. revision_requests

*   id
*   work_order_id
*   sample_id
*   result_submission_id
*   requested_by_user_id (Manager)
*   requested_at
*   reason_text (wajib)
*   scope:
    *   ENTIRE_REPORT
    *   SPECIFIC_TESTS
*   status: OPEN | RESOLVED | CANCELLED
*   resolved_at (nullable)
*   resolved_by_user_id (Manager, nullable)

### B. revision_request_items (kalau scope spesifik test/parameter)

*   id
*   revision_request_id
*   test_task_id
*   parameter_id/subparameter_id
*   issue_type:
    *   `MISSING_RESULT`
    *   `QC_FLAG`
    *   `UNIT_MISMATCH`
    *   `OUTLIER_SANITY`
    *   `RAW_DATA_MISSING`
    *   `METADATA_INCOMPLETE`
    *   `OTHER`
*   comment

### C. result_versions (arsip snapshot hasil sebelum dikoreksi)

*   id
*   work_order_id
*   sample_id
*   version_no (int: 1,2,3...)
*   created_reason: `MANAGER_REJECT` | `EDIT_AFTER_SUBMIT` | `OTHER`
*   snapshot_json (isi ringkas: test_results + qc + attachments list + timestamps)
*   created_by_user_id (system/manager)
*   created_at

### D. rollback_rules (aturan transisi status)

Ini bukan tabel wajib, tapi rules yang harus diterapkan:

*   kalau Manager request revision:
    *   `result_submissions.status = RETURNED`
    *   semua `test_tasks` yang kena revisi → status jadi `IN_PROGRESS` (atau `WAITING_RECHECK`)
    *   field hasil boleh diedit lagi oleh Analyst
    *   audit log wajib (kamu sudah punya audit_events; pakai itu juga)

---

## 4) Report / CoA Generator (Draft Preview → Approve & Sign → LOCK → Final PDF)

Flow penting:

*   Draft watermarked PDF preview sebelum ttd
*   TTD image hanya muncul kalau final approve → LOCK → completed → read-only
*   Manager action: APPROVE & SIGN, REQUEST REVISION
*   Email klien setelah approve/sign

### A. reports (header laporan)

Isi ini ngikut kebutuhan CoA: Report No, Customer info, Quotation ID, Sample identity, tanggal sampling/diterima/analisis, hasil per parameter + baku mutu + batas deteksi, statement of conformity, nama manager.

*   id
*   report_no (unique) (mis: LF-2026-20-0099)
*   work_order_id
*   sample_id
*   quotation_id (nullable tapi biasanya ada)
*   report_type: `COA` (nanti kalau ada jenis lain bisa extend)
*   status:
    *   `DRAFT` (draft report, belum submit)
    *   `SUBMITTED` (masuk manager queue)
    *   `REVISION_REQUESTED`
    *   `APPROVED` (sudah approve)
    *   `LOCKED` (semua field read-only)
    *   `RELEASED` (final pdf sudah tersedia untuk customer)
*   version_no (int, default 0) (increment kalau ada revision cycle)
*   created_by_user_id (system/admin)
*   created_at, updated_at
*   submitted_at (nullable)
*   approved_at (nullable)
*   approved_by_user_id (Manager)
*   locked_at (nullable)

### B. report_customer_snapshot

Snapshot supaya aman kalau customer/address berubah setelah report dibuat.

*   report_id (PK/FK)
*   customer_name
*   customer_address
*   attention_to (Up / PIC)
*   customer_email (opsional untuk pengiriman)

### C. report_sample_snapshot

*   report_id (PK/FK)
*   sample_name
*   matrix_name
*   lab_sample_id_text
*   sampling_date_text
*   received_date_text
*   analysis_date_range_text
*   sample_photo_file_path (nullable)

### D. report_sections (untuk grouping seperti di CoA: "Total Logam Berat", "pH", "COD", dll)

CoA kamu jelas membagi hasil per section dengan kalimat metode "mengacu pada ... menggunakan ...".

*   id

* report_id
* section_order (int)
* section_title (mis: "Total Logam Berat")
* method_statement_text (mis: "Metode mengacu pada SNI ... menggunakan ICP-OES.")
* regulation_reference_text (opsional untuk footnote, mis: PP 22/2021)

### E. report_results (hasil final yang ditarik dari test_results tapi sudah "report-ready")

Kolom minimal sesuai tabel CoA: Parameter Uji, Satuan, Hasil Uji, Baku Mutu, Batas Deteksi.

* id
* report_id
* report_section_id
* row_no (int)
* parameter_name_text (snapshot: "Arsen (As)")
* unit_symbol_text (snapshot)
* result_display_text (mis: "Not Detected", "7.10", "23")
* is_nd (bool)
* limit_display_text (mis: "0.05" atau "7-9" atau "-")
* detection_limit_display_text (LOD) (mis: "0.001" atau "-")
* pass_fail_snapshot: PASS | FAIL | NOT_EVALUATED (untuk Smart highlight)
* source_test_result_id (FK $\rightarrow$ test_results) (traceability)

### F. report_conformity_statements

Di CoA ada "Statement of Conformity" + kalimat kesimpulan.

* id
* report_id
* statement_text (default template)
* is_included (bool)

### G. signatures (simple signature)

Di flow: TTD image muncul hanya saat final approve.
Di CoA ada nama manager + "ditandatangani secara digital...".

* id
* report_id
* signer_user_id (Manager)
* signer_name_snapshot
* signature_image_file_path (file ttd)
* signed_at
* signature_note_text (default "Disetujui dan ditandatangani secara digital...")

### H. report_documents (draft & final PDF)

Flow: draft preview watermarked, final pdf setelah approve & lock.

* id

*   report\_id
*   doc\_type: DRAFT\_PDF\_WATERMARK | FINAL\_PDF
*   file\_path / storage\_key
*   generated\_by\_user\_id
*   generated\_at
*   checksum\_sha256 (opsional, buat verifikasi file tidak berubah)

### I. report\_locks (aturan read-only)

*   report\_id (PK/FK)
*   locked\_by\_user\_id (Manager)
*   locked\_at
*   lock\_reason: FINAL\_APPROVED

***

## 5) Release (status tracker + notifikasi email)

Flow: status tracker "Received > Lab Analysis > Review > Completed", email klien.

### A. status\_timeline\_events

*   id
*   work\_order\_id
*   sample\_id
*   stage:
    *   RECEIVED
    *   LAB\_ANALYSIS
    *   REVIEW
    *   COMPLETED
*   event\_at
*   triggered\_by\_user\_id (nullable kalau system)
*   notes (nullable)

### B. notifications (email queue sederhana)

*   id
*   channel: EMAIL
*   recipient\_email
*   subject
*   body\_template\_key (mis: REPORT\_READY)
*   payload\_json (merge variables)
*   status: PENDING | SENT | FAILED
*   sent\_at (nullable)
*   related\_report\_id (nullable)
*   created\_at

***

# 6) Customer Portal (login customer + realtime tracker + repository + bulk download)

Flow: "Realtime status tracker" + "Repository & Bulk Download: Klien bisa mencari laporan tahun lalu, download PDF."

### A. portal_accounts (akun portal milik customer)

*   id
*   customer_id (FK → customers)
*   username/email (unique)
*   password_hash
*   is_active
*   last_login_at (nullable)
*   created_at

### B. portal_sessions (token login)

*   id
*   portal_account_id
*   session_token_hash
*   issued_at
*   expires_at
*   revoked_at (nullable)
*   ip_address (optional)
*   user_agent (optional)

### C. portal_access_policies (optional, kalau 1 customer punya beberapa akun PIC)

*   id
*   portal_account_id
*   can_view_all_reports (bool)
*   allowed_report_year_from (nullable)
*   allowed_report_year_to (nullable)

### D. portal_activity_logs

*   id
*   portal_account_id
*   action: `LOGIN` | `LOGOUT` | `VIEW_REPORT` | `DOWNLOAD_REPORT` | `SEARCH`
*   report_id (nullable)
*   created_at
*   metadata_json (nullable)

### E. report_customer_visibility (kalau kamu mau fleksibel "report ini boleh dilihat siapa")

Di single tenant, minimalnya cukup filter berdasarkan customer_id yang tersimpan di sample/report snapshot.

*   id

*   report_id
*   customer_id
*   is_visible (bool)
*   visible_from (nullable)

---

# 7) UI/UX detail (Review → Release → Portal)

### Screen: Manager Review Dashboard (Smart Review)

Sesuai flow "highlight merah/hijau + QC chart overlay"

*   **Queue list:** semua report SUBMITTED
    *   kolom: WO No, Sample ID, Customer, Due date max, status chip
    *   badge merah kalau ada: QC out-of-range / missing raw / missing metadata
*   **Klik 1 item → Review Detail**
    *   Checklist auto-evaluated:
        *   semua test finalized?
        *   QC OK?
        *   raw data attach (jika ada)
        *   metadata sample lengkap?
    *   tombol "QC Trend (last 5)" per parameter (popup mini chart)
    *   tombol "Generate Draft PDF (Watermarked)" → preview layout sebelum approve
    *   Actions:
        *   **REQUEST REVISION** (wajib isi alasan, bisa pilih test mana)
        *   **APPROVE & SIGN** → tanda tangan masuk + report LOCK + status Completed

### Screen: Analyst "Returned for Revision"

*   Tab "Needs Revision"
*   Card merah menampilkan alasan Manager + list test yang harus diperbaiki
*   Klik → langsung ke task & hasil yang ditandai
*   Setelah fix → Submit lagi → bikin `result_versions` otomatis (biar historinya aman)

### Screen: Release / Completed

*   Setelah Manager approve:
    *   sistem generate **FINAL PDF** + simpan di `report_documents`
    *   set `reports.status = LOCKED/RELEASED`
    *   semua input hasil jadi read-only (kecuali lewat revision loop)
    *   trigger email ke customer (opsional)

### Screen: Customer Portal

Sesuai flow: status tracker + repository & bulk download.

*   Dashboard:

*   [Customer Portal]
    *   ○ “Status Tracker” per WO/Sample: Received → Lab Analysis → Review → Completed
    *   ○ Quick search: by Report No, Sample Name, date range, matrix
*   **Repository:**
    *   ○ table list report: Report No, Sample, Matrix, Received date, Completed date
    *   ○ action: View (inline PDF viewer) + Download PDF
    *   ○ Bulk download: pilih range tanggal / tahun → download batch (secara sistem bisa ZIP)
*   **Report detail view:**
    *   ○ tampilkan summary + link PDF final (tanpa akses edit)

***

## 8) Hal kecil tapi krusial (biar sistem “ke-lock” dengan benar)

*   **Manager tidak input angka:** semua field result hanya Analyst yang bisa isi; Manager hanya approve/reject.
*   **LOCK benar-benar read-only:** setelah approve, perubahan hanya lewat **Revision Request** (no silent edit).
*   **TTD hanya muncul saat final approve** (bukan di draft)
*   **Customer portal filter by customer_id** (single tenant, tapi tetap wajib isolasi antar customer).



# CHANGE REQUEST STRUCTURE
# INFORMATION

Siap, kita lanjut **Change Request (CR)** sampai level yang bener-bener bisa mencegah "silent edit" dan nyambung ke flow kamu: **semua perubahan setelah Order Approved harus lewat CR**, CR punya ID/versioning, audit trail, approval manager, dan efeknya mengubah task/worklist/report secara aman.

***

# 1) Konsep inti Change Request (sesuai flow)

CR dipakai untuk perubahan seperti: **add parameter, drop/cancel test, ubah due date/TAT, ubah metode/instrumen, koreksi metadata sample**, dan lain-lain — tetapi perubahan baru boleh "terjadi" setelah **Manager approve CR**.

***

# 2) Struktur database — Change Request

### A. change_requests (header)

*   id
*   cr_no (unique, format mis: `CR-2026-000012`)
*   related_entity_type: `WORK_ORDER` (untuk scope saat ini)
*   work_order_id (FK → work_orders)
*   sample_id (FK → samples)
*   quotation_id (nullable)
*   status:
    -   `DRAFT`
    -   `SUBMITTED`
    -   `APPROVED`
    -   `REJECTED`
    -   `CANCELLED`
    -   `APPLIED` (opsional: jika kamu bedakan "approved" dan "sudah dieksekusi sistem")
*   requested_by_user_id (Admin atau Analyst)
*   requested_at
*   reason_text (wajib) (kenapa ada perubahan)
*   impact_summary_text (auto-generated opsional: "+2 tests, due date mundur 3 hari, 1 test dibatalkan")
*   manager_decision_by_user_id (Manager, nullable)
*   manager_decision_at (nullable)
*   manager_decision_note (nullable)
*   created_at, updated_at

### B. change_request_items (detail perubahan per item)

Ini "inti" CR: satu CR bisa berisi banyak aksi.

*   id
*   change_request_id

*   `change_type`:
    *   `ADD_TEST`
    *   `REMOVE_TEST`
    *   `UPDATE_TEST_DUE_DATE`
    *   `UPDATE_METHOD_INSTRUMENT`
    *   `UPDATE_SAMPLE_METADATA`
    *   `UPDATE_STORAGE_LOCATION`
    *   `UPDATE_CUSTOMER_CONTACT`
    *   `OTHER`
*   `target_entity_type`:
    *   `REQUESTED_TEST`
    *   `TEST_TASK`
    *   `SAMPLE`
    *   `WORK_ORDER`
*   `target_entity_id` (nullable, untuk `ADD_TEST` biasanya null karena create baru)
*   `before_json` (nullable) (snapshot state sebelum)
*   `after_json` (nullable) (state yang diminta)
*   `status`: `PENDING` | `APPROVED` | `REJECTED` | `APPLIED`
*   `notes` (nullable)

**Contoh isi after_json per tipe**

*   `ADD_TEST`: `{matrix_id, parameter_id, method_id, instrument_id, due_date, price_snapshot, lead_time_snapshot}`
*   `UPDATE_TEST_DUE_DATE`: `{due_date_new}`
*   `REMOVE_TEST`: `{reason_cancel}`
*   `UPDATE_SAMPLE_METADATA`: `{sample_name, sampling_datetime, field_measurements, ...}` (pilih yang boleh diubah)

### C. change_request_attachments (lampiran bukti)

*   id
*   change_request_id
*   file_path/storage_key
*   caption
*   uploaded_by_user_id
*   uploaded_at

### D. change_request_audit (khusus CR, boleh gabung ke audit_events kalau kamu mau)

*   id
*   change_request_id
*   action: `CREATE` | `UPDATE` | `SUBMIT` | `APPROVE` | `REJECT` | `APPLY` | `CANCEL`
*   performed_by_user_id
*   performed_at
*   comment (nullable)

***

# 3) Aturan "apply" CR (bagaimana CR memengaruhi tabel yang sudah ada)

### A. Saat CR = APPROVED → sistem menjalankan perubahan (APPLY)

Kamu bisa implement sebagai transaksi:

1. tandai CR `APPROVED`
2. jalankan apply untuk tiap item
3. update status item `APPLIED`
4. set CR `APPLIED`
5. tulis audit trail (`audit_events`)

### B. Dampak per jenis CR

#### 1) ADD_TEST

* Buat baris baru di `requested_tests` (Receiving layer)
* Buat `test_tasks` baru status `ASSIGNED` atau `PLANNED` (tergantung kamu mau langsung assign atau masuk scheduling ulang)
* Tambahkan entry ke `status_timeline_events` jika perlu (mis: balik ke `LAB_ANALYSIS` kalau sebelumnya sudah review)

#### 2) REMOVE_TEST

* Validasi:
    - kalau `test_task.status` sudah `COMPLETED` dan report sudah `LOCKED`, maka **tidak boleh remove langsung** → harus jadi **Report Revision** (CR tetap bisa, tapi hasilnya adalah "Report revision cycle")
* Jika belum completed:
    - set `requested_tests` flagged cancelled:
        - tambahkan field `is_cancelled` (bool) dan `cancelled_reason`
    - set `test_tasks.status = CANCELLED` (wajib log di `task_status_logs`)

Aku rekomendasikan nambah field ini ke `requested_tests`:

* `is_cancelled` (bool)
* `cancelled_by_user_id`
* `cancelled_at`
* `cancelled_reason_text`

#### 3) UPDATE_TEST_DUE_DATE

* Update `requested_tests.due_date`
* Update `test_tasks.due_date` (snapshot)
* Log di `task_status_logs`

#### 4) UPDATE_METHOD_INSTRUMENT

* Update `requested_tests.method_id` / `instrument_id`

*   Update `test_tasks.method_id_snapshot` / `instrument_id_snapshot`
*   Kalau task sudah `IN_PROGRESS`, sistem bisa:
    *   either: buat `test_runs` baru dengan reason `OTHER` + note "method changed"
    *   atau paksa task kembali `IN_PROGRESS` dengan revision note

### 5) UPDATE_SAMPLE_METADATA

*   Contoh metadata yang boleh diubah:
    *   sample_name, storage location, condition notes, sampling detail, field measurement
*   Jika report sudah LOCKED:
    *   perubahan metadata harus memicu `reports.version_no+1` + generate report revisi (agar histori tidak kacau)

---

## 4) Tambahan struktur database untuk "No Silent Edit" (langsung kepakai)

### A. entity_locks (kunci per entity setelah fase tertentu)

Ini penting biar rule "semua perubahan lewat CR" enforce di DB layer.

*   id
*   entity_type: `WORK_ORDER` | `SAMPLE` | `REPORT`
*   entity_id
*   lock_state:
    *   `AFTER_ORDER_APPROVED`
    *   `AFTER_REPORT_SUBMITTED`
    *   `AFTER_REPORT_LOCKED`
*   locked_at
*   locked_by_user_id (system/manager)
*   notes

**Rule**

*   kalau lock_state >= `AFTER_ORDER_APPROVED`:
    *   direct update `requested_tests`, `samples`, `work_orders` ditolak di backend kecuali lewat "apply CR transaction".

### B. policy_violations (opsional tapi enak untuk debug)

*   id
*   attempted_entity_type
*   attempted_entity_id
*   attempted_action
*   attempted_by_user_id
*   reason
*   created_at

---

# 5) UI/UX — Change Request (detail per role)

### Screen: Change Requests List

*   Filter chips: Draft / Submitted / Approved / Rejected / Applied
*   Kolom: CR No, Work Order, Sample ID, jenis perubahan (ringkas), status, requester, created date

### Screen: Create CR (Admin/Analyst)

Stepper ringan:

1.  **Select Work Order / Sample**
    *   pilih WO → auto tampil detail sample + requested tests
2.  **Add Change Items**
    *   tombol cepat:
        *   “Add Test”
        *   “Remove Test”
        *   “Change Due Date”
        *   “Change Method/Instrument”
        *   “Edit Sample Metadata”
    *   untuk Add Test: UI sama seperti memilih parameter dari matrix (pakai matrix_parameter_rules + price_list)
    *   untuk Remove: pilih test dari list + alasan
    *   untuk Due date: date picker + preview impact (“overdue? TAT shift?”)
3.  **Review Summary**
    *   tampilkan before/after ringkas
    *   input mandatory “Reason”
4.  **Submit CR**
    *   status → SUBMITTED

### Screen: Approve CR (Manager)

Manager view read-only + risk highlights:

*   “Impact Summary” auto:
    *   +N tests added
    *   N tests cancelled
    *   due date changed
*   Warning:
    *   “Report already LOCKED → will create Report Revision cycle”
*   Actions:
    *   Approve (dengan note optional)
    *   Reject (wajib alasan)

### Setelah Approve

*   toast: “CR Applied”
*   sistem otomatis:
    *   update task/worklist

*   jika mempengaruhi report yang sudah submitted/locked → set report status ke `REVISION_REQUESTED` dan buat `result_versions`/report version increment (sesuai struktur sebelumnya)

***

## 6) Tambahan field kecil yang aku sarankan (biar CR & audit enak)

### Tambah ke work_orders

*   `order_approved_at` (timestamp)
*   `order_approved_by_user_id` (Manager)

supaya "AFTER_ORDER_APPROVED" lock jelas.

### Tambah ke requested_tests

*   `is_cancelled`, `cancelled_reason_text`, `cancelled_at`, `cancelled_by_user_id`
*   `created_via_cr_id` (nullable) (traceability ADD_TEST)

### Tambah ke test_tasks

*   `created_via_cr_id` (nullable)
*   `cancelled_via_cr_id` (nullable)

### Tambah ke reports

*   `revised_due_to_cr_id` (nullable)
*   `revision_note` (nullable)

***

## 7) Workflow end-to-end CR (biar kamu kebayang)

1.  Quotation approved → Work Order dibuat → Receiving confirmed
2.  Scheduling assign tasks → Analyst testing → submit results
3.  Setelah "Order Approved" atau setelah "Report Submitted", semua perubahan lewat CR
4.  Admin buat CR add parameter → manager approve → sistem create requested_test + task baru
5.  Worklist Analyst muncul task baru
6.  Jika report sudah draft/submitted, status balik ke analysis/review sesuai yang kena dampak
7.  Final report tetap punya histori (report version + result_versions)

***

# Tech Stack (LabFlow LIMS)

## Frontend
- **Frontend (Web LIMS):** Next.js (React) + TypeScript
- **UI Kit & Form:** shadcn/ui + React Hook Form + Zod
- **State Management / Data Fetching:** TanStack Query

## Backend
- **Backend API:** Node.js (Next.js API Routes / Hono / Fastify) + OpenAPI
- **ORM / Query Builder:** Drizzle

## Database & Search
- **Database (Single-tenant):** PostgreSQL (managed)
- **Platform DB + Auth + Storage (All-in-one option):** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Vector Database (Hundreds of documents):** pgvector (same Postgres instance)
- **Full-text Search:** Postgres FTS (tsvector)

## Storage & Documents
- **File Storage (raw data, sampling photos, PDF):** Supabase Storage / S3-compatible bucket
- **CoA PDF (precise dynamic paging):** Puppeteer (Chromium print-to-PDF)
- **Digital Signature (simple):** embedded signature image + signer metadata + timestamp

## Queues & Automation
- **Job Queue (PDF):** BullMQ (Redis) / Supabase
- **AI Chat Orchestration:** n8n Webhook + RAG
- **AI Security Boundary:** read-only DB role + “AI-safe” view/schema + rate limiting

## Deployment
- **Deployment (Cloud):** Vercel (frontend) + Supabase storage + Supabase DB + Fly.io worker/queue