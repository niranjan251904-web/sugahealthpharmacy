# Suga.Health - Pharmacy Hub & Delivery Logistics Platform

A modern, clinical-grade telehealth pharmacy dispensing system built for **Suga.Health** (`suga.health`), incorporating the real medication formulary and prescribing doctors from [https://sugahealthv1.vercel.app/](https://sugahealthv1.vercel.app/). Designed to match the exact doctor portal design language, typography, color palette, card anatomy, and interactive workflow.

---

## 💊 Authentic Medication Formulary (Original Generic vs Commercial Brand Examples)

All mock medication data has been removed and replaced with the exact clinical formulations and commercial brand equivalents specified by **Suga.Health** and verified from the clinician directory at [https://sugahealthv1.vercel.app/](https://sugahealthv1.vercel.app/):

| Original Generic | Commercial Brand Examples | Category | Formulation & Packaging | Cold-Chain Vault Storage | Product Illustration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tirzepatide** | **Mounjaro, Yurpeak** | Weight loss | Subcutaneous Solution in Prefilled Pen / KwikPen | ❄ Cold Vault C-01 (2°C - 8°C) | `weightloss-image-1.png` |
| **Orlistat 120 mg** | **Xenical, Obelit, Reeshape** | Weight loss | Oral capsules (Bottle of 84 capsules) | Room Temp Shelf W-03 (<25°C) | `weightloss-image-3.png` |
| **Minoxidil 5%** | **Tugain, Mintop, Morr** | Hair growth | Topical solution with calibrated spray & dropper (60 mL) | Room Temp Shelf H-01 | `hairloss-image-1.png` |
| **Minoxidil 5% + Finasteride 0.1%** | **Morr F, Tugain Men, Hair 4U F** | Hair growth | 2-in-1 Dual Compounded Topical Solution (60 mL) | Room Temp Shelf H-04 | `hairloss-image-2.png` |
| **Oral Minoxidil** | **Anasure 5 mg** | Hair growth | Oral systemic vasodilator tablets (Strip of 30) | Room Temp Shelf H-06 | `hairloss-image-3.png` |
| **Sildenafil 100 mg** | **Viagra, Suhagra, Caverta, Silagra** | Sexual health | Oral film-coated PDE5 inhibitor tablets (100 mg) | 🔒 Discreet Vault S-01 | `sexualhealth-image-1.png` |
| **Tadalafil 20 mg** | **Cialis, Forzest, Tadacip** | Sexual health | Oral 36-hour window tablets (20 mg) | 🔒 Discreet Vault S-03 | `sexualhealth-image-2.png` |
| **Dapoxetine 30 mg** | **Priligy, Duralast, Poxet** | Sexual health | Fast-acting SSRI stamina & control tablets (30 mg) | 🔒 Discreet Vault S-05 | `sexualhealth-image-3.png` |

---

## 👨‍⚕️ Prescribing Clinical Team (From sugahealthv1.vercel.app)

Prescriptions and consultation logs reference the actual clinician network from the live site:
- **Dr. Arulprakash, MD, FRCP, MCA** (Medical Director & Clinical Weight Loss Lead)
- **Dr. Aishwarya Meenaloshini, MBBS, MD** (Dermatology, Venereology, and Hair Restoration Specialist)
- **Dr. Abi Sindhuja, MS, MCH** (Consultant Aesthetic & Reconstructive Surgeon)
- **Dr. S. C. Vivekanandhan, MBBS, MD** (Clinical Advisor & Sexual Health Specialist)

---

## 🎨 Design Theme & Color Palette (Doctor Portal Match)

| UI Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| **Page Background** | `#F8F8F6` / `#F7F7F5` | Calming, warm medical-grade neutral backdrop |
| **Surface Cards** | `#FFFFFF` with `border-black/5` | Soft rounded cards (`rounded-3xl` / 20–24px border radius) |
| **Signature Accent** | `#E8FAA6` (Pastel Chartreuse / Lime) | "Waiting", "New", selected active order highlight |
| **Active Highlight** | `#F7FEDB` bg + `#D4F462` border | Selected order row (`order-card-selected`) matching Priya Raman screen |
| **Primary Charcoal** | `#18181B` / `#1A1A1A` | Navigation pill active state, primary buttons, headers |
| **Success Mint** | `#D6F5E3` / text `#0E603C` | "In Stock", "Delivered", verified state |
| **Urgent Alert** | `#FEE2E2` / `#DC2626` | Patient allergy alert banner (e.g. `Penicillin Allergy`) |
| **Cold-Chain Blue** | `#E0F2FE` / `#0369A1` | Insulated cold-storage packaging badge (2°C - 8°C) |

---

## 🚀 Key Functional Modules

### 1. User Ordered Meds Queue (`index.html` / `pharmacy.html`)
- Displays real user prescriptions sent from doctors (`Dr. Arulprakash`, `Dr. Aishwarya Meenaloshini`, `Dr. S. C. Vivekanandhan`).
- Patients: `Priya Raman` (Mounjaro Tirzepatide), `Arjun Mehta` (Morr-F 5% + Lonitab Oral Minoxidil), `Sneha Kapoor` (Obelit 120 Orlistat), `Rahul Verma` (Tadacip 20 + Duralast 30), `Meera Iyer` (Mintop 5%), etc.
- Live filters by status (*New Orders*, *In Stock Check*, *Ready for Delivery*) and clinical category (*Weight loss*, *Hair growth*, *Sexual health*).
- Instant live search by patient name, Rx ID, medicine brand, or city.

### 2. Pharmacist Stock Check & Verification
- **Interactive Stock Checker**: Compares prescribed quantity against live inventory vault.
- Displays batch numbers (`MNJ-2026-T881`, `MRF-2026-F90`), expiry dates (`03/2028`), vault storage requirements (`Cold Vault C-01 2°C - 8°C` or Room Temp), and stock status (`In Stock` / `Low Stock`).
- Safety checks: Automatically cross-checks patient allergies (e.g., Penicillin alert badge).
- Cold-chain insulation checklist with gel-pack protocols for Tirzepatide pens.
- Dispensing notes input for packaging instructions.

### 3. "Move to Delivery Section" Workflow
- With one click on **"Verify Stock & Move to Delivery Section"**:
  1. Deducts medicine quantity from live warehouse inventory.
  2. Generates an encrypted courier tracking number (e.g. `BD-884920194`).
  3. Transitions order status to `ready_for_shipping`.
  4. Automatically transfers the order into the **Delivery & Shipping Section**.
  5. Displays a confirmation modal with options to view in Shipping, print dispensary labels, or continue dispensing.

### 4. Dedicated Delivery & Shipping Page (`shipping.html`)
- Complete logistics management interface.
- 4-step progress tracker: **Stock Verified ➔ Courier Picked Up ➔ In Transit ➔ Delivered**.
- Courier integrations: **Blue Dart Express Health**, **Delhivery Healthcare**, **FedEx Priority Health**, **Shadowfax Local**.
- **Interactive Actions**:
  - `Dispatch Shipment`: Hand over package to courier agent.
  - `Live Tracker`: Modal with timestamped transit events.
  - `Mark Out for Delivery` and `Confirm Delivery` with recipient sign-off.
  - Direct deep-linking (e.g. `shipping.html?highlight=ORD-9482`) to highlight orders moved from pharmacy.

### 5. Medication Stock & Inventory Vault (`inventory.html`)
- Real product catalog with high-resolution photography from `https://sugahealthv1.vercel.app/`.
- Live stock counters, minimum reorder thresholds, shelf locations, cold-chain status, and 1-click `+ Restock (+10)` action.

### 6. Printable Dispensing & Shipping Label Generator
- Hospital-standard Rx dispensary and priority shipping label.
- Includes barcode, patient delivery address, pharmacist license (`TN-PH-82914`), prescribing doctor details, cold-chain markers, and tamper-evident seal.

---

## 📁 Project Structure

```
D:\parmacy\
├── index.html                  # Main Pharmacy Hub & Dispensing Dashboard
├── pharmacy.html               # Pharmacy page alias
├── shipping.html               # Dedicated Delivery & Shipping Logistics Dashboard
├── inventory.html              # Medication Stock & Inventory Vault
├── server.js                   # Lightweight Node.js local HTTP server
├── package.json                # Project dependencies and npm start script
├── css\
│   └── style.css               # Design system tokens, custom badges, print styles
├── js\
│   ├── data.js                 # Unified data layer & localStorage synchronization
│   ├── app.js                  # Pharmacy hub interactions, search, stock verification
│   └── shipping.js             # Shipping management, tracking timeline, courier actions
└── assets\
    └── images\                 # Real product images from sugahealthv1.vercel.app
```

---

## 💻 How to Run Locally

### Option 1: Using Node.js (Recommended)
Open a terminal in `D:\parmacy` and run:
```bash
npm start
```
or:
```bash
node server.js
```
Then visit: **http://localhost:8000**

### Option 2: Using Python
```bash
python -m http.server 8000
```
Then visit: **http://localhost:8000**

### Option 3: Direct Browser Launch
Double click `index.html` or `shipping.html` to open directly in any modern web browser (Chrome, Edge, Safari, Firefox).
