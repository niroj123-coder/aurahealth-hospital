# 🏥 AuraHealth International Hospital & Research Center Web Portal

A world-class, full-featured hospital and healthcare web application designed with modern clinical precision, responsive UX, and accessible healthcare design standards.

---

## 🌟 Key Features Included

### 1. 24/7 Emergency Care & Ambulance SOS Dispatch
- **Live ER Wait Time Ticker**: Displays real-time estimated door-to-doctor intake time (~11 mins) and active Level-1 trauma bay readiness.
- **Interactive Ambulance SOS Dispatch Simulator**:
  - One-click GPS-assisted ambulance dispatch request.
  - Live animated tracking radar and countdown ETA timer (`Paramedic Unit Alpha-04`).
  - Driver/paramedic direct contact hotline.
  - Bystander safety and first-aid instructions (CPR, airway management, recovery positioning).

### 2. Clinical Symptom Checker & Triage Engine
- Interactive symptom chips (Chest Pain, Thunderclap Headache, High Fever, Joint Trauma, Shortness of Breath, etc.).
- Real-time clinical evaluation rules that assess severity and guide patients:
  - **Critical Emergency**: Alerts patient to life-threatening risks with direct 1-click ambulance dispatch and emergency hotlines.
  - **Specialist Care**: Connects patient directly to the appropriate department with pre-filtered physician scheduling.

### 3. Interactive Step-by-Step Appointment Booking System (with Strict Clinical & Temporal Validation)
- **Step 1: Specialist & Department**: Filter physicians by specialty, review photos, credentials, rating, and consultation fees ($140 - $210). Supports both **In-Person Hospital Visit** and **Telehealth Video Consultation**.
- **Step 2: Date & Available Slots (Strictly Validated)**:
  - **Temporal Validation**: Strictly rejects any date in the past (e.g. 1 Jan 2026 when current date is in Nov 2026).
  - **Booking Window**: Allows bookings only from today up to 60 days in advance.
  - **Same-Day Slot Filter**: If booking for today, slots that have already passed in local time are flagged as `(Passed)` and disabled.
  - Real-time inline feedback alerts user immediately if an invalid date is typed or chosen.
- **Step 3: Patient Intake (Validated)**:
  - **Date of Birth Protection**: Strictly rejects future birth dates (e.g. 2028) and dates prior to 1900. Automatically calculates and displays the patient's exact age in years (`🎂 Patient Age: X years old`).
  - **Full Name**: Requires genuine alphabetic name (min 2 characters).
  - **Phone Number**: Validates genuine contact number (8 to 15 digits).
  - **Email Address**: RFC-standard email format validation.
  - Insurance carrier selection (BlueCross, Aetna, Cigna, Medicare, etc.) and chief complaints.
- **Step 4: Printable Appointment Pass**: Generates official hospital appointment slip with reference number, barcode, room instructions, and 1-click Print/Save as PDF or Add to Calendar. Automatically syncs with the Patient Portal.

### 4. "Find a Doctor" Searchable & Filterable Directory
- Real-time search across doctor names, medical conditions, and specialties.
- Filter by department dropdown.
- Individual Doctor Profile Modal with complete biographical background, education, fellowships, awards, and reviews.

### 5. Centers of Clinical Excellence (Departments)
- **Cardiovascular Sciences & Heart Institute**
- **Neurosciences & Stroke Institute**
- **Orthopedics & Robotic Joint Reconstruction**
- **Comprehensive Cancer Center (Oncology)**
- **Pediatrics & Level-IV Neonatal Intensive Care (NICU)**
- **Level-1 Trauma & Emergency Medicine**
- **Obstetrics, Gynecology & Women's Health**
- **Advanced Diagnostic Radiology & AI Imaging**

### 6. Interactive Patient Portal (Self-Service Dashboard with 2FA Verification Code)
- **Secure 2FA OTP Login**:
  - Authenticate using registered Email or Phone Number.
  - Generates an authentic 6-digit one-time verification code (OTP) with real-time push notification and auto-fill helper.
  - **Quick Booking Reference Lookup**: Patients can track their appointment directly using their `AH-XXXXXX` reference code.
- **Personalized Patient Dashboard**:
  - Dynamically loads the authenticated patient's actual name, contact info, and their personalized scheduled visits.
- **My Appointments**: Active bookings list with "View Pass Slip", "View Received Email", "Add to Calendar", and "Cancel Visit" options.
- **Laboratory & Diagnostic Reports**:
  - Comprehensive Metabolic & Lipid Panel, Complete Blood Count (CBC) with biological reference ranges and pathology validation.
  - "Download Official PDF" simulation.
