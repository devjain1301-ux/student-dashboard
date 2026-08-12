// js/storage.js - High-Performance IndexedDB & LocalStorage State Engine

const STORAGE_KEY = "UNISPHERE_STUDENT_DATA_V2";
const THEME_KEY = "UNISPHERE_THEME_PREFERENCE";

// High-Performance IndexedDB Storage for Large Binary PDFs and Media (Zero LocalStorage Lag/Freeze)
class IndexedDBDocStore {
  constructor(dbName = "CollegeDashboardPDFs_v1", storeName = "documents") {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
    this.memoryFallback = new Map();
    this.initPromise = this.init();
  }

  async init() {
    if (typeof indexedDB === "undefined") {
      console.warn("IndexedDB not supported; using memory fallback for PDF files.");
      return null;
    }
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: "id" });
          }
        };
        req.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(this.db);
        };
        req.onerror = () => {
          console.warn("IndexedDB open error; falling back to memory store");
          resolve(null);
        };
      } catch (err) {
        console.warn("IndexedDB initialization exception", err);
        resolve(null);
      }
    });
  }

  async savePdf(id, dataUrl, meta = {}) {
    await this.initPromise;
    this.memoryFallback.set(id, { id, dataUrl, ...meta });
    if (!this.db) return id;

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        store.put({
          id,
          dataUrl,
          name: meta.name || "document.pdf",
          size: meta.size || "0 KB",
          savedAt: Date.now()
        });
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => resolve(id);
      } catch (e) {
        resolve(id);
      }
    });
  }

  async getPdf(id) {
    if (this.memoryFallback.has(id)) {
      return this.memoryFallback.get(id);
    }
    await this.initPromise;
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const req = store.get(id);
        req.onsuccess = () => {
          const res = req.result;
          if (res) this.memoryFallback.set(id, res);
          resolve(res || null);
        };
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async deletePdf(id) {
    this.memoryFallback.delete(id);
    await this.initPromise;
    if (!this.db) return;
    try {
      const tx = this.db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      store.delete(id);
    } catch (e) {
      console.warn("Error removing PDF from IndexedDB", e);
    }
  }
}

