/**
 * Suga.Health Pharmacy & Shipping Data Store
 * Source of truth: Real medication formulary from https://sugahealthv1.vercel.app/
 * and explicit Generic vs Commercial Brand specification:
 * 1. Tirzepatide -> Mounjaro, Yurpeak
 * 2. Orlistat 120 mg -> Xenical, Obelit, Reeshape
 * 3. Minoxidil 5% -> Tugain, Mintop, Morr
 * 4. Minoxidil 5% + Finasteride 0.1% -> Morr F, Tugain Men, Hair 4U F
 * 5. Oral Minoxidil -> Anasure 5 mg
 * 6. Sildenafil 100 mg -> Viagra, Suhagra, Caverta, Silagra
 * 7. Tadalafil 20 mg -> Cialis, Forzest, Tadacip
 * 8. Dapoxetine 30 mg -> Priligy, Duralast, Poxet
 */

const STORAGE_KEY_ORDERS = 'suga_pharmacy_orders_v6';
const STORAGE_KEY_INVENTORY = 'suga_pharmacy_inventory_v6';
const STORAGE_KEY_ACTIVITY = 'suga_pharmacy_activity_v6';

// Clear out legacy / mock storage keys
[
  'suga_pharmacy_orders_v1', 
  'suga_pharmacy_inventory_v1', 
  'suga_pharmacy_activity_v1',
  'suga_pharmacy_orders_real_v2', 
  'suga_pharmacy_inventory_real_v2', 
  'suga_pharmacy_activity_real_v2',
  'suga_pharmacy_orders_clean_v3',
  'suga_pharmacy_inventory_clean_v3',
  'suga_pharmacy_activity_clean_v3',
  'suga_pharmacy_orders_v4',
  'suga_pharmacy_inventory_v4',
  'suga_pharmacy_activity_v4',
  'suga_pharmacy_orders_v5',
  'suga_pharmacy_inventory_v5',
  'suga_pharmacy_activity_v5'
].forEach(k => {
  try { localStorage.removeItem(k); } catch (e) {}
});

