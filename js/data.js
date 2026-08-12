// js/data.js - Course Hierarchy, Zero Starting State & Stream Catalog

const COURSE_CATALOG = {
  "Engineering & Technology (B.Tech / BE)": {
    "Computer Science & Engineering": [
      "Object Oriented Programming with C++",
      "Data Structures & Algorithms",
      "Database Management Systems (DBMS)",
      "Operating Systems & Linux",
      "Computer Networks & Security",
      "Theory of Computation & Automata",
      "Software Engineering & Agile",
      "Artificial Intelligence & Machine Learning",
      "Web Technologies (HTML/CSS/JS/React)",
      "Cloud Computing & DevOps"
    ],
    "Mechanical Engineering": [
      "Thermodynamics & Heat Transfer",
      "Fluid Mechanics & Hydraulic Machinery",
      "Strength of Materials & Solid Mechanics",
      "Theory of Machines & Kinematics",
      "Manufacturing Processes & Workshop",
      "CAD / CAM & Machine Design",
      "Automobile Engineering",
      "Refrigeration & Air Conditioning"
    ],
    "Civil Engineering": [
      "Structural Analysis & Mechanics",
      "Concrete Technology & Design",
      "Geotechnical & Soil Mechanics",
      "Surveying & Geomatics",
      "Transportation & Highway Engineering",
      "Hydrology & Water Resource Engineering",
      "Environmental Engineering & Waste Management"
    ],
    "Electrical Engineering": [
      "Network Analysis & Circuit Theory",
      "Electrical Machines & Transformers",
      "Control Systems Engineering",
      "Power Systems Generation & Transmission",
      "Power Electronics & Drives",
      "Renewable Energy Systems",
      "Signals and Systems"
    ],
    "Electronics and Communication": [
      "Digital Electronics & Logic Design",
      "Analog Electronic Circuits",
      "Microprocessors & Microcontrollers (8051/ARM)",
      "Digital Signal Processing (DSP)",
      "VLSI Design & Embedded Systems",
      "Wireless & Mobile Communication",
      "Electromagnetic Fields & Waves"
    ]
  },
  "Science & IT (B.Sc / BCA)": {
    "Physics, Chemistry, Mathematics (PCM)": [
      "Classical & Quantum Mechanics",
      "Organic & Inorganic Chemistry",
      "Calculus & Differential Equations",
      "Optics & Electromagnetism",
      "Physical Chemistry & Thermodynamics",
      "Linear Algebra & Complex Analysis"
    ],
    "Botany and Zoology (PCB)": [
      "Plant Physiology & Morphology",
      "Cell Biology & Molecular Genetics",
      "Animal Diversity & Taxonomy",
      "Ecology & Environmental Biology",
      "Human Physiology & Endocrinology",
      "Biochemistry & Enzymology"
    ],
    "Computer Science & Information Technology": [
      "Programming in C++ and Java",
      "Web Development & Python Scripting",
      "Database Systems & SQL",
      "Data Structures & Algorithm Design",
      "Computer Architecture & OS",
      "Cybersecurity Fundamentals"
    ],
    "Statistics and Data Science": [
      "Probability Theory & Probability Distributions",
      "Statistical Inference & Hypothesis Testing",
      "Regression Analysis & Time Series",
      "R Programming & Python for Data Science",
      "Big Data Analytics & Visualization",
      "Machine Learning Fundamentals"
    ],
    "Biotechnology": [
      "Microbiology & Cell Biology",
      "Genetic Engineering & Recombinant DNA",
      "Bioprocess Engineering & Fermentation",
      "Immunology & Serology",
      "Bioinformatics & Computational Biology",
      "Plant & Animal Tissue Culture"
    ]
  },
  "Commerce & Management (B.Com / BBA)": {
    "Financial Accounting": [
      "Principles of Financial Accounting",
      "Cost & Management Accounting",
      "Advanced Corporate Accounting",
      "Auditing & Assurance Standards",
      "Financial Management & Working Capital",
      "Security Analysis & Portfolio Management"
    ],
    "Business Economics": [
      "Microeconomic Analysis & Consumer Behavior",
      "Macroeconomic Policy & Inflation",
      "Managerial Economics & Decision Making",
      "International Trade & Balance of Payments",
      "Public Finance & Fiscal Policy"
    ],
    "Corporate Tax and Law": [
      "Company Law & Corporate Governance",
      "Direct Tax & Income Tax Law",
      "Goods & Services Tax (GST) & Customs",
      "Business Law & Contract Act",
      "Industrial & Labor Law"
    ],
    "Marketing Management": [
      "Marketing Principles & 4Ps Strategy",
      "Consumer Behavior & Market Research",
      "Digital & Social Media Marketing",
      "Brand Management & Advertising",
      "Sales & Distribution Management"
    ],
    "Human Resource Management": [
      "Organizational Behavior & Dynamics",
      "Talent Acquisition & Recruitment",
      "Performance Management & Appraisal",
      "Compensation & Benefits Administration",
      "Employee Relations & Labor Welfare"
    ]
  },
  "Arts & Humanities (BA)": {
    "Psychology": [
      "General Psychology & Cognitive Processes",
      "Developmental Psychology Across Lifespan",
      "Social Psychology & Group Dynamics",
      "Abnormal & Clinical Psychology",
      "Psychological Testing & Research Methods",
      "Counseling & Psychotherapy"
    ],
    "Political Science": [
      "Political Theory & Concepts",
      "Indian Government & Constitutional Framework",
      "Comparative Politics & Systems",
      "International Relations & Global Affairs",
      "Public Administration & Governance",
      "Modern Political Thought"
    ],
    "History": [
      "Ancient Indian History & Civilizations",
      "Medieval World & Mughal Empire",
      "Modern Indian Freedom Struggle",
      "Modern World History (18th-20th Century)",
      "Historiography & Archaeological Methods"
    ],
    "Economics": [
      "Micro & Macro Economic Foundations",
      "Indian Economic Development",
      "Development Economics & Sustainability",
      "Mathematical Methods & Econometrics",
      "Money, Banking & Financial Institutions"
    ],
    "English and Regional Literatures": [
      "British Literature & Poetry",
      "American & World Literature",
      "Indian Writing in English & Regional Texts",
      "Literary Criticism & Theory",
      "Linguistics & Phonetics",
      "Creative Writing & Mass Media"
    ]
  },
  "Medical & Health Sciences (MBBS / BAMS / Nursing)": {
    "Anatomy, Physiology, and Biochemistry": [
      "Gross Anatomy & Histology",
      "General & Systemic Human Physiology",
      "Medical Biochemistry & Metabolism",
      "Embryology & Neuroanatomy"
    ],
    "Pathology and Pharmacology": [
      "General & Systemic Pathology",
      "Clinical Pharmacology & Therapeutics",
      "Medical Microbiology & Parasitology",
      "Hematology & Clinical Pathology"
    ],
    "Community Medicine": [
      "Epidemiology & Biostatistics",
      "Public Health & National Health Programs",
      "Environmental & Occupational Health",
      "Nutrition, Hygiene & Preventive Healthcare"
    ],
    "Surgery and Pediatrics": [
      "General Surgery & Operative Techniques",
      "Pediatrics & Child Health",
      "Obstetrics & Gynecology (OBG)",
      "Orthopedics, ENT & Ophthalmology",
      "General Medicine & Clinical Diagnostics"
    ]
  }
};