class StorageManager {
  constructor() {
    this.docDB = new IndexedDBDocStore();
    this.data = this.loadData();
    this.listeners = [];
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          profile: { ...DEFAULT_DATA.profile, ...(parsed.profile || {}) },
          subjects: parsed.subjects || DEFAULT_DATA.subjects || [],
          timetable: parsed.timetable || DEFAULT_DATA.timetable || {},
          assignments: parsed.assignments || DEFAULT_DATA.assignments || [],
          exams: parsed.exams || DEFAULT_DATA.exams || [],
          notes: parsed.notes || DEFAULT_DATA.notes || [],
          events: parsed.events || DEFAULT_DATA.events || [],
          notices: parsed.notices || DEFAULT_DATA.notices || [],
          expenses: parsed.expenses || DEFAULT_DATA.expenses || { monthlyBudget: 10000, items: [] },
          travel: parsed.travel || DEFAULT_DATA.travel || [],
          calendarActivities: parsed.calendarActivities || DEFAULT_DATA.calendarActivities || [],
          gamification: { ...DEFAULT_DATA.gamification, ...(parsed.gamification || {}) },
          dashboardWidgets: { ...DEFAULT_DATA.dashboardWidgets, ...(parsed.dashboardWidgets || {}) },
          studyLogs: parsed.studyLogs || DEFAULT_DATA.studyLogs || []
        };
      }
    } catch (e) {
      console.error("Failed to parse localStorage data, falling back to defaults", e);
    }
    const cloned = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveData(cloned);
    return cloned;
  }

  saveData(data = this.data) {
    this.data = data;
    
    // Save any heavy PDF dataUrls into IndexedDB so LocalStorage stays featherlight (<20KB)
    if (this.data.notes && Array.isArray(this.data.notes)) {
      this.data.notes.forEach(note => {
        if (note.pdf && note.pdf.dataUrl) {
          if (!note.pdf.id) {
            note.pdf.id = "pdf_" + note.id + "_" + Date.now();
          }
          this.docDB.savePdf(note.pdf.id, note.pdf.dataUrl, {
            name: note.pdf.name,
            size: note.pdf.size
          });
        }
      });
    }

    // Sanitize for localStorage without large base64 strings
    const sanitizedData = {
      ...this.data,
      notes: (this.data.notes || []).map(n => {
        if (n.pdf && n.pdf.dataUrl) {
          const { dataUrl, ...cleanPdf } = n.pdf;
          return { ...n, pdf: cleanPdf };
        }
        return n;
      })
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedData));
    } catch (e) {
      console.warn("LocalStorage save warning (recovering safely):", e);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedData));
      } catch (err) {
        console.error("Critical storage fallback", err);
      }
    }

    this.notifyListeners();
  }

  resetToDefaults() {
    const cloned = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveData(cloned);
    return this.data;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn(this.data);
      } catch (e) {
        console.error("Error in storage listener:", e);
      }
    });
  }

  updateProfile(profileUpdate) {
    this.data.profile = { ...this.data.profile, ...profileUpdate };
    this.saveData();
    return this.data.profile;
  }

  // --- Security & Privacy PIN Operations ---
  setSecurityPin(pin) {
    this.data.profile.securityPin = String(pin).trim();
    this.data.profile.isPinEnabled = !!pin;
    this.saveData();
    return true;
  }

  verifySecurityPin(pin) {
    if (!this.data.profile.isPinEnabled || !this.data.profile.securityPin) return true;
    return String(this.data.profile.securityPin).trim() === String(pin).trim();
  }

  disableSecurityPin() {
    this.data.profile.securityPin = "";
    this.data.profile.isPinEnabled = false;
    this.saveData();
  }

  addSemesterSpi(semName, spiVal, creditsVal = 20) {
    if (!this.data.profile.semGpaHistory) {
      this.data.profile.semGpaHistory = [];
    }
    const spi = parseFloat(spiVal) || 0;
    const credits = parseInt(creditsVal) || 20;

    const existingIndex = this.data.profile.semGpaHistory.findIndex(
      s => s.semester.toLowerCase().trim() === semName.toLowerCase().trim()
    );
    if (existingIndex >= 0) {
      this.data.profile.semGpaHistory[existingIndex] = { semester: semName, gpa: spi, credits: credits };
    } else {
      this.data.profile.semGpaHistory.push({ semester: semName, gpa: spi, credits: credits });
    }

    // Sort semGpaHistory by Sem 1, Sem 2, etc.
    this.data.profile.semGpaHistory.sort((a, b) => a.semester.localeCompare(b.semester, undefined, { numeric: true }));

    // Recalculate CGPA and Total Credits
    let totalWeighted = 0;
    let totalCreds = 0;
    this.data.profile.semGpaHistory.forEach(s => {
      const c = s.credits || 20;
      totalWeighted += (s.gpa * c);
      totalCreds += c;
    });

    const newCgpa = totalCreds > 0 ? (totalWeighted / totalCreds) : spi;
    this.data.profile.cgpa = parseFloat(newCgpa.toFixed(2));
    this.data.profile.creditsEarned = totalCreds;
    this.saveData();
    return this.data.profile;
  }

  deleteSemesterSpi(index) {
    if (this.data.profile.semGpaHistory && this.data.profile.semGpaHistory[index] !== undefined) {
      this.data.profile.semGpaHistory.splice(index, 1);
      let totalWeighted = 0;
      let totalCreds = 0;
      this.data.profile.semGpaHistory.forEach(s => {
        const c = s.credits || 20;
        totalWeighted += (s.gpa * c);
        totalCreds += c;
      });
      this.data.profile.cgpa = totalCreds > 0 ? parseFloat((totalWeighted / totalCreds).toFixed(2)) : 0.00;
      this.data.profile.creditsEarned = totalCreds;
      this.saveData();
    }
  }

  // --- Attendance Operations ---
  recordAttendance(subjectId, deltaAttended, deltaTotal = 1) {
    const sub = this.data.subjects.find(s => s.id === subjectId);
    if (!sub) return;

    if (deltaAttended === 1) {
      // Marked present: attended +1, total +1
      sub.attendedClasses = (sub.attendedClasses || 0) + 1;
      sub.totalClasses = (sub.totalClasses || 0) + deltaTotal;
    } else if (deltaAttended === 0 && deltaTotal === 1) {
      // Marked absent: attended +0, total +1
      sub.totalClasses = (sub.totalClasses || 0) + 1;
    } else if (deltaAttended === -1 && deltaTotal === -1) {
      // Undo present: attended -1, total -1
      if (sub.attendedClasses > 0) sub.attendedClasses -= 1;
      if (sub.totalClasses > 0) sub.totalClasses -= 1;
    }
    this.saveData();
    return sub;
  }

  updateSubjectAttendance(subjectId, attended, total) {
    const sub = this.data.subjects.find(s => s.id === subjectId);
    if (!sub) return;
    sub.attendedClasses = Math.max(0, parseInt(attended) || 0);
    sub.totalClasses = Math.max(sub.attendedClasses, parseInt(total) || 0);
    this.saveData();
    return sub;
  }

  addSubject(subject) {
    const newSub = {
      id: "sub_" + Date.now(),
      code: subject.code || "CS101",
      name: subject.name,
      shortName: subject.shortName || subject.name.substring(0, 8),
      faculty: subject.faculty || "Prof. Faculty",
      color: subject.color || "#4F46E5",
      totalClasses: parseInt(subject.totalClasses) || 0,
      attendedClasses: parseInt(subject.attendedClasses) || 0,
      type: subject.type || "Theory",
      credits: parseInt(subject.credits) || 3
    };
    this.data.subjects.push(newSub);
    this.saveData();
    return newSub;
  }

  // --- Assignment Operations ---
  addAssignment(assignment) {
    const newAsg = {
      id: "asg_" + Date.now(),
      title: assignment.title,
      subject: assignment.subject,
      subjectCode: assignment.subjectCode || "",
      deadline: assignment.deadline,
      priority: assignment.priority || "Medium",
      status: assignment.status || "Pending",
      description: assignment.description || "",
      submissionMode: assignment.submissionMode || "LMS Submission",
      points: parseInt(assignment.points) || 10
    };
    this.data.assignments.unshift(newAsg);
    this.saveData();
    return newAsg;
  }

  updateAssignmentStatus(id, newStatus) {
    const asg = this.data.assignments.find(a => a.id === id);
    if (asg) {
      asg.status = newStatus;
      this.saveData();
    }
    return asg;
  }

  deleteAssignment(id) {
    this.data.assignments = this.data.assignments.filter(a => a.id !== id);
    this.saveData();
  }

  // --- Exam Operations ---
  addExam(exam) {
    const newExam = {
      id: "ex_" + Date.now(),
      subject: exam.subject,
      subjectCode: exam.subjectCode || "",
      category: exam.category || "Mid-Term Examination",
      date: exam.date,
      endTime: exam.endTime || "12:30 PM",
      room: exam.room || "Exam Hall",
      seatNo: exam.seatNo || "Assigned on Desk",
      totalMarks: parseInt(exam.totalMarks) || 60,
      weightage: exam.weightage || "30%",
      syllabusTopics: exam.syllabusTopics || [
        { name: "Unit 1: Fundamentals", completed: true },
        { name: "Unit 2: Core Concepts", completed: false }
      ]
    };
    this.data.exams.push(newExam);
    this.data.exams.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.saveData();
    return newExam;
  }

  toggleExamTopic(examId, topicIndex) {
    const ex = this.data.exams.find(e => e.id === examId);
    if (ex && ex.syllabusTopics && ex.syllabusTopics[topicIndex]) {
      ex.syllabusTopics[topicIndex].completed = !ex.syllabusTopics[topicIndex].completed;
      this.saveData();
    }
  }

  // --- Note Operations ---
  addNote(note) {
    const noteId = "note_" + Date.now();
    let pdfMeta = null;
    if (note.pdf) {
      const pdfId = note.pdf.id || ("pdf_" + noteId + "_" + Date.now());
      pdfMeta = {
        id: pdfId,
        name: note.pdf.name || "study_document.pdf",
        size: note.pdf.size || "0 KB",
        dataUrl: note.pdf.dataUrl || null,
        hasDoc: true
      };
      if (note.pdf.dataUrl) {
        this.docDB.savePdf(pdfId, note.pdf.dataUrl, {
          name: pdfMeta.name,
          size: pdfMeta.size
        });
      }
    }

    const newNote = {
      id: noteId,
      title: note.title || "Untitled Note",
      subject: note.subject || "Other",
      pinned: !!note.pinned,
      updatedAt: new Date().toISOString(),
      tags: note.tags || [],
      content: note.content || "",
      pdf: pdfMeta
    };
    this.data.notes.unshift(newNote);
    this.saveData();
    return newNote;
  }

  updateNote(id, updatedFields) {
    const note = this.data.notes.find(n => n.id === id);
    if (note) {
      Object.assign(note, updatedFields, { updatedAt: new Date().toISOString() });
      this.saveData();
    }
    return note;
  }

  togglePinNote(id) {
    const note = this.data.notes.find(n => n.id === id);
    if (note) {
      note.pinned = !note.pinned;
      this.saveData();
    }
    return note;
  }

  deleteNote(id) {
    const note = this.data.notes.find(n => n.id === id);
    if (note && note.pdf && note.pdf.id) {
      this.docDB.deletePdf(note.pdf.id);
    }
    this.data.notes = this.data.notes.filter(n => n.id !== id);
    this.saveData();
  }

  // --- Event Operations ---
  toggleEventAttendance(id) {
    const ev = this.data.events.find(e => e.id === id);
    if (ev) {
      ev.attending = !ev.attending;
      this.saveData();
    }
    return ev;
  }

  addEvent(event) {
    const newEv = {
      id: "ev_" + Date.now(),
      title: event.title,
      category: event.category || "Workshops",
      organizer: event.organizer || "Campus Club",
      date: event.date,
      venue: event.venue || "Campus Auditorium",
      type: event.type || "Offline",
      badge: event.badge || "Upcoming",
      description: event.description || "",
      attending: false,
      image: event.image || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&auto=format&fit=crop&q=80"
    };
    this.data.events.unshift(newEv);
    this.saveData();
    return newEv;
  }

  // --- Expense Operations ---
  addExpense(expense) {
    const newExp = {
      id: "exp_" + Date.now(),
      title: expense.title,
      category: expense.category || "Other",
      amount: parseFloat(expense.amount) || 0,
      date: expense.date || new Date().toISOString().split("T")[0],
      mode: expense.mode || "UPI"
    };
    this.data.expenses.items.unshift(newExp);
    this.saveData();
    return newExp;
  }

  deleteExpense(id) {
    this.data.expenses.items = this.data.expenses.items.filter(e => e.id !== id);
    this.saveData();
  }

  updateMonthlyBudget(amount) {
    this.data.expenses.monthlyBudget = parseFloat(amount) || 10000;
    this.saveData();
  }

  // --- Timetable Operations ---
  addTimetableClass(day, lecture) {
    if (!this.data.timetable[day]) {
      this.data.timetable[day] = [];
    }
    const newClass = {
      id: "tt_" + Date.now(),
      time: `${lecture.startTime} - ${lecture.endTime}`,
      subjectId: lecture.subjectId || "sub_" + Date.now(),
      subject: lecture.subject,
      professor: lecture.professor || "Faculty",
      room: lecture.room || "Room 101",
      type: lecture.type || "Lecture",
      startTime: lecture.startTime,
      endTime: lecture.endTime
    };
    this.data.timetable[day].push(newClass);
    // Sort by startTime
    this.data.timetable[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    this.saveData();
    return newClass;
  }

  deleteTimetableClass(day, classId) {
    if (this.data.timetable[day]) {
      this.data.timetable[day] = this.data.timetable[day].filter(c => c.id !== classId);
      this.saveData();
    }
  }

  deleteSubject(subjectId) {
    this.data.subjects = this.data.subjects.filter(s => s.id !== subjectId);
    this.saveData();
  }

  // --- Travel & Transit Operations ---
  addTravelTrip(trip) {
    if (!this.data.travel) this.data.travel = [];
    const newTrip = {
      id: "trv_" + Date.now(),
      title: trip.title || "College Journey",
      mode: trip.mode || "Train", // Train, Flight, Bus, Car, Metro, Other
      carrierName: trip.carrierName || "",
      origin: trip.origin || "",
      destination: trip.destination || "",
      departureDate: trip.departureDate || new Date().toISOString().split("T")[0],
      departureTime: trip.departureTime || "10:00",
      arrivalDate: trip.arrivalDate || trip.departureDate || new Date().toISOString().split("T")[0],
      arrivalTime: trip.arrivalTime || "18:00",
      pnrOrSeat: trip.pnrOrSeat || "",
      fare: parseFloat(trip.fare) || 0,
      status: trip.status || "Confirmed", // Confirmed, RAC / WL, Booked, Completed, Cancelled
      notes: trip.notes || ""
    };
    this.data.travel.unshift(newTrip);
    // Sort by departureDate & departureTime ascending (nearest first)
    this.data.travel.sort((a, b) => {
      const dateA = new Date(`${a.departureDate}T${a.departureTime || '00:00'}`);
      const dateB = new Date(`${b.departureDate}T${b.departureTime || '00:00'}`);
      return dateA - dateB;
    });
    this.saveData();
    return newTrip;
  }

  deleteTravelTrip(tripId) {
    if (this.data.travel) {
      this.data.travel = this.data.travel.filter(t => t.id !== tripId);
      this.saveData();
    }
  }

  // --- Calendar & Daily Planner Operations ---
  addCalendarActivity(activity) {
    if (!this.data.calendarActivities) this.data.calendarActivities = [];
    const newAct = {
      id: "act_" + Date.now(),
      date: activity.date || new Date().toISOString().split("T")[0],
      startTime: activity.startTime || "09:00",
      endTime: activity.endTime || "10:00",
      title: activity.title || "Daily Activity",
      venue: activity.venue || "Campus Main Hall",
      venueCategory: activity.venueCategory || "Classroom",
      category: activity.category || "General",
      completed: false,
      notes: activity.notes || ""
    };
    this.data.calendarActivities.push(newAct);
    // Sort chronologically by date and startTime
    this.data.calendarActivities.sort((a, b) => {
      const timeA = `${a.date}T${a.startTime}`;
      const timeB = `${b.date}T${b.startTime}`;
      return timeA.localeCompare(timeB);
    });
    this.saveData();
    return newAct;
  }

  toggleActivityCompleted(actId) {
    if (!this.data.calendarActivities) return;
    const act = this.data.calendarActivities.find(a => a.id === actId);
    if (act) {
      act.completed = !act.completed;
      this.saveData();
    }
  }

  deleteCalendarActivity(actId) {
    if (this.data.calendarActivities) {
      this.data.calendarActivities = this.data.calendarActivities.filter(a => a.id !== actId);
      this.saveData();
    }
  }

  updateTravelStatus(tripId, status) {
    if (this.data.travel) {
      const trip = this.data.travel.find(t => t.id === tripId);
      if (trip) {
        trip.status = status;
        this.saveData();
      }
    }
  }

  // ==========================================
  // GAMIFICATION, STUDY STREAK & DASHBOARD WIDGETS
  // ==========================================
  awardXP(amount, reason = "Activity Completed") {
    if (!this.data.gamification) {
      this.data.gamification = { ...DEFAULT_DATA.gamification };
    }

    const gam = this.data.gamification;
    const oldLevel = gam.level || 1;
    gam.xp = (gam.xp || 0) + amount;

    const titles = [
      "Freshman Explorer",
      "Code Apprentice",
      "Curious Scholar",
      "Algorithm Pioneer",
      "Academic Ace",
      "Senior Contender",
      "Campus Vanguard",
      "University Legend"
    ];

    const xpPerLevel = 250;
    const newLevel = Math.floor(gam.xp / xpPerLevel) + 1;
    gam.level = newLevel;
    gam.title = titles[Math.min(newLevel - 1, titles.length - 1)];

    this.saveData();

    return {
      amount,
      reason,
      totalXP: gam.xp,
      level: gam.level,
      title: gam.title,
      leveledUp: newLevel > oldLevel,
      currentLevelBaseXP: (newLevel - 1) * xpPerLevel,
      nextLevelTargetXP: newLevel * xpPerLevel
    };
  }

  logStudySession(durationMins, subject, notes = "") {
    if (!this.data.studyLogs) this.data.studyLogs = [];
    if (!this.data.gamification) this.data.gamification = { ...DEFAULT_DATA.gamification };

    const gam = this.data.gamification;
    const todayStr = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().getDay(); // 0 is Sunday, 1 is Monday

    // Streak calculation
    if (gam.lastStudyDate) {
      const lastDate = new Date(gam.lastStudyDate);
      const today = new Date(todayStr);
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        gam.streak = (gam.streak || 0) + 1;
      } else if (diffDays > 1) {
        gam.streak = 1;
      }
    } else {
      gam.streak = 1;
    }

    gam.lastStudyDate = todayStr;

    // Update 7-day weekly study array (Mon-Sun mapped to 0-6)
    const mapDayIndex = (dayOfWeek + 6) % 7; // Mon=0, Tue=1 ... Sun=6
    if (!Array.isArray(gam.weeklyStudyDays)) {
      gam.weeklyStudyDays = [false, false, false, false, false, false, false];
    }
    gam.weeklyStudyDays[mapDayIndex] = true;

    // XP calculation: 1 XP per minute, min 25, bonus for long focus sessions
    const xpEarned = Math.max(25, Math.floor(durationMins * 1.2));

    const newLog = {
      id: "log_" + Date.now(),
      date: todayStr,
      subject: subject || "General Study",
      durationMins: parseInt(durationMins) || 45,
      xpEarned,
      notes: notes || ""
    };

    this.data.studyLogs.unshift(newLog);
    const xpResult = this.awardXP(xpEarned, `Logged ${durationMins}m Study Sprint`);

    return {
      log: newLog,
      streak: gam.streak,
      xpResult
    };
  }

  updateDashboardWidgets(config) {
    this.data.dashboardWidgets = {
      ...(this.data.dashboardWidgets || DEFAULT_DATA.dashboardWidgets),
      ...config
    };
    this.saveData();
  }
}

// Global Storage Instance
window.storage = new StorageManager();
