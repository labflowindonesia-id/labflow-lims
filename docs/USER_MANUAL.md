# 📖 User Manual - LabFlow LIMS

> **Laboratory Information Management System**  
> Version 1.0.0 | Last Updated: February 2026

---

## 📋 Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Akses Aplikasi](#akses-aplikasi)
3. [Settings & Master Data (Langkah Awal)](#settings--master-data-langkah-awal)
4. [Modul Quotation](#modul-quotation)
5. [Contract Review (Manager)](#contract-review-manager)
6. [Receiving Sample](#receiving-sample)
7. [Scheduling & Assignment](#scheduling--assignment)
8. [Worklist Analyst](#worklist-analyst)
9. [Testing & Result Entry](#testing--result-entry)
10. [QC Monitoring](#qc-monitoring)
11. [Results Review (Manager)](#results-review-manager)
12. [Report Generation](#report-generation)
13. [Customer Portal](#customer-portal)
14. [Archive & Search](#archive--search)
15. [Change Request System](#change-request-system)
16. [Tips & Troubleshooting](#tips--troubleshooting)

---

## Pendahuluan

### Apa itu LabFlow LIMS?

LabFlow LIMS adalah sistem manajemen informasi laboratorium yang dirancang untuk mengelola seluruh alur kerja laboratorium, mulai dari pembuatan quotation hingga penyerahan laporan hasil uji kepada pelanggan.

### Flow Utama Aplikasi

```
┌─────────────┐    ┌────────────────┐    ┌──────────────┐    ┌────────────┐
│  Quotation  │───▶│ Contract Review│───▶│   Receiving  │───▶│ Scheduling │
│   (Admin)   │    │   (Manager)    │    │    Sample    │    │  (Admin)   │
└─────────────┘    └────────────────┘    └──────────────┘    └────────────┘
                                                                    │
                                                                    ▼
┌─────────────┐    ┌────────────────┐    ┌──────────────┐    ┌────────────┐
│   Report    │◀───│  Results       │◀───│   Testing    │◀───│  Worklist  │
│  Generation │    │  Review        │    │   + QC       │    │  (Analyst) │
└─────────────┘    └────────────────┘    └──────────────┘    └────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Customer Portal                                  │
│        (Status Tracking, Report Download, Bulk Download)                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Role & Hak Akses

| Role | Deskripsi | Menu yang Dapat Diakses |
|------|-----------|-------------------------|
| **Admin** | Membuat quotation, receiving sample, scheduling | Dashboard, Quotations, Receiving, Scheduling, Reports, Settings |
| **Analyst** | Mengerjakan task uji, input hasil | Dashboard, My Worklist |
| **Manager** | Review, approve, monitoring | Dashboard, Contract Review, QC Monitor, Results Review, Reports, Archive |

---

## Akses Aplikasi

### URL Akses

| Tipe User | URL | Keterangan |
|-----------|-----|------------|
| **Staff/Admin** | `http://localhost:3000/admin/login` | Dashboard LIMS |
| **Customer** | `http://localhost:3000/login` | Customer Portal |

### Akun Demo (Testing)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@labflow.id` | (sesuai setup) |
| Manager | `manager@labflow.id` | (sesuai setup) |
| Analyst | `analyst1@labflow.id` | (sesuai setup) |

### Login Steps

1. Buka URL sesuai role Anda
2. Masukkan **Email** dan **Password**
3. Klik tombol **Sign In**
4. Sistem akan redirect ke Dashboard

---

## Settings & Master Data (Langkah Awal)

> ⚠️ **PENTING:** Sebelum menggunakan modul lain, setup Master Data terlebih dahulu!

### Cara Akses
- Klik icon **⚙️ Settings** di sidebar (paling bawah)

### Tab Settings yang Tersedia

#### 1. General Settings
Konfigurasi informasi laboratorium:
- **Laboratory Name**: Nama lab Anda
- **Company Code**: Kode perusahaan
- **Support Email & Phone**: Kontak support
- **Address**: Alamat laboratorium
- **Accreditation Number**: Nomor akreditasi lab
- **Default Currency**: IDR atau USD

**Langkah:**
1. Klik tab **General**
2. Isi semua field yang diperlukan
3. Klik **Save Changes**

---

#### 2. Users (Pengguna)
Kelola akun admin, manager, dan analyst.

**Menambah User Baru:**
1. Klik tab **Users**
2. Klik tombol **+ Add User**
3. Isi form:
   - **Full Name**: Nama lengkap
   - **Email**: Email (digunakan untuk login)
   - **Role**: Pilih ADMIN/MANAGER/ANALYST
   - **Active Status**: Centang jika aktif
4. Klik **Save**

**Role yang Tersedia:**
| Role | Keterangan |
|------|------------|
| ADMIN | Buat quotation, receiving, scheduling |
| MANAGER | Review & approve, monitoring |
| ANALYST | Input hasil uji |

---

#### 3. Customers (Pelanggan)
Data pelanggan/klien laboratorium.

**Menambah Customer:**
1. Klik tab **Customers**
2. Klik **+ Add Customer**
3. Isi:
   - **Company Name**: Nama perusahaan
   - **Customer Code**: Kode unik (mis: CUST-001)
   - **Address**: Alamat lengkap
   - **Phone & Email**: Kontak

---

#### 4. Departments (Departemen)
Departemen/bidang di laboratorium.

**Contoh Departments:**
- Chemistry (CHEM)
- Microbiology (MICRO)
- Physical Testing (PHYS)
- Sample Receiving (RCV)
- QA/QC

---

#### 5. Parameters (Parameter Uji)
Parameter yang dapat diujikan.

**Menambah Parameter:**
1. Klik tab **Parameters**
2. Klik **+ Add**
3. Isi:
   - **Parameter Name**: Nama parameter (mis: pH, COD, BOD)
   - **Symbol**: Simbol singkat
   - **Category**: Physical/Chemical/Biological

---

#### 6. Sample Matrices (Matriks Sampel)
Jenis/tipe sampel yang dapat diterima.

**Contoh Matrices:**
| Nama | Kode | Kategori |
|------|------|----------|
| Air Minum | AM | Environment |
| Air Limbah Domestik | ALD | Environment |
| Tanah | TNH | Environment |
| Makanan | MKN | Food |

---

#### 7. Matrix-Parameter Rules
Aturan kombinasi matriks dan parameter yang diizinkan.

**Fungsi:**
- Menentukan metode default per kombinasi matriks-parameter
- Mengontrol kombinasi yang diperbolehkan

**Menambah Rule:**
1. Klik tab **Matrix-Param Rules**
2. Klik **+ Add Rule**
3. Pilih **Matrix**, **Parameter**, **Default Method**
4. Centang **Allowed** jika kombinasi diizinkan

---

#### 8. Methods (Metode Uji)
Metode standar untuk pengujian.

**Menambah Method:**
1. Klik tab **Methods**
2. Klik **+ Add Method**
3. Isi:
   - **Method Name**: Nama metode
   - **Method Code**: Kode SNI/ISO (mis: SNI 6989.11:2019)
   - **Accredited**: Centang jika terakreditasi

---

#### 9. Instruments (Instrumen)
Peralatan laboratorium.

**Menambah Instrument:**
1. Klik tab **Instruments**
2. Klik **+ Add Instrument**
3. Isi:
   - **Instrument Name**: Nama alat
   - **Code**: Kode internal
   - **Location**: Lokasi di lab
   - **Status**: READY/IN_USE/MAINTENANCE/CALIBRATION
   - **Calibration Due Date**: Tanggal kalibrasi berikutnya

---

#### 10. Units (Satuan)
Satuan pengukuran.

**Contoh Units:**
| Nama | Symbol |
|------|--------|
| Miligram per Liter | mg/L |
| Milligram per Kilogram | mg/kg |
| Celsius | °C |
| NTU | NTU |

---

#### 11. Test Packages (Paket Uji)
Bundel parameter untuk quotation cepat.

**Contoh Package:**
- Basic Water Quality (8 tests) - Rp 2.500.000
- Heavy Metals Panel (12 tests) - Rp 4.500.000

---

#### 12. Price List (Daftar Harga)
Harga per kombinasi matriks-parameter.

**Menambah Harga:**
1. Klik tab **Price List**
2. Klik **+ Add Price**
3. Pilih **Matrix**, **Parameter**
4. Isi **Price (IDR)**
5. Isi **Min Quantity** jika ada harga khusus untuk qty tertentu

---

## Modul Quotation

### Tujuan
Membuat penawaran resmi ke pelanggan berdasarkan parameter uji yang diminta.

### Cara Akses
- Klik menu **📄 Quotations** di sidebar

### Membuat Quotation Baru

1. **Klik "+ Create Quotation"**

2. **Pilih Customer**
   - Pilih dari dropdown Customer
   - Pilih Contact Person (jika ada multiple PIC)

3. **Pilih Matrix (Jenis Sampel)**
   - Misal: Air Limbah Domestik

4. **Pilih Parameter**
   - Multi-select parameter yang diminta
   - Atau pilih dari **Test Package** untuk bundel

5. **Review Auto-Populated Data**
   - Sistem otomatis mengisi:
     - ✅ Metode default (dari Matrix-Parameter Rules)
     - ✅ Instrumen default
     - ✅ Harga (dari Price List)
     - ✅ Lead time / TAT estimasi

6. **Isi Quantity & Notes**
   - Quantity sampel
   - Terms & conditions (opsional)

7. **Klik "Generate Draft Quotation"**
   - Sistem generate PDF draft
   - Status: **DRAFT**

8. **Submit for Review**
   - Klik **"Submit for Contract Review"**
   - Status berubah: **SUBMITTED_FOR_REVIEW**
   - Quotation masuk ke queue Manager

### Status Quotation

| Status | Keterangan |
|--------|------------|
| DRAFT | Baru dibuat, belum dikirim |
| SUBMITTED_FOR_REVIEW | Menunggu review Manager |
| APPROVED | Disetujui, order aktif |
| REJECTED | Ditolak, perlu revisi |
| EXPIRED | Lewat masa berlaku (90 hari) |
| CANCELLED | Dibatalkan |

---

## Contract Review (Manager)

### Tujuan
Manager memvalidasi quotation sebelum order dianggap approved.

### Cara Akses
- Klik menu **✓ Contract Review** di sidebar
- **Hanya untuk role MANAGER**

### Proses Review

1. **Lihat Daftar Queue**
   - Semua quotation status SUBMITTED_FOR_REVIEW

2. **Klik Detail Quotation**

3. **Checklist Review (Minimal)**
   - [ ] Lab capable menjalankan metode
   - [ ] Matrix compatible dengan kemampuan lab
   - [ ] Deadline/TAT realistis
   - [ ] Decision rule "simple acceptance" tercatat

4. **Keputusan**

   **✅ Approve:**
   - Klik tombol **Approve**
   - Status → **APPROVED** (Order Approved)
   - ⚠️ Mulai prinsip "anti silent edit"
   - Perubahan selanjutnya WAJIB via Change Request

   **❌ Reject:**
   - Klik tombol **Reject**
   - Isi alasan rejection
   - Quotation kembali ke Admin untuk perbaikan

---

## Receiving Sample

### Tujuan
Mencatat penerimaan sampel fisik dengan lengkap.

### Cara Akses
- Klik menu **📦 Receiving** di sidebar

### Flow Receiving

1. **Klik "+ Create Sample"**

2. **Input/Scan Quotation ID**
   - Isi nomor quotation yang sudah APPROVED
   - Klik **"Fetch from Quotation"**

3. **Data Auto-Fetched:**
   - Customer + Contact
   - Matrix
   - Requested tests + Due date/TAT

4. **Isi Primary Sample Details:**
   - **Sample Name**: Nama deskriptif (mis: "Limbah Outlet IPAL")
   - **Quantity & Unit**: Jumlah + satuan (mis: 2 x 1L Botol Kaca)
   - **Storage Location**: Lokasi penyimpanan (dropdown)
   - **Storage Condition**: Kondisi (mis: Chiller 4°C)
   - **Condition Upon Receipt**: INTACT / LEAK / DAMAGED
   - **Condition Notes**: Catatan kondisi
   - **Sample Photos**: Upload foto sampel

5. **Isi Sampling Info (Opsional):**
   - Sampling DateTime
   - Lokasi + Koordinat GPS
   - Nama Sampler
   - Sampling Method: GRAB / COMPOSITE
   - Cuaca saat sampling

6. **Isi Field Measurements (Opsional):**
   - pH lapangan
   - Suhu (°C)
   - DO (mg/L)
   - Debit (m³/s)

7. **Final Check Requested Tests:**
   - Review parameter, metode, instrumen, due date
   - Pastikan semua benar

8. **Klik "Confirm Receipt"**
   - Work Order status → **RECEIVED_CONFIRMED**
   - Generate **Sample Receipt PDF**
   - Generate **Barcode Label** untuk sampel

### Output Receiving
- Sample ID terbentuk (format: R/YYYYMMXXXX)
- Sample Receipt PDF tersimpan
- Timeline stage: RECEIVED

---

## Scheduling & Assignment

### Tujuan
Membagi pekerjaan uji ke analyst dan membentuk Worklist.

### Cara Akses
- Klik menu **📅 Scheduling** di sidebar

### Proses Scheduling

1. **Filter Work Order**
   - Status: RECEIVED_CONFIRMED
   - Lihat daftar WO yang siap di-assign

2. **Klik Detail Work Order**
   - Lihat requested tests

3. **Assign untuk Setiap Test:**
   - **Analyst**: Pilih analyst dari dropdown
   - **Priority**: LOW / NORMAL / HIGH / URGENT
   - **Due Date**: Default dari TAT quotation, bisa diubah

4. **Klik "Create Tasks"**
   - Sistem membuat **test_tasks** dengan status **ASSIGNED**
   - Tasks muncul di Worklist Analyst

### Output Scheduling
- Worklist Analyst terbentuk
- Analyst menerima notifikasi task baru

---

## Worklist Analyst

### Tujuan
Halaman kerja harian untuk analyst.

### Cara Akses
- Klik menu **🧪 My Worklist** di sidebar
- **Khusus role ANALYST**

### Fitur Utama

**Tab yang Tersedia:**
| Tab | Isi |
|-----|-----|
| My Tasks | Task yang di-assign ke saya |
| Overdue | Task yang lewat due date |
| Completed | Task yang sudah selesai |

**Sorting & Filter:**
- Due date (terdekat dulu)
- Matrix
- Instrument
- Parameter

### Melihat Task
1. Klik task dari daftar
2. Lihat detail:
   - Sample info
   - Parameter yang harus diuji
   - Metode & instrument
   - Due date

3. **Klik "Start Testing"** untuk mulai

---

## Testing & Result Entry

### Tujuan
Input hasil uji yang akan dipakai di report.

### Cara Akses
- Dari Worklist, klik task → **Start Testing**
- Atau klik menu **🔬 Testing**

### Langkah Input Hasil

1. **Start Run**
   - Klik tombol **"Start Run"**
   - Sistem membuat test_run (run_no = 1)

2. **Input Hasil:**
   | Field | Keterangan |
   |-------|------------|
   | Result Numeric | Angka hasil uji |
   | Unit | Satuan (auto dari parameter) |
   | ND Toggle | Centang jika Not Detected |
   | LOD/LOQ | Auto dari rules, bisa override dengan alasan |
   | Remarks | Catatan untuk report |

3. **Upload Raw Data (Opsional tapi Disarankan):**
   - File data mentah dari instrument
   - Chromatogram, spektra, dll

4. **Input QC (Jika Ada):**
   - Recovery % (terima 80-120%)
   - Control sample results

5. **Multiple Runs (Jika Perlu):**
   - Klik **"Add New Run"**
   - Input hasil run ke-2, ke-3, dst

6. **Mark Completed**
   - Klik **"Mark Completed"**
   - Status task → **COMPLETED**

### Handling ND (Not Detected)

Jika hasil tidak terdeteksi (di bawah batas deteksi):
1. Centang toggle **"ND"**
2. Sistem menyimpan:
   - `is_nd = true`
   - `numeric = null`
   - `display_text = "Not Detected"` atau `"<LOD"`
   - LOD/LOQ tetap tersimpan

---

## QC Monitoring

### Tujuan
Monitoring kualitas hasil pengujian.

### Cara Akses
- Klik menu **📊 QC Monitor** di sidebar
- **Untuk Manager & Admin**

### Fitur Utama

**Recovery Monitoring:**
- Target acceptance: **80-120%**
- Jika di luar range:
  - 🔴 Flag merah di task
  - ⚠️ Warning toast saat analyst submit
  - Tercatat sebagai QC record

**QC Trend Overlay:**
- Lihat trend QC 5 sampel terakhir
- Per parameter/metode/instrument
- Deteksi drift kualitas lebih cepat

**Control Chart:**
- Visualisasi hasil QC
- Warning lines (UCL/LCL)
- Action limits

---

## Results Review (Manager)

### Tujuan
Manager review hasil sebelum dibuatkan report.

### Cara Akses
- Klik menu **📝 Results Review** di sidebar
- **Khusus role MANAGER**

### Proses Review

1. **Lihat Review Queue**
   - Daftar work order dengan status **SUBMITTED FOR REVIEW**

2. **Klik Detail Work Order**

3. **Review Checklist Otomatis:**
   - [ ] Semua test finalized?
   - [ ] Ada QC red flags?
   - [ ] Raw data attached (jika diwajibkan)?
   - [ ] Metadata sample lengkap?

4. **Highlight Per Parameter:**
   - 🟢 Hijau: PASS (dalam batas)
   - 🔴 Merah: FAIL (di luar batas)

5. **Aksi yang Tersedia:**

   **📄 Generate Draft PDF:**
   - Preview report dengan watermark
   - Cek sebelum finalisasi

   **🔁 Request Revision:**
   - Klik jika ada masalah
   - Wajib isi reason
   - Bisa scope: seluruh report atau test tertentu
   - Task kembali ke analyst untuk perbaikan

   **✅ Approve & Sign:**
   - Klik untuk finalisasi
   - Input signature (simple signature)
   - Report status: APPROVED → LOCKED → RELEASED

---

## Report Generation

### Tujuan
Membuat laporan hasil uji resmi.

### Cara Akses
- Klik menu **📑 Reports** di sidebar

### Membuat Report

1. **Klik "+ Create Report"**

2. **Pilih Work Order/Sample**
   - Multi-select untuk report gabungan

3. **Opsi Report:**
   - [ ] Include QC Data
   - [ ] Include Raw Data references
   - Template: Universal / Custom

4. **Generate Draft**
   - Preview dengan watermark
   - Review sebelum finalisasi

5. **Finalisasi**
   - Setelah Manager approve & sign
   - PDF final (tanpa watermark)
   - Status: **LOCKED**
   - Semua data jadi read-only

### Distribusi Report

**Email ke Customer:**
1. Klik **"Send Email"**
2. Pilih recipient dari contact list
3. Customize message
4. Klik **Send**

**Portal:**
- Otomatis tersedia di Customer Portal setelah RELEASED

---

## Customer Portal

### Tujuan
Portal untuk customer melihat progress dan download report.

### Cara Akses
- URL: `http://localhost:3000/login`
- Login dengan akun customer

### Fitur Portal

#### 1. Dashboard Status Tracker
Visualisasi progress sampel:
```
RECEIVED → LAB ANALYSIS → REVIEW → COMPLETED
   ✓           🔄           ○          ○
```

#### 2. Order List
- Lihat semua order aktif
- Status terkini
- Estimated completion date

#### 3. Report Repository
- Search by:
  - Report No
  - Sample Name
  - Date Range
  - Matrix
- View report (PDF viewer)
- Download individual report

#### 4. Bulk Download
- Select date range
- Download semua report dalam ZIP
- Untuk kebutuhan audit tahunan

### Keamanan Portal
- Customer hanya bisa melihat report **milik sendiri**
- Filter otomatis berdasarkan customer_id

---

## Archive & Search

### Tujuan
Menyimpan dan mencari data historis (retensi 5 tahun).

### Cara Akses
- Klik menu **📁 Archive** di sidebar

### Fitur Archive

**Global Search:**
- Cari di semua data:
  - Orders
  - Reports
  - Samples
  - Tasks

**Filter Lanjutan:**
| Filter | Keterangan |
|--------|------------|
| Date Range | Periode tertentu |
| Customer | Filter per customer |
| Matrix | Jenis sampel |
| Status | Status tertentu |

**Bulk Actions:**
- Export to Excel
- Bulk download reports

**Retention Policy:**
- Data disimpan minimal 5 tahun
- Setelah itu bisa di-archive ke cold storage

---

## Change Request System

### Tujuan
Jalur resmi untuk perubahan setelah Order Approved.

### Kapan Dipakai
- Tambah test baru
- Cancel test tertentu
- Ubah due date
- Ubah metode/instrument
- Koreksi metadata sample

### Cara Membuat Change Request

1. **Akses dari Work Order terkait**
   - Klik tombol **"Create Change Request"**

2. **Isi Detail CR:**
   - **Type**: ADD_TEST / CANCEL_TEST / CHANGE_DATE / CHANGE_METHOD / OTHER
   - **Description**: Jelaskan perubahan yang diminta
   - **Justification**: Alasan perubahan

3. **Submit CR**
   - Status: **SUBMITTED**
   - CR masuk ke queue Manager

### Approval CR (Manager)

1. **Lihat CR Queue**
   - Menu **Change Requests** atau dari dashboard

2. **Review CR:**
   - Lihat detail perubahan
   - Impact assessment

3. **Keputusan:**

   **✅ Approve:**
   - Sistem APPLY perubahan otomatis:
     - Update requested_tests
     - Update test_tasks
     - Jika report sudah locked → buat revision cycle
   
   **❌ Reject:**
   - CR ditolak
   - Isi alasan rejection

### Prinsip Anti-Silent Edit

> ⚠️ Setelah **Order Approved**, tidak ada perubahan data operasional yang bisa dilakukan **tanpa** Change Request yang ter-approve.

Ini termasuk:
- Test list
- Due date
- Method/Instrument
- Sample metadata

---

## Tips & Troubleshooting

### Tips Penggunaan

1. **Setup Master Data Dulu**
   - Pastikan Parameters, Methods, Instruments, Price List sudah lengkap sebelum mulai operasional

2. **Gunakan Test Packages**
   - Untuk quotation cepat pada kombinasi parameter yang sering diminta

3. **Upload Raw Data Selalu**
   - Untuk audit trail dan QA purposes

4. **Monitor QC Regularly**
   - Cek QC Monitor setiap hari untuk deteksi dini masalah kualitas

5. **Use Bulk Download**
   - Untuk backup dan kebutuhan audit tahunan

### Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tidak bisa login | Cek email & password, pastikan akun active |
| Quotation tidak muncul harga | Pastikan Price List sudah di-setup untuk kombinasi matrix-parameter |
| Parameter tidak available | Cek Matrix-Parameter Rules, pastikan kombinasi allowed |
| Task tidak muncul di Worklist | Pastikan scheduling sudah dilakukan & analyst ter-assign |
| Report tidak bisa di-lock | Pastikan semua test sudah COMPLETED & sudah di-review Manager |
| Customer tidak bisa lihat report | Report belum RELEASED, atau customer_id tidak match |

### Keyboard Shortcuts

| Shortcut | Aksi |
|----------|------|
| `Ctrl + K` | Global Search |
| `Ctrl + N` | New (context-aware) |
| `Ctrl + S` | Save |
| `Esc` | Close modal/cancel |

### Kontak Support

Jika mengalami masalah teknis:
- **Email**: support@labflow.com
- **Phone**: +62 21 123 4567

---

## Appendix: Status Reference

### Quotation Status
```
DRAFT → SUBMITTED_FOR_REVIEW → APPROVED → (EXPIRED/CANCELLED)
                             ↘ REJECTED
```

### Work Order Status
```
RECEIVED_DRAFT → RECEIVED_CONFIRMED → IN_ANALYSIS → IN_REVIEW → COMPLETED
                                                              ↘ CANCELLED
```

### Test Task Status
```
ASSIGNED → IN_PROGRESS → COMPLETED → (WAITING_RECHECK jika revision)
```

### Report Status
```
DRAFT → SUBMITTED → APPROVED → LOCKED → RELEASED
                  ↘ REJECTED (revision loop)
```

### Change Request Status
```
DRAFT → SUBMITTED → APPROVED (applied) / REJECTED
```

---

> 📌 **Catatan**: Manual ini akan diupdate seiring dengan perkembangan fitur aplikasi.

---

*LabFlow LIMS - Powered by LabFlow Indonesia*
