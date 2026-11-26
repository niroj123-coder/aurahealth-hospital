/**
 * Darwin City Hospital - Persistent Relational Database Core
 * Powered by Node.js built-in node:sqlite (ACID compliant, zero-dependency)
 * Fictional Australian Healthcare Platform - Darwin, NT
 */
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

// Ensure database directory exists
const DB_DIR = path.join(__dirname);
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'darwin_hospital.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Password Hashing & Verification using Node crypto scrypt
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

/**
 * 1. Initialize Tables (12 Relational Tables)
 */
function initializeSchema() {
  db.exec(`
    -- 1. Users Table (Patient, Doctor, Admin authentication)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT CHECK(role IN ('patient', 'doctor', 'admin')) NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Departments Table (14 Clinical Specialties)
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      icon TEXT NOT NULL,
      head_doctor_name TEXT,
      description TEXT,
      room_wing TEXT,
      operating_hours TEXT,
      treatments TEXT -- JSON array stored as string
    );

    -- 3. Doctors Table (15 Specialist Doctor Profiles)
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      department_id TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      credentials TEXT NOT NULL,
      specialisation TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      languages TEXT NOT NULL,
      biography TEXT,
      fee_aud REAL NOT NULL,
      rating REAL DEFAULT 4.9,
      reviews_count INTEGER DEFAULT 120,
      avatar TEXT NOT NULL,
      room TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    -- 4. Patients Table (Extended Medical Profile)
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      mrn TEXT UNIQUE NOT NULL,
      dob TEXT,
      gender TEXT,
      blood_group TEXT,
      medicare_num TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      allergies TEXT,
      address TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 5. Doctor Availability Schedule
    CREATE TABLE IF NOT EXISTS doctor_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
      start_time TEXT NOT NULL, -- "09:00"
      end_time TEXT NOT NULL,   -- "17:00"
      slot_duration_mins INTEGER DEFAULT 30,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );

    -- 6. Appointments Table (7-Step Booking & Collision Prevention)
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY, -- Reference Code: e.g. DCH-892145
      patient_id INTEGER NOT NULL,
      doctor_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      appointment_date TEXT NOT NULL, -- YYYY-MM-DD
      time_slot TEXT NOT NULL,        -- e.g. "09:30 AM"
      consultation_type TEXT DEFAULT 'In-Person Consultation',
      status TEXT CHECK(status IN ('confirmed', 'pending', 'completed', 'cancelled')) DEFAULT 'confirmed',
      patient_name TEXT NOT NULL,
      patient_email TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      reason TEXT,
      symptoms TEXT,
      fee_aud REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      UNIQUE(doctor_id, appointment_date, time_slot)
    );

    -- 7. Medical Records Table (Pathology, Radiology, Clinical Summaries)
    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id TEXT,
      record_type TEXT NOT NULL, -- Pathology, Radiology, Consultation, Triage
      title TEXT NOT NULL,
      record_date TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT DEFAULT 'Finalized',
      file_ref TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    -- 8. Prescriptions Table
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      medication TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      refills_left INTEGER DEFAULT 0,
      pharmacy_instructions TEXT,
      issued_date TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    -- 9. Notifications Table
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- appointment, alert, system, lab
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 10. Contact Enquiries Table
    CREATE TABLE IF NOT EXISTS contact_enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      department_id TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new', -- new, in_progress, resolved
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Health Articles Table
    CREATE TABLE IF NOT EXISTS health_articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      author_doctor_name TEXT NOT NULL,
      author_title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      read_time_mins INTEGER DEFAULT 5,
      published_date TEXT NOT NULL,
      image_url TEXT NOT NULL
    );

    -- 12. Audit Logs Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Email Verifications Table (6-digit OTP, 5-min expiry, hashed storage, attempt limiting)
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL COLLATE NOCASE,
      purpose TEXT NOT NULL, -- 'booking' or 'enquiry'
      otp_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      expires_at INTEGER NOT NULL, -- Epoch ms
      attempts INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      verified_token TEXT,
      last_sent_at INTEGER NOT NULL, -- Epoch ms
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 14. General Enquiries Table (Real enquiry tracking & admin response)
    CREATE TABLE IF NOT EXISTS general_enquiries (
      id TEXT PRIMARY KEY, -- e.g. ENQ-928174
      full_name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE,
      phone TEXT,
      enquiry_category TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT CHECK(status IN ('new', 'in_progress', 'resolved')) DEFAULT 'new',
      admin_response TEXT,
      responded_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 15. Email Delivery Status & Audit Logs
    CREATE TABLE IF NOT EXISTS email_delivery_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_email TEXT NOT NULL,
      email_type TEXT NOT NULL, -- 'otp_verification', 'appointment_confirmation', 'enquiry_acknowledgement', 'admin_enquiry_alert', 'admin_response'
      subject TEXT NOT NULL,
      status TEXT CHECK(status IN ('sent', 'failed')) NOT NULL,
      error_message TEXT,
      reference_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16. Digital Check-Ins & Real-Time Queue
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id TEXT UNIQUE NOT NULL,
      patient_id INTEGER NOT NULL,
      doctor_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      queue_number TEXT NOT NULL,
      status TEXT CHECK(status IN ('checked_in', 'waiting', 'in_consultation', 'completed', 'cancelled')) DEFAULT 'checked_in',
      checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      estimated_wait_mins INTEGER DEFAULT 15,
      room TEXT NOT NULL,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    -- 17. Patient Family Profiles
    CREATE TABLE IF NOT EXISTS patient_families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      member_name TEXT NOT NULL,
      relationship TEXT NOT NULL,
      dob TEXT,
      gender TEXT,
      blood_group TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- 18. Payments (Stripe Consultation Fee Processing)
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      patient_id INTEGER NOT NULL,
      amount_aud REAL NOT NULL,
      currency TEXT DEFAULT 'AUD',
      status TEXT CHECK(status IN ('paid', 'pending', 'refunded')) DEFAULT 'paid',
      payment_method TEXT DEFAULT 'credit_card',
      stripe_payment_intent_id TEXT,
      receipt_ref TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    -- 19. Patient Feedback & Reviews
    CREATE TABLE IF NOT EXISTS patient_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id TEXT,
      patient_id INTEGER,
      patient_name TEXT NOT NULL,
      doctor_id TEXT,
      rating_overall INTEGER NOT NULL,
      rating_doctor INTEGER NOT NULL,
      rating_cleanliness INTEGER NOT NULL,
      comments TEXT,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 20. Doctor Favorites
    CREATE TABLE IF NOT EXISTS doctor_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(patient_id, doctor_id)
    );

    -- 21. Automated Reminder Logs
    CREATE TABLE IF NOT EXISTS reminder_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id TEXT NOT NULL,
      reminder_type TEXT NOT NULL, -- '24h', '2h'
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'sent'
    );
  `);
}

/**
 * 2. Comprehensive Seed Data
 */