- **Digital Prescriptions**: Active hospital medications (Atorvastatin, Aspirin, CoQ10) with dosage, schedule, and **1-Click Refill** requests.
- **Invoices & Billing**: Itemized bills, insurance coverage breakdown, and interactive **Pay Co-Pay** modal with instant receipt generation.

### 7. Real-Time Hospital Operations & Live Bed Tracker
- Real-time bed occupancy stats for ICU, Trauma Resuscitation Bays, Maternity Birthing Suites, Pediatric Unit, and General Inpatient Wards.
- **Blood Bank Reserves Inventory**: Live levels for O+, O-, A+, A-, B+, B-, AB+, and AB- blood units with critical shortage indicators.

### 8. Preventive Health Checkup Packages
- Executive Whole-Body Screen ($299, 72 parameters)
- Cardiac Wellness & Heart Shield ($199)
- Women's Wellness & Cancer Prevention ($249)
- Senior Citizen Longevity Panel ($219)
- Diabetes Care & Endocrine Comprehensive ($129)

### 9. Health Knowledge Hub, Patient Testimonials & FAQ
- Verified patient recovery stories.
- Clinician-authored medical wellness articles.
- Expandable interactive accordion for visitor policies, insurance queries, and ER triage rules.

---

## 🚀 How to Run the Website

### Option 1: Using the Built-in Zero-Dependency Node.js Server (Recommended)
You can launch the local server using standard Node.js (no external packages or `npm install` needed!):

```bash
npm start
```
*or*
```bash
node server.js
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

### Option 2: Direct Browser Launch (No server required)
Simply double-click on `index.html` or open it directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari!

---

## 📁 Project Architecture

```
ashim1/
├── index.html              # Main application entry point & layout
├── server.js               # Zero-dependency Node.js HTTP server (Standard Library)
├── package.json            # Project configuration & npm start script
├── README.md               # Documentation & feature roadmap
├── css/
│   └── styles.css          # Modern healthcare design system & responsive stylesheet
└── js/
    ├── data.js             # Hospital dataset: doctors, departments, packages, patient records
    ├── email.js            # Universal email & OTP gateway (EmailJS, .EML, Node server relay)
    ├── app.js              # Core UI controller, global search (Ctrl+K), toasts, modals
    ├── booking.js          # 4-step appointment booking wizard & printable pass generator
    ├── portal.js           # Patient portal: 2FA OTP login, health records, lab reports, refills
    ├── triage.js           # Interactive symptom checker & triage risk calculator
    ├── ambulance.js        # 24/7 Emergency ambulance SOS dispatch simulator with ETA
    └── admin.js            # Live hospital operations & bed occupancy tracker
```

---

## ✉️ Real Gmail & Mobile Phone SMS Notifications

### How to Get 100% Automated Background Emails in Your Gmail
In web technology, no browser or static web file can push emails across the internet into Google's `@gmail.com` mailboxes without an email service key (otherwise spammers could abuse any website).

To receive emails automatically in your inbox in the background without manually composing:

1. **Option 1: Web3Forms (Takes 30 Seconds - Free & Zero Server)**
   - Go to [web3forms.com](https://web3forms.com) (free 250 emails/month).
   - Enter your email (`nirojkhattri33@gmail.com`) to get your free Access Key.
   - Click **"⚙️ Notification & Delivery Settings"** in the portal, paste your Access Key into the box, and click **Save Settings**.
   - Every booking pass and 2FA code will automatically arrive in your Gmail inbox!

2. **Option 2: Direct 1-Click Send to Gmail**
   - On the booking confirmation card, click **`🚀 Open & Save in My Gmail (1-Click)`**.
   - Your Gmail app opens pre-populated with your confirmation pass, reference ID, doctor, and clinic instructions. Click Send, and it's in your inbox!

3. **Option 3: Instant 1-Click Auto-Fill (Zero Waiting)**
   - When logging in, your genuine 6-digit security code is generated and displayed on screen in the green card (e.g., `614 - 324`).
   - Click **`⚡ Click to Auto-Fill & Log In`** to access your appointments and medical records immediately without waiting for any email.

---

## 💡 Keyboard Shortcuts
- **`Ctrl + K`** (or `Cmd + K`): Open instant global medical search for doctors, departments, and health packages.
- **`Esc`**: Close any active modal dialog.