// Default Clean Starting Dataset
const DEFAULT_DATA = {
  profile: {
    name: "",
    email: "",
    phone: "",
    isVerified: false,
    rollNo: "",
    prn: "",
    stream: "Engineering & Technology (B.Tech / BE)",
    branch: "Computer Science & Engineering",
    course: "B.Tech in Computer Science & Engineering",
    shortCourse: "B.Tech CSE",
    semester: 1,
    college: "",
    academicYear: "2025-2026",
    cgpa: 0.00,
    creditsEarned: 0,
    totalCredits: 160,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    hostel: "",
    semGpaHistory: [],
    emergencyContacts: [],
    securityPin: "",
    isPinEnabled: false
  },

  subjects: [],

  timetable: {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  },

  assignments: [],

  exams: [],

  notes: [],

  events: [],

  notices: [],

  expenses: {
    monthlyBudget: 10000,
    currency: "₹",
    items: []
  },

  travel: [],

  calendarActivities: [
    {
      id: "act_1",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:30",
      title: "Data Structures & Algorithms Lecture",
      venue: "Lecture Hall 304 (Academic Block A)",
      venueCategory: "Classroom",
      category: "Lecture",
      completed: true,
      notes: "Topics: B-Trees and Graph DFS/BFS traversal algorithms"
    },
    {
      id: "act_2",
      date: new Date().toISOString().split("T")[0],
      startTime: "11:00",
      endTime: "12:30",
      title: "DBMS & SQL Query Optimization Lab",
      venue: "Computer Lab 2, 2nd Floor",
      venueCategory: "Lab",
      category: "Lab",
      completed: false,
      notes: "Submit Exercise 4 queries on subqueries and triggers"
    },
    {
      id: "act_3",
      date: new Date().toISOString().split("T")[0],
      startTime: "13:00",
      endTime: "14:00",
      title: "Lunch with Batchmates & Project Discussion",
      venue: "Central Student Canteen / Food Court",
      venueCategory: "Food",
      category: "Food",
      completed: false,
      notes: "Discuss frontend UI designs for capstone project"
    },
    {
      id: "act_4",
      date: new Date().toISOString().split("T")[0],
      startTime: "15:00",
      endTime: "17:00",
      title: "Self Study & Research Paper Reading",
      venue: "Central University Library, Quiet Zone 3rd Floor",
      venueCategory: "Library",
      category: "Study",
      completed: false,
      notes: "Prepare notes for next week's OS mid-term exam"
    },
    {
      id: "act_5",
      date: new Date().toISOString().split("T")[0],
      startTime: "18:00",
      endTime: "19:30",
      title: "Evening Workout & Badminton Match",
      venue: "Campus Sports Complex / Gymnasium",
      venueCategory: "Sports",
      category: "Fitness",
      completed: false,
      notes: "Cardio and badminton practice match"
    }
  ],

  gamification: {
    xp: 480,
    level: 3,
    title: "Curious Scholar",
    streak: 5,
    lastStudyDate: new Date().toISOString().split("T")[0],
    weeklyStudyDays: [true, true, true, false, true, true, false]
  },

  dashboardWidgets: {
    todayHub: true,
    gamification: true,
    timetable: true,
    attendance: true,
    exams: true,
    assignments: true,
    expenses: true,
    travel: true,
    notes: true
  },

  studyLogs: [
    {
      id: "log_1",
      date: new Date().toISOString().split("T")[0],
      subject: "Data Structures",
      durationMins: 45,
      xpEarned: 40,
      notes: "Binary Search Trees & AVL rotations"
    }
  ]
};

