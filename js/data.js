/**
 * Darwin City Hospital — Clinical & Hospital Datasets
 * Fictional Australian Healthcare Web Platform & Educational Portfolio Project
 * Location: Darwin, Northern Territory, Australia
 * Emergency: 000 | Non-Emergency: (08) 8999 0000 | Timezone: ACST (UTC+9:30)
 */

const HOSPITAL_DATA = {
  info: {
    name: "Darwin City Hospital",
    shortName: "Darwin City Hospital",
    tagline: "Your Health, Our Priority.",
    location: "Darwin, Northern Territory, Australia",
    emergencyPhone: "000",
    generalPhone: "(08) 8999 0000",
    ambulanceHotline: "000",
    email: "care@darwinhospital.gov.au",
    address: "Rocklands Drive, Tiwi NT 0810, Darwin Australia",
    hours: "Emergency & Trauma: 24/7/365 | Outpatient Clinics: Mon-Sat 8:00 AM - 6:00 PM (ACST)",
    accreditations: [
      "ACHS Accredited (Demonstration)",
      "NSQHS Standards Compliant (Demo)",
      "Level 1 Trauma Center NT",
      "Australian Clinical Governance Framework"
    ],
    disclaimer: "Darwin City Hospital is a fictional healthcare platform created for educational and professional portfolio demonstration purposes. In a medical emergency in Australia, immediately dial 000."
  },

  // Emergency Department Live Indicators
  erStatus: {
    waitMinutes: 9,
    triageLevel: "Level 1 Active",
    traumaBaysAvailable: 5,
    traumaBaysTotal: 18,
    dutyPhysicians: 8,
    lastUpdated: "Just now"
  },

  // Hospital Key Metrics & Live Bed Capacity
  bedOccupancy: {
    icu: { total: 32, occupied: 24, available: 8, cleaning: 0 },
    trauma: { total: 18, occupied: 12, available: 5, cleaning: 1 },
    maternity: { total: 36, occupied: 27, available: 8, cleaning: 1 },
    pediatric: { total: 30, occupied: 22, available: 7, cleaning: 1 },
    generalWard: { total: 240, occupied: 198, available: 38, cleaning: 4 },
    operatingTheaters: { total: 12, active: 8, onStandby: 3, maintenance: 1 },
    bloodBank: [
      { type: "O+", status: "Adequate", units: 135, level: "green" },
      { type: "O-", status: "Critical", units: 14, level: "red" },
      { type: "A+", status: "Adequate", units: 105, level: "green" },
      { type: "A-", status: "Moderate", units: 28, level: "amber" },
      { type: "B+", status: "Adequate", units: 92, level: "green" },
      { type: "B-", status: "Moderate", units: 22, level: "amber" },
      { type: "AB+", status: "Adequate", units: 54, level: "green" },
      { type: "AB-", status: "Critical", units: 11, level: "red" }
    ]
  },

  // 14 Clinical Departments
  departments: [
    {
      id: "cardiology",
      name: "Cardiology & Heart Health",
      shortName: "Cardiology",
      icon: "heart-pulse",
      color: "blue",
      head: "Dr. Sarah Jenkins, MBBS, FRACP, FCSANZ",
      room: "Wing A, Level 3, Suite 304",
      hours: "Mon - Fri: 8:00 AM - 6:00 PM (Emergency 24/7)",
      description: "Advanced cardiac catheterization laboratory, 24/7 primary angioplasty, pacemaker clinic, and specialized cardiovascular rehabilitation.",
      treatments: [
        "Coronary Angiography & Stenting",
        "Echocardiography (TTE & TOE)",
        "Cardiac Electrophysiology",
        "Heart Failure Management",
        "Cardiovascular Rehabilitation"
      ],
      stats: { patientsPerYear: "14,800+", successRate: "99.3%", specialists: 18 }
    },
    {
      id: "neurology",
      name: "Neurology & Stroke Unit",
      shortName: "Neurology",
      icon: "brain",
      color: "indigo",
      head: "Dr. Alexander Vance, MD, PhD, FRACP",
      room: "Wing B, Level 4, Suite 412",
      hours: "Mon - Fri: 8:30 AM - 5:30 PM",
      description: "Dedicated acute stroke protocol, rapid neuro-thrombectomy, epilepsy continuous EEG monitoring, and specialized headache & neuromuscular clinics.",
      treatments: [
        "Acute Stroke Thrombolysis Protocol",
        "EEG & Evoked Potentials",
        "Parkinson & Movement Disorder Clinic",
        "Neuro-Immunology & MS Therapy",
        "Neuropathy & EMG Studies"
      ],
      stats: { patientsPerYear: "9,600+", successRate: "98.8%", specialists: 14 }
    },
    {
      id: "orthopaedics",
      name: "Orthopaedics & Joint Surgery",
      shortName: "Orthopaedics",
      icon: "bone",
      color: "emerald",
      head: "Dr. Marcus Brody, MBBS, MS Orth, FRACS",
      room: "Wing C, Level 2, Suite 210",
      hours: "Mon - Fri: 8:00 AM - 5:00 PM",
      description: "Mako robotic-arm assisted total knee and hip arthroplasty, sports arthroscopy, spine decompression, and complex pelvic trauma reconstruction.",
      treatments: [
        "Total Hip & Knee Replacements",
        "Shoulder & Knee Arthroscopy",
        "Complex Fracture Reconstruction",
        "ACL & Ligament Repairs",
        "Spine & Decompression Surgery"
      ],
      stats: { patientsPerYear: "12,400+", successRate: "99.5%", specialists: 16 }
    },
    {
      id: "paediatrics",
      name: "Paediatrics & Child Health",
      shortName: "Paediatrics",
      icon: "baby",
      color: "amber",
      head: "Dr. Emily Watson, MBChB, FRACP Paed",
      room: "Wing D, Level 1, Suite 105",
      hours: "Mon - Sat: 8:30 AM - 6:00 PM",
      description: "Comprehensive medical and developmental care for infants, children, and adolescents, featuring family-centred inpatient wards and Level IV NICU integration.",
      treatments: [
        "General Paediatric Consultations",
        "Neonatal Health Checks",
        "Paediatric Asthma & Allergy Care",
        "Developmental Milestone Assessments",
        "Childhood Immunisation Program"
      ],
      stats: { patientsPerYear: "16,500+", successRate: "99.8%", specialists: 20 }
    },
    {
      id: "general-medicine",
      name: "General & Internal Medicine",
      shortName: "General Medicine",
      icon: "stethoscope",
      color: "teal",
      head: "Dr. David K. Chen, MBBS, FRACP, FACP",
      room: "Wing A, Level 1, Suite 102",
      hours: "Mon - Fri: 8:00 AM - 6:00 PM | Sat: 9:00 AM - 1:00 PM",
      description: "Expert holistic diagnosis and management of chronic multimorbidities, diabetes, lipid disorders, hypertension, and perioperative care.",
      treatments: [
        "Comprehensive Health Assessments",
        "Chronic Disease Management",
        "Type 1 & 2 Diabetes Clinic",
        "Hypertension & Lipid Optimization",
        "Pre-operative Medical Clearance"
      ],
      stats: { patientsPerYear: "24,000+", successRate: "99.1%", specialists: 22 }
    },
    {
      id: "emergency",
      name: "Emergency Medicine & Trauma",
      shortName: "Emergency Care",
      icon: "shield-alert",
      color: "red",
      head: "Dr. Rachel Green, MBBS, FACEM",
      room: "Ground Floor, Emergency Entrance",
      hours: "Open 24 Hours / 365 Days",
      description: "24/7 Level-1 accredited trauma facility equipped with rapid resuscitation bays, heliport trauma reception, and dedicated pediatric triage.",
      treatments: [
        "Advanced Trauma Resuscitation",
        "Acute Coronary & Stroke Care",
        "Emergency Toxicology & Envenomation",
        "Minor Injury Assessment & Suture",
        "24/7 Heliport Trauma Transfer"
      ],
      stats: { patientsPerYear: "48,500+", successRate: "98.9%", specialists: 28 }
    },
    {
      id: "maternity",
      name: "Maternity & Women’s Health",
      shortName: "Maternity & Ob/Gyn",
      icon: "flower",
      color: "pink",
      head: "Dr. Olivia Taylor, MBBS, FRANZCOG",
      room: "Wing B, Level 2, Suite 220",
      hours: "Mon - Fri: 8:00 AM - 5:00 PM (Delivery Suite 24/7)",
      description: "Family-focused maternity care, private birthing suites, specialized antenatal monitoring, water birth facilities, and advanced minimally invasive gynaecology.",
      treatments: [
        "Antenatal & Postnatal Care",
        "Private Labour & Delivery Suites",
        "Special Care Baby Unit (SCBU)",
        "Minimally Invasive Gynaecology",
        "Fertility & Reproductive Health"
      ],
      stats: { patientsPerYear: "11,800+", successRate: "99.7%", specialists: 16 }
    },
    {
      id: "dermatology",
      name: "Dermatology & Skin Cancer",
      shortName: "Dermatology",
      icon: "sparkles",
      color: "amber",
      head: "Dr. James Wilson, MBBS, FACD",
      room: "Wing C, Level 3, Suite 315",
      hours: "Mon - Fri: 8:30 AM - 5:00 PM",
      description: "Specialized in tropical climate skin conditions, full-body digital mole mapping, Mohs micrographic surgery, and targeted psoriasis biologic therapies.",
      treatments: [
        "Full-Body Digital Mole Mapping",
        "Melanoma & Non-Melanoma Surgery",
        "Mohs Micrographic Surgery",
        "Phototherapy & Biologics for Psoriasis",
        "Acne & Inflammatory Dermatoses"
      ],
      stats: { patientsPerYear: "8,900+", successRate: "99.4%", specialists: 10 }
    },
    {
      id: "radiology",
      name: "Radiology & Diagnostic Imaging",
      shortName: "Radiology",
      icon: "scan",
      color: "cyan",
      head: "Dr. Kevin Patel, MBBS, FRANZCR",
      room: "Ground Floor, Imaging Wing",
      hours: "Mon - Sun: 7:30 AM - 8:00 PM (Emergency 24/7)",
      description: "Equipped with 3T MRI, 128-slice dual-source CT, 3D mammography, ultrasound doppler, and subspecialist interventional radiology services.",
      treatments: [
        "3T Magnetic Resonance Imaging (MRI)",
        "128-Slice Low-Dose CT Scanning",
        "Digital Diagnostic Ultrasound & Doppler",
        "EOS Low-Dose Full Body X-Ray",
        "Image-Guided Biopsies & Injections"
      ],
      stats: { patientsPerYear: "64,000+", successRate: "99.9%", specialists: 18 }
    },
    {
      id: "oncology",
      name: "Oncology & Cancer Care",
      shortName: "Oncology",
      icon: "ribbon",
      color: "rose",
      head: "Dr. Meera Nambiar, MBBS, MD, FRACP Onc",
      room: "Wing D, Level 3, Cancer Care Center",
      hours: "Mon - Fri: 8:00 AM - 5:00 PM",
      description: "State-of-the-art day infusion pavilion, targeted immunotherapies, precision oncology sequencing, and holistic cancer support services.",
      treatments: [
        "Targeted Chemotherapy & Immunotherapy",
        "Personalised Precision Genomics",
        "Haematological Malignancy Care",
        "Oncology Clinical Trials Access",
        "Comprehensive Palliative & Supportive Care"
      ],
      stats: { patientsPerYear: "8,400+", successRate: "97.2%", specialists: 15 }
    },
    {
      id: "physiotherapy",
      name: "Physiotherapy & Rehabilitation",
      shortName: "Physiotherapy",
      icon: "activity",
      color: "emerald",
      head: "Liam O’Connor, B.Physio, APAM",
      room: "Rehabilitation Pavilion, Ground Floor",
      hours: "Mon - Fri: 7:30 AM - 6:30 PM | Sat: 8:00 AM - 12:00 PM",
      description: "Advanced hydrotherapy pool, active gym recovery, post-surgical mobility restoration, vestibular rehab, and sports performance optimization.",
      treatments: [
        "Post-Surgical Joint Rehabilitation",
        "Clinical Hydrotherapy Pool Sessions",
        "Spinal Manual Therapy & Pilates",
        "Neurological Stroke Rehabilitation",
        "Sports Injury Assessment & Return to Sport"
      ],
      stats: { patientsPerYear: "15,200+", successRate: "99.0%", specialists: 12 }
    },
    {
      id: "mental-health",
      name: "Mental Health & Wellbeing",
      shortName: "Mental Health",
      icon: "smile",
      color: "purple",
      head: "Dr. Hannah Scott, MBBS, FRANZCP",
      room: "Wellness Pavilion, Level 2",
      hours: "Mon - Fri: 8:30 AM - 5:30 PM",
      description: "Evidence-based adult psychiatric evaluations, individual and group psychotherapy, mood and anxiety disorders, and occupational trauma support.",
      treatments: [
        "Adult Psychiatric Consultations",
        "Cognitive Behavioural Therapy (CBT)",
        "Mood & Anxiety Disorder Management",
        "PTSD & Trauma Recovery Programs",
        "Mindfulness & Stress Resilience Groups"
      ],
      stats: { patientsPerYear: "7,900+", successRate: "96.5%", specialists: 14 }
    },
    {
      id: "dental",
      name: "Dental & Maxillofacial Care",
      shortName: "Dental Care",
      icon: "smile-plus",
      color: "sky",
      head: "Dr. Anthony Ross, BDS, MBBS, FRACDS",
      room: "Wing C, Level 1, Suite 112",
      hours: "Mon - Fri: 8:00 AM - 5:30 PM | Sat: 9:00 AM - 2:00 PM",
      description: "Hospital-grade oral surgery, surgical wisdom tooth removal under sedation, titanium implants, dental trauma reconstruction, and routine preventive care.",
      treatments: [
        "Wisdom Teeth Surgical Extraction",
        "Dental Implants & Bone Grafting",
        "Facial Trauma & Fracture Fixation",
        "Endodontic Root Canal Therapy",
        "Preventative Scaling & Cosmetic Dental"
      ],
      stats: { patientsPerYear: "9,100+", successRate: "99.2%", specialists: 11 }
    },
    {
      id: "pathology",
      name: "Pathology & Clinical Laboratory",
      shortName: "Pathology",
      icon: "flask-conical",
      color: "indigo",
      head: "Dr. Fiona Stewart, MBBS, FRCPA",
      room: "Central Laboratory, Level 1",
      hours: "Collection: Mon - Sat 7:00 AM - 6:00 PM (Testing 24/7)",
      description: "NATA-accredited automated pathology laboratory delivering rapid haematology, biochemistry, surgical histology, cytology, and 24/7 blood banking.",
      treatments: [
        "Routine & Stat Blood Analysis",
        "Microbiology Culture & Sensitivities",
        "Histopathology & Biopsy Examination",
        "Molecular PCR Diagnostic Testing",
        "Transfusion & Blood Group Crossmatching"
      ],
      stats: { patientsPerYear: "92,000+", successRate: "99.9%", specialists: 22 }
    }
  ],

  // 15 Specialist Doctors
  doctors: [
    {
      id: "doc-jenkins",
      name: "Dr. Sarah Jenkins",
      credentials: "MBBS (Hons), FRACP, FCSANZ, FACC",
      title: "Senior Consultant Cardiologist & Head of Heart Center",
      departmentId: "cardiology",
      departmentName: "Cardiology & Heart Health",
      experience: "16 Years",
      experienceYears: 16,
      rating: 4.98,
      reviewsCount: 312,
      fee: 220,
      languages: ["English", "French"],
      education: "University of Melbourne | Harvard Medical School Fellowship",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Jenkins trained at Royal Melbourne Hospital and Harvard before relocating to Darwin. She specializes in transcatheter heart interventions and complex arrhythmia ablation, championing cardiac health outcomes across regional Northern Territory.",
      room: "Wing A, Level 3, Suite 304",
      nextAvailable: "Today at 2:30 PM",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      timeSlots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "01:30 PM", "02:30 PM", "03:30 PM", "04:00 PM"]
    },
    {
      id: "doc-vance",
      name: "Dr. Alexander Vance",
      credentials: "MD, PhD, FRACP (Neuro)",
      title: "Consultant Neurologist & Director of Acute Stroke Unit",
      departmentId: "neurology",
      departmentName: "Neurology & Stroke Unit",
      experience: "19 Years",
      experienceYears: 19,
      rating: 4.96,
      reviewsCount: 284,
      fee: 240,
      languages: ["English", "German"],
      education: "University of Sydney | Queen Square Institute of Neurology London",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
      bio: "With extensive fellowship training at Queen Square in London, Dr. Vance has pioneered rapid telemedicine stroke response in regional and remote Australian communities.",
      room: "Wing B, Level 4, Suite 412",
      nextAvailable: "Tomorrow at 10:00 AM",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Friday"],
      timeSlots: ["10:00 AM", "10:30 AM", "11:30 AM", "02:00 PM", "03:00 PM"]
    },
    {
      id: "doc-brody",
      name: "Dr. Marcus Brody",
      credentials: "MBBS, MS Orth, FRACS (Orth), FAOA",
      title: "Head of Orthopaedic Surgery & Trauma Director",
      departmentId: "orthopaedics",
      departmentName: "Orthopaedics & Joint Surgery",
      experience: "14 Years",
      experienceYears: 14,
      rating: 4.95,
      reviewsCount: 395,
      fee: 250,
      languages: ["English"],
      education: "University of Queensland | Mayo Clinic Joint Fellow",
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Brody is a leading Australian orthopaedic surgeon specializing in Mako robotic total joint replacement and reconstruction of high-velocity sports and trauma injuries.",
      room: "Wing C, Level 2, Suite 210",
      nextAvailable: "Today at 3:30 PM",
      availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
      timeSlots: ["09:00 AM", "10:30 AM", "01:30 PM", "03:30 PM"]
    },
    {
      id: "doc-watson",
      name: "Dr. Emily Watson",
      credentials: "MBChB (Otago), FRACP (Paed), DCH",
      title: "Senior Specialist Paediatrician & Neonatologist",
      departmentId: "paediatrics",
      departmentName: "Paediatrics & Child Health",
      experience: "12 Years",
      experienceYears: 12,
      rating: 4.99,
      reviewsCount: 460,
      fee: 195,
      languages: ["English", "Spanish"],
      education: "University of Otago | Sydney Children's Hospital at Westmead",
      avatar: "https://images.unsplash.com/photo-1594824813567-33671a53f0f6?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Watson brings a warm, gentle and family-oriented approach to caring for infants, children, and adolescents, with specialized expertise in complex respiratory conditions.",
      room: "Wing D, Level 1, Suite 105",
      nextAvailable: "Tomorrow at 9:00 AM",
      availableDays: ["Monday", "Wednesday", "Thursday", "Saturday"],
      timeSlots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:30 PM"]
    },
    {
      id: "doc-chen",
      name: "Dr. David K. Chen",
      credentials: "MBBS (Syd), FRACP, FACP",
      title: "Head of Internal Medicine & Clinical Governance",
      departmentId: "general-medicine",
      departmentName: "General & Internal Medicine",
      experience: "22 Years",
      experienceYears: 22,
      rating: 4.97,
      reviewsCount: 520,
      fee: 180,
      languages: ["English", "Mandarin", "Cantonese"],
      education: "University of Sydney | Royal Prince Alfred Hospital",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",
      bio: "A revered diagnostician with over two decades of clinical experience, Dr. Chen oversees adult inpatient medicine and specializes in multisystem endocrine and autoimmune disorders.",
      room: "Wing A, Level 1, Suite 102",
      nextAvailable: "Today at 1:30 PM",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      timeSlots: ["09:30 AM", "11:00 AM", "01:30 PM", "02:30 PM", "04:00 PM"]
    },
    {
      id: "doc-green",
      name: "Dr. Rachel Green",
      credentials: "MBBS, FACEM, Dip. Tropical Med",
      title: "Director of Emergency Medicine & Trauma Lead",
      departmentId: "emergency",
      departmentName: "Emergency Medicine & Trauma",
      experience: "11 Years",
      experienceYears: 11,
      rating: 4.94,
      reviewsCount: 380,
      fee: 210,
      languages: ["English"],
      education: "Monash University | Alfred Health Trauma Fellowship",
      avatar: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Green directs the 24/7 Emergency and Trauma Centre. She has published widely on tropical envenomation protocols and coordinates regional mass casualty triage.",
      room: "Ground Floor, Emergency Clinical Station",
      nextAvailable: "Walk-in 24/7 Triage",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      timeSlots: ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM"]
    },
    {
      id: "doc-taylor",
      name: "Dr. Olivia Taylor",
      credentials: "MBBS (Monash), FRANZCOG, CMFM",
      title: "Consultant Obstetrician & Gynaecological Surgeon",
      departmentId: "maternity",
      departmentName: "Maternity & Women’s Health",
      experience: "15 Years",
      experienceYears: 15,
      rating: 4.98,
      reviewsCount: 410,
      fee: 230,
      languages: ["English"],
      education: "Monash University | Royal Women's Hospital Melbourne",
      avatar: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Taylor provides personalized, supportive pregnancy care alongside laparoscopic surgical management for endometriosis and uterine conditions.",
      room: "Wing B, Level 2, Suite 220",
      nextAvailable: "Tomorrow at 11:00 AM",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Friday"],
      timeSlots: ["09:30 AM", "11:00 AM", "01:30 PM", "03:00 PM"]
    },
    {
      id: "doc-wilson",
      name: "Dr. James Wilson",
      credentials: "MBBS, FACD, International Mohs Fellow",
      title: "Consultant Dermatologist & Mohs Surgeon",
      departmentId: "dermatology",
      departmentName: "Dermatology & Skin Cancer",
      experience: "13 Years",
      experienceYears: 13,
      rating: 4.95,
      reviewsCount: 340,
      fee: 210,
      languages: ["English"],
      education: "University of Adelaide | Royal North Shore Hospital",
      avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80",
      bio: "Specializing in the early detection and precision surgical excision of aggressive melanoma under Australia's intense UV indices, using computerized digital dermatoscopy.",
      room: "Wing C, Level 3, Suite 315",
      nextAvailable: "Wednesday at 10:30 AM",
      availableDays: ["Monday", "Wednesday", "Thursday", "Friday"],
      timeSlots: ["09:00 AM", "10:30 AM", "01:30 PM", "03:00 PM", "04:00 PM"]
    },
    {
      id: "doc-patel",
      name: "Dr. Kevin Patel",
      credentials: "MBBS, FRANZCR, EBIR",
      title: "Director of Diagnostic & Interventional Radiology",
      departmentId: "radiology",
      departmentName: "Radiology & Diagnostic Imaging",
      experience: "17 Years",
      experienceYears: 17,
      rating: 4.96,
      reviewsCount: 290,
      fee: 225,
      languages: ["English", "Hindi", "Gujarati"],
      education: "University of Western Australia | Princess Alexandra Hospital",
      avatar: "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&w=400&q=80",
      bio: "Specialist in minimally invasive vascular interventions, CT fluoroscopy-guided biopsies, and advanced multiparametric MRI diagnostics.",
      room: "Ground Floor, Imaging Wing Radiology Control",
      nextAvailable: "Today at 4:00 PM",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      timeSlots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"]
    },
    {
      id: "doc-nambiar",
      name: "Dr. Meera Nambiar",
      credentials: "MBBS, MD (Med), FRACP (Medical Oncology)",
      title: "Senior Medical Oncologist & Clinical Research Lead",
      departmentId: "oncology",
      departmentName: "Oncology & Cancer Care",
      experience: "14 Years",
      experienceYears: 14,
      rating: 4.99,
      reviewsCount: 375,
      fee: 260,
      languages: ["English", "Malayalam", "Hindi"],
      education: "Christian Medical College | Peter MacCallum Cancer Centre",
      avatar: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=400&q=80",
      bio: "Dedicated to precision cancer therapy, genomic oncology profiling, and novel immunotherapies, Dr. Nambiar delivers empathetic, evidence-based care.",
      room: "Wing D, Level 3, Suite 330",
      nextAvailable: "Thursday at 1:30 PM",
      availableDays: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      timeSlots: ["10:00 AM", "11:30 AM", "01:30 PM", "03:00 PM"]
    },
    {
      id: "doc-oconnor",
      name: "Liam O’Connor",
      credentials: "B.Physio (Hons, UQ), M.MuscPhysio, APAM",
      title: "Head of Physical Rehabilitation & Sports Physiotherapy",
      departmentId: "physiotherapy",
      departmentName: "Physiotherapy & Rehabilitation",
      experience: "9 Years",
      experienceYears: 9,
      rating: 4.97,
      reviewsCount: 420,
      fee: 140,
      languages: ["English"],
      education: "University of Queensland | Australian Institute of Sport",
      avatar: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80",
      bio: "With extensive sports performance and hospital rehabilitation background, Liam accelerates functional return after joint surgery and acute sports injuries.",
      room: "Rehabilitation Pavilion, Consulting Room 1",
      nextAvailable: "Today at 3:00 PM",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      timeSlots: ["08:30 AM", "10:00 AM", "11:30 AM", "01:30 PM", "03:00 PM", "04:30 PM"]
    },
    {
      id: "doc-scott",
      name: "Dr. Hannah Scott",
      credentials: "MBBS, FRANZCP, Cert. Psychotherapy",
      title: "Consultant Adult Psychiatrist & Psychotherapist",
      departmentId: "mental-health",
      departmentName: "Mental Health & Wellbeing",
      experience: "16 Years",
      experienceYears: 16,
      rating: 4.95,
      reviewsCount: 260,
      fee: 240,
      languages: ["English"],
      education: "University of New South Wales | St Vincent's Hospital Sydney",
      avatar: "https://images.unsplash.com/photo-1594824813680-32dfcce03978?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Scott provides collaborative psychiatric evaluations and therapeutic care, working closely with allied health professionals to support sustained mental wellbeing.",
      room: "Wellness Pavilion, Suite 204",
      nextAvailable: "Friday at 10:00 AM",
      availableDays: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      timeSlots: ["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM"]
    },
    {
      id: "doc-ross",
      name: "Dr. Anthony Ross",
      credentials: "BDS (Adel), MBBS, FRACDS (OMS)",
      title: "Oral & Maxillofacial Surgeon",
      departmentId: "dental",
      departmentName: "Dental & Maxillofacial Care",
      experience: "12 Years",
      experienceYears: 12,
      rating: 4.96,
      reviewsCount: 310,
      fee: 190,
      languages: ["English", "Italian"],
      education: "University of Adelaide | Royal Melbourne Hospital OMS",
      avatar: "https://images.unsplash.com/photo-1622253694242-abdfa58f4a18?auto=format&fit=crop&w=400&q=80",
      bio: "Dually qualified in medicine and dentistry, Dr. Ross performs wisdom tooth removal, facial trauma repair, and restorative implant surgery in sterile operating suites.",
      room: "Wing C, Level 1, Suite 112",
      nextAvailable: "Tomorrow at 2:00 PM",
      availableDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
      timeSlots: ["09:00 AM", "10:30 AM", "02:00 PM", "03:30 PM"]
    },
    {
      id: "doc-stewart",
      name: "Dr. Fiona Stewart",
      credentials: "MBBS, FRCPA, FIAC",
      title: "Clinical Director of Anatomical Pathology & Cytology",
      departmentId: "pathology",
      departmentName: "Pathology & Clinical Laboratory",
      experience: "18 Years",
      experienceYears: 18,
      rating: 4.98,
      reviewsCount: 215,
      fee: 175,
      languages: ["English"],
      education: "University of Western Australia | PathWest",
      avatar: "https://images.unsplash.com/photo-1559839734-66a982998a44?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Stewart oversees the NATA-accredited diagnostic laboratory, delivering rapid, pinpoint histopathologic and molecular reports for oncology and surgical teams.",
      room: "Central Laboratory, Director Suite",
      nextAvailable: "Collection Hours Mon-Sat",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      timeSlots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"]
    },
    {
      id: "doc-blake",
      name: "Dr. Nathan Blake",
      credentials: "MBBS, FANZCA, FCICM",
      title: "Senior Specialist Intensivist & Clinical Anaesthetist",
      departmentId: "emergency",
      departmentName: "Emergency Medicine & Trauma",
      experience: "15 Years",
      experienceYears: 15,
      rating: 4.97,
      reviewsCount: 290,
      fee: 235,
      languages: ["English"],
      education: "University of Queensland | Royal Brisbane and Women's Hospital",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",
      bio: "Dr. Blake directs the 32-bed Intensive Care Unit (ICU) and coordinates surgical anaesthesia for high-risk trauma and emergency operative cases.",
      room: "Intensive Care Unit, Consultant Station",
      nextAvailable: "ICU On-Duty 24/7",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      timeSlots: ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM"]
    }
  ],

  // Hospital Statistics (for animated homepage counters)
  statistics: {
    yearsExperience: 48,
    specialistDoctors: 180,
    hospitalBeds: 520,
    clinicalDepartments: 14,
    patientsServedAnnual: "95,000+"
  },

  // Demonstration Patient Data
  demoPatient: {
    id: "pat-9021",
    mrn: "DCH-MRN-9021",
    name: "Niroj Khattri",
    email: "nirojkhattri33@gmail.com",
    phone: "+61 412 663 7298",
    dob: "1995-04-12",
    gender: "Male",
    bloodGroup: "O+",
    allergies: "Penicillin (Mild urticaria)",
    medicare: "2893 48123 1",
    emergencyContact: {
      name: "Primary Contact",
      relation: "Family",
      phone: "+61 412 000 111"
    },
    appointments: [
      {
        id: "DCH-892145",
        doctorName: "Dr. Sarah Jenkins",
        doctorSpecialty: "Cardiology",
        department: "Cardiology & Heart Health",
        date: "2026-12-04",
        time: "10:00 AM",
        status: "confirmed",
        type: "In-Person Consultation",
        location: "Wing A, Level 3, Suite 304",
        fee: 220
      },
      {
        id: "DCH-741290",
        doctorName: "Dr. David K. Chen",
        doctorSpecialty: "General Medicine",
        department: "General & Internal Medicine",
        date: "2026-12-15",
        time: "02:30 PM",
        status: "pending",
        type: "In-Person Consultation",
        location: "Wing A, Level 1, Suite 102",
        fee: 180
      },
      {
        id: "DCH-618402",
        doctorName: "Dr. James Wilson",
        doctorSpecialty: "Dermatology",
        department: "Dermatology & Skin Cancer",
        date: "2026-11-10",
        time: "11:00 AM",
        status: "completed",
        type: "In-Person Consultation",
        location: "Wing C, Level 3, Suite 315",
        fee: 210
      }
    ],
    labReports: [
      {
        id: "DCH-ECG-112026",
        testName: "12-Lead Resting Electrocardiogram (ECG)",
        category: "Cardiology",
        date: "2026-11-10",
        doctor: "Dr. Sarah Jenkins",
        status: "Final Validated",
        results: [
          { parameter: "Heart Rate", value: "68 bpm", refRange: "60 - 100 bpm", status: "normal" },
          { parameter: "PR Interval", value: "158 ms", refRange: "120 - 200 ms", status: "normal" },
          { parameter: "QRS Duration", value: "88 ms", refRange: "80 - 120 ms", status: "normal" },
          { parameter: "QTc Interval", value: "412 ms", refRange: "< 440 ms", status: "normal" }
        ],
        notes: "Normal sinus rhythm. No acute ischaemic ST-T segment abnormalities detected."
      },
      {
        id: "DCH-PATH-88910",
        testName: "Comprehensive Metabolic & Lipid Panel",
        category: "Pathology",
        date: "2026-11-08",
        doctor: "Dr. Fiona Stewart",
        status: "Final Validated",
        results: [
          { parameter: "Fasting Serum Glucose", value: "5.1 mmol/L", refRange: "3.9 - 6.0 mmol/L", status: "normal" },
          { parameter: "Total Cholesterol", value: "4.6 mmol/L", refRange: "< 5.2 mmol/L", status: "normal" },
          { parameter: "HDL 'Good' Cholesterol", value: "1.4 mmol/L", refRange: "> 1.0 mmol/L", status: "normal" },
          { parameter: "LDL 'Bad' Cholesterol", value: "2.7 mmol/L", refRange: "< 3.0 mmol/L", status: "normal" },
          { parameter: "Serum Creatinine", value: "78 umol/L", refRange: "60 - 110 umol/L", status: "normal" },
          { parameter: "Estimated GFR", value: "> 90 mL/min/1.73m²", refRange: "> 60 mL/min", status: "normal" }
        ],
        notes: "Lipid, renal, and glycemic parameters are within recommended reference thresholds."
      }
    ],
    prescriptions: [
      {
        id: "DCH-RX-5501",
        medication: "Rosuvastatin Calcium",
        dosage: "10 mg Oral Tablet",
        frequency: "Once Daily with Evening Meal",
        prescribedBy: "Dr. Sarah Jenkins",
        prescribedDate: "2026-11-10",
        refillsRemaining: 3,
        status: "Active",
        pharmacyInstructions: "Dispense PBS item. Take consistently in the evening."
      },
      {
        id: "DCH-RX-4210",
        medication: "Cholecalciferol (Vitamin D3)",
        dosage: "1,000 IU Softgel",
        frequency: "Once Daily with Food",
        prescribedBy: "Dr. David K. Chen",
        prescribedDate: "2026-11-08",
        refillsRemaining: 2,
        status: "Active",
        pharmacyInstructions: "Maintain regular daily supplementation."
      }
    ]
  },

  // Patient Testimonials (Fictional demonstration feedback)
  testimonials: [
    {
      id: "test-1",
      patientName: "Eleanor Vance",
      age: 62,
      location: "Fannie Bay, Darwin",
      procedure: "Robotic Knee Replacement",
      doctor: "Dr. Marcus Brody",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      quote: "After years of worsening osteoarthritis, Dr. Brody performed Mako robotic joint replacement at Darwin City Hospital. The physiotherapy team had me walking comfortably in two weeks. Outstanding care right here in Darwin."
    },
    {
      id: "test-2",
      patientName: "Marcus Sterling",
      age: 51,
      location: "Nightcliff, Darwin",
      procedure: "Emergency Cardiac Intervention",
      doctor: "Dr. Sarah Jenkins",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      quote: "When I had sudden chest pain, St John Ambulance brought me directly to Darwin City Hospital's trauma bay. Dr. Jenkins and her catheter team were waiting and placed two stents immediately. Truly saved my life."
    },
    {
      id: "test-3",
      patientName: "Chloe & Liam Nguyen",
      age: 32,
      location: "Casuarina, Darwin",
      procedure: "Maternity & Special Care Nursery",
      doctor: "Dr. Olivia Taylor & Dr. Emily Watson",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      quote: "Our baby daughter arrived four weeks early. The maternity birthing suites and special care nursery provided compassionate, round-the-clock monitoring. We are forever grateful to the amazing nursing staff."
    }
  ],

  // Demonstration Health News Articles
  articles: [
    {
      id: "art-1",
      slug: "sun-safety-melanoma-detection-darwin",
      title: "Sun Safety & Early Melanoma Detection in Australia’s Top End",
      category: "Dermatology",
      author: "Dr. James Wilson, MBBS, FACD",
      authorTitle: "Consultant Dermatologist",
      date: "Nov 15, 2026",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
      excerpt: "Living in Darwin means year-round extreme UV exposure. Learn the ABCDE rules of melanoma detection and essential prevention habits."
    },
    {
      id: "art-2",
      slug: "understanding-stroke-fast-protocol",
      title: "Understanding Acute Stroke: Act F.A.S.T. Every Second Counts",
      category: "Neurology",
      author: "Dr. Alexander Vance, MD, PhD, FRACP",
      authorTitle: "Director of Acute Stroke Unit",
      date: "Nov 12, 2026",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
      excerpt: "Rapid recognition of stroke symptoms saves brain tissue and lives. Understand the F.A.S.T. signs and when to immediately call 000."
    },
    {
      id: "art-3",
      slug: "heart-health-fundamentals-prevention",
      title: "Heart Health Fundamentals: Blood Pressure, Lipids and Diet",
      category: "Cardiology",
      author: "Dr. Sarah Jenkins, MBBS, FRACP",
      authorTitle: "Senior Consultant Cardiologist",
      date: "Nov 05, 2026",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
      excerpt: "Cardiovascular disease remains Australia's leading health burden. Discover actionable lifestyle and clinical steps to protect your heart."
    }
  ],

  // Frequently Asked Questions
  faqs: [
    {
      q: "How do I book an appointment with a Darwin City Hospital specialist?",
      a: "You can book directly through our 7-step online booking portal on this website. Simply select your medical department, preferred specialist, date, and available time slot. You can also contact our outpatient reception on (08) 8999 0000."
    },
    {
      q: "What should I do in a medical emergency?",
      a: "In a medical emergency in Australia, immediately dial 000 for ambulance dispatch. Our Emergency Medicine & Level-1 Trauma Centre at Rocklands Drive is open 24 hours a day, 365 days a year with direct ambulance and helipad access."
    },
    {
      q: "What health funds and Medicare billing does the hospital accept?",
      a: "Darwin City Hospital accepts Medicare cards, Australian Veterans' Affairs (DVA), and all major Australian private health funds (Medibank, Bupa, HCF, NIB, Australian Unity, Teachers Health, etc.). Bulk-billing applies to eligible public outpatient consultations."
    },
    {
      q: "Can I view my pathology and radiology results online?",
      a: "Yes! Registered patients can sign in to the secure Patient Portal to view and print verified pathology lab results, resting ECG summaries, radiology reports, and active e-prescriptions."
    },
    {
      q: "What are the hospital visiting hours?",
      a: "General Inpatient Wards: 10:00 AM – 8:00 PM daily. Intensive Care Unit (ICU): 11:00 AM – 1:00 PM and 5:00 PM – 7:00 PM. Maternity Birthing Suites are open 24 hours for nominated primary birth partners."
    }
  ]
};

// Export for browser and node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HOSPITAL_DATA;
} else if (typeof window !== 'undefined') {
  window.HOSPITAL_DATA = HOSPITAL_DATA;
}