function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('[Darwin DB] Seeding initial hospital data...');

  // 1. Seed Users
  const adminPass = hashPassword('DarwinAdmin2026!');
  const adminStmt = db.prepare(`
    INSERT INTO users (email, password_hash, salt, role, name, phone)
    VALUES (?, ?, ?, 'admin', 'Hospital Administrator', '+61 8 8999 1000')
  `);
  adminStmt.run('admin@darwinhospital.gov.au', adminPass.hash, adminPass.salt);

  const docPass = hashPassword('DoctorPass2026!');
  const docUserStmt = db.prepare(`
    INSERT INTO users (email, password_hash, salt, role, name, phone)
    VALUES (?, ?, ?, 'doctor', ?, '+61 8 8999 2000')
  `);
  const drJenkinsUser = docUserStmt.run('dr.jenkins@darwinhospital.gov.au', docPass.hash, docPass.salt, 'Dr. Sarah Jenkins');
  const drVanceUser = docUserStmt.run('dr.vance@darwinhospital.gov.au', docPass.hash, docPass.salt, 'Dr. Alexander Vance');

  const patPass = hashPassword('PatientPass2026!');
  const patUserStmt = db.prepare(`
    INSERT INTO users (email, password_hash, salt, role, name, phone)
    VALUES (?, ?, ?, 'patient', 'Niroj Khattri', '+61 412 663 7298')
  `);
  const patientUser = patUserStmt.run('nirojkhattri33@gmail.com', patPass.hash, patPass.salt);

  // Seed Patient Profile
  const patProfileStmt = db.prepare(`
    INSERT INTO patients (user_id, mrn, dob, gender, blood_group, medicare_num, emergency_contact_name, emergency_contact_phone, allergies, address)
    VALUES (?, 'DCH-MRN-9021', '1995-04-12', 'Male', 'O Positive', '2893 48123 1', 'Emergency Contact', '+61 412 000 111', 'Penicillin (Mild)', '48 Mitchell St, Darwin City NT 0800')
  `);
  const patientProfile = patProfileStmt.run(Number(patientUser.lastInsertRowid));
  const patientId = Number(patientProfile.lastInsertRowid);

  // 2. Seed 14 Departments
  const departmentsData = [
    {
      id: 'cardiology',
      name: 'Cardiology & Heart Health',
      tagline: 'Advanced Interventional & Electrophysiology Cardiac Center',
      icon: 'heart-pulse',
      head: 'Dr. Sarah Jenkins, MBBS, FRACP, FCSANZ',
      room: 'Wing A, Level 3, Suite 304',
      hours: 'Mon - Fri: 8:00 AM - 6:00 PM (Emergency 24/7)',
      description: 'Comprehensive cardiology services with 24/7 cardiac catheterization labs, echocardiography, pacemaker clinic, and cardiovascular rehabilitation.',
      treatments: JSON.stringify(['Coronary Angiography & Stenting', 'Echocardiography (TTE & TOE)', 'Cardiac Electrophysiology', 'Heart Failure Management', 'Cardiovascular Rehabilitation'])
    },
    {
      id: 'neurology',
      name: 'Neurology & Stroke Unit',
      tagline: 'Specialised Top End Stroke and Neurological Disorder Center',
      icon: 'brain',
      head: 'Dr. Alexander Vance, MD, PhD, FRACP',
      room: 'Wing B, Level 4, Suite 412',
      hours: 'Mon - Fri: 8:30 AM - 5:30 PM',
      description: 'Acute stroke intervention, epilepsy monitoring, headache disorders, multiple sclerosis management, and comprehensive neuro-diagnostic assessments.',
      treatments: JSON.stringify(['Acute Stroke Thrombolysis Protocol', 'EEG & Evoked Potentials', 'Parkinson & Movement Disorder Clinic', 'Neuro-Immunology & MS Therapy', 'Neuropathy & EMG Studies'])
    },
    {
      id: 'orthopaedics',
      name: 'Orthopaedics & Joint Surgery',
      tagline: 'Musculoskeletal Surgery, Arthroplasty & Trauma Center',
      icon: 'bone',
      head: 'Dr. Marcus Brody, MBBS, MS Orth, FRACS',
      room: 'Wing C, Level 2, Suite 210',
      hours: 'Mon - Fri: 8:00 AM - 5:00 PM',
      description: 'Specialised in total joint replacements, minimally invasive arthroscopy, sports injury rehabilitation, and complex musculoskeletal trauma reconstruction.',
      treatments: JSON.stringify(['Total Hip & Knee Replacements', 'Shoulder & Knee Arthroscopy', 'Complex Fracture Reconstruction', 'ACL & Ligament Repairs', 'Spine & Decompression Surgery'])
    },
    {
      id: 'paediatrics',
      name: 'Paediatrics & Child Health',
      tagline: 'Compassionate Care for Infants, Children, and Adolescents',
      icon: 'baby',
      head: 'Dr. Emily Watson, MBChB, FRACP Paed',
      room: 'Wing D, Level 1, Suite 105',
      hours: 'Mon - Sat: 8:30 AM - 6:00 PM',
      description: 'Dedicated paediatric and adolescent care featuring a child-friendly environment, developmental assessments, and close integration with neonatal intensive care.',
      treatments: JSON.stringify(['General Paediatric Consultations', 'Neonatal Health Checks', 'Paediatric Asthma & Allergy Care', 'Developmental Milestone Assessments', 'Childhood Immunisation Program'])
    },
    {
      id: 'general-medicine',
      name: 'General & Internal Medicine',
      tagline: 'Holistic Management of Acute & Chronic Medical Conditions',
      icon: 'stethoscope',
      head: 'Dr. David K. Chen, MBBS, FRACP, FACP',
      room: 'Wing A, Level 1, Suite 102',
      hours: 'Mon - Fri: 8:00 AM - 6:00 PM | Sat: 9:00 AM - 1:00 PM',
      description: 'Multidisciplinary care for complex multimorbidities, diabetes, endocrinology, hypertension, preventative health screenings, and perioperative medical optimization.',
      treatments: JSON.stringify(['Comprehensive Health Assessments', 'Chronic Disease Management', 'Type 1 & 2 Diabetes Clinic', 'Hypertension & Lipid Optimization', 'Pre-operative Medical Clearance'])
    },
    {
      id: 'emergency',
      name: 'Emergency Medicine & Trauma',
      tagline: '24/7 Level-1 Accredited Regional Trauma & Resuscitation Center',
      icon: 'shield-alert',
      head: 'Dr. Rachel Green, MBBS, FACEM',
      room: 'Ground Floor, Emergency Entrance (Bays 1-18)',
      hours: 'Open 24 Hours / 365 Days',
      description: 'State-of-the-art emergency department equipped with resuscitation bays, trauma suites, dedicated paediatric emergency, and rapid diagnostic imaging.',
      treatments: JSON.stringify(['Advanced Trauma Resuscitation', 'Acute Coronary & Stroke Care', 'Emergency Toxicology & Envenomation', 'Minor Injury Assessment & Suture', '24/7 Heliport Trauma Transfer'])
    },
    {
      id: 'maternity',
      name: 'Maternity & Women’s Health',
      tagline: 'Expert Antenatal, Birthing, and Gynaecological Care',
      icon: 'flower',
      head: 'Dr. Olivia Taylor, MBBS, FRANZCOG',
      room: 'Wing B, Level 2, Suite 220',
      hours: 'Mon - Fri: 8:00 AM - 5:00 PM (Delivery Suite 24/7)',
      description: 'Modern family-centred birthing suites, water birth options, specialized antenatal clinics, maternal-foetal medicine, and complete gynaecological surgery.',
      treatments: JSON.stringify(['Antenatal & Postnatal Care', 'Private Labour & Delivery Suites', 'Special Care Baby Unit (SCBU)', 'Minimally Invasive Gynaecology', 'Fertility & Reproductive Health'])
    },
    {
      id: 'dermatology',
      name: 'Dermatology & Skin Cancer',
      tagline: 'Specialised Skin Health, Mohs Surgery & Tropical Dermatology',
      icon: 'sparkles',
      head: 'Dr. James Wilson, MBBS, FACD',
      room: 'Wing C, Level 3, Suite 315',
      hours: 'Mon - Fri: 8:30 AM - 5:00 PM',
      description: 'Expert digital dermatoscopy, skin cancer excision, Mohs micrographic surgery, eczema, psoriasis biologics, and tropical skin disorder treatment.',
      treatments: JSON.stringify(['Full-Body Digital Mole Mapping', 'Melanoma & Non-Melanoma Surgery', 'Mohs Micrographic Surgery', 'Phototherapy & Biologics for Psoriasis', 'Acne & Inflammatory Dermatoses'])
    },
    {
      id: 'radiology',
      name: 'Radiology & Diagnostic Imaging',
      tagline: '3T MRI, 128-Slice CT, Ultrasound & Interventional Procedures',
      icon: 'scan',
      head: 'Dr. Kevin Patel, MBBS, FRANZCR',
      room: 'Ground Floor, Imaging Wing',
      hours: 'Mon - Sun: 7:30 AM - 8:00 PM (Emergency 24/7)',
      description: 'Comprehensive high-resolution medical imaging supporting clinical departments with subspecialist diagnostic reporting and image-guided interventions.',
      treatments: JSON.stringify(['3T Magnetic Resonance Imaging (MRI)', '128-Slice Low-Dose CT Scanning', 'Digital Diagnostic Ultrasound & Doppler', 'EOS Low-Dose Full Body X-Ray', 'Image-Guided Biopsies & Injections'])
    },
    {
      id: 'oncology',
      name: 'Oncology & Cancer Care',
      tagline: 'Personalised Medical Oncology, Day Infusion & Supportive Care',
      icon: 'ribbon',
      head: 'Dr. Meera Nambiar, MBBS, MD, FRACP Onc',
      room: 'Wing D, Level 3, Cancer Care Center',
      hours: 'Mon - Fri: 8:00 AM - 5:00 PM',
      description: 'State-of-the-art day infusion lounge, biological and targeted therapies, clinical cancer genetics, dedicated oncology nursing, and holistic allied health support.',
      treatments: JSON.stringify(['Targeted Chemotherapy & Immunotherapy', 'Personalised Precision Genomics', 'Haematological Malignancy Care', 'Oncology Clinical Trials Access', 'Comprehensive Palliative & Supportive Care'])
    },
    {
      id: 'physiotherapy',
      name: 'Physiotherapy & Rehabilitation',
      tagline: 'Active Rehabilitation, Hydrotherapy & Musculoskeletal Recovery',
      icon: 'activity',
      head: 'Liam O’Connor, B.Physio, APAM',
      room: 'Rehabilitation Pavilion, Ground Floor',
      hours: 'Mon - Fri: 7:30 AM - 6:30 PM | Sat: 8:00 AM - 12:00 PM',
      description: 'Modern rehabilitation gym with heated hydrotherapy pool, neurological rehab equipment, pre/post-operative recovery programs, and vestibular therapy.',
      treatments: JSON.stringify(['Post-Surgical Joint Rehabilitation', 'Clinical Hydrotherapy Pool Sessions', 'Spinal Manual Therapy & Pilates', 'Neurological Stroke Rehabilitation', 'Sports Injury Assessment & Return to Sport'])
    },
    {
      id: 'mental-health',
      name: 'Mental Health & Wellbeing',
      tagline: 'Compassionate Psychiatric & Psychological Clinical Services',
      icon: 'smile',
      head: 'Dr. Hannah Scott, MBBS, FRANZCP',
      room: 'Wellness Pavilion, Level 2',
      hours: 'Mon - Fri: 8:30 AM - 5:30 PM',
      description: 'Comprehensive psychological and psychiatric evaluations, outpatient psychotherapy, acute crisis stabilization, mood disorder clinics, and mindful wellbeing support.',
      treatments: JSON.stringify(['Adult Psychiatric Consultations', 'Cognitive Behavioural Therapy (CBT)', 'Mood & Anxiety Disorder Management', 'PTSD & Trauma Recovery Programs', 'Mindfulness & Stress Resilience Groups'])
    },
    {
      id: 'dental',
      name: 'Dental & Maxillofacial Care',
      tagline: 'Advanced Oral Surgery, Restorative Dentistry & Dental Trauma',
      icon: 'smile-plus',
      head: 'Dr. Anthony Ross, BDS, MBBS, FRACDS',
      room: 'Wing C, Level 1, Suite 112',
      hours: 'Mon - Fri: 8:00 AM - 5:30 PM | Sat: 9:00 AM - 2:00 PM',
      description: 'Equipped for hospital-grade oral and maxillofacial surgeries, wisdom teeth extraction under sedation, facial trauma reconstruction, and routine preventive dental hygiene.',
      treatments: JSON.stringify(['Wisdom Teeth Surgical Extraction', 'Dental Implants & Bone Grafting', 'Facial Trauma & Fracture Fixation', 'Endodontic Root Canal Therapy', 'Preventative Scaling & Cosmetic Dental'])
    },
    {
      id: 'pathology',
      name: 'Pathology & Clinical Laboratory',
      tagline: 'NATA-Accredited 24/7 Rapid Diagnostic Laboratory & Blood Bank',
      icon: 'flask-conical',
      head: 'Dr. Fiona Stewart, MBBS, FRCPA',
      room: 'Central Laboratory, Level 1',
      hours: 'Collection: Mon - Sat 7:00 AM - 6:00 PM (Emergency Testing 24/7)',
      description: 'Fully automated diagnostic pathology providing haematology, biochemistry, microbiology, histology, cytology, and a dedicated regional blood banking service.',
      treatments: JSON.stringify(['Routine & Stat Blood Analysis', 'Microbiology Culture & Sensitivities', 'Histopathology & Biopsy Examination', 'Molecular PCR Diagnostic Testing', 'Transfusion & Blood Group Crossmatching'])
    }
  ];

  const deptStmt = db.prepare(`
    INSERT INTO departments (id, name, tagline, icon, head_doctor_name, room_wing, operating_hours, description, treatments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const d of departmentsData) {
    deptStmt.run(d.id, d.name, d.tagline, d.icon, d.head, d.room, d.hours, d.description, d.treatments);
  }

  // 3. Seed 15 Specialist Doctors
  const doctorsData = [
    {
      id: 'doc-jenkins',
      user_id: Number(drJenkinsUser.lastInsertRowid),
      department_id: 'cardiology',
      name: 'Dr. Sarah Jenkins',
      title: 'Senior Consultant Cardiologist & Head of Heart Center',
      credentials: 'MBBS (Hons), FRACP, FCSANZ, FACC',
      specialisation: 'Interventional Cardiology & Electrophysiology',
      experience_years: 16,
      languages: 'English, French',
      biography: 'Dr. Jenkins trained at Royal Melbourne Hospital and Harvard Medical School before relocating to Darwin. She specializes in transcatheter heart interventions and complex arrhythmia ablation, championing cardiac health outcomes across regional Northern Territory.',
      fee_aud: 220,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800',
      room: 'Wing A, Level 3, Suite 304'
    },
    {
      id: 'doc-vance',
      user_id: Number(drVanceUser.lastInsertRowid),
      department_id: 'neurology',
      name: 'Dr. Alexander Vance',
      title: 'Consultant Neurologist & Director of Acute Stroke Unit',
      credentials: 'MD, PhD, FRACP (Neuro)',
      specialisation: 'Cerebrovascular Disease & Neuro-Oncology',
      experience_years: 19,
      languages: 'English, German',
      biography: 'With extensive fellowship training at Queen Square Institute of Neurology in London, Dr. Vance has pioneered rapid telemedicine stroke response in regional and remote Australian communities.',
      fee_aud: 240,
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800',
      room: 'Wing B, Level 4, Suite 412'
    },
    {
      id: 'doc-brody',
      user_id: null,
      department_id: 'orthopaedics',
      name: 'Dr. Marcus Brody',
      title: 'Head of Orthopaedic Surgery & Trauma Director',
      credentials: 'MBBS, MS Orth, FRACS (Orth), FAOA',
      specialisation: 'Joint Reconstruction & High-Energy Trauma',
      experience_years: 14,
      languages: 'English',
      biography: 'Dr. Brody is a leading Australian orthopaedic surgeon specializing in Mako robotic total joint replacement and reconstruction of high-velocity sports and motor-vehicle musculoskeletal trauma.',
      fee_aud: 250,
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=800',
      room: 'Wing C, Level 2, Suite 210'
    },
    {
      id: 'doc-watson',
      user_id: null,
      department_id: 'paediatrics',
      name: 'Dr. Emily Watson',
      title: 'Senior Specialist Paediatrician & Neonatologist',
      credentials: 'MBChB (Otago), FRACP (Paed), DCH',
      specialisation: 'Paediatric Acute Care & Developmental Medicine',
      experience_years: 12,
      languages: 'English, Spanish',
      biography: 'Dr. Watson brings a gentle and family-oriented approach to caring for infants, children, and young adolescents. She previously served at Sydney Children’s Hospital at Westmead.',
      fee_aud: 195,
      avatar: 'https://images.unsplash.com/photo-1594824813567-33671a53f0f6?auto=format&fit=crop&q=80&w=800',
      room: 'Wing D, Level 1, Suite 105'
    },
    {
      id: 'doc-chen',
      user_id: null,
      department_id: 'general-medicine',
      name: 'Dr. David K. Chen',
      title: 'Head of Internal Medicine & Clinical Governance',
      credentials: 'MBBS (Syd), FRACP, FACP',
      specialisation: 'Complex Multimorbidity & Endocrinology',
      experience_years: 22,
      languages: 'English, Mandarin, Cantonese',
      biography: 'A revered diagnostician with over two decades of clinical mastery, Dr. Chen oversees the hospital’s adult inpatient admissions and specializes in challenging multisystem autoimmune and endocrine disorders.',
      fee_aud: 180,
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800',
      room: 'Wing A, Level 1, Suite 102'
    },
    {
      id: 'doc-green',
      user_id: null,
      department_id: 'emergency',
      name: 'Dr. Rachel Green',
      title: 'Director of Emergency Medicine & Major Incident Lead',
      credentials: 'MBBS, FACEM, Dip. Mountain & Tropical Med',
      specialisation: 'Resuscitation, Disaster Medicine & Envenomation',
      experience_years: 11,
      languages: 'English',
      biography: 'Dr. Green coordinates the 24/7 Emergency and Trauma Centre. She has published widely on tropical envenomation protocols and leads the hospital’s emergency disaster preparedness committee.',
      fee_aud: 210,
      avatar: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=800',
      room: 'Ground Floor, Emergency Clinical Station'
    },
    {
      id: 'doc-taylor',
      user_id: null,
      department_id: 'maternity',
      name: 'Dr. Olivia Taylor',
      title: 'Consultant Obstetrician & Gynaecological Surgeon',
      credentials: 'MBBS (Monash), FRANZCOG, CMFM',
      specialisation: 'High-Risk Obstetrics & Advanced Laparoscopy',
      experience_years: 15,
      languages: 'English',
      biography: 'Dr. Taylor provides supportive, patient-guided pregnancy and delivery care alongside surgical management for endometriosis, uterine fibroids, and pelvic floor conditions.',
      fee_aud: 230,
      avatar: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=800',
      room: 'Wing B, Level 2, Suite 220'
    },
    {
      id: 'doc-wilson',
      user_id: null,
      department_id: 'dermatology',
      name: 'Dr. James Wilson',
      title: 'Consultant Dermatologist & Mohs Micrographic Surgeon',
      credentials: 'MBBS, FACD, International Mohs Fellow',
      specialisation: 'Melanoma Surgery & Tropical Skin Disorders',
      experience_years: 13,
      languages: 'English',
      biography: 'Recognized for his expertise in early detection of aggressive melanoma and non-melanoma skin cancers in Australia’s high UV indices, utilizing full-body digital photography and margin-controlled excisions.',
      fee_aud: 210,
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=800',
      room: 'Wing C, Level 3, Suite 315'
    },
    {
      id: 'doc-patel',
      user_id: null,
      department_id: 'radiology',
      name: 'Dr. Kevin Patel',
      title: 'Director of Diagnostic & Interventional Radiology',
      credentials: 'MBBS, FRANZCR, EBIR',
      specialisation: 'Cardiovascular Imaging & Image-Guided Interventions',
      experience_years: 17,
      languages: 'English, Hindi, Gujarati',
      biography: 'Specialized in minimally invasive vascular interventions, CT fluoroscopy-guided biopsy, and advanced multi-parametric MRI interpretations across adult and paediatric cases.',
      fee_aud: 225,
      avatar: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=800',
      room: 'Ground Floor, Imaging Wing Radiology Control'
    },
    {
      id: 'doc-nambiar',
      user_id: null,
      department_id: 'oncology',
      name: 'Dr. Meera Nambiar',
      title: 'Senior Medical Oncologist & Clinical Research Lead',
      credentials: 'MBBS, MD (Med), FRACP (Medical Oncology)',
      specialisation: 'Immunotherapy, Breast & Thoracic Malignancies',
      experience_years: 14,
      languages: 'English, Malayalam, Hindi',
      biography: 'Dr. Nambiar is committed to empowering oncology patients with the latest personalized molecular therapies, clinical trials, and empathetic multidimensional cancer supportive services.',
      fee_aud: 260,
      avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=800',
      room: 'Wing D, Level 3, Suite 330'
    },
    {
      id: 'doc-oconnor',
      user_id: null,
      department_id: 'physiotherapy',
      name: 'Liam O’Connor',
      title: 'Head of Physical Rehabilitation & Sports Physiotherapy',
      credentials: 'B.Physio (Hons, UQ), M.MuscPhysio, APAM',
      specialisation: 'Post-Surgical Orthopaedic Rehab & Hydrotherapy',
      experience_years: 9,
      languages: 'English',
      biography: 'With elite sports team experience, Liam oversees clinical rehabilitation programs to restore maximal physical function following acute injury or elective joint replacement.',
      fee_aud: 140,
      avatar: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
      room: 'Rehabilitation Pavilion, Consulting Room 1'
    },
    {
      id: 'doc-scott',
      user_id: null,
      department_id: 'mental-health',
      name: 'Dr. Hannah Scott',
      title: 'Consultant Adult Psychiatrist & Psychotherapist',
      credentials: 'MBBS, FRANZCP, Cert. Psychotherapy',
      specialisation: 'Mood Disorders, Anxiety & Occupational Trauma',
      experience_years: 16,
      languages: 'English',
      biography: 'Dr. Scott provides collaborative psychiatric evaluations and therapeutic care, working closely with clinical psychologists to support sustained psychological recovery and mental fitness.',
      fee_aud: 240,
      avatar: 'https://images.unsplash.com/photo-1594824813680-32dfcce03978?auto=format&fit=crop&q=80&w=800',
      room: 'Wellness Pavilion, Suite 204'
    },
    {
      id: 'doc-ross',
      user_id: null,
      department_id: 'dental',
      name: 'Dr. Anthony Ross',
      title: 'Oral & Maxillofacial Surgeon',
      credentials: 'BDS (Adel), MBBS, FRACDS (OMS)',
      specialisation: 'Wisdom Teeth, Facial Reconstruction & Dental Implants',
      experience_years: 12,
      languages: 'English, Italian',
      biography: 'Dually qualified in dentistry and medicine, Dr. Ross performs comprehensive oral surgical procedures under local, IV sedation, and general anaesthesia in Darwin City Hospital operating theatres.',
      fee_aud: 190,
      avatar: 'https://images.unsplash.com/photo-1622253694242-abdfa58f4a18?auto=format&fit=crop&q=80&w=800',
      room: 'Wing C, Level 1, Suite 112'
    },
    {
      id: 'doc-stewart',
      user_id: null,
      department_id: 'pathology',
      name: 'Dr. Fiona Stewart',
      title: 'Clinical Director of Anatomical Pathology & Cytology',
      credentials: 'MBBS, FRCPA, FIAC',
      specialisation: 'Surgical Histopathology & Dermatopathology',
      experience_years: 18,
      languages: 'English',
      biography: 'Dr. Stewart leads the NATA-accredited clinical laboratory, providing accurate and rapid histopathologic reports for surgeons and oncologists throughout the Top End.',
      fee_aud: 175,
      avatar: 'https://images.unsplash.com/photo-1559839734-66a982998a44?auto=format&fit=crop&q=80&w=800',
      room: 'Central Laboratory, Director Suite'
    },
    {
      id: 'doc-blake',
      user_id: null,
      department_id: 'emergency',
      name: 'Dr. Nathan Blake',
      title: 'Senior Specialist Intensivist & Clinical Anaesthetist',
      credentials: 'MBBS, FANZCA, FCICM',
      specialisation: 'Critical Care, ECMO & Neuro-Trauma Life Support',
      experience_years: 15,
      languages: 'English',
      biography: 'Dr. Blake directs the 32-bed Intensive Care Unit (ICU) and coordinates surgical anaesthesia for complex emergency and cardiothoracic procedures.',
      fee_aud: 235,
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800',
      room: 'Intensive Care Unit, Consultant Station'
    }
  ];

  const docStmt = db.prepare(`
    INSERT INTO doctors (id, user_id, department_id, name, title, credentials, specialisation, experience_years, languages, biography, fee_aud, rating, reviews_count, avatar, room)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const doc of doctorsData) {
    docStmt.run(
      doc.id,
      doc.user_id,
      doc.department_id,
      doc.name,
      doc.title,
      doc.credentials,
      doc.specialisation,
      doc.experience_years,
      doc.languages,
      doc.biography,
      doc.fee_aud,
      4.9,
      128,
      doc.avatar,
      doc.room
    );
  }

  // 4. Seed Doctor Availability (Monday - Friday 09:00 - 16:30 for all doctors)
  const availStmt = db.prepare(`
    INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_mins, is_active)
    VALUES (?, ?, '09:00', '16:30', 30, 1)
  `);
  for (const doc of doctorsData) {
    for (let day = 1; day <= 5; day++) { // Mon - Fri
      availStmt.run(doc.id, day);
    }
  }

  // 5. Seed Initial Appointments for Demo Patient
  const apptStmt = db.prepare(`
    INSERT INTO appointments (id, patient_id, doctor_id, department_id, appointment_date, time_slot, consultation_type, status, patient_name, patient_email, patient_phone, reason, symptoms, fee_aud)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  apptStmt.run(
    'DCH-892145',
    patientId,
    'doc-jenkins',
    'cardiology',
    '2026-12-04',
    '10:00 AM',
    'In-Person Consultation',
    'confirmed',
    'Niroj Khattri',
    'nirojkhattri33@gmail.com',
    '+61 412 663 7298',
    'Routine Cardiology Follow-up & ECG Review',
    'Mild palpitations following aerobic exercise',
    220
  );

  apptStmt.run(
    'DCH-741290',
    patientId,
    'doc-chen',
    'general-medicine',
    '2026-12-15',
    '02:30 PM',
    'In-Person Consultation',
    'pending',
    'Niroj Khattri',
    'nirojkhattri33@gmail.com',
    '+61 412 663 7298',
    'Annual Preventative Health & Lipid Panel',
    'General annual medical checkup',
    180
  );

  apptStmt.run(
    'DCH-618402',
    patientId,
    'doc-wilson',
    'dermatology',
    '2026-11-10',
    '11:00 AM',
    'In-Person Consultation',
    'completed',
    'Niroj Khattri',
    'nirojkhattri33@gmail.com',
    '+61 412 663 7298',
    'Routine Skin Cancer Screening',
    'Upper back pigmented lesion examination',
    210
  );

  // 6. Seed Demonstration Medical Records
  const medStmt = db.prepare(`
    INSERT INTO medical_records (patient_id, doctor_id, record_type, title, record_date, doctor_name, summary, status, file_ref)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  medStmt.run(
    patientId,
    'doc-jenkins',
    'Cardiology ECG Report',
    '12-Lead Resting Electrocardiogram',
    '2026-11-10',
    'Dr. Sarah Jenkins',
    'Normal sinus rhythm at 68 bpm. PR interval 158 ms, QRS 88 ms, QTc 412 ms. Normal axis. No acute ST-T wave abnormalities identified. Stable compared to baseline.',
    'Finalized',
    'DCH-ECG-112026.pdf'
  );

  medStmt.run(
    patientId,
    'doc-stewart',
    'Pathology Lab Report',
    'Comprehensive Metabolic & Lipid Panel',
    '2026-11-08',
    'Dr. Fiona Stewart',
    'Serum Glucose: 5.1 mmol/L (Normal 3.9 - 6.0). Total Cholesterol: 4.6 mmol/L. HDL: 1.4 mmol/L. LDL: 2.7 mmol/L. Serum Creatinine: 78 umol/L. eGFR > 90 mL/min/1.73m2. Liver enzymes within reference limits.',
    'Finalized',
    'DCH-PATH-88910.pdf'
  );

  medStmt.run(
    patientId,
    'doc-wilson',
    'Dermatology Exam',
    'Digital Dermatoscopy of Dorsal Lesion',
    '2026-11-10',
    'Dr. James Wilson',
    'Target pigmented macule on mid-scapular region displays benign reticular pigment network. Symmetrical architecture. No atypical globules or regression structures. Advised routine annual follow-up.',
    'Finalized',
    'DCH-DERM-33912.pdf'
  );

  // 7. Seed Prescriptions
  const rxStmt = db.prepare(`
    INSERT INTO prescriptions (patient_id, doctor_id, doctor_name, medication, dosage, frequency, duration, refills_left, pharmacy_instructions, issued_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  rxStmt.run(
    patientId,
    'doc-jenkins',
    'Dr. Sarah Jenkins',
    'Rosuvastatin Calcium',
    '10 mg oral tablet',
    'Once daily with evening meal',
    '90 Days',
    3,
    'Dispense as approved PBS item. Take consistently in the evening.',
    '2026-11-10'
  );

  rxStmt.run(
    patientId,
    'doc-chen',
    'Dr. David K. Chen',
    'Cholecalciferol (Vitamin D3)',
    '1,000 IU softgel capsule',
    'One capsule daily with food',
    '180 Days',
    2,
    'Maintain daily supplement through wet season.',
    '2026-11-08'
  );

  // 8. Seed Notifications
  const notifStmt = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
    VALUES (?, ?, ?, ?, 0, datetime('now', '-2 hours'))
  `);

  notifStmt.run(
    Number(patientUser.lastInsertRowid),
    'appointment',
    'Upcoming Consultation Confirmed',
    'Your appointment with Dr. Sarah Jenkins (Cardiology) is confirmed for 04 Dec 2026 at 10:00 AM at Wing A, Level 3, Suite 304.'
  );

  notifStmt.run(
    Number(patientUser.lastInsertRowid),
    'lab',
    'Pathology Results Ready to View',
    'Your Comprehensive Metabolic & Lipid Panel results from Dr. Fiona Stewart are finalized and available in your portal.'
  );

  // 9. Seed Health Articles
  const articleStmt = db.prepare(`
    INSERT INTO health_articles (id, title, slug, category, author_doctor_name, author_title, summary, content, read_time_mins, published_date, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  articleStmt.run(
    'art-01',
    'Sun Safety & Melanoma Detection in Australia’s Top End',
    'sun-safety-melanoma-detection-darwin',
    'Dermatology & Prevention',
    'Dr. James Wilson',
    'Consultant Dermatologist',
    'Living in Darwin and the Northern Territory brings year-round UV exposure. Learn the ABCDE rules of melanoma detection and essential sun-smart habits.',
    'The UV Index in Darwin consistently exceeds 11 for the majority of the year. Dr. James Wilson details practical strategies for safeguarding skin integrity: broad-spectrum SPF50+ sunscreen, UV protective apparel, and the importance of professional full-body skin audits.',
    4,
    '2026-11-15',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'
  );

  articleStmt.run(
    'art-02',
    'Understanding Acute Stroke: Act F.A.S.T. Every Second Counts',
    'understanding-stroke-fast-protocol',
    'Neurology & Emergency',
    'Dr. Alexander Vance',
    'Director of Acute Stroke Unit',
    'Rapid recognition of stroke symptoms can save brain function and lives. Understand the F.A.S.T. warning signs and when to dial 000 immediately.',
    'Time lost is brain lost during an acute ischaemic stroke. Dr. Alexander Vance explains modern endovascular thrombectomy, intravenous thrombolytic therapies available at Darwin City Hospital, and the vital community role of recognizing Face drooping, Arm weakness, and Slurred Speech.',
    5,
    '2026-11-12',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800'
  );

  articleStmt.run(
    'art-03',
    'Heart Health Fundamentals: Blood Pressure, Lipids and Diet',
    'heart-health-fundamentals-prevention',
    'Cardiology',
    'Dr. Sarah Jenkins',
    'Senior Consultant Cardiologist',
    'Heart disease remains Australia’s leading health challenge. Discover lifestyle and clinical measures that significantly protect your cardiovascular system.',
    'Optimal cardiovascular health rests on four core pillars: blood pressure control, lipid balance, daily physical activity, and stress resilience. Dr. Sarah Jenkins provides clinical insights on maintaining a healthy heart in tropical climates.',
    6,
    '2026-11-05',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800'
  );

  // 10. Seed Initial Contact Enquiries
  const contactStmt = db.prepare(`
    INSERT INTO contact_enquiries (full_name, email, phone, department_id, subject, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  contactStmt.run(
    'Sarah MacIntyre',
    'sarah.mac@example.com.au',
    '+61 488 123 456',
    'cardiology',
    'Outpatient Echocardiogram Referral Query',
    'Hi, my GP in Casuarina provided a referral for an echocardiogram. Could you advise on current outpatient appointment wait times? Thank you.',
    'new'
  );

  console.log('[Darwin DB] Database successfully initialized and seeded with 12 tables!');
}

/**
 * 2b. Seed Upgraded Healthcare Features (Queue, Family, Payments, Feedback, Favorites)
 */
function seedUpgradedFeatures() {
  try {
    // 1. Seed Check-ins & Queue if empty
    const checkinCount = db.prepare('SELECT COUNT(*) as count FROM checkins').get().count;
    if (checkinCount === 0) {
      const existingAppt = db.prepare('SELECT * FROM appointments LIMIT 3').all();
      if (existingAppt.length > 0) {
        const qStmt = db.prepare(`
          INSERT INTO checkins (appointment_id, patient_id, doctor_id, department_id, queue_number, status, estimated_wait_mins, room)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const statuses = ['in_consultation', 'waiting', 'checked_in'];
        const waits = [0, 10, 25];
        existingAppt.forEach((a, idx) => {
          const qNum = `Q-0${40 + idx + 1}`;
          const doc = db.prepare('SELECT room FROM doctors WHERE id = ?').get(a.doctor_id);
          const room = doc ? doc.room : 'Wing A, Suite 304';
          try {
            qStmt.run(a.id, a.patient_id, a.doctor_id, a.department_id, qNum, statuses[idx % statuses.length], waits[idx % waits.length], room);
          } catch (e) {}
        });
      }
    }

    // 2. Seed Patient Family Profiles if empty
    const familyCount = db.prepare('SELECT COUNT(*) as count FROM patient_families').get().count;
    if (familyCount === 0) {
      const pat = db.prepare('SELECT id FROM patients LIMIT 1').get();
      if (pat) {
        const famStmt = db.prepare(`
          INSERT INTO patient_families (patient_id, member_name, relationship, dob, gender, blood_group)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        famStmt.run(pat.id, 'Sunita Khattri', 'Spouse', '1996-08-22', 'Female', 'A Positive');
        famStmt.run(pat.id, 'Aaradhya Khattri', 'Child', '2022-03-15', 'Female', 'O Positive');
      }
    }

    // 3. Seed Payments if empty
    const paymentCount = db.prepare('SELECT COUNT(*) as count FROM payments').get().count;
    if (paymentCount === 0) {
      const appt = db.prepare('SELECT * FROM appointments LIMIT 2').all();
      if (appt.length > 0) {
        const payStmt = db.prepare(`
          INSERT INTO payments (id, appointment_id, patient_id, amount_aud, currency, status, payment_method, stripe_payment_intent_id, receipt_ref)
          VALUES (?, ?, ?, ?, 'AUD', 'paid', 'credit_card', ?, ?)
        `);
        appt.forEach((a) => {
          const payId = 'PAY-' + Math.floor(100000 + Math.random() * 900000);
          const receipt = 'DCH-REC-' + Math.floor(100000 + Math.random() * 900000);
          const pi = 'pi_test_' + Math.random().toString(36).substring(2, 12);
          try {
            payStmt.run(payId, a.id, a.patient_id, a.fee_aud || 220, pi, receipt);
          } catch (e) {}
        });
      }
    }

    // 4. Seed Patient Feedback if empty
    const feedbackCount = db.prepare('SELECT COUNT(*) as count FROM patient_feedback').get().count;
    if (feedbackCount === 0) {
      const fbStmt = db.prepare(`
        INSERT INTO patient_feedback (appointment_id, patient_id, patient_name, doctor_id, rating_overall, rating_doctor, rating_cleanliness, comments, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')
      `);
      fbStmt.run('DCH-DEMO-01', 1, 'Jack Thompson (Nightcliff)', 'doc-jenkins', 5, 5, 5, 'Dr. Sarah Jenkins and the cardiology team provided outstanding care. The ECG was conducted promptly and every step was clearly explained.');
      fbStmt.run('DCH-DEMO-02', 1, 'Chloe Miller (Parap)', 'doc-brody', 5, 5, 4, 'Excellent post-op orthopaedic follow-up for my knee arthroscopy. Clear physio guidance and very welcoming nursing staff.');
      fbStmt.run('DCH-DEMO-03', 1, 'Priya Sharma (Casuarina)', 'doc-chen', 5, 5, 5, 'Dr. David Chen is exceptional with chronic diabetes management. The new digital check-in and queue tracker saved us so much time.');
    }

    // 5. Seed Doctor Favorites if empty
    const favCount = db.prepare('SELECT COUNT(*) as count FROM doctor_favorites').get().count;
    if (favCount === 0) {
      const pat = db.prepare('SELECT id FROM patients LIMIT 1').get();
      if (pat) {
        try {
          db.prepare('INSERT OR IGNORE INTO doctor_favorites (patient_id, doctor_id) VALUES (?, ?)').run(pat.id, 'doc-jenkins');
          db.prepare('INSERT OR IGNORE INTO doctor_favorites (patient_id, doctor_id) VALUES (?, ?)').run(pat.id, 'doc-chen');
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('[Darwin DB] Upgrades seeding error:', err.message);
  }
}

// Auto-run schema initialization and seeding
initializeSchema();
seedDatabase();
seedUpgradedFeatures();

/**
 * Public Query Helper Methods
 */
const DarwinDB = {
  // Database instance
  db,

  // Auth & Password utilities
  hashPassword,
  verifyPassword,

  // Departments
  getAllDepartments: () => {
    return db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
  },
  getDepartmentById: (id) => {
    return db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  },

  // Doctors
  getAllDoctors: (departmentId = null, searchQuery = null) => {
    let sql = 'SELECT d.*, dept.name as department_name FROM doctors d JOIN departments dept ON d.department_id = dept.id';
    const params = [];
    const conditions = [];

    if (departmentId && departmentId !== 'all') {
      conditions.push('d.department_id = ?');
      params.push(departmentId);
    }
    if (searchQuery) {
      conditions.push('(d.name LIKE ? OR d.specialisation LIKE ? OR d.credentials LIKE ?)');
      const wildcard = `%${searchQuery}%`;
      params.push(wildcard, wildcard, wildcard);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY d.experience_years DESC';

    return db.prepare(sql).all(...params);
  },

  getDoctorById: (id) => {
    return db.prepare(`
      SELECT d.*, dept.name as department_name, dept.room_wing as dept_room 
      FROM doctors d 
      JOIN departments dept ON d.department_id = dept.id 
      WHERE d.id = ?
    `).get(id);
  },

  // Appointments & Slot collision check
  getBookedSlots: (doctorId, appointmentDate) => {
    return db.prepare(`
      SELECT time_slot FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'
    `).all(doctorId, appointmentDate).map(row => row.time_slot);
  },

  createAppointment: (appointmentData) => {
    // Check if slot is already occupied
    const existing = db.prepare(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status != 'cancelled'
    `).get(appointmentData.doctor_id, appointmentData.appointment_date, appointmentData.time_slot);

    if (existing) {
      throw new Error(`Time slot ${appointmentData.time_slot} on ${appointmentData.appointment_date} has already been reserved.`);
    }

    const refCode = 'DCH-' + Math.floor(100000 + Math.random() * 900000);

    const stmt = db.prepare(`
      INSERT INTO appointments (
        id, patient_id, doctor_id, department_id, appointment_date, time_slot,
        consultation_type, status, patient_name, patient_email, patient_phone,
        reason, symptoms, fee_aud
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      refCode,
      appointmentData.patient_id,
      appointmentData.doctor_id,
      appointmentData.department_id,
      appointmentData.appointment_date,
      appointmentData.time_slot,
      appointmentData.consultation_type || 'In-Person Consultation',
      appointmentData.status || 'confirmed',
      appointmentData.patient_name,
      appointmentData.patient_email,
      appointmentData.patient_phone,
      appointmentData.reason || '',
      appointmentData.symptoms || '',
      appointmentData.fee_aud || 200
    );

    // Also trigger a notification for the patient if user_id is found
    const patUser = db.prepare('SELECT user_id FROM patients WHERE id = ?').get(appointmentData.patient_id);
    if (patUser && patUser.user_id) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, 'appointment', 'Appointment Confirmed', ?)
      `).run(
        patUser.user_id,
        `Your appointment [${refCode}] is scheduled on ${appointmentData.appointment_date} at ${appointmentData.time_slot}.`
      );
    }

    return refCode;
  },

  updateAppointmentStatus: (appointmentId, newStatus) => {
    return db.prepare(`UPDATE appointments SET status = ? WHERE id = ?`).run(newStatus, appointmentId);
  },

  rescheduleAppointment: (appointmentId, newDate, newTime) => {
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);
    if (!appt) throw new Error('Appointment not found');

    // Check collision for target slot
    const existing = db.prepare(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status != 'cancelled' AND id != ?
    `).get(appt.doctor_id, newDate, newTime, appointmentId);

    if (existing) {
      throw new Error(`The slot on ${newDate} at ${newTime} is already booked.`);
    }

    db.prepare(`
      UPDATE appointments 
      SET appointment_date = ?, time_slot = ?, status = 'confirmed' 
      WHERE id = ?
    `).run(newDate, newTime, appointmentId);

    return true;
  },

  // Patient Dashboard Queries
  getPatientDashboardData: (userId) => {
    const user = db.prepare('SELECT id, email, name, phone, role FROM users WHERE id = ?').get(userId);
    if (!user) return null;

    let patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(userId);
    if (!patient) {
      // Create empty patient record if missing
      const mrn = 'DCH-MRN-' + Math.floor(1000 + Math.random() * 9000);
      db.prepare('INSERT INTO patients (user_id, mrn) VALUES (?, ?)').run(userId, mrn);
      patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(userId);
    }

    const appointments = db.prepare(`
      SELECT a.*, d.name as doctor_name, d.avatar as doctor_avatar, d.room as doctor_room, dept.name as department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.time_slot ASC
    `).all(patient.id);

    const medicalRecords = db.prepare(`
      SELECT * FROM medical_records WHERE patient_id = ? ORDER BY record_date DESC
    `).all(patient.id);

    const prescriptions = db.prepare(`
      SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY issued_date DESC
    `).all(patient.id);

    const notifications = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 15
    `).all(userId);

    const families = db.prepare(`
      SELECT * FROM patient_families WHERE patient_id = ? ORDER BY id ASC
    `).all(patient.id);

    const payments = db.prepare(`
      SELECT p.*, a.appointment_date, a.time_slot, d.name as doctor_name
      FROM payments p
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE p.patient_id = ?
      ORDER BY p.created_at DESC
    `).all(patient.id);

    const favorites = db.prepare(`
      SELECT doctor_id FROM doctor_favorites WHERE patient_id = ?
    `).all(patient.id).map(r => r.doctor_id);

    return {
      user,
      patient,
      appointments,
      medicalRecords,
      prescriptions,
      notifications,
      families,
      payments,
      favorites
    };
  },

  // Doctor Dashboard Queries
  getDoctorDashboardData: (userId) => {
    const user = db.prepare('SELECT id, email, name, phone, role FROM users WHERE id = ?').get(userId);
    if (!user) return null;

    const doctor = db.prepare(`
      SELECT d.*, dept.name as department_name 
      FROM doctors d 
      JOIN departments dept ON d.department_id = dept.id 
      WHERE d.user_id = ?
    `).get(userId);

    if (!doctor) return { user, doctor: null, appointments: [] };

    const todayDate = new Date().toISOString().split('T')[0];

    const todayAppointments = db.prepare(`
      SELECT a.*, p.mrn, p.dob, p.gender, p.blood_group
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = ? AND a.appointment_date = ?
      ORDER BY a.time_slot ASC
    `).all(doctor.id, todayDate);

    const upcomingAppointments = db.prepare(`
      SELECT a.*, p.mrn, p.dob, p.gender, p.blood_group
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = ? AND a.appointment_date >= ?
      ORDER BY a.appointment_date ASC, a.time_slot ASC
    `).all(doctor.id, todayDate);

    const patientsList = db.prepare(`
      SELECT DISTINCT p.*, u.name, u.email, u.phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ?
    `).all(doctor.id);

    return {
      user,
      doctor,
      todayAppointments,
      upcomingAppointments,
      patientsList
    };
  },

  // Admin Dashboard Metrics & Management
  getAdminDashboardData: () => {
    const totalDoctors = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
    const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
    const totalAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;
    
    const todayDate = new Date().toISOString().split('T')[0];
    const todayAppointments = db.prepare(`
      SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?
    `).get(todayDate).count;

    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count FROM appointments GROUP BY status
    `).all();

    const departmentStats = db.prepare(`
      SELECT dept.name, COUNT(a.id) as appointment_count
      FROM departments dept
      LEFT JOIN appointments a ON dept.id = a.department_id
      GROUP BY dept.id
      ORDER BY appointment_count DESC
    `).all();

    const recentAppointments = db.prepare(`
      SELECT a.*, d.name as doctor_name, dept.name as department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dept ON a.department_id = dept.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all();

    const enquiries = db.prepare(`
      SELECT * FROM contact_enquiries ORDER BY created_at DESC LIMIT 10
    `).all();

    return {
      metrics: {
        totalDoctors,
        totalPatients,
        totalAppointments,
        todayAppointments
      },
      statusBreakdown: statusCounts,
      departmentStats,
      recentAppointments,
      enquiries
    };
  },

  // Health Articles
  getAllArticles: () => {
    return db.prepare('SELECT * FROM health_articles ORDER BY published_date DESC').all();
  },

  // Contact Enquiries
  submitContactEnquiry: (data) => {
    const stmt = db.prepare(`
      INSERT INTO contact_enquiries (full_name, email, phone, department_id, subject, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(data.fullName, data.email, data.phone || '', data.departmentId || '', data.subject, data.message);
    return true;
  },

  // =========================================================================
  // EMAIL VERIFICATION (OTP Security, 5-Min Expiry, 60s Resend, Attempt Limits)
  // =========================================================================
  saveOtpVerification: (email, purpose, otp) => {
    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();

    // Check rate limit: 60 seconds cooldown between OTP requests for the same email & purpose
    const existing = db.prepare(`
      SELECT * FROM email_verifications 
      WHERE email = ? AND purpose = ? AND is_verified = 0 
      ORDER BY id DESC LIMIT 1
    `).get(normalizedEmail, purpose);

    if (existing && (now - existing.last_sent_at) < 60000) {
      const waitSeconds = Math.ceil((60000 - (now - existing.last_sent_at)) / 1000);
      return {
        success: false,
        rateLimited: true,
        waitSeconds,
        error: `Please wait ${waitSeconds} seconds before requesting a new verification code.`
      };
    }

    // Hash OTP using PBKDF2/scrypt with random salt
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.scryptSync(otp.toString().trim(), salt, 32).toString('hex');
    const expiresAt = now + (5 * 60 * 1000); // 5 minutes validity

    // Invalidate prior unverified codes for this email and purpose
    db.prepare(`
      DELETE FROM email_verifications 
      WHERE email = ? AND purpose = ? AND is_verified = 0
    `).run(normalizedEmail, purpose);

    // Insert new OTP verification record
    const stmt = db.prepare(`
      INSERT INTO email_verifications (email, purpose, otp_hash, salt, expires_at, attempts, is_verified, last_sent_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?)
    `);
    stmt.run(normalizedEmail, purpose, otpHash, salt, expiresAt, now);

    return { success: true, expiresAt };
  },

  verifyOtpCode: (email, purpose, otp) => {
    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();

    const record = db.prepare(`
      SELECT * FROM email_verifications 
      WHERE email = ? AND purpose = ? AND is_verified = 0 
      ORDER BY id DESC LIMIT 1
    `).get(normalizedEmail, purpose);

    if (!record) {
      return { success: false, error: 'No active verification code found. Please request a new code.' };
    }

    if (record.attempts >= 5) {
      return { success: false, error: 'Maximum verification attempts (5) exceeded. Please request a new code.' };
    }

    // Increment attempt counter
    db.prepare('UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?').run(record.id);

    // Check expiry
    if (now > record.expires_at) {
      return { success: false, error: 'Verification code has expired (5-minute validity). Please request a new code.' };
    }

    // Verify hash timing-safe
    const testHash = crypto.scryptSync(otp.toString().trim(), record.salt, 32).toString('hex');
    const isMatch = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(record.otp_hash, 'hex'));

    if (!isMatch) {
      const remainingAttempts = Math.max(0, 4 - record.attempts);
      return { 
        success: false, 
        error: `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.` 
      };
    }

    // Successful verification - generate single-use verified token
    const verifiedToken = crypto.randomBytes(32).toString('hex');
    db.prepare(`
      UPDATE email_verifications 
      SET is_verified = 1, verified_token = ? 
      WHERE id = ?
    `).run(verifiedToken, record.id);

    return { success: true, verifiedToken };
  },

  validateAndConsumeVerifiedToken: (email, purpose, token) => {
    if (!token || typeof token !== 'string') return false;
    const normalizedEmail = email.trim().toLowerCase();

    const record = db.prepare(`
      SELECT * FROM email_verifications 
      WHERE email = ? AND purpose = ? AND verified_token = ? AND is_verified = 1
    `).get(normalizedEmail, purpose, token.trim());

    if (!record) return false;

    // Single-use: Consume and invalidate token immediately
    db.prepare('UPDATE email_verifications SET verified_token = NULL WHERE id = ?').run(record.id);
    return true;
  },

  // =========================================================================
  // GENERAL ENQUIRIES & ADMIN ACTIONS
  // =========================================================================
  createGeneralEnquiry: (data) => {
    const id = 'ENQ-' + Math.floor(100000 + Math.random() * 900000);
    const stmt = db.prepare(`
      INSERT INTO general_enquiries (id, full_name, email, phone, enquiry_category, subject, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
    `);
    stmt.run(
      id,
      data.fullName.trim(),
      data.email.trim().toLowerCase(),
      data.phone ? data.phone.trim() : '',
      data.category || 'General Enquiry',
      data.subject.trim(),
      data.message.trim()
    );

    return {
      id,
      full_name: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone ? data.phone.trim() : '',
      enquiry_category: data.category || 'General Enquiry',
      subject: data.subject.trim(),
      message: data.message.trim(),
      status: 'new',
      created_at: new Date().toISOString()
    };
  },

  getAllGeneralEnquiries: (category = null, status = null) => {
    let query = 'SELECT * FROM general_enquiries WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND enquiry_category = ?';
      params.push(category);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    return db.prepare(query).all(...params);
  },

  getGeneralEnquiryById: (id) => {
    return db.prepare('SELECT * FROM general_enquiries WHERE id = ?').get(id);
  },

  updateGeneralEnquiryStatus: (id, status, adminResponse = null) => {
    const now = new Date().toISOString();
    if (adminResponse) {
      db.prepare(`
        UPDATE general_enquiries 
        SET status = ?, admin_response = ?, responded_at = ? 
        WHERE id = ?
      `).run(status, adminResponse, now, id);
    } else {
      db.prepare(`
        UPDATE general_enquiries 
        SET status = ? 
        WHERE id = ?
      `).run(status, id);
    }
    return db.prepare('SELECT * FROM general_enquiries WHERE id = ?').get(id);
  },

  // =========================================================================
  // EMAIL DELIVERY LOGS
  // =========================================================================
  logEmailDelivery: (recipientEmail, emailType, subject, status, errorMessage = null, referenceCode = null) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO email_delivery_logs (recipient_email, email_type, subject, status, error_message, reference_code)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(recipientEmail, emailType, subject, status, errorMessage, referenceCode);
    } catch (e) {
      console.error('[Darwin DB] Failed to log email delivery:', e.message);
    }
  },

  getEmailDeliveryLogs: (limit = 50) => {
    return db.prepare(`
      SELECT * FROM email_delivery_logs 
      ORDER BY id DESC LIMIT ?
    `).all(limit);
  },

  // Admin Appointments List with search and status filtering
  getAllAppointmentsFiltered: (status = null, search = null) => {
    let query = `
      SELECT a.*, d.name as doctor_name, dept.name as department_name, d.room as doctor_room
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ' AND (a.id LIKE ? OR a.patient_name LIKE ? OR a.patient_email LIKE ? OR d.name LIKE ?)';
      params.push(term, term, term, term);
    }

    query += ' ORDER BY a.appointment_date DESC, a.time_slot ASC';
    return db.prepare(query).all(...params);
  },

  // =========================================================================
  // DIGITAL CHECK-IN & REAL-TIME QUEUE
  // =========================================================================
  checkinAppointment: (appointmentRef) => {
    const cleanRef = (appointmentRef || '').trim().toUpperCase();
    const appt = db.prepare(`
      SELECT a.*, d.name as doctor_name, d.room as doctor_room, dept.name as department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE a.id = ?
    `).get(cleanRef);

    if (!appt) {
      throw new Error(`Appointment reference "${cleanRef}" not found. Please double-check your booking reference.`);
    }

    if (appt.status === 'cancelled') {
      throw new Error(`Appointment ${cleanRef} has been cancelled. Please book a new consultation.`);
    }

    // Check if already checked in
    const existing = db.prepare('SELECT * FROM checkins WHERE appointment_id = ?').get(cleanRef);
    if (existing) {
      return {
        alreadyCheckedIn: true,
        queueNumber: existing.queue_number,
        status: existing.status,
        estimatedWaitMins: existing.estimated_wait_mins,
        room: existing.room,
        doctorName: appt.doctor_name,
        departmentName: appt.department_name,
        appointmentId: appt.id,
        checkedInAt: existing.checked_in_at,
        qrToken: `DCH-Q:${existing.queue_number}|REF:${appt.id}`
      };
    }

    // Calculate queue number & wait time
    const activeForDoctor = db.prepare(`
      SELECT COUNT(*) as count FROM checkins 
      WHERE doctor_id = ? AND status IN ('checked_in', 'waiting', 'in_consultation')
    `).get(appt.doctor_id).count;

    const totalCheckinsToday = db.prepare('SELECT COUNT(*) as count FROM checkins').get().count;
    const queueNumber = `Q-${String(101 + totalCheckinsToday).padStart(3, '0')}`;
    const estimatedWaitMins = activeForDoctor === 0 ? 5 : (activeForDoctor * 15);

    db.prepare(`
      INSERT INTO checkins (appointment_id, patient_id, doctor_id, department_id, queue_number, status, estimated_wait_mins, room)
      VALUES (?, ?, ?, ?, ?, 'waiting', ?, ?)
    `).run(appt.id, appt.patient_id, appt.doctor_id, appt.department_id, queueNumber, estimatedWaitMins, appt.doctor_room);

    // Update appointment status to confirmed
    db.prepare("UPDATE appointments SET status = 'confirmed' WHERE id = ?").run(appt.id);

    return {
      alreadyCheckedIn: false,
      queueNumber,
      status: 'waiting',
      estimatedWaitMins,
      room: appt.doctor_room,
      doctorName: appt.doctor_name,
      departmentName: appt.department_name,
      appointmentId: appt.id,
      checkedInAt: new Date().toISOString(),
      qrToken: `DCH-Q:${queueNumber}|REF:${appt.id}`
    };
  },

  getPublicQueueData: () => {
    // Strictly privacy-preserving: No patient names or sensitive medical issues
    return db.prepare(`
      SELECT 
        c.id,
        c.queue_number,
        c.status,
        c.estimated_wait_mins,
        c.room,
        c.checked_in_at,
        d.name as doctor_name,
        dept.name as department_name
      FROM checkins c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN departments dept ON c.department_id = dept.id
      WHERE c.status IN ('checked_in', 'waiting', 'in_consultation')
      ORDER BY 
        CASE c.status 
          WHEN 'in_consultation' THEN 1 
          WHEN 'waiting' THEN 2 
          ELSE 3 
        END,
        c.checked_in_at ASC
    `).all();
  },

  updateQueueStatus: (checkinIdOrQueueNum, newStatus) => {
    const valid = ['checked_in', 'waiting', 'in_consultation', 'completed', 'cancelled'];
    if (!valid.includes(newStatus)) {
      throw new Error(`Invalid queue status: ${newStatus}`);
    }

    const checkin = db.prepare('SELECT * FROM checkins WHERE id = ? OR queue_number = ?').get(checkinIdOrQueueNum, checkinIdOrQueueNum);
    if (!checkin) throw new Error('Queue entry not found');

    db.prepare('UPDATE checkins SET status = ? WHERE id = ?').run(newStatus, checkin.id);

    if (newStatus === 'completed') {
      db.prepare("UPDATE appointments SET status = 'completed' WHERE id = ?").run(checkin.appointment_id);
    } else if (newStatus === 'cancelled') {
      db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(checkin.appointment_id);
    }

    return db.prepare('SELECT * FROM checkins WHERE id = ?').get(checkin.id);
  },

  // =========================================================================
  // PATIENT FAMILY PROFILES
  // =========================================================================
  getPatientFamilies: (patientId) => {
    return db.prepare('SELECT * FROM patient_families WHERE patient_id = ? ORDER BY id ASC').all(patientId);
  },

  addPatientFamily: (patientId, data) => {
    if (!data.memberName || !data.relationship) {
      throw new Error('Member name and relationship are required.');
    }
    const stmt = db.prepare(`
      INSERT INTO patient_families (patient_id, member_name, relationship, dob, gender, blood_group)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      patientId,
      data.memberName.trim(),
      data.relationship.trim(),
      data.dob || '',
      data.gender || 'Not Specified',
      data.bloodGroup || 'Unknown'
    );
    return db.prepare('SELECT * FROM patient_families WHERE id = ?').get(Number(res.lastInsertRowid));
  },

  deletePatientFamily: (familyId, patientId) => {
    return db.prepare('DELETE FROM patient_families WHERE id = ? AND patient_id = ?').run(familyId, patientId);
  },

  // =========================================================================
  // PAYMENTS (STRIPE TEST-MODE / MOCK CONSULTATION PAYMENTS)
  // =========================================================================
  recordPayment: (paymentData) => {
    const payId = 'PAY-' + Math.floor(100000 + Math.random() * 900000);
    const receiptRef = 'DCH-REC-' + Math.floor(100000 + Math.random() * 900000);
    const pi = paymentData.stripePaymentIntentId || ('pi_mock_' + Math.random().toString(36).substring(2, 14));

    const stmt = db.prepare(`
      INSERT INTO payments (id, appointment_id, patient_id, amount_aud, currency, status, payment_method, stripe_payment_intent_id, receipt_ref)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      payId,
      paymentData.appointmentId,
      paymentData.patientId,
      paymentData.amountAud || 220,
      paymentData.currency || 'AUD',
      paymentData.status || 'paid',
      paymentData.paymentMethod || 'credit_card',
      pi,
      receiptRef
    );

    return db.prepare('SELECT * FROM payments WHERE id = ?').get(payId);
  },

  getPatientPayments: (patientId) => {
    return db.prepare(`
      SELECT p.*, a.appointment_date, a.time_slot, d.name as doctor_name, dept.name as department_name
      FROM payments p
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN departments dept ON a.department_id = dept.id
      WHERE p.patient_id = ?
      ORDER BY p.created_at DESC
    `).all(patientId);
  },

  refundPayment: (paymentId) => {
    db.prepare("UPDATE payments SET status = 'refunded' WHERE id = ?").run(paymentId);
    return db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  },

  // =========================================================================
  // PATIENT FEEDBACK & REVIEWS
  // =========================================================================
  submitFeedback: (data) => {
    if (!data.patientName || !data.ratingOverall) {
      throw new Error('Patient name and overall rating are required.');
    }
    const stmt = db.prepare(`
      INSERT INTO patient_feedback (appointment_id, patient_id, patient_name, doctor_id, rating_overall, rating_doctor, rating_cleanliness, comments, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')
    `);
    const res = stmt.run(
      data.appointmentId || 'DCH-PAT-' + Math.floor(1000 + Math.random() * 9000),
      data.patientId || null,
      data.patientName.trim(),
      data.doctorId || null,
      Number(data.ratingOverall) || 5,
      Number(data.ratingDoctor) || 5,
      Number(data.ratingCleanliness) || 5,
      data.comments ? data.comments.trim() : '',
    );
    return db.prepare('SELECT * FROM patient_feedback WHERE id = ?').get(Number(res.lastInsertRowid));
  },

  getPublicFeedback: (limit = 10) => {
    return db.prepare(`
      SELECT f.*, d.name as doctor_name, dept.name as department_name
      FROM patient_feedback f
      LEFT JOIN doctors d ON f.doctor_id = d.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE f.status = 'approved'
      ORDER BY f.created_at DESC LIMIT ?
    `).all(limit);
  },

  getAdminFeedback: () => {
    return db.prepare(`
      SELECT f.*, d.name as doctor_name
      FROM patient_feedback f
      LEFT JOIN doctors d ON f.doctor_id = d.id
      ORDER BY f.created_at DESC
    `).all();
  },

  updateFeedbackStatus: (id, status) => {
    db.prepare('UPDATE patient_feedback SET status = ? WHERE id = ?').run(status, id);
    return db.prepare('SELECT * FROM patient_feedback WHERE id = ?').get(id);
  },

  // =========================================================================
  // DOCTOR FAVORITES
  // =========================================================================
  toggleDoctorFavorite: (patientId, doctorId) => {
    const existing = db.prepare('SELECT id FROM doctor_favorites WHERE patient_id = ? AND doctor_id = ?').get(patientId, doctorId);
    if (existing) {
      db.prepare('DELETE FROM doctor_favorites WHERE id = ?').run(existing.id);
      return { favorited: false };
    } else {
      db.prepare('INSERT INTO doctor_favorites (patient_id, doctor_id) VALUES (?, ?)').run(patientId, doctorId);
      return { favorited: true };
    }
  },

  getDoctorFavorites: (patientId) => {
    return db.prepare('SELECT doctor_id FROM doctor_favorites WHERE patient_id = ?').all(patientId).map(r => r.doctor_id);
  },

  // =========================================================================
  // DIGITAL PATIENT ID CARD DATA
  // =========================================================================
  getDigitalPatientId: (userIdOrPatientId) => {
    let patient = db.prepare(`
      SELECT p.*, u.name, u.email, u.phone, u.created_at as member_since
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? OR p.user_id = ?
    `).get(userIdOrPatientId, userIdOrPatientId);

    if (!patient) {
      patient = db.prepare(`
        SELECT p.*, u.name, u.email, u.phone, u.created_at as member_since
        FROM patients p
        JOIN users u ON p.user_id = u.id
        LIMIT 1
      `).get();
    }

    if (!patient) return null;

    return {
      mrn: patient.mrn,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      dob: patient.dob || '1995-04-12',
      gender: patient.gender || 'Male',
      bloodGroup: patient.blood_group || 'O Positive',
      medicareNum: patient.medicare_num || '2893 48123 1',
      emergencyContactName: patient.emergency_contact_name || 'Emergency Contact',
      emergencyContactPhone: patient.emergency_contact_phone || '+61 412 000 111',
      allergies: patient.allergies || 'Penicillin (Mild)',
      memberSince: patient.member_since,
      qrPayload: `DCH-PATIENT-ID:${patient.mrn}|AUTH-TOKEN:${crypto.createHash('md5').update(patient.mrn + 'DCH2026').digest('hex').substring(0, 8)}`,
      hospitalName: 'Darwin City Hospital',
      region: 'Darwin, Northern Territory, Australia'
    };
  },

  // =========================================================================
  // SAMPLE CLINICAL REPORTS & PRESCRIPTIONS
  // =========================================================================
  getMedicalRecordById: (id) => {
    return db.prepare(`
      SELECT m.*, p.mrn, u.name as patient_name, u.email as patient_email
      FROM medical_records m
      JOIN patients p ON m.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE m.id = ?
    `).get(id);
  },

  getPrescriptionById: (id) => {
    return db.prepare(`
      SELECT rx.*, p.mrn, u.name as patient_name, u.email as patient_email, d.credentials as doctor_credentials
      FROM prescriptions rx
      JOIN patients p ON rx.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN doctors d ON rx.doctor_id = d.id
      WHERE rx.id = ?
    `).get(id);
  },

  // =========================================================================
  // AUTOMATED APPOINTMENT REMINDER SCHEDULER
  // =========================================================================
  runAppointmentReminderCheck: () => {
    const upcoming = db.prepare(`
      SELECT a.*, d.name as doctor_name, d.room as doctor_room
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.status = 'confirmed'
    `).all();

    let count = 0;
    const stmt = db.prepare('INSERT INTO reminder_logs (appointment_id, reminder_type, status) VALUES (?, ?, ?)');

    for (const appt of upcoming) {
      const alreadySent = db.prepare('SELECT id FROM reminder_logs WHERE appointment_id = ? AND reminder_type = ?').get(appt.id, '24h');
      if (!alreadySent) {
        stmt.run(appt.id, '24h', 'sent');
        count++;
      }
    }
    return { remindersProcessed: count };
  }
};

module.exports = DarwinDB;
