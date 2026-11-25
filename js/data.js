/**
 * AuraHealth International Hospital Portal
 * Clinical & Hospital Datasets
 */

const HOSPITAL_DATA = {
  info: {
    name: "AuraHealth International Hospital & Research Center",
    tagline: "Advancing Medicine. Healing with Compassion.",
    emergencyPhone: "+1 (800) 911-AURA",
    generalPhone: "+1 (800) 555-CARE",
    ambulanceHotline: "+1 (800) 911-2872",
    email: "care@aurahealth.org",
    address: "742 Medical Center Boulevard, Metro Health District, NY 10024",
    hours: "Emergency & Trauma: 24/7/365 | Outpatient Clinics: Mon-Sat 7:30 AM - 8:00 PM",
    accreditations: ["JCI Accredited", "ISO 9001:2015", "Magnet Nursing Recognized", "Level 1 Trauma Center", "HIPAA Compliant"]
  },

  // Emergency Department Live Statistics
  erStatus: {
    waitMinutes: 11,
    triageLevel: "Level 1 Active",
    traumaBaysAvailable: 4,
    traumaBaysTotal: 12,
    dutyPhysicians: 6,
    lastUpdated: "Just now"
  },

  // Bed Availability Tracker (Real-time Operations)
  bedOccupancy: {
    icu: { total: 32, occupied: 26, available: 6, cleaning: 0 },
    trauma: { total: 16, occupied: 11, available: 4, cleaning: 1 },
    maternity: { total: 40, occupied: 31, available: 8, cleaning: 1 },
    pediatric: { total: 28, occupied: 20, available: 7, cleaning: 1 },
    generalWard: { total: 220, occupied: 182, available: 34, cleaning: 4 },
    operatingTheaters: { total: 14, active: 9, onStandby: 4, maintenance: 1 },
    bloodBank: [
      { type: "O+", status: "Adequate", units: 142, level: "green" },
      { type: "O-", status: "Critical", units: 18, level: "red" },
      { type: "A+", status: "Adequate", units: 110, level: "green" },
      { type: "A-", status: "Moderate", units: 34, level: "amber" },
      { type: "B+", status: "Adequate", units: 95, level: "green" },
      { type: "B-", status: "Moderate", units: 26, level: "amber" },
      { type: "AB+", status: "Adequate", units: 58, level: "green" },
      { type: "AB-", status: "Critical", units: 12, level: "red" }
    ]
  },

  // Clinical Departments
  departments: [
    {
      id: "cardiology",
      name: "Cardiovascular Sciences & Heart Institute",
      shortName: "Cardiology",
      icon: "heart-pulse",
      color: "blue",
      head: "Dr. Sarah Jenkins, MD, FACC",
      description: "State-of-the-art interventional cardiology, robotic heart valve repair, cardiac electrophysiology, and 24/7 primary angioplasty emergency response.",
      treatments: [
        "Cardiac Catheterization & Stenting",
        "Coronary Artery Bypass (CABG)",
        "Heart Failure & Transplant Cardiology",
        "Arrhythmia & Pacemaker Implantation",
        "Pediatric Cardiology & Congenital Heart Care"
      ],
      stats: { patientsPerYear: "14,500+", successRate: "99.2%", specialists: 18 }
    },
    {
      id: "neurology",
      name: "Neurosciences & Stroke Institute",
      shortName: "Neurology",
      icon: "brain",
      color: "indigo",
      head: "Dr. David K. Chen, MD, PhD, FAAN",
      description: "Comprehensive care for neurological conditions, acute stroke intervention, neuro-oncology, deep brain stimulation (DBS), and minimally invasive neurosurgery.",
      treatments: [
        "Rapid Endovascular Stroke Thrombolysis",
        "Complex Brain & Skull Base Tumors",
        "Epilepsy Monitoring & Resection",
        "Parkinson's & Movement Disorders",
        "Spine & Peripheral Nerve Decompression"
      ],
      stats: { patientsPerYear: "9,800+", successRate: "98.7%", specialists: 14 }
    },
    {
      id: "orthopedics",
      name: "Orthopedics & Joint Reconstruction",
      shortName: "Orthopedics",
      icon: "bone",
      color: "emerald",
      head: "Dr. Michael Ross, MD, FAAOS",
      description: "World-renowned orthopedic specialists utilizing Mako robotic-arm assisted joint replacements, sports injury arthroscopy, and complex trauma reconstruction.",
      treatments: [
        "Robotic Total Hip & Knee Replacement",
        "Arthroscopic ACL & Rotator Cuff Repair",
        "Minimally Invasive Spine Surgery",
        "Pediatric Orthopedics & Scoliosis",
        "Sports Medicine & Cartilage Restoration"
      ],
      stats: { patientsPerYear: "12,200+", successRate: "99.4%", specialists: 16 }
    },
    {
      id: "oncology",
      name: "Comprehensive Cancer Center",
      shortName: "Oncology",
      icon: "ribbon",
      color: "rose",
      head: "Dr. Aisha Patel, MD, FASCO",
      description: "Cutting-edge cancer therapies including personalized genomic sequencing, CAR-T cell immunotherapy, stereotactic radiation (CyberKnife), and surgical oncology.",
      treatments: [
        "Targeted Chemotherapy & Immunotherapy",
        "Stereotactic Body Radiotherapy (SBRT)",
        "Surgical Oncology & Tumor Resection",
        "Hematologic Malignancy & Bone Marrow",
        "Palliative Care & Integrative Oncology"
      ],
      stats: { patientsPerYear: "8,600+", successRate: "96.8%", specialists: 15 }
    },
    {
      id: "pediatrics",
      name: "Pediatrics & Neonatal Intensive Care",
      shortName: "Pediatrics",
      icon: "baby",
      color: "amber",
      head: "Dr. Emily Rodriguez, MD, FAAP",
      description: "Compassionate child-centered healthcare from newborn care to adolescence, featuring Level-IV Neonatal ICU (NICU) and specialized pediatric surgery suites.",
      treatments: [
        "Level IV Neonatal Intensive Care",
        "Pediatric Emergency & Trauma Unit",
        "Congenital Anomaly Repair",
        "Pediatric Asthma & Allergy Clinic",
        "Child Development & Behavioral Health"
      ],
      stats: { patientsPerYear: "16,000+", successRate: "99.8%", specialists: 22 }
    },
    {
      id: "emergency",
      name: "Level 1 Trauma & Emergency Medicine",
      shortName: "Emergency Care",
      icon: "siren",
      color: "red",
      head: "Dr. Marcus Vance, MD, FACEP",
      description: "24/7 dedicated trauma surgeons, critical care specialists, high-speed resuscitation bays, heliport facility, and rapid-response cardiac and stroke teams.",
      treatments: [
        "Resuscitation & Multi-Trauma Stabilization",
        "Emergency Cardiac Intervention (Cath Lab)",
        "Severe Burn & Toxicological Management",
        "Pediatric Trauma Emergencies",
        "Mass Casualty & Disaster Preparedness"
      ],
      stats: { patientsPerYear: "48,000+", successRate: "98.9%", specialists: 28 }
    },
    {
      id: "maternity",
      name: "Obstetrics, Gynecology & Women's Health",
      shortName: "Maternity & Ob/Gyn",
      icon: "user-heart",
      color: "pink",
      head: "Dr. Elena Rostova, MD, FACOG",
      description: "Comprehensive prenatal care, luxury LDRP (Labor, Delivery, Recovery, Postpartum) birthing suites, fetal medicine, and advanced gynecologic robotics.",
      treatments: [
        "Painless Natural & Gentle Cesarean Delivery",
        "High-Risk Maternal-Fetal Medicine",
        "Robotic Hysterectomy & Myomectomy",
        "Fertility Assessment & Assisted IVF Care",
        "Menopause & Gynecologic Endocrinology"
      ],
      stats: { patientsPerYear: "11,400+", successRate: "99.7%", specialists: 16 }
    },
    {
      id: "radiology",
      name: "Advanced Diagnostic Radiology & Imaging",
      shortName: "Radiology",
      icon: "scan",
      color: "cyan",
      head: "Dr. Robert Sterling, MD, FACR",
      description: "Next-generation diagnostic imaging powered by AI triage: 3 Tesla MRI, 256-Slice Dual-Source CT, PET-CT oncology imaging, and digital 3D mammography.",
      treatments: [
        "3T High-Resolution MRI Scans",
        "Ultra-Low-Dose 256-Slice CT Scans",
        "Digital 3D Tomosynthesis Mammography",
        "Interventional Radiology & Guided Biopsies",
        "Nuclear Medicine & PET-CT Scans"
      ],
      stats: { patientsPerYear: "65,000+", successRate: "99.9%", specialists: 20 }
    }
  ],

  // Specialists & Doctors
  doctors: [
    {
      id: "doc-1",
      name: "Dr. Sarah Jenkins",
      credentials: "MD, FACC, FSCAI",
      title: "Chief of Cardiovascular Sciences",
      departmentId: "cardiology",
      departmentName: "Cardiovascular Sciences",
      experience: "21 Years",
      rating: 4.98,
      reviewsCount: 428,
      fee: 180,
      languages: ["English", "Spanish"],
      education: "Harvard Medical School | Johns Hopkins Fellowship",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Jenkins is an internationally acclaimed interventional cardiologist specializing in complex coronary angioplasty, transcatheter aortic valve replacement (TAVR), and preventive cardiovascular health.",
      nextAvailable: "Today at 2:30 PM",
      availableDays: ["Monday", "Wednesday", "Thursday", "Friday"],
      timeSlots: ["09:00 AM", "10:30 AM", "01:30 PM", "02:30 PM", "04:00 PM"]
    },
    {
      id: "doc-2",
      name: "Dr. David K. Chen",
      credentials: "MD, PhD, FAAN",
      title: "Head of Neurosciences Institute",
      departmentId: "neurology",
      departmentName: "Neurosciences & Stroke",
      experience: "19 Years",
      rating: 4.95,
      reviewsCount: 382,
      fee: 200,
      languages: ["English", "Mandarin"],
      education: "Stanford University School of Medicine | UCSF Neurology",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Chen is a leading neurologist and neuroscientist known for breakthrough protocols in acute ischemic stroke reversal, epilepsy management, and deep brain stimulation for Parkinson's disease.",
      nextAvailable: "Tomorrow at 10:00 AM",
      availableDays: ["Tuesday", "Wednesday", "Friday"],
      timeSlots: ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM"]
    },
    {
      id: "doc-3",
      name: "Dr. Michael Ross",
      credentials: "MD, FAAOS",
      title: "Director of Robotic Joint Reconstruction",
      departmentId: "orthopedics",
      departmentName: "Orthopedics & Joint Care",
      experience: "16 Years",
      rating: 4.96,
      reviewsCount: 512,
      fee: 175,
      languages: ["English"],
      education: "Columbia University Vagelos College of Physicians and Surgeons | Mayo Clinic Fellowship",
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80",
      bio: "Specializing in Mako robotic-assisted total hip and knee arthroplasty, Dr. Ross has performed over 3,500 successful joint procedures with accelerated recovery protocols.",
      nextAvailable: "Today at 4:15 PM",
      availableDays: ["Monday", "Tuesday", "Thursday"],
      timeSlots: ["09:30 AM", "11:00 AM", "02:30 PM", "04:15 PM"]
    },
    {
      id: "doc-4",
      name: "Dr. Aisha Patel",
      credentials: "MD, FASCO",
      title: "Chair of Medical Oncology",
      departmentId: "oncology",
      departmentName: "Comprehensive Cancer Center",
      experience: "18 Years",
      rating: 4.99,
      reviewsCount: 310,
      fee: 210,
      languages: ["English", "Hindi", "Urdu"],
      education: "Oxford University Medical School | Memorial Sloan Kettering",
      avatar: "https://images.unsplash.com/photo-1594824813568-7c8585e8d530?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Patel leads clinical trials in targeted gene therapies and immunotherapies, delivering compassionate, precision-tailored oncology treatment regimens.",
      nextAvailable: "Thursday at 11:00 AM",
      availableDays: ["Tuesday", "Thursday", "Saturday"],
      timeSlots: ["10:00 AM", "11:00 AM", "01:00 PM", "03:00 PM"]
    },
    {
      id: "doc-5",
      name: "Dr. Emily Rodriguez",
      credentials: "MD, FAAP",
      title: "Chief of Pediatric Medicine & NICU",
      departmentId: "pediatrics",
      departmentName: "Pediatrics & Child Health",
      experience: "15 Years",
      rating: 4.97,
      reviewsCount: 640,
      fee: 140,
      languages: ["English", "Spanish"],
      education: "Yale School of Medicine | Boston Children's Hospital",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
      bio: "Beloved by children and parents alike, Dr. Rodriguez specializes in pediatric acute care, developmental milestones, adolescent wellness, and neonatal critical care.",
      nextAvailable: "Today at 1:00 PM",
      availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
      timeSlots: ["08:30 AM", "10:00 AM", "01:00 PM", "02:30 PM", "04:00 PM"]
    },
    {
      id: "doc-6",
      name: "Dr. Elena Rostova",
      credentials: "MD, FACOG",
      title: "Director of Obstetrics & Maternal-Fetal Medicine",
      departmentId: "maternity",
      departmentName: "Obstetrics & Gynecology",
      experience: "17 Years",
      rating: 4.94,
      reviewsCount: 489,
      fee: 165,
      languages: ["English", "Russian", "French"],
      education: "University of Pennsylvania Perelman School of Medicine",
      avatar: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80",
      bio: "Expert in natural physiological births, high-risk twin and triplet pregnancies, minimally invasive gynecologic surgery, and prenatal ultrasound diagnostics.",
      nextAvailable: "Tomorrow at 2:00 PM",
      availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
      timeSlots: ["09:00 AM", "11:00 AM", "02:00 PM", "03:30 PM"]
    },
    {
      id: "doc-7",
      name: "Dr. Marcus Vance",
      credentials: "MD, FACEP",
      title: "Medical Director of Emergency Services",
      departmentId: "emergency",
      departmentName: "Emergency & Trauma Medicine",
      experience: "22 Years",
      rating: 4.93,
      reviewsCount: 520,
      fee: 190,
      languages: ["English"],
      education: "Georgetown University School of Medicine | Bellevue Emergency Trauma",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",
      bio: "Overseeing AuraHealth's Level 1 Trauma Center, Dr. Vance is an expert in rapid trauma resuscitation, cardiac arrest protocols, and disaster medical operations.",
      nextAvailable: "Available On-Duty 24/7",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      timeSlots: ["Emergency Direct Triage"]
    },
    {
      id: "doc-8",
      name: "Dr. Robert Sterling",
      credentials: "MD, FACR",
      title: "Chief of Diagnostic & Interventional Radiology",
      departmentId: "radiology",
      departmentName: "Radiology & Imaging",
      experience: "20 Years",
      rating: 4.91,
      reviewsCount: 295,
      fee: 150,
      languages: ["English", "German"],
      education: "University of Chicago Pritzker School of Medicine",
      avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80",
      bio: "Pioneer in AI-assisted radiological diagnosis, low-radiation vascular angiography, musculoskeletal MRI interpretation, and image-guided tumor ablations.",
      nextAvailable: "Tomorrow at 9:00 AM",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      timeSlots: ["09:00 AM", "10:30 AM", "01:30 PM", "03:00 PM"]
    }
  ],

  // Diagnostic Health Packages
  healthPackages: [
    {
      id: "pkg-exec",
      name: "Executive Whole-Body Health Screen",
      category: "Comprehensive Screening",
      price: 299,
      originalPrice: 450,
      tag: "Most Popular",
      recommendedFor: "Men & Women aged 30+",
      duration: "3-4 Hours (Includes Breakfast)",
      testsCount: "72 Clinical Parameters",
      testsList: [
        "Complete Hemogram & ESR (24 Parameters)",
        "Comprehensive Metabolic & Liver Function Panel (LFT)",
        "Advanced Lipid & Cardiovascular Risk Profile",
        "Kidney Function Panel (BUN, Creatinine, Electrolytes)",
        "Fasting Blood Sugar & Glycated Hemoglobin (HbA1c)",
        "Thyroid Profile (Free T3, Free T4, TSH)",
        "High-Resolution Chest Digital X-Ray",
        "12-Lead Resting Digital Electrocardiogram (ECG)",
        "Whole Abdomen & Pelvis Ultrasonography",
        "Complete Urine Routine & Microscopy",
        "Physician Consultation & Lifestyle Counseling"
      ]
    },
    {
      id: "pkg-cardiac",
      name: "Advanced Cardiac Wellness & Heart Shield",
      category: "Heart & Vascular",
      price: 199,
      originalPrice: 320,
      tag: "Cardiology Center",
      recommendedFor: "Individuals with family history of heart disease, hypertension, or high cholesterol",
      duration: "2-3 Hours",
      testsCount: "48 Parameters",
      testsList: [
        "Cardiology Specialist Consultation",
        "12-Lead Electrocardiogram (ECG)",
        "2D Color Doppler Echocardiogram (ECHO)",
        "Treadmill Stress Test (TMT / Exercise Stress)",
        "High-Sensitivity C-Reactive Protein (hs-CRP)",
        "Lipid Panel (Total Cholesterol, HDL, LDL, VLDL, Triglycerides)",
        "Serum Homocysteine & Apo-B",
        "Serum Electrolytes & Creatinine"
      ]
    },
    {
      id: "pkg-women",
      name: "Women's Wellness & Cancer Prevention",
      category: "Women's Health",
      price: 249,
      originalPrice: 380,
      tag: "Preventive Care",
      recommendedFor: "Women of all ages (breast & cervical cancer screening)",
      duration: "2.5 Hours",
      testsCount: "55 Parameters",
      testsList: [
        "Gynecologist Consultation & Breast Exam",
        "Digital 3D Tomosynthesis Mammography or Breast Ultrasound",
        "Liquid-Based Pap Smear with High-Risk HPV DNA screening",
        "Thyroid Panel (TSH, FT3, FT4)",
        "Vitamin D3 & Vitamin B12 Levels",
        "Bone Mineral Density (DEXA) Scan",
        "Complete Blood Count & Iron Studies",
        "Pelvic Ultrasound (Transvaginal / Abdominal)"
      ]
    },
    {
      id: "pkg-senior",
      name: "Senior Citizen Longevity & Mobility Panel",
      category: "Geriatric Health",
      price: 219,
      originalPrice: 340,
      tag: "Ages 55+",
      recommendedFor: "Older adults seeking comprehensive vital organ and joint assessment",
      duration: "2-3 Hours",
      testsCount: "60 Parameters",
      testsList: [
        "Geriatrician Full Health Evaluation",
        "Comprehensive Joint & Arthritis Assessment",
        "HbA1c & Fasting Insulin Resistance",
        "Kidney & Liver Function Panels",
        "Serum Uric Acid & Calcium",
        "Prostate Specific Antigen (PSA) for Men / Bone Density for Women",
        "Resting ECG & Chest X-Ray",
        "Audiometry & Vision Acuity Screen"
      ]
    },
    {
      id: "pkg-diabetes",
      name: "Diabetes Care & Endocrine Comprehensive",
      category: "Metabolic Health",
      price: 129,
      originalPrice: 195,
      tag: "Chronic Care",
      recommendedFor: "Diabetic or pre-diabetic patients",
      duration: "1.5 Hours",
      testsCount: "35 Parameters",
      testsList: [
        "Fasting & Post-Prandial Plasma Glucose",
        "HbA1c (Average 3-Month Glucose)",
        "Microalbuminuria Urine Screening",
        "Complete Lipid Profile",
        "Diabetic Foot Neuropathy Examination",
        "Dilated Fundus Retinal Eye Exam",
        "Dietitian Nutritionist Consultation"
      ]
    }
  ],

  // Diagnostic Tests Catalog
  diagnosticTests: [
    { id: "test-cbc", name: "Complete Blood Count (CBC) with Differential", category: "Hematology", price: 35, turnaround: "2 Hours", fasting: "No" },
    { id: "test-lipid", name: "Comprehensive Lipid Profile", category: "Biochemistry", price: 45, turnaround: "4 Hours", fasting: "Yes (10-12 hrs)" },
    { id: "test-hba1c", name: "Glycated Hemoglobin (HbA1c)", category: "Biochemistry", price: 40, turnaround: "2 Hours", fasting: "No" },
    { id: "test-mri", name: "3T MRI Scan (Single Region with Contrast)", category: "Radiology", price: 450, turnaround: "24 Hours", fasting: "Yes (4 hrs)" },
    { id: "test-ct", name: "256-Slice Low-Dose CT Scan", category: "Radiology", price: 350, turnaround: "12 Hours", fasting: "Yes (4 hrs)" },
    { id: "test-echo", name: "2D Color Doppler Echocardiogram", category: "Cardiology", price: 120, turnaround: "Immediate", fasting: "No" },
    { id: "test-thyroid", name: "Complete Thyroid Panel (TSH, FT3, FT4)", category: "Endocrinology", price: 55, turnaround: "4 Hours", fasting: "Yes" },
    { id: "test-xray", name: "Digital Chest X-Ray (PA & Lateral)", category: "Radiology", price: 50, turnaround: "30 Mins", fasting: "No" }
  ],

  // Symptom Checker & Triage Engine
  symptomChecker: [
    {
      id: "symp-chest-pain",
      name: "Chest Pain / Pressure / Tightness",
      category: "Cardiovascular / Thoracic",
      isCritical: true,
      questions: [
        { q: "Does the pain radiate to your left arm, jaw, neck, or back?", weight: 5 },
        { q: "Is the chest pain accompanied by cold sweats or dizziness?", weight: 5 },
        { q: "Are you feeling acute shortness of breath?", weight: 4 }
      ],
      recommendation: {
        critical: {
          level: "CRITICAL_EMERGENCY",
          title: "🚨 Immediate Emergency Care Required",
          badge: "Life-Threatening Risk",
          advice: "Your symptoms indicate a possible acute cardiac event (such as a myocardial infarction or angina). Do not attempt to drive yourself. Call 911 or dispatch an AuraHealth Emergency Ambulance immediately.",
          action: "dispatch_ambulance",
          phone: "+1 (800) 911-AURA"
        },
        moderate: {
          level: "URGENT_EVALUATION",
          title: "⚠️ Urgent Cardiology Evaluation Recommended",
          badge: "Urgent Care Needed",
          advice: "Non-radiating chest discomfort warrants immediate same-day evaluation by our on-duty cardiology team.",
          action: "book_cardiology",
          department: "cardiology"
        }
      }
    },
    {
      id: "symp-headache",
      name: "Severe Headache / Migraine / Neurological",
      category: "Neurology",
      isCritical: false,
      questions: [
        { q: "Did this headache come on suddenly like a 'thunderclap'?", weight: 5 },
        { q: "Do you have sudden weakness or numbness in one side of your face or body?", weight: 5 },
        { q: "Are you experiencing difficulty speaking, slurred words, or vision loss?", weight: 5 }
      ],
      recommendation: {
        critical: {
          level: "CRITICAL_EMERGENCY",
          title: "🚨 Possible Acute Stroke / Neurological Emergency",
          badge: "Time-Sensitive Neuro Emergency",
          advice: "Sudden severe thunderclap headache with focal weakness or speech changes requires immediate Level-1 Stroke Evaluation. FAST protocol applies.",
          action: "dispatch_ambulance",
          phone: "+1 (800) 911-AURA"
        },
        moderate: {
          level: "SPECIALIST_CONSULTATION",
          title: "🩺 Neurologist Consultation Recommended",
          badge: "Specialist Care",
          advice: "Recurrent or persistent headaches without acute paralysis can be evaluated by our Neurosciences team.",
          action: "book_neurology",
          department: "neurology"
        }
      }
    },
    {
      id: "symp-fever",
      name: "High Fever / Infection / Chills",
      category: "General Medicine / Infectious Disease",
      isCritical: false,
      questions: [
        { q: "Is your temperature above 103°F (39.4°C) or not responding to medication?", weight: 3 },
        { q: "Do you have stiff neck, confusion, or difficulty staying awake?", weight: 5 },
        { q: "Have you had this fever for more than 3 consecutive days?", weight: 3 }
      ],
      recommendation: {
        critical: {
          level: "URGENT_EVALUATION",
          title: "⚠️ Urgent Medical Evaluation Required",
          badge: "High Risk Infection",
          advice: "High fever accompanied by severe lethargy or neck stiffness requires immediate urgent care evaluation for possible meningitis or severe infection.",
          action: "book_emergency",
          department: "emergency"
        },
        moderate: {
          level: "TELEHEALTH_OR_OPD",
          title: "💻 Telehealth or General Consultation",
          badge: "Primary Care",
          advice: "Mild to moderate fever can be safely reviewed via an AuraHealth Telehealth Video Consultation or outpatient visit.",
          action: "book_telehealth",
          department: "pediatrics"
        }
      }
    },
    {
      id: "symp-joint",
      name: "Joint Pain / Acute Swelling / Bone Injury",
      category: "Orthopedics & Rheumatology",
      isCritical: false,
      questions: [
        { q: "Did the injury occur during a fall or sports accident with immediate inability to bear weight?", weight: 4 },
        { q: "Is there visible deformity, open wound, or extreme joint swelling?", weight: 4 },
        { q: "Is the joint hot to touch, red, and accompanied by fever?", weight: 3 }
      ],
      recommendation: {
        critical: {
          level: "URGENT_EVALUATION",
          title: "🦴 Orthopedic Trauma / Urgent Care Recommended",
          badge: "Fracture / Ligament Risk",
          advice: "Inability to bear weight with acute deformity requires immediate digital X-Ray and orthopedic stabilization.",
          action: "book_orthopedics",
          department: "orthopedics"
        },
        moderate: {
          level: "SPECIALIST_CONSULTATION",
          title: "👨‍⚕️ Orthopedic Specialist Appointment",
          badge: "Joint & Spine Clinic",
          advice: "Chronic joint stiffness or repetitive strain injury can be evaluated with our robotic joint and sports medicine team.",
          action: "book_orthopedics",
          department: "orthopedics"
        }
      }
    },
    {
      id: "symp-breathing",
      name: "Shortness of Breath / Wheezing / Asthma",
      category: "Pulmonology & Respiratory",
      isCritical: true,
      questions: [
        { q: "Are you struggling to complete full sentences without gasping for air?", weight: 5 },
        { q: "Are your lips, tongue, or fingertips appearing bluish or pale?", weight: 5 },
        { q: "Is your oxygen saturation below 92% on a pulse oximeter?", weight: 5 }
      ],
      recommendation: {
        critical: {
          level: "CRITICAL_EMERGENCY",
          title: "🚨 Respiratory Distress Alert",
          badge: "Emergency Oxygen / Airway",
          advice: "Severe breathlessness with cyanosis (blue lips) or low SpO2 is an acute medical emergency. Dispatch ambulance immediately.",
          action: "dispatch_ambulance",
          phone: "+1 (800) 911-AURA"
        },
        moderate: {
          level: "URGENT_EVALUATION",
          title: "💨 Urgent Pulmonology / Respiratory Consultation",
          badge: "Urgent Clinic",
          advice: "Persistent wheezing or mild asthma flare-up should be evaluated promptly by a respiratory physician.",
          action: "book_emergency",
          department: "cardiology"
        }
      }
    }
  ],

  // Mock Patient Data for the Patient Portal
  patientPortal: {
    profile: {
      id: "AH-PT-98042",
      name: "Alexander Vance",
      dob: "1984-06-14",
      age: 42,
      gender: "Male",
      bloodGroup: "O+",
      allergies: ["Penicillin", "Sulfa drugs"],
      primaryPhysician: "Dr. Sarah Jenkins (Cardiology)",
      insurance: {
        provider: "BlueCross BlueShield Premier",
        policyNumber: "BCBS-9948201-P",
        groupNumber: "GRP-0824",
        status: "Active & Verified",
        copay: "$25 Specialist / $150 Emergency"
      }
    },
    appointments: [
      {
        id: "APPT-2026-9041",
        doctorName: "Dr. Sarah Jenkins",
        doctorTitle: "Chief of Cardiovascular Sciences",
        department: "Cardiology",
        date: "2026-11-28",
        time: "10:30 AM",
        type: "In-Person Clinic Visit",
        room: "Cardiology Suite, Wing B, Level 3",
        status: "Confirmed",
        fee: 180,
        paid: true,
        notes: "Routine 6-month post-stent cardiac ultrasound follow-up."
      },
      {
        id: "APPT-2026-8812",
        doctorName: "Dr. Robert Sterling",
        doctorTitle: "Chief of Radiology & Imaging",
        department: "Radiology",
        date: "2026-12-05",
        time: "02:00 PM",
        type: "Diagnostic Scan (3T MRI)",
        room: "Radiology Imaging Pavilion, Level B1",
        status: "Scheduled",
        fee: 450,
        paid: false,
        notes: "Contrast Lumbar Spine MRI evaluation."
      }
    ],
    history: [
      {
        id: "APPT-2026-7104",
        doctorName: "Dr. Sarah Jenkins",
        department: "Cardiology",
        date: "2026-05-18",
        time: "09:00 AM",
        type: "In-Person",
        status: "Completed",
        summary: "Patient reported mild exertional fatigue. ECG within normal limits. Blood pressure 124/82 mmHg. Refilled Atorvastatin 20mg."
      },
      {
        id: "APPT-2025-6022",
        doctorName: "Dr. Michael Ross",
        department: "Orthopedics",
        date: "2025-11-04",
        time: "03:30 PM",
        type: "In-Person",
        status: "Completed",
        summary: "Left knee minor meniscus strain diagnosed via ultrasound. Prescribed 6 sessions of physical therapy. Full recovery noted."
      }
    ],
    labReports: [
      {
        id: "LAB-2026-10492",
        testName: "Comprehensive Metabolic & Lipid Panel",
        category: "Biochemistry & Hematology",
        date: "2026-11-12",
        doctor: "Dr. Sarah Jenkins",
        status: "Final Validated",
        results: [
          { parameter: "Fasting Blood Glucose", value: "94 mg/dL", refRange: "70 - 99 mg/dL", status: "normal" },
          { parameter: "Glycated Hemoglobin (HbA1c)", value: "5.4 %", refRange: "4.0 - 5.6 %", status: "normal" },
          { parameter: "Total Cholesterol", value: "178 mg/dL", refRange: "< 200 mg/dL", status: "normal" },
          { parameter: "HDL 'Good' Cholesterol", value: "58 mg/dL", refRange: "> 45 mg/dL", status: "normal" },
          { parameter: "LDL 'Bad' Cholesterol", value: "98 mg/dL", refRange: "< 100 mg/dL", status: "normal" },
          { parameter: "Triglycerides", value: "110 mg/dL", refRange: "< 150 mg/dL", status: "normal" },
          { parameter: "Serum Creatinine", value: "0.92 mg/dL", refRange: "0.7 - 1.3 mg/dL", status: "normal" },
          { parameter: "Estimated GFR", value: "> 90 mL/min/1.73m²", refRange: "> 60 mL/min", status: "normal" },
          { parameter: "hs-CRP (Cardiac Risk Marker)", value: "1.1 mg/L", refRange: "< 1.0 - 3.0 mg/L", status: "normal" }
        ],
        notes: "All metabolic and lipid biomarkers are within target therapeutic range. Excellent cardiac risk profile on current lifestyle and medication."
      },
      {
        id: "LAB-2026-09820",
        testName: "Complete Blood Count (CBC) with Differential",
        category: "Hematology",
        date: "2026-11-12",
        doctor: "Dr. Sarah Jenkins",
        status: "Final Validated",
        results: [
          { parameter: "Hemoglobin", value: "15.2 g/dL", refRange: "13.8 - 17.2 g/dL", status: "normal" },
          { parameter: "White Blood Cells (WBC)", value: "6,400 /mcL", refRange: "4,500 - 11,000 /mcL", status: "normal" },
          { parameter: "Platelet Count", value: "245,000 /mcL", refRange: "150,000 - 450,000 /mcL", status: "normal" },
          { parameter: "Hematocrit", value: "45.1 %", refRange: "40.7 - 50.3 %", status: "normal" },
          { parameter: "Mean Corpuscular Volume (MCV)", value: "88 fL", refRange: "80 - 100 fL", status: "normal" }
        ],
        notes: "Normal red and white cell morphology. Platelet count adequate."
      }
    ],
    prescriptions: [
      {
        id: "RX-2026-5501",
        medication: "Atorvastatin Calcium",
        dosage: "20 mg Oral Tablet",
        frequency: "Once Daily at Bedtime",
        prescribedBy: "Dr. Sarah Jenkins",
        prescribedDate: "2026-05-18",
        refillsRemaining: 3,
        status: "Active",
        pharmacyInstructions: "Take with water. Avoid large quantities of grapefruit juice."
      },
      {
        id: "RX-2026-5502",
        medication: "Aspirin (Enteric Coated)",
        dosage: "81 mg Oral Tablet",
        frequency: "Once Daily with Morning Meal",
        prescribedBy: "Dr. Sarah Jenkins",
        prescribedDate: "2026-05-18",
        refillsRemaining: 2,
        status: "Active",
        pharmacyInstructions: "Cardioprotective low-dose antiplatelet therapy."
      },
      {
        id: "RX-2026-4210",
        medication: "Coenzyme Q10 (Ubiquinol)",
        dosage: "100 mg Softgel",
        frequency: "Once Daily with Food",
        prescribedBy: "Dr. Sarah Jenkins",
        prescribedDate: "2026-05-18",
        refillsRemaining: 4,
        status: "Active",
        pharmacyInstructions: "Nutritional supplement supporting cardiovascular cellular energetics."
      }
    ],
    invoices: [
      {
        id: "INV-2026-8842",
        description: "Comprehensive Outpatient Cardiac Follow-up & ECG",
        date: "2026-05-18",
        totalAmount: 260,
        insuranceCovered: 235,
        patientDue: 25,
        status: "Paid",
        paidDate: "2026-05-18"
      },
      {
        id: "INV-2026-9411",
        description: "Advanced Diagnostic Radiology (3T MRI Lumbar Spine)",
        date: "2026-11-20",
        totalAmount: 450,
        insuranceCovered: 380,
        patientDue: 70,
        status: "Pending",
        dueDate: "2026-12-05"
      }
    ]
  },

  // Patient Testimonials
  testimonials: [
    {
      id: "test-1",
      patientName: "Eleanor Vance",
      age: 64,
      procedure: "Robotic Knee Replacement",
      doctor: "Dr. Michael Ross",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      quote: "After 4 years of severe osteoarthritic knee pain, Dr. Ross performed robotic joint replacement at AuraHealth. I was walking without assistance within two weeks! The nursing staff and rehabilitation center are truly world-class."
    },
    {
      id: "test-2",
      patientName: "Marcus Sterling",
      age: 52,
      procedure: "Emergency Cardiac Angioplasty",
      doctor: "Dr. Sarah Jenkins",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      quote: "When I experienced acute chest pain at home, the AuraHealth ambulance arrived in under 7 minutes. Dr. Jenkins and the cardiac cath lab team saved my life with immediate stenting. I owe my future to AuraHealth."
    },
    {
      id: "test-3",
      patientName: "Sofia & Liam Chen",
      age: 33,
      procedure: "High-Risk Twin Delivery & Level IV NICU",
      doctor: "Dr. Elena Rostova & Dr. Emily Rodriguez",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      quote: "Our twins were born premature at 32 weeks. The neonatal intensive care unit (NICU) gave our babies 24/7 incubator care and constant monitoring. Today, our toddlers are thriving. Thank you, AuraHealth angels!"
    }
  ],

  // Health Blog Articles
  articles: [
    {
      id: "art-1",
      title: "7 Early Warning Signs of Heart Disease You Should Never Overlook",
      category: "Cardiology",
      author: "Dr. Sarah Jenkins, MD, FACC",
      date: "Nov 14, 2026",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
      excerpt: "Heart disease doesn't always begin with crushing chest pain. Discover subtle signs like unexplained fatigue, jaw tightness, and exertional breathlessness."
    },
    {
      id: "art-2",
      title: "Robotic Joint Surgery: How Millimeter Precision Speeds Recovery",
      category: "Orthopedics",
      author: "Dr. Michael Ross, MD, FAAOS",
      date: "Nov 08, 2026",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
      excerpt: "How CT-based 3D modeling and Mako robotic guidance enable personalized implant positioning with minimal soft-tissue disruption."
    },
    {
      id: "art-3",
      title: "The Ultimate Preventive Health Screening Checklist by Age Decades",
      category: "Preventive Care",
      author: "Dr. Aisha Patel, MD, FASCO",
      date: "Oct 29, 2026",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
      excerpt: "From blood panels in your 20s to colonoscopy, mammography, and DEXA bone scans in your 40s and 50s: your complete roadmap to proactive health."
    }
  ],

  // Frequently Asked Questions
  faqs: [
    {
      q: "How do I book an appointment with a specialist?",
      a: "You can book directly on our website using the 'Book Appointment' button. Select your department, preferred doctor, and available time slot. You can also call our 24/7 appointment desk at +1 (800) 555-CARE."
    },
    {
      q: "What insurance providers does AuraHealth accept?",
      a: "We accept all major national and international health insurance providers, including BlueCross BlueShield, Aetna, Cigna, Medicare, UnitedHealthcare, Humana, Kaiser Permanente, and Bupa Global. We also offer direct cashless billing for eligible plans."
    },
    {
      q: "What is your emergency room wait time policy?",
      a: "Our Level 1 Trauma Center follows the international ESI (Emergency Severity Index) triage protocol. Life-threatening emergencies (heart attack, stroke, major trauma) are attended to instantaneously. Our current average ER door-to-doctor time is ~11 minutes."
    },
    {
      q: "Can I access my lab test results and medical records online?",
      a: "Yes! Every patient receives complimentary access to the secure AuraHealth Patient Portal. You can view, download, and print official PDF lab reports, radiology imaging reports, doctor visit summaries, and active prescriptions anytime."
    },
    {
      q: "What are the hospital visiting hours?",
      a: "General Inpatient Wards: 10:00 AM – 8:00 PM daily. Intensive Care Units (ICU/CCU/NICU): 11:00 AM – 1:00 PM and 5:00 PM – 7:00 PM (restricted to immediate family). Maternity Birthing Suites: Open 24 hours for designated primary birth partners."
    }
  ]
};

// Export to window or node environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HOSPITAL_DATA;
} else if (typeof window !== 'undefined') {
  window.HOSPITAL_DATA = HOSPITAL_DATA;
}