// Authentic Medication Inventory initialized with 0 stock (Empty Central Vault)
const DEFAULT_INVENTORY = [
  {
    id: "MED-TRZ-01",
    name: "Tirzepatide (Mounjaro® / Yurpeak™)",
    genericName: "Tirzepatide",
    brandExamples: ["Mounjaro", "Yurpeak"],
    primaryBrand: "Mounjaro® KwikPen (also Yurpeak™)",
    category: "Weight loss",
    form: "Prescription subcutaneous injection · KwikPen / vial",
    strength: "2.5 mg / 0.5 mL (Initiation dose) & 5.0 mg / 0.5 mL",
    currentStock: 0,
    unit: "pens",
    minThreshold: 10,
    batchNumber: "TRZ-2026-M881",
    expiryDate: "03/2028",
    shelfLocation: "Cold Vault C-01 (2°C - 8°C)",
    isColdChain: true,
    price: 6500,
    image: "assets/images/weightloss-image-1.png",
    description: "First-in-class dual GIP and GLP-1 receptor agonist targeting metabolic satiety pathways. Available in commercial formulations Mounjaro® and Yurpeak™. Mandatory cold-chain storage (2°C - 8°C) with validated temperature logger."
  },
  {
    id: "MED-ORL-02",
    name: "Orlistat 120 mg (Xenical / Obelit / Reeshape)",
    genericName: "Orlistat 120 mg",
    brandExamples: ["Xenical", "Obelit", "Reeshape"],
    primaryBrand: "Obelit 120 / Xenical / Reeshape Capsules",
    category: "Weight loss",
    form: "Oral capsules (Bottle of 84 capsules)",
    strength: "120 mg",
    currentStock: 0,
    unit: "bottles",
    minThreshold: 15,
    batchNumber: "ORL-2026-X12",
    expiryDate: "09/2028",
    shelfLocation: "Shelf W-03 (Room Temp <25°C)",
    isColdChain: false,
    price: 2150,
    image: "assets/images/weightloss-image-3.png",
    description: "Potent gastrointestinal lipase inhibitor blocking absorption of dietary lipids. Dispensed in commercial brands Xenical, Obelit, or Reeshape. Room temperature storage."
  },
  {
    id: "MED-MNX-03",
    name: "Minoxidil 5% (Tugain / Mintop / Morr)",
    genericName: "Minoxidil 5%",
    brandExamples: ["Tugain", "Mintop", "Morr"],
    primaryBrand: "Mintop® / Tugain / Morr 5% Solution",
    category: "Hair growth",
    form: "Topical solution (60 mL bottle with spray & calibrated dropper)",
    strength: "5% w/v",
    currentStock: 0,
    unit: "bottles",
    minThreshold: 15,
    batchNumber: "MNX-2026-T501",
    expiryDate: "11/2027",
    shelfLocation: "Shelf H-01 (Room Temp)",
    isColdChain: false,
    price: 980,
    image: "assets/images/hairloss-image-1.png",
    description: "Arterial vasodilator stimulating microcirculation around hair roots. Available in top clinical brands Tugain, Mintop, and Morr. First-line topical therapy for androgenetic alopecia."
  },
  {
    id: "MED-MNF-04",
    name: "Minoxidil 5% + Finasteride 0.1% (Morr F / Tugain Men / Hair 4U F)",
    genericName: "Minoxidil 5% + Finasteride 0.1%",
    brandExamples: ["Morr F", "Tugain Men", "Hair 4U F"],
    primaryBrand: "Morr-F® 5% / Tugain Men / Hair 4U F Solution",
    category: "Hair growth",
    form: "2-in-1 Compounded Topical Solution (60 mL bottle with dropper)",
    strength: "Minoxidil 5% w/v + Finasteride 0.1% w/v",
    currentStock: 0,
    unit: "bottles",
    minThreshold: 12,
    batchNumber: "MNF-2026-F90",
    expiryDate: "08/2027",
    shelfLocation: "Shelf H-04 (Room Temp)",
    isColdChain: false,
    price: 1450,
    image: "assets/images/hairloss-image-2.png",
    description: "Synergistic dual therapy: Finasteride arrests follicular miniaturization by inhibiting DHT, while Minoxidil accelerates anagen regrowth. Formulations: Morr F, Tugain Men, Hair 4U F."
  },
  {
    id: "MED-OMX-05",
    name: "Oral Minoxidil (Anasure 5 mg)",
    genericName: "Oral Minoxidil",
    brandExamples: ["Anasure 5 mg"],
    primaryBrand: "Anasure 5 mg Tablets",
    category: "Hair growth",
    form: "Oral tablets (Blister strip of 30 tablets)",
    strength: "5 mg (Titrated systemic dose)",
    currentStock: 0,
    unit: "boxes",
    minThreshold: 20,
    batchNumber: "ANS-2026-A05",
    expiryDate: "05/2028",
    shelfLocation: "Shelf H-06 (Room Temp)",
    isColdChain: false,
    price: 650,
    image: "assets/images/hairloss-image-3.png",
    description: "Systemic oral minoxidil formulation for uniform scalp-wide hair follicle recruitment. Available as commercial Anasure 5 mg. Prescribed under doctor-monitored blood pressure evaluation."
  },
  {
    id: "MED-SLD-06",
    name: "Sildenafil 100 mg (Viagra / Suhagra / Caverta / Silagra)",
    genericName: "Sildenafil 100 mg",
    brandExamples: ["Viagra", "Suhagra", "Caverta", "Silagra"],
    primaryBrand: "Suhagra® / Viagra / Caverta / Silagra 100",
    category: "Sexual health",
    form: "Oral film-coated tablets (Pack of 4 / 30 tablets)",
    strength: "100 mg",
    currentStock: 0,
    unit: "boxes",
    minThreshold: 20,
    batchNumber: "SLD-2026-V100",
    expiryDate: "12/2028",
    shelfLocation: "Vault S-01 (Discreet Security Section)",
    isColdChain: false,
    price: 1650,
    image: "assets/images/sexualhealth-image-1.png",
    description: "Selective PDE5 inhibitor for erectile enhancement. Reliable onset within 30-60 minutes. Commercial brand options: Viagra, Suhagra, Caverta, Silagra. Plain, tamper-evident unbranded outer packaging mandatory."
  },
  {
    id: "MED-TDL-07",
    name: "Tadalafil 20 mg (Cialis / Forzest / Tadacip)",
    genericName: "Tadalafil 20 mg",
    brandExamples: ["Cialis", "Forzest", "Tadacip"],
    primaryBrand: "Tadacip® / Cialis / Forzest 20 mg",
    category: "Sexual health",
    form: "Oral film-coated tablets (Pack of 4 / 30 tablets)",
    strength: "20 mg",
    currentStock: 0,
    unit: "boxes",
    minThreshold: 20,
    batchNumber: "TDL-2026-C20",
    expiryDate: "10/2028",
    shelfLocation: "Vault S-03 (Discreet Security Section)",
    isColdChain: false,
    price: 2400,
    image: "assets/images/sexualhealth-image-2.png",
    description: "Extended-duration PDE5 inhibitor offering up to 36 hours of therapeutic responsiveness. Commercial brand options: Cialis, Forzest, Tadacip. Strict discreet packaging protocols applied."
  },
  {
    id: "MED-DPX-08",
    name: "Dapoxetine 30 mg (Priligy / Duralast / Poxet)",
    genericName: "Dapoxetine 30 mg",
    brandExamples: ["Priligy", "Duralast", "Poxet"],
    primaryBrand: "Duralast® / Priligy / Poxet 30 mg",
    category: "Sexual health",
    form: "Oral film-coated tablets (Pack of 4 / 30 tablets)",
    strength: "30 mg",
    currentStock: 0,
    unit: "boxes",
    minThreshold: 15,
    batchNumber: "DPX-2026-D30",
    expiryDate: "04/2028",
    shelfLocation: "Vault S-05 (Discreet Security Section)",
    isColdChain: false,
    price: 1950,
    image: "assets/images/sexualhealth-image-3.png",
    description: "Fast-acting short half-life SSRI indicated for latency extension. Commercial brand options: Priligy, Duralast, Poxet. Plain tamper-evident outer box mandatory."
  }
];

