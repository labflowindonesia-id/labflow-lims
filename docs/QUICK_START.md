# 🚀 Quick Start Guide - LabFlow LIMS

> Panduan cepat untuk memulai menggunakan LabFlow LIMS dalam 10 menit

---

## ✅ Langkah 1: Setup Awal (5 menit)

### 1.1 Akses Settings
1. Login sebagai Admin: `http://localhost:3000/admin/login`
2. Klik icon **⚙️ Settings** di sidebar

### 1.2 Setup Data Minimal

**A. Customers** (Tab: Customers)
```
Company Name: PT Contoh Industri
Customer Code: CUST-001
Address: Jl. Industri No. 123
Phone: 021-1234567
Email: contact@contoh.co.id
```

**B. Sample Matrices** (Tab: Matrices)
```
Name: Air Limbah Domestik
Code: ALD
Category: Environment
```

**C. Parameters** (Tab: Parameters)
```
1. Name: pH, Symbol: pH, Category: Chemical
2. Name: COD, Symbol: COD, Category: Chemical
3. Name: BOD, Symbol: BOD, Category: Chemical
```

**D. Methods** (Tab: Methods)
```
1. Name: pH Meter, Code: SNI-pH, Accredited: Yes
2. Name: Titrimetri, Code: SNI-COD, Accredited: Yes
```

**E. Price List** (Tab: Price List)
```
1. Matrix: Air Limbah, Parameter: pH, Price: 75000
2. Matrix: Air Limbah, Parameter: COD, Price: 200000
3. Matrix: Air Limbah, Parameter: BOD, Price: 250000
```

---

## 📄 Langkah 2: Buat Quotation (2 menit)

1. Klik menu **📄 Quotations**
2. Klik **+ Create Quotation**
3. Pilih Customer: PT Contoh Industri
4. Pilih Matrix: Air Limbah Domestik
5. Pilih Parameters: pH, COD, BOD
6. Review harga (otomatis terisi)
7. Klik **Generate Draft**
8. Klik **Submit for Review**

---

## ✓ Langkah 3: Contract Review - Manager (1 menit)

1. Login sebagai Manager
2. Klik menu **✓ Contract Review**
3. Klik quotation yang pending
4. Centang semua checklist
5. Klik **Approve**

---

## 📦 Langkah 4: Receiving Sample (2 menit)

1. Login sebagai Admin
2. Klik menu **📦 Receiving**
3. Klik **+ Create Sample**
4. Input Quotation ID → **Fetch from Quotation**
5. Isi:
   - Sample Name: Limbah Outlet IPAL
   - Quantity: 2 x 1L Botol Kaca
   - Condition: INTACT
6. Klik **Confirm Receipt**

---

## 📅 Langkah 5: Scheduling (1 menit)

1. Tetap di dashboard Admin
2. Klik menu **📅 Scheduling**
3. Pilih Work Order yang baru dibuat
4. Assign Analyst untuk setiap test
5. Set Priority & Due Date
6. Klik **Create Tasks**

---

## 🧪 Langkah 6: Testing - Analyst (2 menit)

1. Login sebagai Analyst
2. Klik menu **🧪 My Worklist**
3. Klik task pH → **Start Testing**
4. Input:
   - Result: 7.2
   - Unit: -
5. Klik **Mark Completed**
6. Ulangi untuk COD & BOD

---

## 📝 Langkah 7: Review & Approve - Manager (1 menit)

1. Login sebagai Manager
2. Klik menu **📝 Results Review**
3. Klik Work Order yang submitted
4. Review hasil
5. Klik **Generate Draft PDF** (preview)
6. Klik **Approve & Sign**

---

## 📑 Langkah 8: Report Released

Setelah approve:
- Report status → **LOCKED/RELEASED**
- Customer bisa akses di Portal
- Email notifikasi terkirim

---

## 🎉 Selesai!

Anda telah menyelesaikan full cycle LabFlow LIMS:

```
Quotation ✅ → Contract Review ✅ → Receiving ✅ → Scheduling ✅ 
    → Testing ✅ → Review ✅ → Report Released ✅
```

---

## 📞 Butuh Bantuan?

Lihat dokumentasi lengkap: `docs/USER_MANUAL.md`

---

*LabFlow LIMS - Quick Start Guide v1.0*