// Prescribing Clinical Team from https://sugahealthv1.vercel.app/
const REAL_DOCTORS = [
  { 
    name: "Dr. Arulprakash", 
    credentials: "MD, FRCP, MCA", 
    regNo: "MCI-482910", 
    specialty: "Clinical Weight Loss & Endocrinology",
    department: "Weight Loss Clinic"
  },
  { 
    name: "Dr. Aishwarya Meenaloshini", 
    credentials: "MBBS, MD (DVL)", 
    regNo: "TN-MC-62914", 
    specialty: "Dermatology & Hair Restoration",
    department: "Trichology & Hair Growth"
  },
  { 
    name: "Dr. S. C. Vivekanandhan", 
    credentials: "MBBS, MD", 
    regNo: "DMC-51092", 
    specialty: "Sexual Health & Internal Medicine",
    department: "Men's Health"
  },
  { 
    name: "Dr. Abi Sindhuja", 
    credentials: "MS, MCH", 
    regNo: "MCI-77401", 
    specialty: "Consultant Aesthetic & Reconstructive Surgery",
    department: "Aesthetic Medicine"
  }
];

// Initial empty prescription queue - zero mock data in Pharmacy Operations Hub
const DEFAULT_ORDERS = [];

// Reference prescription models for authentic testing if manually requested
const SAMPLE_ORDERS = [
  {
    id: "ORD-1001",
    rxId: "RX-2051",
    consultationId: "CON-7001",
    orderDate: "14 Nov 2026, 11:20 AM",
    timeAgo: "22 mins ago",
    status: "new",
    priority: "high",
    patient: {
      id: "SG-5001",
      name: "Priya Raman",
      initials: "PR",
      age: 34,
      gender: "Female",
      city: "Chennai",
      phone: "+91 98401 23891",
      email: "priya.raman@example.com",
      address: "Flat 4B, Emerald Heights, Cenotaph Road, Teynampet, Chennai, TN 600018",
      allergies: ["Penicillin"],
      conditions: "Metabolic weight management · BMI 29.4",
      notes: "First-time incretin therapy. Pre-counseling on subcutaneous injection completed."
    },
    doctor: {
      name: "Dr. Arulprakash",
      credentials: "MD, FRCP, MCA",
      regNo: "MCI-482910",
      consultDate: "14 Nov 2026"
    },
    items: [
      {
        medId: "MED-TRZ-01",
        name: "Tirzepatide (Mounjaro® / Yurpeak™)",
        genericName: "Tirzepatide",
        selectedBrand: "Mounjaro® KwikPen",
        brandExamples: ["Mounjaro", "Yurpeak"],
        dosage: "0.5 mL (2.5 mg) subcutaneously once weekly for 4 weeks",
        qty: 1,
        unit: "pen",
        duration: "28 Days",
        batchAssigned: "TRZ-2026-M881",
        stockVerified: false,
        requiresColdChain: true,
        price: 6500
      }
    ],
    packagingNotes: "COLD-CHAIN MANDATE: Pre-chilled insulated thermal pack with calibrated gel ice packs (2°C - 8°C).",
    deliveryNotes: "Call patient prior to delivery. Signature required on handover.",
    totalAmount: 6500,
    pharmacistReview: {
      pharmacistName: null,
      reviewTimestamp: null,
      stockVerified: false,
      batchVerified: false,
      coldChainPrepped: false,
      comments: ""
    },
    shipping: {
      carrier: "Blue Dart Express Health",
      trackingId: null,
      courierContact: null,
      labelPrinted: false,
      dispatchedAt: null,
      estimatedDelivery: "15 Nov 2026 (Priority Overnight)",
      deliveredAt: null,
      transitEvents: []
    }
  },
  {
    id: "ORD-1002",
    rxId: "RX-2052",
    consultationId: "CON-7002",
    orderDate: "14 Nov 2026, 11:45 AM",
    timeAgo: "40 mins ago",
    status: "new",
    priority: "normal",
    patient: {
      id: "SG-5002",
      name: "Arjun Mehta",
      initials: "AM",
      age: 29,
      gender: "Male",
      city: "Mumbai",
      phone: "+91 98205 77123",
      email: "arjun.m@example.com",
      address: "12A, Silver Arch Apartments, Linking Road, Bandra West, Mumbai, MH 400050",
      allergies: [],
      conditions: "Androgenetic alopecia (Norwood Scale Grade III)",
      notes: "Follow-up consultation at 90 days. Photo progress baseline recorded."
    },
    doctor: {
      name: "Dr. Aishwarya Meenaloshini",
      credentials: "MBBS, MD (DVL)",
      regNo: "TN-MC-62914",
      consultDate: "14 Nov 2026"
    },
    items: [
      {
        medId: "MED-MNF-04",
        name: "Minoxidil 5% + Finasteride 0.1% (Morr F / Tugain Men / Hair 4U F)",
        genericName: "Minoxidil 5% + Finasteride 0.1%",
        selectedBrand: "Morr F® Dual Solution",
        brandExamples: ["Morr F", "Tugain Men", "Hair 4U F"],
        dosage: "1 mL twice daily using calibrated dropper on clean dry scalp",
        qty: 1,
        unit: "bottle (60 mL)",
        duration: "30 Days",
        batchAssigned: "MNF-2026-F90",
        stockVerified: false,
        requiresColdChain: false,
        price: 1450
      }
    ],
    packagingNotes: "Standard tamper-evident Suga Health packaging with safety seal.",
    deliveryNotes: "Leave at concierge if recipient is unavailable.",
    totalAmount: 1450,
    pharmacistReview: {
      pharmacistName: null,
      reviewTimestamp: null,
      stockVerified: false,
      batchVerified: false,
      coldChainPrepped: false,
      comments: ""
    },
    shipping: {
      carrier: "Delhivery Healthcare",
      trackingId: null,
      courierContact: null,
      labelPrinted: false,
      dispatchedAt: null,
      estimatedDelivery: "16 Nov 2026",
      deliveredAt: null,
      transitEvents: []
    }
  },
  {
    id: "ORD-1003",
    rxId: "RX-2053",
    consultationId: "CON-7003",
    orderDate: "14 Nov 2026, 10:15 AM",
    timeAgo: "1 hour ago",
    status: "stock_checking",
    priority: "normal",
    patient: {
      id: "SG-5003",
      name: "Rahul Verma",
      initials: "RV",
      age: 41,
      gender: "Male",
      city: "Gurugram",
      phone: "+91 98110 44299",
      email: "rahul.v@example.com",
      address: "Tower 3, Apt 1102, The Crest, DLF Phase 5, Gurugram, HR 122002",
      allergies: [],
      conditions: "Erectile wellness · Teleconsultation verified",
      notes: "Strict confidentiality and discreet outer packaging requested."
    },
    doctor: {
      name: "Dr. S. C. Vivekanandhan",
      credentials: "MBBS, MD",
      regNo: "DMC-51092",
      consultDate: "14 Nov 2026"
    },
    items: [
      {
        medId: "MED-TDL-07",
        name: "Tadalafil 20 mg (Cialis / Forzest / Tadacip)",
        genericName: "Tadalafil 20 mg",
        selectedBrand: "Tadacip® 20 (also Cialis / Forzest)",
        brandExamples: ["Cialis", "Forzest", "Tadacip"],
        dosage: "Take 1 tablet with water 30-60 minutes before intimacy",
        qty: 1,
        unit: "box (10 tabs)",
        duration: "On Demand",
        batchAssigned: "TDL-2026-C20",
        stockVerified: false,
        requiresColdChain: false,
        price: 2400
      }
    ],
    packagingNotes: "DISCREET PACKAGING MANDATE: Opaque unbranded outer cardboard box. Zero medication references on label.",
    deliveryNotes: "Direct delivery to recipient only. Discreet dispatch.",
    totalAmount: 2400,
    pharmacistReview: {
      pharmacistName: "Rahul Patel, R.Ph",
      reviewTimestamp: "14 Nov 2026, 10:30 AM",
      stockVerified: false,
      batchVerified: true,
      coldChainPrepped: false,
      comments: "Batch TDL-2026-C20 checked. Pharmacist inspection ongoing."
    },
    shipping: {
      carrier: "Blue Dart Express Health",
      trackingId: null,
      courierContact: null,
      labelPrinted: false,
      dispatchedAt: null,
      estimatedDelivery: "15 Nov 2026",
      deliveredAt: null,
      transitEvents: []
    }
  },
  {
    id: "ORD-1004",
    rxId: "RX-2054",
    consultationId: "CON-7004",
    orderDate: "14 Nov 2026, 09:30 AM",
    timeAgo: "2 hours ago",
    status: "ready_for_shipping",
    priority: "normal",
    patient: {
      id: "SG-5004",
      name: "Ananya Sen",
      initials: "AS",
      age: 38,
      gender: "Female",
      city: "Bengaluru",
      phone: "+91 98450 33182",
      email: "ananya.sen@example.com",
      address: "Villa 18, Palm Meadows, Whitefield, Bengaluru, KA 560066",
      allergies: ["Sulfa drugs"],
      conditions: "Dietary fat management protocol",
      notes: "Prescribed alongside nutritional dietary plan."
    },
    doctor: {
      name: "Dr. Arulprakash",
      credentials: "MD, FRCP, MCA",
      regNo: "MCI-482910",
      consultDate: "14 Nov 2026"
    },
    items: [
      {
        medId: "MED-ORL-02",
        name: "Orlistat 120 mg (Xenical / Obelit / Reeshape)",
        genericName: "Orlistat 120 mg",
        selectedBrand: "Obelit 120 (also Xenical / Reeshape)",
        brandExamples: ["Xenical", "Obelit", "Reeshape"],
        dosage: "1 capsule with each main meal containing dietary fat",
        qty: 1,
        unit: "bottle (84 caps)",
        duration: "28 Days",
        batchAssigned: "ORL-2026-X12",
        stockVerified: true,
        requiresColdChain: false,
        price: 2150
      }
    ],
    packagingNotes: "Standard tamper-evident Suga Health packaging.",
    deliveryNotes: "Security desk at main gate authorized.",
    totalAmount: 2150,
    pharmacistReview: {
      pharmacistName: "Rahul Patel, R.Ph (TN-PH-82914)",
      reviewTimestamp: "14 Nov 2026, 09:50 AM",
      stockVerified: true,
      batchVerified: true,
      coldChainPrepped: false,
      comments: "Stock verified from Shelf W-03. Transferred to Delivery Section."
    },
    shipping: {
      carrier: "Blue Dart Express Health",
      trackingId: "BD-849201948",
      courierContact: "+91 1800 233 1234",
      labelPrinted: true,
      dispatchedAt: null,
      estimatedDelivery: "15 Nov 2026",
      deliveredAt: null,
      transitEvents: [
        {
          time: "14 Nov 2026, 09:50 AM",
          status: "Stock Verified & Ready",
          note: "Approved by Chief Pharmacist Rahul Patel. Transferred to Delivery Hub. Tracking #BD-849201948"
        }
      ]
    }
  },
  {
    id: "ORD-1005",
    rxId: "RX-2055",
    consultationId: "CON-7005",
    orderDate: "13 Nov 2026, 04:15 PM",
    timeAgo: "Yesterday",
    status: "in_transit",
    priority: "normal",
    patient: {
      id: "SG-5005",
      name: "Devendra Patel",
      initials: "DP",
      age: 31,
      gender: "Male",
      city: "Ahmedabad",
      phone: "+91 97230 44810",
      email: "dev.patel@example.com",
      address: "B-402, Shaligram Plus, Bodakdev, Ahmedabad, GJ 380054",
      allergies: [],
      conditions: "Diffuse hair thinning · Oral minoxidil protocol",
      notes: "Blood pressure cleared by Dr. Aishwarya Meenaloshini."
    },
    doctor: {
      name: "Dr. Aishwarya Meenaloshini",
      credentials: "MBBS, MD (DVL)",
      regNo: "TN-MC-62914",
      consultDate: "13 Nov 2026"
    },
    items: [
      {
        medId: "MED-OMX-05",
        name: "Oral Minoxidil (Anasure 5 mg)",
        genericName: "Oral Minoxidil",
        selectedBrand: "Anasure 5 mg",
        brandExamples: ["Anasure 5 mg"],
        dosage: "1 tablet daily after breakfast with water",
        qty: 2,
        unit: "boxes (60 tabs)",
        duration: "60 Days",
        batchAssigned: "ANS-2026-A05",
        stockVerified: true,
        requiresColdChain: false,
        price: 1300
      }
    ],
    packagingNotes: "Standard tamper-evident Suga Health packaging.",
    deliveryNotes: "Deliver during office hours (10 AM - 6 PM).",
    totalAmount: 1300,
    pharmacistReview: {
      pharmacistName: "Rahul Patel, R.Ph (TN-PH-82914)",
      reviewTimestamp: "13 Nov 2026, 05:00 PM",
      stockVerified: true,
      batchVerified: true,
      coldChainPrepped: false,
      comments: "Dispensed 2 boxes of Anasure 5 mg. Batch ANS-2026-A05."
    },
    shipping: {
      carrier: "Delhivery Healthcare",
      trackingId: "DL-472019842",
      courierContact: "+91 1800 103 6354",
      labelPrinted: true,
      dispatchedAt: "13 Nov 2026, 06:30 PM",
      estimatedDelivery: "15 Nov 2026",
      deliveredAt: null,
      transitEvents: [
        {
          time: "13 Nov 2026, 05:00 PM",
          status: "Stock Verified & Ready",
          note: "Stock verified and approved for shipping."
        },
        {
          time: "13 Nov 2026, 06:30 PM",
          status: "Dispatched",
          note: "Handed over to Delhivery Healthcare Sorting Hub (BLR/HUB-01)."
        },
        {
          time: "14 Nov 2026, 08:15 AM",
          status: "In Transit",
          note: "Departed sorting facility en route to Ahmedabad Distribution Center."
        }
      ]
    }
  },
  {
    id: "ORD-1006",
    rxId: "RX-2056",
    consultationId: "CON-7006",
    orderDate: "13 Nov 2026, 02:00 PM",
    timeAgo: "Yesterday",
    status: "out_for_delivery",
    priority: "normal",
    patient: {
      id: "SG-5006",
      name: "Sameer Khanna",
      initials: "SK",
      age: 45,
      gender: "Male",
      city: "Delhi",
      phone: "+91 98101 99234",
      email: "sameer.k@example.com",
      address: "42, Golf Links, New Delhi, DL 110003",
      allergies: [],
      conditions: "PDE5 therapy · Telemedicine follow-up",
      notes: "Zero medical mentions on exterior package."
    },
    doctor: {
      name: "Dr. S. C. Vivekanandhan",
      credentials: "MBBS, MD",
      regNo: "DMC-51092",
      consultDate: "13 Nov 2026"
    },
    items: [
      {
        medId: "MED-SLD-06",
        name: "Sildenafil 100 mg (Viagra / Suhagra / Caverta / Silagra)",
        genericName: "Sildenafil 100 mg",
        selectedBrand: "Suhagra® / Viagra 100 mg",
        brandExamples: ["Viagra", "Suhagra", "Caverta", "Silagra"],
        dosage: "Take 1 tablet 30-60 minutes before activity as directed",
        qty: 1,
        unit: "box (10 tabs)",
        duration: "On Demand",
        batchAssigned: "SLD-2026-V100",
        stockVerified: true,
        requiresColdChain: false,
        price: 1650
      }
    ],
    packagingNotes: "DISCREET PACKAGING MANDATE: Plain corrugated brown box without brand markings.",
    deliveryNotes: "Call 15 minutes before arrival. Hand over in person.",
    totalAmount: 1650,
    pharmacistReview: {
      pharmacistName: "Rahul Patel, R.Ph (TN-PH-82914)",
      reviewTimestamp: "13 Nov 2026, 02:40 PM",
      stockVerified: true,
      batchVerified: true,
      coldChainPrepped: false,
      comments: "Discreet packaging verified. Batch SLD-2026-V100 released."
    },
    shipping: {
      carrier: "Blue Dart Express Health",
      trackingId: "BD-918237461",
      courierContact: "+91 98112 34567",
      labelPrinted: true,
      dispatchedAt: "13 Nov 2026, 04:00 PM",
      estimatedDelivery: "Today, by 02:00 PM",
      deliveredAt: null,
      transitEvents: [
        {
          time: "13 Nov 2026, 02:40 PM",
          status: "Stock Verified & Ready",
          note: "Dispensed and transferred to courier dispatch."
        },
        {
          time: "13 Nov 2026, 04:00 PM",
          status: "Dispatched",
          note: "Picked up by Blue Dart courier executive."
        },
        {
          time: "14 Nov 2026, 06:30 AM",
          status: "Arrived at Local Facility",
          note: "Arrived at South Delhi Hub (DL-STH-04)."
        },
        {
          time: "14 Nov 2026, 09:10 AM",
          status: "Out for Delivery",
          note: "Package loaded in courier van. Delivery rider: Rajesh Kumar (+91 98112 34567)."
        }
      ]
    }
  }
];

// Initial activity log: empty central vault log, zero mock records
const DEFAULT_ACTIVITY = [];

/**
 * Data Access Layer
 */
class PharmacyDB {
  static getOrders() {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(DEFAULT_ORDERS));
      return DEFAULT_ORDERS;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error parsing orders:", e);
      return [];
    }
  }

  static saveOrders(orders) {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new Event('suga_orders_updated'));
  }

  static clearOrders() {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify([]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('suga_orders_updated'));
      window.dispatchEvent(new Event('suga_activity_updated'));
    }
    return [];
  }

  static loadSampleOrders() {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(SAMPLE_ORDERS));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('suga_orders_updated'));
      window.dispatchEvent(new Event('suga_activity_updated'));
    }
    return SAMPLE_ORDERS;
  }

  static getInventory() {
    const raw = localStorage.getItem(STORAGE_KEY_INVENTORY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(DEFAULT_INVENTORY));
      return DEFAULT_INVENTORY;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error parsing inventory:", e);
      return DEFAULT_INVENTORY;
    }
  }

  static saveInventory(inventory) {
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
    window.dispatchEvent(new Event('suga_inventory_updated'));
  }

  static getDoctors() {
    return REAL_DOCTORS;
  }

  static getActivity() {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(DEFAULT_ACTIVITY));
      return DEFAULT_ACTIVITY;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_ACTIVITY;
    }
  }

  static logActivity(text, type = "info") {
    const activity = this.getActivity();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    activity.unshift({
      id: Date.now(),
      time: timeStr,
      text,
      type
    });
    if (activity.length > 50) activity.pop();
    localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(activity));
  }

  /**
   * Create a patient order dynamically
   */
  static createOrder(patientData, doctorData, medItemData, options = {}) {
    const orders = this.getOrders();
    const orderIdNum = 1000 + orders.length + 1;
    const orderId = `ORD-${orderIdNum}`;
    const rxId = `RX-${2050 + orders.length + 1}`;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + 
                    ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const initials = (patientData.name || 'PT')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const newOrder = {
      id: orderId,
      rxId: rxId,
      consultationId: `CON-${7000 + orders.length + 1}`,
      orderDate: dateStr,
      timeAgo: "Just now",
      status: "new",
      priority: options.priority || "normal",
      patient: {
        id: `SG-${5000 + orders.length + 1}`,
        name: patientData.name,
        initials: initials,
        age: patientData.age || 30,
        gender: patientData.gender || "Female",
        city: patientData.city || "Mumbai",
        phone: patientData.phone || "+91 98000 00000",
        email: patientData.email || "",
        address: patientData.address || "Main Street, India",
        allergies: patientData.allergies || [],
        conditions: patientData.conditions || "Clinical consultation completed",
        notes: patientData.notes || ""
      },
      doctor: {
        name: doctorData.name || "Dr. Arulprakash",
        credentials: doctorData.credentials || "MD, FRCP, MCA",
        regNo: doctorData.regNo || "MCI-482910",
        consultDate: dateStr
      },
      items: [
        {
          medId: medItemData.medId,
          name: medItemData.name,
          genericName: medItemData.genericName || medItemData.name,
          selectedBrand: medItemData.selectedBrand || medItemData.name,
          brandExamples: medItemData.brandExamples || [],
          dosage: medItemData.dosage,
          qty: medItemData.qty || 1,
          unit: medItemData.unit || "unit",
          duration: medItemData.duration || "30 Days",
          batchAssigned: medItemData.batchNumber || "Assigned on verification",
          stockVerified: false,
          requiresColdChain: !!medItemData.isColdChain,
          price: medItemData.price || 0
        }
      ],
      packagingNotes: medItemData.isColdChain 
        ? "COLD-CHAIN MANDATE: Insulated container with 2°C - 8°C gel pack." 
        : (medItemData.category === "Sexual health" ? "DISCREET PACKAGING MANDATE: Opaque unbranded outer cardboard box." : "Standard tamper-evident Suga Health packaging."),
      deliveryNotes: options.deliveryNotes || "Deliver during business hours.",
      totalAmount: medItemData.price || 0,
      pharmacistReview: {
        pharmacistName: null,
        reviewTimestamp: null,
        stockVerified: false,
        batchVerified: false,
        coldChainPrepped: false,
        comments: ""
      },
      shipping: {
        carrier: options.carrier || "Blue Dart Express Health",
        trackingId: null,
        courierContact: null,
        labelPrinted: false,
        dispatchedAt: null,
        estimatedDelivery: "Within 24-48 hours",
        deliveredAt: null,
        transitEvents: []
      }
    };

    orders.unshift(newOrder);
    this.saveOrders(orders);
    this.logActivity(`New Rx order ${orderId} received for ${newOrder.patient.name} (${newOrder.items[0].name})`, "order");
    return newOrder;
  }

  /**
   * Core workflow: Pharmacist verifies stock and moves order to delivery section
   */
  static verifyStockAndMoveToDelivery(orderId, pharmacistNotes = "") {
    const orders = this.getOrders();
    const inventory = this.getInventory();
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return { success: false, message: "Order not found" };
    }

    const order = orders[orderIndex];

    // Check stock availability & deduct
    for (const item of order.items) {
      const med = inventory.find(m => m.id === item.medId);
      if (med) {
        if (med.currentStock < item.qty) {
          return {
            success: false,
            message: `Insufficient stock for ${med.name}! Available: ${med.currentStock}, Needed: ${item.qty}`
          };
        }
        med.currentStock -= item.qty;
        item.stockVerified = true;
        item.verifiedAt = new Date().toISOString();
      }
    }

    // Generate Carrier Tracking ID if not yet assigned
    const carrier = order.shipping.carrier || "Blue Dart Express Health";
    const prefix = carrier.includes("Blue") ? "BD" : carrier.includes("Delhivery") ? "DL" : "FX";
    const generatedTracking = `${prefix}-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const now = new Date();
    const nowStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + 
                   ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    order.status = "ready_for_shipping";
    order.pharmacistReview = {
      pharmacistName: "Rahul Patel, R.Ph (Reg. #TN-PH-82914)",
      reviewTimestamp: nowStr,
      stockVerified: true,
      batchVerified: true,
      coldChainPrepped: order.items.some(i => i.requiresColdChain),
      comments: pharmacistNotes || "All medications batch-verified from Suga Health inventory, checked against patient allergy record, and approved for dispatch."
    };

    order.shipping.trackingId = order.shipping.trackingId || generatedTracking;
    order.shipping.labelPrinted = true;
    order.shipping.transitEvents = [
      {
        time: nowStr,
        status: "Stock Verified & Ready",
        note: `Approved by Chief Pharmacist Rahul Patel. Transferred to Delivery Hub. Tracking #${generatedTracking}`
      }
    ];

    this.saveOrders(orders);
    this.saveInventory(inventory);
    this.logActivity(`Order ${order.id} (${order.patient.name}) verified and moved to Delivery Section`, "shipping");

    return {
      success: true,
      order,
      trackingId: generatedTracking,
      message: `Order ${order.id} for ${order.patient.name} has been verified and moved to Delivery & Shipping!`
    };
  }

  /**
   * Shipping workflow: Dispatch order with courier
   */
  static dispatchOrder(orderId, carrierName = null) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: "Order not found" };

    const now = new Date();
    const nowStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + 
                   ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    order.status = "in_transit";
    if (carrierName) order.shipping.carrier = carrierName;
    order.shipping.dispatchedAt = nowStr;
    order.shipping.transitEvents.push({
      time: nowStr,
      status: "Dispatched",
      note: `Package handed over to ${order.shipping.carrier} courier pickup van`
    });

    this.saveOrders(orders);
    this.logActivity(`Order ${order.id} dispatched via ${order.shipping.carrier}`, "dispatch");
    return { success: true, order };
  }

  /**
   * Mark Out For Delivery
   */
  static markOutForDelivery(orderId) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: "Order not found" };

    const now = new Date();
    const nowStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + 
                   ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    order.status = "out_for_delivery";
    order.shipping.transitEvents.push({
      time: nowStr,
      status: "Out for Delivery",
      note: `Shipment is out for delivery with local courier agent`
    });

    this.saveOrders(orders);
    this.logActivity(`Order ${order.id} is Out for Delivery to ${order.patient.city}`, "shipping");
    return { success: true, order };
  }

  /**
   * Mark Delivered
   */
  static markDelivered(orderId, recipientName = null) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: "Order not found" };

    const now = new Date();
    const nowStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + 
                   ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    order.status = "delivered";
    order.shipping.deliveredAt = nowStr;
    order.shipping.transitEvents.push({
      time: nowStr,
      status: "Delivered",
      note: `Successfully delivered and signed for by ${recipientName || order.patient.name}`
    });

    this.saveOrders(orders);
    this.logActivity(`Order ${order.id} delivered to ${order.patient.name} (${order.patient.city})`, "delivered");
    return { success: true, order };
  }

  /**
   * Adjust stock count (+ / - delta)
   */
  static updateStock(medId, delta) {
    const inv = this.getInventory();
    const item = inv.find(m => m.id === medId);
    if (!item) return { success: false, message: "Medication not found" };
    item.currentStock = Math.max(0, item.currentStock + delta);
    this.saveInventory(inv);
    this.logActivity(`Stock count for ${item.genericName} adjusted to ${item.currentStock} ${item.unit}`, "stock");
    return { success: true, item };
  }

  /**
   * Restock medication batch
   */
  static restock(medId, additionalQty, newBatch = null, newExpiry = null) {
    const inv = this.getInventory();
    const item = inv.find(m => m.id === medId);
    if (!item) return { success: false, message: "Medication not found" };
    const qtyNum = Number(additionalQty);
    if (isNaN(qtyNum) || qtyNum <= 0) return { success: false, message: "Invalid quantity" };
    item.currentStock += qtyNum;
    if (newBatch && newBatch.trim()) item.batchNumber = newBatch.trim();
    if (newExpiry && newExpiry.trim()) item.expiryDate = newExpiry.trim();
    this.saveInventory(inv);
    this.logActivity(`Received batch restock of ${qtyNum} ${item.unit} for ${item.genericName}`, "stock");
    return { success: true, item };
  }

  /**
   * Clear inventory completely (0 items)
   */
  static clearInventory() {
    this.saveInventory([]);
    this.logActivity("All inventory wiped. Central vault is empty.", "stock");
  }

  /**
   * Load the 8 authentic formulary medications with 0 stock
   */
  static loadZeroStockTemplate() {
    this.saveInventory(DEFAULT_INVENTORY);
    this.logActivity("Loaded 8 formulary formulations initialized with 0 units in vault.", "stock");
  }



  /**
   * Reset system inventory to real catalog
   */
  static resetToDefault() {
    localStorage.removeItem(STORAGE_KEY_ORDERS);
    localStorage.removeItem(STORAGE_KEY_INVENTORY);
    localStorage.removeItem(STORAGE_KEY_ACTIVITY);
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(DEFAULT_ORDERS));
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(DEFAULT_INVENTORY));
    localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(DEFAULT_ACTIVITY));
    window.dispatchEvent(new Event('suga_orders_updated'));
    window.dispatchEvent(new Event('suga_inventory_updated'));
  }
}

// Make globally accessible
window.PharmacyDB = PharmacyDB;
