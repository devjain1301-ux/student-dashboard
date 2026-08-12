// js/app.js - Main Application Controller for UniSphere College Student Dashboard

function initUniSphereApp() {
  if (!window.app) {
    window.app = new UniSphereApp();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUniSphereApp);
} else {
  initUniSphereApp();
}

const PRESET_AVATARS = [
  { id: "av1", name: "Engineering / Tech", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80" },
  { id: "av2", name: "Science Scholar", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80" },
  { id: "av3", name: "Software Developer", url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80" },
  { id: "av4", name: "Medical / Healthcare", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80" },
  { id: "av5", name: "Business Student", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80" },
  { id: "av6", name: "Arts & Humanities", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
  { id: "av7", name: "Tech Enthusiast", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80" },
  { id: "av8", name: "Campus Researcher", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80" },
  { id: "av9", name: "Minimalist Vector 1", url: "https://api.dicebear.com/7.x/bottts/svg?seed=student1&backgroundColor=b6e3f4" },
  { id: "av10", name: "Minimalist Vector 2", url: "https://api.dicebear.com/7.x/bottts/svg?seed=student2&backgroundColor=c0aede" },
  { id: "av11", name: "Graduation Cap 1", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=ffd5dc" },
  { id: "av12", name: "Graduation Cap 2", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=d1d4f9" }
];

class UniSphereApp {
  constructor() {
    this.storage = window.storage;
    this.currentView = "dashboard";
    this.currentTimetableDay = this.getTodayName();
    this.activeNoteFilter = "All";
    this.activeEventFilter = "All";
    this.activeAssignmentStatus = "All";
    this.activeAssignmentSubject = "All";
    this.activeTravelMode = "All";
    this.currentAttachedNotePdf = null;
    this.currentPinBuffer = "";
    this.isVaultUnlocked = false;

    this.initTheme();
    this.initNavigation();
    this.initSearch();
    this.initClockAndTimers();
    this.initStreamAndBranchSelectors();
    this.initScrollToTopListener();
    this.renderAvatarGallery();
    this.bindEvents();
    this.renderAll();

    // Check mandatory student verification / login gate
    this.checkStudentVerification();

    // Initialize 4-Digit PIN Security Lock
    this.initSecurityLock();
    this.bindPinKeyboardListeners();

    // Re-render when storage updates
    this.storage.subscribe(() => {
      this.renderAll();
    });
  }

  initScrollToTopListener() {
    const scrollBtn = document.getElementById("scrollTopBtn");
    if (!scrollBtn) return;

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 250) {
            scrollBtn.classList.add("visible");
          } else {
            scrollBtn.classList.remove("visible");
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ==========================================
  // 1. THEME MANAGEMENT (DARK / LIGHT)
  // ==========================================
  initTheme() {
    const savedTheme = localStorage.getItem("UNISPHERE_THEME_PREFERENCE") || 
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    this.setTheme(savedTheme);

    const themeToggleBtns = document.querySelectorAll(".theme-toggle-trigger");
    themeToggleBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        const next = current === "dark" ? "light" : "dark";
        this.setTheme(next);
        this.showToast(`Switched to ${next} theme`, "info");
      });
    });
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("UNISPHERE_THEME_PREFERENCE", theme);
    
    const icons = document.querySelectorAll(".theme-icon-slot");
    icons.forEach(el => {
      if (theme === "dark") {
        el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      } else {
        el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      }
    });
  }

  // ==========================================
  // 2. MANDATORY STUDENT VERIFICATION & LOGIN
  // ==========================================
  checkStudentVerification() {
    const prof = this.storage.data.profile;
    const modal = document.getElementById("modalStudentLogin");
    if (!prof.isVerified || !prof.email || !prof.phone || !prof.name) {
      if (modal) {
        modal.classList.add("active");
        this.onStreamSelectChange("loginInputStream", "loginInputBranch");
      }
    } else {
      if (modal) modal.classList.remove("active");
    }
  }

  // ==========================================
  // 3. STREAM & BRANCH DROPDOWN CASCADING
  // ==========================================
  initStreamAndBranchSelectors() {
    this.onStreamSelectChange("loginInputStream", "loginInputBranch");
    this.onStreamSelectChange("classInputStream", "classInputBranch", "classSubjectQuickList");
    this.onStreamSelectChange("subInputStream", "subInputBranch", "subSubjectQuickList");
    this.onStreamSelectChange("profInputStream", "profInputBranch");
  }

  onStreamSelectChange(streamSelectId, branchSelectId, pillsContainerId = null) {
    const streamSelect = document.getElementById(streamSelectId);
    const branchSelect = document.getElementById(branchSelectId);
    if (!streamSelect || !branchSelect) return;

    const selectedStream = streamSelect.value;
    const branches = COURSE_CATALOG[selectedStream] ? Object.keys(COURSE_CATALOG[selectedStream]) : [];

    branchSelect.innerHTML = branches.map(b => `<option value="${b}">${b}</option>`).join("");

    if (pillsContainerId) {
      this.populateSubjectQuickList(streamSelectId, branchSelectId, pillsContainerId);
    }
  }

  populateSubjectQuickList(streamSelectId, branchSelectId, pillsContainerId) {
    const streamSelect = document.getElementById(streamSelectId);
    const branchSelect = document.getElementById(branchSelectId);
    const container = document.getElementById(pillsContainerId);
    if (!streamSelect || !branchSelect || !container) return;

    const stream = streamSelect.value;
    const branch = branchSelect.value;
    const subjects = (COURSE_CATALOG[stream] && COURSE_CATALOG[stream][branch]) ? COURSE_CATALOG[stream][branch] : [];

    const targetInputId = pillsContainerId === "classSubjectQuickList" ? "classInputSubject" : "subInputName";

    container.innerHTML = subjects.map(s => `
      <div style="display:inline-flex; align-items:center; background:var(--bg-card-subtle); border:1px solid var(--border-color); border-radius:var(--radius-full); margin:3px 2px; padding:2px 8px;">
        <span style="font-size:0.75rem; cursor:pointer; color:var(--text-main); font-weight:600;" onclick="app.selectSubjectSuggestion('${s.replace(/'/g, "\\'")}', '${targetInputId}')">
          ${s}
        </span>
        <button type="button" class="btn btn-primary" style="margin-left:6px; padding:2px 7px; font-size:0.68rem; border-radius:var(--radius-full); line-height:1.2;" onclick="app.directAddSubject('${s.replace(/'/g, "\\'")}')" title="Add this subject to dashboard directly">
          + Add
        </button>
      </div>
    `).join("");
  }

  directAddSubject(subjectName) {
    const exists = this.storage.data.subjects.some(s => s.name.toLowerCase() === subjectName.toLowerCase());
    if (exists) {
      this.showToast(`"${subjectName}" is already in your subjects list!`, "info");
      return;
    }

    const words = subjectName.split(" ");
    const initials = words.map(w => w[0]).join("").toUpperCase().substring(0, 4);
    const colors = ["#4F46E5", "#06B6D4", "#8B5CF6", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];
    const i = this.storage.data.subjects.length;

    const newSub = {
      id: "sub_" + (Date.now()),
      code: `${initials}${101 + i}`,
      name: subjectName,
      shortName: words[0],
      faculty: "Department Faculty",
      color: colors[i % colors.length],
      totalClasses: 0,
      attendedClasses: 0,
      type: "Theory + Lab",
      credits: 4
    };

    this.storage.addSubject(newSub);
    this.closeModal("modalAddSubject");
    this.showToast(`Subject "${newSub.name}" added successfully! 🎉`, "success");
  }

  selectSubjectSuggestion(subjectName, inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.value = subjectName;
      input.focus();
    }
    // Also auto-generate a short tag/code if filling subInputName
    if (inputId === "subInputName") {
      const codeInput = document.getElementById("subInputCode");
      const shortInput = document.getElementById("subInputShort");
      if (codeInput && !codeInput.value) {
        const words = subjectName.split(" ");
        const initials = words.map(w => w[0]).join("").toUpperCase().substring(0, 4);
        codeInput.value = initials + "101";
        if (shortInput && !shortInput.value) shortInput.value = words[0];
      }
    }
  }

  quickLoadBranchCurriculum() {
    const prof = this.storage.data.profile;
    const stream = prof.stream || "Engineering & Technology (B.Tech / BE)";
    const branch = prof.branch || "Computer Science & Engineering";
    const catalogSubjects = (COURSE_CATALOG[stream] && COURSE_CATALOG[stream][branch]) ? COURSE_CATALOG[stream][branch] : [];

    if (catalogSubjects.length === 0) {
      this.showToast(`No preset curriculum found for ${branch}`, "warning");
      return;
    }

    if (confirm(`Load standard subjects for "${branch}" (${catalogSubjects.length} subjects) into your dashboard? All attendance counters will start at 0.`)) {
      catalogSubjects.forEach((subName, i) => {
        const words = subName.split(" ");
        const initials = words.map(w => w[0]).join("").toUpperCase().substring(0, 4);
        const colors = ["#4F46E5", "#06B6D4", "#8B5CF6", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];
        
        // Add only if not already added
        if (!this.storage.data.subjects.some(s => s.name.toLowerCase() === subName.toLowerCase())) {
          this.storage.data.subjects.push({
            id: "sub_" + (Date.now() + i),
            code: `${initials}${101 + i}`,
            name: subName,
            shortName: words[0],
            faculty: "Department Faculty",
            color: colors[i % colors.length],
            totalClasses: 0,
            attendedClasses: 0,
            type: "Theory + Lab",
            credits: 4
          });
        }
      });

      this.storage.saveData();
      this.showToast(`Loaded ${catalogSubjects.length} subjects for ${branch}!`, "success");
    }
  }

  // ==========================================
  // 4. NAVIGATION CONTROLLER
  // ==========================================
  initNavigation() {
    const navButtons = document.querySelectorAll("[data-nav-target]");
    navButtons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetView = btn.getAttribute("data-nav-target");
        this.navigateTo(targetView);

        const sidebar = document.getElementById("appSidebar");
        if (sidebar && sidebar.classList.contains("open")) {
          sidebar.classList.remove("open");
        }
      });
    });

    const menuToggle = document.getElementById("mobileMenuBtn");
    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (e.key === "1") this.navigateTo("dashboard");
      if (e.key === "2") this.navigateTo("timetable");
      if (e.key === "3") this.navigateTo("attendance");
      if (e.key === "4") this.navigateTo("assignments");
      if (e.key === "5") this.navigateTo("exams");
      if (e.key === "6") this.navigateTo("notes");
      if (e.key === "7") this.navigateTo("events");
      if (e.key === "8") this.navigateTo("expenses");
      if (e.key === "9") this.navigateTo("profile");
    });
  }

  toggleSidebar(forceOpen) {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (!sidebar) return;

    const isOpen = forceOpen !== undefined ? forceOpen : !sidebar.classList.contains("open");
    if (isOpen) {
      sidebar.classList.add("open");
      if (backdrop) backdrop.classList.add("active");
    } else {
      sidebar.classList.remove("open");
      if (backdrop) backdrop.classList.remove("active");
    }
  }

  toggleMobileMoreDrawer(forceOpen) {
    const drawer = document.getElementById("mobileMoreDrawer");
    if (!drawer) return;

    const isOpen = forceOpen !== undefined ? forceOpen : !drawer.classList.contains("active");
    if (isOpen) {
      drawer.classList.add("active");
    } else {
      drawer.classList.remove("active");
    }
  }

  navigateTo(viewId) {
    this.currentView = viewId;

    this.toggleSidebar(false);
    this.toggleMobileMoreDrawer(false);

    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active");
    });
    const targetSection = document.getElementById(`view-${viewId}`);
    if (targetSection) {
      targetSection.classList.add("active");
    }

    document.querySelectorAll("[data-nav-target]").forEach(btn => {
      if (btn.getAttribute("data-nav-target") === viewId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    const titleMap = {
      dashboard: { title: "Overview Dashboard", sub: "Your complete college overview & real-time analytics" },
      timetable: { title: "Class Timetable", sub: "Daily & weekly lecture schedule with room indicators" },
      attendance: { title: "Attendance & 75% Rule", sub: "Subject-wise tracking and smart attendance predictor" },
      assignments: { title: "Assignments & Tasks", sub: "Track submissions, deadlines, and project deliverables" },
      exams: { title: "Exams & Live Timetable", sub: "Upcoming tests, seating details, and syllabus checklists" },
      notes: { title: "Subject Study Notes", sub: "Organized repository for formulas, codes, and cheatsheets" },
      events: { title: "College Events & Notices", sub: "Workshops, hackathons, fests, and official bulletins" },
      expenses: { title: "Student Expense Tracker", sub: "Hostel, PG, food & daily budget management" },
      profile: { title: "Student Profile & Academics", sub: "Personal academic records, CGPA progression & details" }
    };

    const info = titleMap[viewId] || { title: "UniSphere", sub: "Student Hub" };
    const titleEl = document.getElementById("currentPageTitle");
    const subEl = document.getElementById("currentPageSubtitle");
    if (titleEl) titleEl.textContent = info.title;
    if (subEl) subEl.textContent = info.sub;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ==========================================
  // 5. REAL-TIME CLOCKS & TIMERS
  // ==========================================
  initClockAndTimers() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    setInterval(() => this.updateExamsLiveCountdown(), 1000);
  }

  updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    
    const liveTimeEl = document.getElementById("headerLiveTime");
    if (liveTimeEl) {
      liveTimeEl.textContent = `${dateStr} • ${timeStr}`;
    }

    this.renderCurrentClassBanner();
  }

  getTodayName() {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = new Date().getDay();
    return d === 0 ? "Monday" : days[d];
  }

  // ==========================================
  // 6. RENDERING ENGINE (ALL MODULES)
  // ==========================================
  renderAll() {
    this.renderDashboard();
    this.renderTimetable();
    this.renderAttendance();
    this.renderAssignments();
    this.renderExams();
    this.renderNotes();
    this.renderEvents();
    this.renderExpenses();
    this.renderTravel();
    this.renderProfile();
    this.updateNavBadges();
  }

  updateNavBadges() {
    const data = this.storage.data;
    const pendingAsg = data.assignments.filter(a => a.status !== "Submitted").length;
    const asgBadge = document.getElementById("badgeAssignments");
    if (asgBadge) asgBadge.textContent = pendingAsg;

    const lowAtt = data.subjects.filter(s => s.totalClasses > 0 && (s.attendedClasses / s.totalClasses) < 0.75).length;
    const attBadge = document.getElementById("badgeAttendance");
    if (attBadge) {
      attBadge.textContent = lowAtt > 0 ? `${lowAtt} Alert` : "75% Rule";
      attBadge.className = lowAtt > 0 ? "nav-badge danger" : "nav-badge";
    }

    const activeTrips = (data.travel || []).filter(t => t.status !== "Completed" && t.status !== "Cancelled").length;
    const travelBadge = document.getElementById("badgeTravelCount");
    if (travelBadge) {
      travelBadge.textContent = activeTrips > 0 ? `${activeTrips} Active` : "Train/Flight";
    }
  }

  // ------------------------------------------
  // MODULE 1: DASHBOARD
  // ------------------------------------------
  renderDashboard() {
    const data = this.storage.data;
    
    // 1. Profile Welcome & CGPA
    const heroName = document.getElementById("heroStudentName");
    if (heroName) heroName.textContent = data.profile.name || "Student";
    const heroCourse = document.getElementById("heroStudentCourse");
    if (heroCourse) heroCourse.textContent = `${data.profile.branch || data.profile.course || 'Degree'} • Semester ${data.profile.semester || 1} (${data.profile.academicYear || '2026-2027'})`;

    const heroCgpaEl = document.getElementById("heroCgpaValue");
    if (heroCgpaEl) heroCgpaEl.textContent = (data.profile.cgpa || 0).toFixed(2);
    const heroCgpaDetailEl = document.getElementById("heroCgpaDetail");
    if (heroCgpaDetailEl) {
      if (data.profile.cgpa > 0) {
        const approxPct = (data.profile.cgpa * 9.5).toFixed(1);
        heroCgpaDetailEl.textContent = `Approx ${approxPct}% • ${data.profile.creditsEarned || 0} Credits`;
      } else {
        heroCgpaDetailEl.textContent = "+ Click to Add Semester SPI →";
      }
    }

    // 2. Stat 1: Overall Attendance
    let totalClasses = 0;
    let totalAttended = 0;
    data.subjects.forEach(s => {
      totalClasses += s.totalClasses || 0;
      totalAttended += s.attendedClasses || 0;
    });
    const overallAttPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
    
    const dashAttVal = document.getElementById("dashStatAttendance");
    if (dashAttVal) dashAttVal.textContent = `${overallAttPct}%`;
    const dashAttBadge = document.getElementById("dashStatAttBadge");
    if (dashAttBadge) {
      if (totalClasses === 0) {
        dashAttBadge.className = "stat-trend-badge";
        dashAttBadge.style.background = "var(--bg-card-subtle)";
        dashAttBadge.style.color = "var(--text-muted)";
        dashAttBadge.textContent = "0 classes logged";
      } else if (overallAttPct >= 75) {
        dashAttBadge.className = "stat-trend-badge positive";
        dashAttBadge.textContent = "✓ Safe (>75%)";
      } else {
        dashAttBadge.className = "stat-trend-badge danger";
        dashAttBadge.textContent = "⚠ Shortage Alert";
      }
    }

    // 3. Stat 2: Pending Tasks
    const pendingTasks = data.assignments.filter(a => a.status !== "Submitted");
    const dashPendingVal = document.getElementById("dashStatPendingTasks");
    if (dashPendingVal) dashPendingVal.textContent = pendingTasks.length;

    // 4. Stat 3: Next Exam Countdown
    const nextExam = [...data.exams].sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    const dashNextExamVal = document.getElementById("dashStatNextExam");
    const subLabel = document.getElementById("dashStatExamSub");
    if (nextExam) {
      const daysLeft = this.calculateDaysRemaining(nextExam.date);
      if (dashNextExamVal) dashNextExamVal.textContent = `${daysLeft}d left`;
      if (subLabel) subLabel.textContent = nextExam.subject.split(" ")[0];
    } else {
      if (dashNextExamVal) dashNextExamVal.textContent = "0 scheduled";
      if (subLabel) subLabel.textContent = "None";
    }

    // 5. Stat 4: Budget Balance
    const monthlyBudget = data.expenses.monthlyBudget || 10000;
    const totalSpent = data.expenses.items.reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);
    const balance = monthlyBudget - totalSpent;
    const dashBudgetVal = document.getElementById("dashStatBudget");
    if (dashBudgetVal) dashBudgetVal.textContent = `₹${balance.toLocaleString()}`;

    // 6. Render Current Class Happening Now Banner
    this.renderCurrentClassBanner();

    // 7. Today's Class Schedule on Dashboard
    this.renderDashboardTodaySchedule();

    // 8. Quick Task Checklist on Dashboard
    this.renderDashboardTasks();
  }

  renderCurrentClassBanner() {
    const data = this.storage.data;
    const todayName = this.getTodayName();
    const todayClasses = data.timetable[todayName] || [];
    
    const bannerContainer = document.getElementById("dashCurrentClassBanner");
    if (!bannerContainer) return;

    if (todayClasses.length === 0) {
      bannerContainer.innerHTML = `
        <div class="live-class-card" style="border-left: 5px solid var(--text-subtle);">
          <div class="live-class-badge" style="background: var(--text-muted);">No Classes</div>
          <div class="live-class-details">
            <div>
              <h3 class="live-subject-name">No classes added for ${todayName}</h3>
              <p style="font-size: 0.84rem; color: var(--text-muted);">Click <strong>+ Add Class</strong> to manually add your lectures, labs, and tutorials.</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let activeClass = null;
    let nextClass = null;

    for (let c of todayClasses) {
      const [sh, sm] = c.startTime.split(":").map(Number);
      const [eh, em] = c.endTime.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (currentMinutes >= startMin && currentMinutes < endMin) {
        activeClass = { ...c, startMin, endMin };
        break;
      } else if (currentMinutes < startMin && !nextClass) {
        nextClass = { ...c, startMin, endMin };
      }
    }

    if (activeClass) {
      const totalDuration = activeClass.endMin - activeClass.startMin;
      const elapsed = currentMinutes - activeClass.startMin;
      const pct = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

      bannerContainer.innerHTML = `
        <div class="live-class-card" style="border-left: 5px solid var(--success);">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div class="live-class-badge"><span class="live-dot" style="width:6px; height:6px; background:white; box-shadow:none;"></span> HAPPENING NOW</div>
            <span style="font-size:0.78rem; font-weight:700; color:var(--success);">${activeClass.time}</span>
          </div>
          <div class="live-class-details">
            <div>
              <h3 class="live-subject-name">${activeClass.subject}</h3>
              <div class="live-class-meta">
                <span>📍 Room/Hall: <strong>${activeClass.room}</strong></span>
                <span>👨‍🏫 ${activeClass.professor}</span>
                <span class="type-pill ${activeClass.type.toLowerCase()}">${activeClass.type}</span>
              </div>
            </div>
          </div>
          <div class="live-progress-container">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.3rem;">
              <span>Lecture progress: ${elapsed}m of ${totalDuration}m elapsed</span>
              <span><strong>${pct}%</strong></span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill success" style="width: ${pct}%;"></div>
            </div>
          </div>
        </div>
      `;
    } else if (nextClass) {
      const minsUntil = nextClass.startMin - currentMinutes;
      const hours = Math.floor(minsUntil / 60);
      const mins = minsUntil % 60;
      const timeWaitStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

      bannerContainer.innerHTML = `
        <div class="live-class-card" style="border-left: 5px solid var(--primary-600);">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div class="live-class-badge" style="background:var(--primary-600);">UP NEXT (IN ${timeWaitStr})</div>
            <span style="font-size:0.78rem; font-weight:700; color:var(--primary-600);">${nextClass.time}</span>
          </div>
          <div class="live-class-details">
            <div>
              <h3 class="live-subject-name">${nextClass.subject}</h3>
              <div class="live-class-meta">
                <span>📍 Room/Hall: <strong>${nextClass.room}</strong></span>
                <span>👨‍🏫 ${nextClass.professor}</span>
                <span class="type-pill ${nextClass.type.toLowerCase()}">${nextClass.type}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      bannerContainer.innerHTML = `
        <div class="live-class-card" style="border-left: 5px solid var(--success);">
          <div class="live-class-badge" style="background:var(--success);">SCHEDULE COMPLETE</div>
          <div class="live-class-details">
            <div>
              <h3 class="live-subject-name">All classes for today are complete! 🌟</h3>
              <p style="font-size: 0.84rem; color: var(--text-muted);">Good job today! Work on assignments or add notes.</p>
            </div>
          </div>
        </div>
      `;
    }
  }

  renderDashboardTodaySchedule() {
    const listEl = document.getElementById("dashTodayScheduleList");
    if (!listEl) return;

    const todayName = this.getTodayName();
    const classes = this.storage.data.timetable[todayName] || [];

    if (classes.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 1.5rem; color: var(--text-muted); font-size:0.88rem;">
          No classes scheduled for today.
          <div style="margin-top:0.5rem;">
            <button class="btn btn-secondary" style="font-size:0.78rem; padding:0.35rem 0.75rem;" onclick="app.openModal('modalAddClass')">+ Add Class</button>
          </div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = classes.map(c => `
      <div class="timeline-item">
        <div class="timeline-time-col">
          <div>${c.time.split("-")[0].trim()}</div>
          <div style="font-size:0.72rem; color:var(--text-subtle);">${c.time.split("-")[1].trim()}</div>
        </div>
        <div class="timeline-content-col">
          <div class="timeline-subj-title">${c.subject}</div>
          <div class="timeline-subj-meta">
            <span>📍 ${c.room}</span>
            <span>👨‍🏫 ${c.professor}</span>
            <span class="type-pill ${c.type.toLowerCase()}">${c.type}</span>
          </div>
        </div>
      </div>
    `).join("");
  }

  renderDashboardTasks() {
    const listEl = document.getElementById("dashQuickTasksList");
    if (!listEl) return;

    const assignments = this.storage.data.assignments.slice(0, 4);
    if (assignments.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 1.5rem; color: var(--text-muted);">
          No assignments pending.
          <div style="margin-top:0.5rem;">
            <button class="btn btn-primary" style="font-size:0.78rem; padding:0.35rem 0.75rem;" onclick="app.openModal('modalAddAssignment')">+ Add Assignment</button>
          </div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = assignments.map(a => {
      const isDone = a.status === "Submitted";
      const days = this.calculateDaysRemaining(a.deadline);
      const isUrgent = days <= 2 && !isDone;

      return `
        <div class="task-mini-item ${isDone ? 'completed' : ''}">
          <div class="task-checkbox-wrap" onclick="app.toggleAssignmentDone('${a.id}')">
            <div class="custom-checkbox">${isDone ? '✓' : ''}</div>
            <div>
              <div class="task-text">${a.title}</div>
              <div style="font-size:0.74rem; color:var(--text-muted);">${a.subject} • Due ${new Date(a.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            </div>
          </div>
          <span class="task-deadline-badge ${isUrgent ? 'urgent' : 'normal'}">${isDone ? 'Submitted' : `${days}d left`}</span>
        </div>
      `;
    }).join("");
  }

  // ------------------------------------------
  // MODULE 2: TIMETABLE
  // ------------------------------------------
  renderTimetable() {
    const container = document.getElementById("timetableGrid");
    if (!container) return;

    const activeDay = this.currentTimetableDay;
    const classes = this.storage.data.timetable[activeDay] || [];

    // Render Day Selector Tabs
    const tabsContainer = document.getElementById("timetableDayTabs");
    if (tabsContainer) {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const today = this.getTodayName();
      tabsContainer.innerHTML = days.map(d => `
        <button class="day-pill-btn ${d === activeDay ? 'active' : ''} ${d === today ? 'is-today-marker' : ''}" onclick="app.switchTimetableDay('${d}')">
          ${d.substring(0, 3)} ${d === today ? '•' : ''}
        </button>
      `).join("");
    }

    if (classes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 3.5rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border-color);">
          <div style="font-size: 2.8rem; margin-bottom: 0.5rem;">📅</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.35rem;">No classes added for ${activeDay}</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; max-width: 500px; margin: 0 auto 1.25rem;">Manually add your lectures and practicals, or load your branch subjects directly.</p>
          <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="app.openModal('modalAddClass')">+ Add Custom Class</button>
            <button class="btn btn-secondary" onclick="app.quickLoadBranchCurriculum()">📚 Load Branch Subjects</button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = classes.map(c => `
      <div class="class-schedule-card">
        <div>
          <div class="class-card-header">
            <span class="class-time-badge">${c.time}</span>
            <span class="type-pill ${c.type.toLowerCase()}">${c.type}</span>
          </div>
          <h3 class="class-title">${c.subject}</h3>
          <div class="class-professor">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${c.professor}
          </div>
        </div>
        <div class="class-location-footer">
          <span class="room-chip">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
            ${c.room}
          </span>
          <div style="display:flex; gap:0.35rem;">
            <button class="btn-att-action" style="max-width: fit-content; padding: 0.25rem 0.55rem; font-size: 0.72rem;" onclick="app.quickMarkSubjectAttendance('${c.subjectId}', 1)">
              + Attended
            </button>
            <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.72rem; color:var(--danger);" onclick="app.deleteTimetableClass('${activeDay}', '${c.id}')" title="Delete lecture">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  switchTimetableDay(day) {
    this.currentTimetableDay = day;
    this.renderTimetable();
  }

  deleteTimetableClass(day, classId) {
    if (confirm("Remove this class from your schedule?")) {
      this.storage.deleteTimetableClass(day, classId);
      this.showToast("Class removed from schedule", "info");
    }
  }

  // ------------------------------------------
  // MODULE 3: ATTENDANCE & 75% CALCULATOR
  // ------------------------------------------
  renderAttendance() {
    const subjects = this.storage.data.subjects;
    
    // 1. Calculate overall summary
    let totalClasses = 0;
    let totalAttended = 0;
    subjects.forEach(s => {
      totalClasses += s.totalClasses || 0;
      totalAttended += s.attendedClasses || 0;
    });
    const totalMissed = totalClasses - totalAttended;
    const overallPct = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(1) : "0.0";

    // Update Circular Gauge
    const gaugeVal = document.getElementById("attOverallPercentText");
    if (gaugeVal) gaugeVal.textContent = `${overallPct}%`;
    const gaugeCircle = document.getElementById("attGaugeCircle");
    if (gaugeCircle) {
      const radius = 45;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (circumference * parseFloat(overallPct) / 100);
      gaugeCircle.style.strokeDashoffset = offset;
      gaugeCircle.style.stroke = parseFloat(overallPct) >= 75 ? "var(--success)" : "var(--danger)";
    }

    const totalClsEl = document.getElementById("attTotalClassesStat");
    if (totalClsEl) totalClsEl.textContent = totalClasses;
    const totalAttEl = document.getElementById("attTotalAttendedStat");
    if (totalAttEl) totalAttEl.textContent = totalAttended;
    const totalMisEl = document.getElementById("attTotalMissedStat");
    if (totalMisEl) totalMisEl.textContent = totalMissed;

    // 2. Render Overall 75% Smart Prediction Box
    const simBox = document.getElementById("att75PredictionBox");
    if (simBox) {
      if (totalClasses === 0) {
        simBox.className = "simulator-result-box";
        simBox.style.borderColor = "var(--border-color)";
        simBox.style.background = "var(--bg-card-subtle)";
        simBox.innerHTML = `
          <div class="sim-icon-circle" style="background:var(--primary-600); color:white;">✨</div>
          <div>
            <div class="sim-text-title" style="color: var(--text-heading);">New Semester: 0 Classes Conducted</div>
            <div class="sim-text-desc">You have not logged any classes yet. Click <strong>+ Present</strong> or <strong>- Absent</strong> on any subject below to track your attendance and calculate your 75% cutoff in real-time.</div>
          </div>
        `;
      } else if (parseFloat(overallPct) >= 75) {
        const safeBunks = Math.floor((totalAttended - 0.75 * totalClasses) / 0.75);
        simBox.className = "simulator-result-box safe";
        simBox.innerHTML = `
          <div class="sim-icon-circle">✓</div>
          <div>
            <div class="sim-text-title" style="color: var(--success);">You are in the Safe Attendance Zone!</div>
            <div class="sim-text-desc">Your overall attendance is <strong>${overallPct}%</strong>. You can safely miss up to <strong>${safeBunks} classes</strong> without dropping below the mandatory 75% university criteria.</div>
          </div>
        `;
      } else {
        const reqClasses = Math.max(1, Math.ceil((3 * totalClasses - 4 * totalAttended)));
        simBox.className = "simulator-result-box warning";
        simBox.innerHTML = `
          <div class="sim-icon-circle">⚠</div>
          <div>
            <div class="sim-text-title" style="color: var(--danger);">Attendance Shortage Warning (<75%)</div>
            <div class="sim-text-desc">Your attendance is <strong>${overallPct}%</strong>. You must attend the next <strong>${reqClasses} consecutive classes</strong> without missing any to restore eligibility for midterm exams!</div>
          </div>
        `;
      }
    }

    // 3. Render Subject-wise Cards
    const grid = document.getElementById("subjectAttendanceGrid");
    if (!grid) return;

    if (subjects.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📚</div>
          <h3 style="font-size: 1.2rem; font-weight: 700;">No subjects added yet</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0.25rem 0 1.25rem;">Add your subjects manually or load preset curriculum for your stream/branch.</p>
          <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="app.openModal('modalAddSubject')">+ Add Custom Subject</button>
            <button class="btn btn-secondary" onclick="app.quickLoadBranchCurriculum()">📚 Load Branch Subjects</button>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = subjects.map(s => {
      const tot = s.totalClasses || 0;
      const att = s.attendedClasses || 0;
      const pctNum = tot > 0 ? (att / tot) * 100 : 0;
      const pctStr = pctNum.toFixed(1);
      
      let statusClass = "safe";
      let adviceText = "";

      if (tot === 0) {
        statusClass = "neutral";
        adviceText = "✨ 0 classes logged (Click + Present to start)";
      } else if (pctNum >= 80) {
        statusClass = "safe";
        const bunks = Math.floor((att - 0.75 * tot) / 0.75);
        adviceText = bunks > 0 ? `🛡️ You can safely miss ${bunks} lecture${bunks > 1 ? 's' : ''}` : `✓ On track for 75% criteria`;
      } else if (pctNum >= 75) {
        statusClass = "warning";
        adviceText = `⚠️ Borderline! Do not miss the next upcoming lecture`;
      } else {
        statusClass = "danger";
        const need = Math.ceil(3 * tot - 4 * att);
        adviceText = `🚨 Shortage: Must attend next ${need} lecture${need > 1 ? 's' : ''}`;
      }

      return `
        <div class="subject-att-card">
          <div>
            <div class="subject-header-row">
              <div class="subject-name-col">
                <span class="sub-code-badge">${s.code}</span>
                <h3 class="sub-name-heading">${s.name}</h3>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">👨‍🏫 ${s.faculty}</div>
              </div>
              <div class="sub-percentage-pill ${statusClass}">
                ${pctStr}%
              </div>
            </div>

            <div class="attendance-progress-wrap">
              <div class="att-ratio-label">
                <span>Classes attended: <strong>${att} / ${tot}</strong></span>
                <span>Missed: <strong>${tot - att}</strong></span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill ${statusClass}" style="width: ${Math.min(100, pctNum)}%;"></div>
              </div>
            </div>

            <div class="att-status-tip" style="${statusClass === 'danger' ? 'background: var(--danger-bg); color: var(--danger); font-weight:700;' : ''}">
              ${adviceText}
            </div>
          </div>

          <div class="att-actions-row">
            <button class="btn-att-action btn-att-present" onclick="app.quickMarkSubjectAttendance('${s.id}', 1)" title="Mark present today">
              + Present
            </button>
            <button class="btn-att-action btn-att-absent" onclick="app.quickMarkSubjectAttendance('${s.id}', 0)" title="Mark absent today">
              - Absent
            </button>
            <button class="btn-att-action btn-secondary" style="flex:0.4;" onclick="app.openEditAttendanceModal('${s.id}')" title="Edit exact count">
              ✏️
            </button>
            <button class="btn-att-action btn-secondary" style="flex:0.4; color:var(--danger);" onclick="app.deleteSubject('${s.id}')" title="Delete subject">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  quickMarkSubjectAttendance(subjectId, deltaAttended) {
    const sub = this.storage.recordAttendance(subjectId, deltaAttended, 1);
    if (sub) {
      if (deltaAttended === 1) {
        this.showToast(`Marked Present for ${sub.shortName || sub.name} (+1)`, "success");
      } else {
        this.showToast(`Marked Absent for ${sub.shortName || sub.name}`, "warning");
      }
    }
  }

  deleteSubject(subjectId) {
    if (confirm("Remove this subject from your dashboard?")) {
      this.storage.deleteSubject(subjectId);
      this.showToast("Subject removed", "info");
    }
  }

  // ------------------------------------------
  // MODULE 4: ASSIGNMENTS & TASKS
  // ------------------------------------------
  renderAssignments() {
    const container = document.getElementById("assignmentsGrid");
    if (!container) return;

    let list = [...this.storage.data.assignments];

    if (this.activeAssignmentStatus !== "All") {
      list = list.filter(a => a.status === this.activeAssignmentStatus);
    }

    if (this.activeAssignmentSubject !== "All") {
      list = list.filter(a => a.subject === this.activeAssignmentSubject);
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
          <h3 style="font-size: 1.2rem; font-weight: 700;">No assignments found</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0.25rem 0 1rem;">Click below to add your homework, lab reports or projects.</p>
          <button class="btn btn-primary" onclick="app.openModal('modalAddAssignment')">+ Add New Assignment</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(a => {
      const isDone = a.status === "Submitted";
      const days = this.calculateDaysRemaining(a.deadline);
      const isUrgent = days <= 2 && !isDone;
      const formattedDate = new Date(a.deadline).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

      let countdownBadgeHtml = "";
      if (isDone) {
        countdownBadgeHtml = `<div class="assignment-countdown-box" style="background:var(--success-bg); border-color:var(--success-border); color:var(--success);">✓ Completed & Submitted</div>`;
      } else if (days < 0) {
        countdownBadgeHtml = `<div class="assignment-countdown-box urgent">🚨 Overdue by ${Math.abs(days)} day(s)</div>`;
      } else if (days === 0) {
        countdownBadgeHtml = `<div class="assignment-countdown-box urgent">⏰ Due Today! Submit before midnight</div>`;
      } else {
        countdownBadgeHtml = `<div class="assignment-countdown-box ${isUrgent ? 'urgent' : ''}">⏳ ${days} day(s) remaining (${formattedDate})</div>`;
      }

      return `
        <div class="assignment-card">
          <div>
            <div class="assignment-top-row">
              <span class="sub-code-badge">${a.subject} • ${a.subjectCode || ''}</span>
              <span class="priority-tag ${a.priority}">${a.priority} Priority</span>
            </div>
            <h3 class="assignment-title">${a.title}</h3>
            <p class="assignment-desc">${a.description || 'Complete all requirements according to faculty guidelines.'}</p>
            ${countdownBadgeHtml}
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.75rem;">
              📦 Submission via: <strong>${a.submissionMode}</strong> (${a.points} Points)
            </div>
          </div>

          <div class="assignment-footer-controls">
            <div style="display:flex; align-items:center; gap: 0.5rem;">
              <select class="status-dropdown" onchange="app.changeAssignmentStatus('${a.id}', this.value)">
                <option value="Pending" ${a.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="In Progress" ${a.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Submitted" ${a.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
              </select>
            </div>
            <button class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; color: var(--danger);" onclick="app.deleteAssignment('${a.id}')" title="Delete assignment">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  filterAssignmentsStatus(status) {
    this.activeAssignmentStatus = status;
    document.querySelectorAll(".asg-status-filter-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-status") === status);
    });
    this.renderAssignments();
  }

  filterAssignmentsSubject(subject) {
    this.activeAssignmentSubject = subject;
    document.querySelectorAll(".asg-subject-filter-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-sub") === subject);
    });
    this.renderAssignments();
  }

  changeAssignmentStatus(id, newStatus) {
    this.storage.updateAssignmentStatus(id, newStatus);
    this.showToast(`Assignment status updated to: ${newStatus}`, newStatus === "Submitted" ? "success" : "info");
  }

  toggleAssignmentDone(id) {
    const asg = this.storage.data.assignments.find(a => a.id === id);
    if (!asg) return;
    const nextStatus = asg.status === "Submitted" ? "In Progress" : "Submitted";
    this.storage.updateAssignmentStatus(id, nextStatus);
    this.showToast(nextStatus === "Submitted" ? "Assignment marked as completed! 🎉" : "Assignment marked as In Progress", "success");
  }

  deleteAssignment(id) {
    if (confirm("Are you sure you want to delete this assignment?")) {
      this.storage.deleteAssignment(id);
      this.showToast("Assignment removed", "info");
    }
  }

  // ------------------------------------------
  // MODULE 5: EXAMS & LIVE COUNTDOWN
  // ------------------------------------------
  renderExams() {
    const exams = this.storage.data.exams;
    const nextExam = exams[0];

    const bannerContainer = document.getElementById("nextExamHeroBanner");
    if (bannerContainer) {
      if (nextExam) {
        bannerContainer.innerHTML = `
          <div style="position: relative; z-index: 2; max-width: 600px;">
            <span class="hero-badge-pill">🎯 Upcoming Examination</span>
            <h2 style="font-size: 1.75rem; font-weight: 800; color: white; margin-bottom: 0.35rem;">${nextExam.subject}</h2>
            <div style="display:flex; gap:1.25rem; font-size:0.86rem; color:#C7D2FE; margin-bottom: 1rem;">
              <span>📅 ${new Date(nextExam.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
              <span>📍 ${nextExam.room}</span>
              <span>🪑 Seat: <strong>${nextExam.seatNo}</strong></span>
            </div>
            <div class="countdown-timer-units" id="heroExamCountdownSlots">
              <!-- Dynamic ticking slots -->
            </div>
          </div>
          <div style="position: relative; z-index: 2; text-align: right; background: rgba(255,255,255,0.08); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.15); min-width: 200px;">
            <div style="font-size:0.75rem; color:#C7D2FE; text-transform:uppercase;">Weightage</div>
            <div style="font-size:1.8rem; font-weight:800; color:white;">${nextExam.weightage}</div>
            <div style="font-size:0.78rem; color:#A5B4FC;">Max Marks: ${nextExam.totalMarks}</div>
          </div>
        `;
      } else {
        bannerContainer.innerHTML = `
          <div style="position: relative; z-index: 2; max-width: 600px;">
            <span class="hero-badge-pill">🎯 Examination Portal</span>
            <h2 style="font-size: 1.75rem; font-weight: 800; color: white; margin-bottom: 0.35rem;">No Exams Scheduled Yet</h2>
            <p style="font-size:0.88rem; color:#C7D2FE; margin-bottom: 1rem;">Click "+ Add Exam Entry" to schedule your upcoming midterms or final semester papers.</p>
            <button class="btn btn-primary" onclick="app.openModal('modalAddExam')">+ Schedule First Exam</button>
          </div>
        `;
      }
    }

    this.updateExamsLiveCountdown();

    const matrixGrid = document.getElementById("examsMatrixGrid");
    if (!matrixGrid) return;

    if (exams.length === 0) {
      matrixGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No exams in timetable.</div>`;
      return;
    }

    matrixGrid.innerHTML = exams.map(ex => {
      const examDate = new Date(ex.date);
      const daysLeft = this.calculateDaysRemaining(ex.date);
      const topics = ex.syllabusTopics || [];
      const completedTopics = topics.filter(t => t.completed).length;
      const prepPct = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0;

      return `
        <div class="exam-schedule-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
              <span class="sub-code-badge">${ex.subjectCode || 'EXAM'}</span>
              <span class="priority-tag ${daysLeft <= 5 ? 'High' : 'Medium'}">${daysLeft} days left</span>
            </div>
            <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:0.35rem;">${ex.subject}</h3>
            <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">
              <div>📅 ${examDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} • ${examDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              <div style="margin-top:0.25rem;">📍 <strong>${ex.room}</strong> (Seat: ${ex.seatNo})</div>
            </div>

            <div style="margin: 1rem 0;">
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted); margin-bottom:0.35rem;">
                <span>Syllabus Prepared (${completedTopics}/${topics.length} Units)</span>
                <span><strong>${prepPct}%</strong></span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill ${prepPct >= 75 ? 'success' : prepPct >= 40 ? 'warning' : 'danger'}" style="width:${prepPct}%;"></div>
              </div>
            </div>

            <div class="syllabus-checklist-section">
              <div style="font-size:0.78rem; font-weight:700; text-transform:uppercase; color:var(--text-subtle); margin-bottom:0.5rem;">Syllabus Checklist</div>
              ${topics.map((t, idx) => `
                <div class="syllabus-topic-item ${t.completed ? 'done' : ''}" onclick="app.toggleExamTopicCheck('${ex.id}', ${idx})">
                  <div class="custom-checkbox" style="width:16px; height:16px;">${t.completed ? '✓' : ''}</div>
                  <span>${t.name}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  updateExamsLiveCountdown() {
    const slotsEl = document.getElementById("heroExamCountdownSlots");
    if (!slotsEl) return;

    const nextExam = this.storage.data.exams[0];
    if (!nextExam) return;

    const targetTime = new Date(nextExam.date).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, targetTime - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    slotsEl.innerHTML = `
      <div class="countdown-box"><span class="val">${days}</span><span class="lbl">Days</span></div>
      <div class="countdown-box"><span class="val">${String(hours).padStart(2, '0')}</span><span class="lbl">Hours</span></div>
      <div class="countdown-box"><span class="val">${String(minutes).padStart(2, '0')}</span><span class="lbl">Mins</span></div>
      <div class="countdown-box"><span class="val">${String(seconds).padStart(2, '0')}</span><span class="lbl">Secs</span></div>
    `;
  }

  toggleExamTopicCheck(examId, topicIndex) {
    this.storage.toggleExamTopic(examId, topicIndex);
    this.renderExams();
  }

  // ------------------------------------------
  // MODULE 6: STUDY NOTES
  // ------------------------------------------
  renderNotes() {
    const container = document.getElementById("notesMasonryGrid");
    if (!container) return;

    let notes = [...this.storage.data.notes];

    if (this.activeNoteFilter !== "All") {
      notes = notes.filter(n => n.subject === this.activeNoteFilter);
    }

    notes.sort((a, b) => {
      if (a.pinned === b.pinned) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      return a.pinned ? -1 : 1;
    });

    if (notes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📝</div>
          <h3 style="font-size: 1.2rem; font-weight: 700;">No notes found for ${this.activeNoteFilter}</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0.25rem 0 1rem;">Click "+ Add Note" to create a formula cheatsheet or code snippet.</p>
          <button class="btn btn-primary" onclick="app.openModal('modalAddNote')">+ Add Note</button>
        </div>
      `;
      return;
    }

    container.innerHTML = notes.map(n => `
      <div class="note-card ${n.pinned ? 'pinned' : ''}">
        <button class="note-pin-btn" onclick="app.toggleNotePin('${n.id}')" title="${n.pinned ? 'Unpin note' : 'Pin note to top'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${n.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
        </button>

        <div>
          <span class="sub-code-badge">${n.subject}</span>
          <h3 style="font-size:1.15rem; font-weight:700; margin:0.35rem 0 0.5rem; padding-right:1.5rem;">${n.title}</h3>
          
          ${n.content ? `
            <div class="note-content-preview">
              ${this.formatNoteContent(n.content)}
            </div>
          ` : ''}

          <!-- PDF Attachment Preview Box -->
          ${n.pdf ? `
            <div class="note-pdf-box" style="margin:0.85rem 0; padding:0.75rem 0.85rem; background:rgba(79, 70, 229, 0.08); border:1px solid rgba(79, 70, 229, 0.22); border-radius:var(--radius-md);">
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.6rem; overflow:hidden;">
                <span style="font-size:1.4rem;">📄</span>
                <div style="overflow:hidden;">
                  <div style="font-weight:700; font-size:0.82rem; color:var(--primary-700); text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${n.pdf.name || 'Attached Study PDF'}</div>
                  <div style="font-size:0.7rem; color:var(--text-muted);">${n.pdf.size || 'PDF Document'}</div>
                </div>
              </div>
              <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                <button type="button" class="btn btn-primary" style="padding:0.3rem 0.75rem; font-size:0.75rem; font-weight:700;" onclick="app.viewNotePdf('${n.id}')">
                  👁️ View PDF
                </button>
                <a href="${n.pdf.dataUrl || n.pdf.url}" download="${n.pdf.name || 'study_notes.pdf'}" class="btn btn-secondary" style="padding:0.3rem 0.65rem; font-size:0.75rem;">
                  ⬇️ Download
                </a>
                <a href="${n.pdf.dataUrl || n.pdf.url}" target="_blank" class="btn btn-secondary" style="padding:0.3rem 0.55rem; font-size:0.75rem;" title="Open in Fullscreen Browser Tab">
                  ↗️ Tab
                </a>
              </div>
            </div>
          ` : ''}

          <div class="note-tags-wrap">
            ${(n.tags || []).map(t => `<span class="note-tag">#${t}</span>`).join("")}
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:1.25rem; padding-top:0.75rem; border-top:1px solid var(--border-light); font-size:0.75rem; color:var(--text-subtle);">
          <span>Edited ${new Date(n.updatedAt).toLocaleDateString()}</span>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);" onclick="app.deleteNote('${n.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `).join("");
  }

  filterNotesSubject(subject) {
    this.activeNoteFilter = subject;
    document.querySelectorAll(".note-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-sub") === subject);
    });
    this.renderNotes();
  }

  formatNoteContent(raw) {
    if (!raw) return "";
    return raw
      .replace(/###\s/g, "<strong>")
      .replace(/##\s/g, "<strong>")
      .replace(/#\s/g, "<strong>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code style='background:var(--bg-card-subtle); padding:1px 4px; border-radius:3px;'>$1</code>")
      .replace(/\n/g, "<br>");
  }

  toggleNotePin(id) {
    this.storage.togglePinNote(id);
    this.renderNotes();
  }

  deleteNote(id) {
    if (confirm("Delete this study note?")) {
      this.storage.deleteNote(id);
      this.showToast("Note deleted", "info");
    }
  }

  // --- PDF Attachment Handlers ---
  handleNotePdfFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      this.showToast("Please select a valid PDF document (.pdf)", "danger");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      this.currentAttachedNotePdf = {
        name: file.name,
        size: this.formatBytes(file.size),
        dataUrl: event.target.result
      };
      this.updateNotePdfPreviewUI();
      this.showToast(`Attached PDF: "${file.name}"! 📄`, "success");
    };
    reader.readAsDataURL(file);
  }

  removeAttachedNotePdf() {
    this.currentAttachedNotePdf = null;
    const fileInput = document.getElementById("noteInputPdfFile");
    if (fileInput) fileInput.value = "";
    this.updateNotePdfPreviewUI();
  }

  updateNotePdfPreviewUI() {
    const previewBox = document.getElementById("notePdfPreviewBox");
    const fileNameEl = document.getElementById("notePdfFileName");
    const fileSizeEl = document.getElementById("notePdfFileSize");

    if (this.currentAttachedNotePdf) {
      if (previewBox) previewBox.style.display = "flex";
      if (fileNameEl) fileNameEl.textContent = this.currentAttachedNotePdf.name;
      if (fileSizeEl) fileSizeEl.textContent = this.currentAttachedNotePdf.size;
    } else {
      if (previewBox) previewBox.style.display = "none";
    }
  }

  async viewNotePdf(noteId) {
    const note = this.storage.data.notes.find(n => n.id === noteId);
    if (!note || !note.pdf) {
      this.showToast("No PDF document attached to this note", "warning");
      return;
    }

    let pdfData = note.pdf.dataUrl || note.pdf.url;
    if (!pdfData && note.pdf.id) {
      const record = await this.storage.docDB.getPdf(note.pdf.id);
      pdfData = record?.dataUrl;
    }

    if (!pdfData) {
      this.showToast("Could not load PDF document", "danger");
      return;
    }

    const titleEl = document.getElementById("pdfViewerTitle");
    const subEl = document.getElementById("pdfViewerSubtitle");
    const iframe = document.getElementById("pdfViewerIframe");
    const downloadBtn = document.getElementById("pdfViewerDownloadBtn");
    const openNewTabBtn = document.getElementById("pdfViewerOpenNewTabBtn");

    if (titleEl) titleEl.textContent = note.title;
    if (subEl) subEl.textContent = `${note.pdf.name} • ${note.pdf.size || 'PDF Document'}`;

    if (this._activePdfBlobUrl) {
      URL.revokeObjectURL(this._activePdfBlobUrl);
      this._activePdfBlobUrl = null;
    }

    let displayUrl = pdfData;
    if (typeof pdfData === "string" && pdfData.startsWith("data:application/pdf")) {
      try {
        const base64Data = pdfData.split(",")[1];
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        displayUrl = URL.createObjectURL(blob);
        this._activePdfBlobUrl = displayUrl;
      } catch (e) {
        displayUrl = pdfData;
      }
    }

    if (iframe) iframe.src = displayUrl;
    if (downloadBtn) {
      downloadBtn.href = displayUrl;
      downloadBtn.download = note.pdf.name || "study_notes.pdf";
    }
    if (openNewTabBtn) {
      openNewTabBtn.href = displayUrl;
    }

    this.openModal("modalPdfViewer");
  }

  formatBytes(bytes, decimals = 2) {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  // ------------------------------------------
  // MODULE 7: EVENTS & NOTICES
  // ------------------------------------------
  renderEvents() {
    const container = document.getElementById("eventsGridLayout");
    if (!container) return;

    let events = [...this.storage.data.events];

    if (this.activeEventFilter !== "All") {
      events = events.filter(e => e.category === this.activeEventFilter);
    }

    if (events.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No campus events listed currently.</div>`;
    } else {
      container.innerHTML = events.map(ev => {
        const dateObj = new Date(ev.date);
        const days = this.calculateDaysRemaining(ev.date);

        return `
          <div class="event-item-card">
            <img src="${ev.image}" alt="${ev.title}" class="event-banner-img" />
            <div class="event-card-body">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                  <span class="sub-code-badge">${ev.category}</span>
                  <span class="priority-tag Low">${ev.badge || 'Campus Event'}</span>
                </div>
                <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:0.35rem;">${ev.title}</h3>
                <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.85rem; line-height:1.4;">${ev.description}</p>
                
                <div style="font-size:0.8rem; color:var(--text-muted); display:flex; flex-direction:column; gap:0.25rem; margin-bottom:1rem;">
                  <div>📅 <strong>${dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</strong> • ${dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${days}d left)</div>
                  <div>📍 Venue: <strong>${ev.venue}</strong></div>
                  <div>👥 Org: ${ev.organizer}</div>
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; pt:0.75rem; border-top:1px solid var(--border-light);">
                <button class="btn ${ev.attending ? 'btn-primary' : 'btn-secondary'}" style="width:100%;" onclick="app.toggleEventRSVP('${ev.id}')">
                  ${ev.attending ? '✓ RSVP Attending' : '⭐ Register / Interested'}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    // Render Notices List
    const noticesList = document.getElementById("officialNoticesList");
    if (noticesList) {
      if (this.storage.data.notices.length === 0) {
        noticesList.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-muted);">No official university notices currently posted.</div>`;
      } else {
        noticesList.innerHTML = this.storage.data.notices.map(n => `
          <div class="official-notice-card ${n.priority === 'High' ? 'high-priority' : ''}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
              <span style="font-size:0.72rem; font-weight:700; text-transform:uppercase; color:${n.priority === 'High' ? 'var(--danger)' : 'var(--primary-600)'};">
                🏛️ ${n.department}
              </span>
              <span style="font-size:0.74rem; color:var(--text-subtle);">${n.date}</span>
            </div>
            <h4 style="font-size:1.02rem; font-weight:700; margin-bottom:0.35rem;">${n.title}</h4>
            <p style="font-size:0.84rem; color:var(--text-muted); line-height:1.45;">${n.content}</p>
          </div>
        `).join("");
      }
    }
  }

  filterEventsCategory(cat) {
    this.activeEventFilter = cat;
    document.querySelectorAll(".event-cat-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-cat") === cat);
    });
    this.renderEvents();
  }

  toggleEventRSVP(id) {
    const ev = this.storage.toggleEventAttendance(id);
    this.showToast(ev.attending ? "RSVP confirmed for event!" : "RSVP removed", "info");
  }

  // ------------------------------------------
  // MODULE 8: EXPENSES
  // ------------------------------------------
  renderExpenses() {
    const expenses = this.storage.data.expenses;
    const budget = expenses.monthlyBudget || 10000;
    const items = expenses.items || [];

    const totalSpent = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const balance = Math.max(0, budget - totalSpent);
    const spentPct = Math.min(100, Math.round((totalSpent / budget) * 100));

    // Summary Metrics
    const budgetEl = document.getElementById("expMonthlyBudget");
    if (budgetEl) budgetEl.textContent = `₹${budget.toLocaleString()}`;
    const spentEl = document.getElementById("expTotalSpent");
    if (spentEl) spentEl.textContent = `₹${totalSpent.toLocaleString()}`;
    const balEl = document.getElementById("expBalanceLeft");
    if (balEl) balEl.textContent = `₹${balance.toLocaleString()}`;
    const progEl = document.getElementById("expBudgetProgressBar");
    if (progEl) {
      progEl.style.width = `${spentPct}%`;
      progEl.className = `progress-bar-fill ${spentPct >= 90 ? 'danger' : spentPct >= 75 ? 'warning' : 'success'}`;
    }

    // Category Breakdown Bars
    const categories = ["Food", "Transport", "Hostel", "Study materials", "Entertainment", "Other"];
    const catTotals = {};
    categories.forEach(c => catTotals[c] = 0);
    items.forEach(i => {
      const cat = i.category || "Other";
      catTotals[cat] = (catTotals[cat] || 0) + (parseFloat(i.amount) || 0);
    });

    const breakdownContainer = document.getElementById("expCategoryBreakdown");
    if (breakdownContainer) {
      breakdownContainer.innerHTML = categories.map(cat => {
        const amt = catTotals[cat] || 0;
        const pct = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
        return `
          <div class="category-bar-item">
            <div class="category-bar-header">
              <span>${cat}</span>
              <span>₹${amt.toLocaleString()} (${pct}%)</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width:${pct}%;"></div>
            </div>
          </div>
        `;
      }).join("");
    }

    // Transactions Table
    const tableBody = document.getElementById("expTransactionsTableBody");
    if (tableBody) {
      if (items.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No expenses recorded yet. Log your first expense using "+ Add Expense".</td></tr>`;
      } else {
        tableBody.innerHTML = items.map(exp => `
          <tr>
            <td><strong>${exp.title}</strong></td>
            <td><span class="expense-category-chip ${exp.category.replace(/\s+/g, '-')}">${exp.category}</span></td>
            <td>${exp.date}</td>
            <td><span style="font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted);">${exp.mode}</span></td>
            <td><strong style="color:var(--text-heading);">₹${parseFloat(exp.amount).toLocaleString()}</strong></td>
            <td>
              <button class="btn btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem; color:var(--danger);" onclick="app.deleteExpense('${exp.id}')">🗑️</button>
            </td>
          </tr>
        `).join("");
      }
    }
  }

  deleteExpense(id) {
    this.storage.deleteExpense(id);
    this.showToast("Expense removed", "info");
  }

  // ------------------------------------------
  // MODULE 9: PROFILE & ACADEMICS
  // ------------------------------------------
  renderProfile() {
    const prof = this.storage.data.profile;
    const avatarUrl = prof.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80";

    const profAvatarLarge = document.getElementById("profAvatarLarge");
    if (profAvatarLarge) profAvatarLarge.src = avatarUrl;
    const sidebarAvatar = document.getElementById("sidebarUserAvatar");
    if (sidebarAvatar) sidebarAvatar.src = avatarUrl;
    const modalPreview = document.getElementById("avatarModalPreview");
    if (modalPreview) modalPreview.src = avatarUrl;

    const nameEl = document.getElementById("profName");
    if (nameEl) nameEl.textContent = prof.name || "Student Name";
    const rollEl = document.getElementById("profRollNo");
    if (rollEl) rollEl.textContent = `${prof.rollNo || 'Roll No'} • ${prof.prn || 'PRN'}`;
    const courseEl = document.getElementById("profCourse");
    if (courseEl) courseEl.textContent = `${prof.branch || prof.course || 'Degree & Branch'}`;
    const collegeEl = document.getElementById("profCollege");
    if (collegeEl) collegeEl.textContent = prof.college || "College Name";
    const semEl = document.getElementById("profSemester");
    if (semEl) semEl.textContent = `Semester ${prof.semester || 1} (${prof.academicYear || '2026-2027'})`;
    const hostelEl = document.getElementById("profHostel");
    if (hostelEl) hostelEl.textContent = prof.hostel || "Not Specified";
    
    const cgpaEl = document.getElementById("profCGPA");
    if (cgpaEl) cgpaEl.textContent = (prof.cgpa || 0).toFixed(2);
    const creditsEl = document.getElementById("profCredits");
    if (creditsEl) creditsEl.textContent = `${prof.creditsEarned || 0} / ${prof.totalCredits || 160}`;

    const percentEl = document.getElementById("profEquivalentPercent");
    if (percentEl) {
      if (prof.cgpa > 0) {
        const pct = (prof.cgpa * 9.5).toFixed(1);
        percentEl.innerHTML = `Approx Percentage (CGPA × 9.5): <strong style="color:var(--primary-600);">${pct}%</strong>`;
      } else {
        percentEl.innerHTML = `Approx Percentage: <strong style="color:var(--text-muted);">0.0%</strong>`;
      }
    }

    // Sidebar small card sync
    const sideName = document.getElementById("sidebarStudentName");
    if (sideName) sideName.textContent = prof.name || "Student";
    const sideRole = document.getElementById("sidebarStudentRoll");
    if (sideRole) sideRole.textContent = `${prof.branch || prof.shortCourse || 'Course'} • Sem ${prof.semester || 1} (${prof.academicYear || '2026-2027'})`;

    // Semester GPA Progression
    const semGrid = document.getElementById("profSemHistoryGrid");
    if (semGrid) {
      const history = prof.semGpaHistory || [];
      if (history.length === 0) {
        semGrid.innerHTML = `
          <div style="text-align:center; padding:1.5rem; background:var(--bg-card-subtle); border-radius:var(--radius-md); border:1px dashed var(--border-color);">
            <div style="font-size:1.8rem; margin-bottom:0.3rem;">🎓</div>
            <div style="font-weight:700; font-size:0.92rem; margin-bottom:0.25rem;">No Semester SPI recorded yet</div>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.85rem;">Add your semester SPI / SGPA to automatically calculate your overall cumulative CGPA and percentage.</p>
            <button class="btn btn-primary" style="font-size:0.82rem; padding:0.45rem 1rem;" onclick="app.openModal('modalAddSpi')">
              + Add Semester SPI / SGPA
            </button>
          </div>
        `;
      } else {
        semGrid.innerHTML = history.map((s, idx) => `
          <div class="academic-sem-history-row" style="display:flex; align-items:center; justify-content:space-between; padding:0.85rem 1rem; background:var(--bg-card-subtle); border-radius:var(--radius-md); margin-bottom:0.5rem;">
            <div>
              <div style="font-weight:700; font-size:0.95rem;">${s.semester}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${s.credits || 20} Credits • Approx ${(s.gpa * 9.5).toFixed(1)}% Marks</div>
            </div>
            <div style="display:flex; align-items:center; gap:0.85rem;">
              <span style="font-family:var(--font-heading); font-weight:800; color:var(--primary-600); font-size:1.15rem;">${s.gpa.toFixed(2)} SPI</span>
              <button class="btn btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem; color:var(--danger);" onclick="app.deleteSemesterSpi(${idx})" title="Delete this semester SPI">🗑️</button>
            </div>
          </div>
        `).join("");
      }
    }

    // Emergency Contacts
    const emergencyList = document.getElementById("profEmergencyList");
    if (emergencyList) {
      const contacts = prof.emergencyContacts || [];
      if (contacts.length === 0) {
        emergencyList.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:var(--bg-card-subtle); border-radius:var(--radius-md); font-size:0.82rem; color:var(--text-muted);">
            <span>Gmail: <strong>${prof.email || 'Not verified'}</strong> • Phone: <strong>${prof.phone || 'Not verified'}</strong></span>
            <button class="btn btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem;" onclick="app.openEditProfileModal()">Edit Details</button>
          </div>
        `;
      } else {
        emergencyList.innerHTML = contacts.map(c => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:var(--bg-card-subtle); border-radius:var(--radius-md); margin-bottom:0.5rem;">
            <div>
              <div style="font-weight:700; font-size:0.88rem;">${c.name}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${c.relation}</div>
            </div>
            <a href="tel:${c.phone}" class="btn btn-primary" style="padding:0.35rem 0.75rem; font-size:0.78rem;">📞 ${c.phone}</a>
          </div>
        `).join("");
      }
    }
  }

  // ------------------------------------------
  // MODULE 10: TRAVEL & TRANSIT (TRAINS, FLIGHTS, BUS, CARS)
  // ------------------------------------------
  renderTravel() {
    const travel = this.storage.data.travel || [];
    
    // 1. Metric: Next Upcoming Trip
    const activeTrips = travel.filter(t => t.status !== "Completed" && t.status !== "Cancelled");
    
    const nextTrip = [...activeTrips].sort((a, b) => {
      const dateA = new Date(`${a.departureDate}T${a.departureTime || '00:00'}`);
      const dateB = new Date(`${b.departureDate}T${b.departureTime || '00:00'}`);
      return dateA - dateB;
    })[0];

    const nextTripEl = document.getElementById("travelMetricNextTrip");
    const nextTripCountdown = document.getElementById("travelMetricCountdown");
    if (nextTrip) {
      if (nextTripEl) nextTripEl.textContent = `${nextTrip.mode}: ${nextTrip.origin.split(" ")[0]} → ${nextTrip.destination.split(" ")[0]}`;
      const days = this.calculateDaysRemaining(nextTrip.departureDate);
      if (nextTripCountdown) {
        if (days === 0) nextTripCountdown.innerHTML = `⚡ <strong>Departing Today</strong> at ${nextTrip.departureTime}`;
        else if (days === 1) nextTripCountdown.innerHTML = `🔥 <strong>Tomorrow</strong> at ${nextTrip.departureTime}`;
        else if (days > 1) nextTripCountdown.innerHTML = `⏳ In <strong>${days} days</strong> (${nextTrip.departureDate})`;
        else nextTripCountdown.innerHTML = `🏁 In progress / Passed`;
      }
    } else {
      if (nextTripEl) nextTripEl.textContent = "None Planned";
      if (nextTripCountdown) nextTripCountdown.textContent = "Click + Add Journey to plan";
    }

    // 2. Metric: Active Bookings
    const activeCountEl = document.getElementById("travelMetricActiveCount");
    if (activeCountEl) activeCountEl.textContent = activeTrips.length;
    const confirmedCountEl = document.getElementById("travelMetricConfirmedCount");
    const confirmedCount = travel.filter(t => t.status === "Confirmed").length;
    if (confirmedCountEl) confirmedCountEl.textContent = `${confirmedCount} Confirmed`;

    // 3. Metric: Total Travel Fares
    const totalFare = travel.reduce((acc, t) => acc + (parseFloat(t.fare) || 0), 0);
    const totalFareEl = document.getElementById("travelMetricTotalFare");
    if (totalFareEl) totalFareEl.textContent = `₹${totalFare.toLocaleString()}`;

    // Filter Trips by Mode
    const filter = this.activeTravelMode || "All";
    const filteredTrips = filter === "All" ? travel : travel.filter(t => t.mode.toLowerCase() === filter.toLowerCase());

    const grid = document.getElementById("travelCardsGrid");
    if (!grid) return;

    if (filteredTrips.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:3.5rem 1.5rem; background:var(--bg-card); border-radius:var(--radius-xl); border:1px dashed var(--border-color);">
          <div style="font-size:2.5rem; margin-bottom:0.75rem;">🚆 ✈️ 🚌 🚗</div>
          <h3 style="font-size:1.2rem; font-weight:800; margin-bottom:0.35rem;">No ${filter === 'All' ? '' : filter} journeys logged yet</h3>
          <p style="font-size:0.86rem; color:var(--text-muted); max-width:480px; margin:0 auto 1.25rem;">
            Keep track of your semester holiday train tickets, festival flights, weekend bus bookings, outstation car trips, and PNR details in one place!
          </p>
          <button class="btn btn-primary" onclick="app.openModal('modalAddTravel')">
            + Log First ${filter === 'All' ? 'Journey' : filter}
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filteredTrips.map(trip => {
      const days = this.calculateDaysRemaining(trip.departureDate);
      let countdownHtml = "";
      if (trip.status === "Completed") {
        countdownHtml = `<span style="font-size:0.72rem; padding:0.2rem 0.5rem; background:var(--bg-card-subtle); color:var(--text-muted); border-radius:var(--radius-full); font-weight:700;">✓ Completed</span>`;
      } else if (days === 0) {
        countdownHtml = `<span style="font-size:0.72rem; padding:0.2rem 0.5rem; background:rgba(239,68,68,0.15); color:var(--danger); border-radius:var(--radius-full); font-weight:800;">⚡ TODAY at ${trip.departureTime}</span>`;
      } else if (days === 1) {
        countdownHtml = `<span style="font-size:0.72rem; padding:0.2rem 0.5rem; background:rgba(245,158,11,0.15); color:var(--warning); border-radius:var(--radius-full); font-weight:800;">🔥 Tomorrow</span>`;
      } else if (days > 1) {
        countdownHtml = `<span style="font-size:0.72rem; padding:0.2rem 0.5rem; background:rgba(79,70,229,0.12); color:var(--primary-600); border-radius:var(--radius-full); font-weight:700;">⏳ In ${days} days</span>`;
      } else {
        countdownHtml = `<span style="font-size:0.72rem; padding:0.2rem 0.5rem; background:var(--bg-card-subtle); color:var(--text-muted); border-radius:var(--radius-full);">Passed</span>`;
      }

      let modeIcon = "🚆";
      if (trip.mode === "Flight") modeIcon = "✈️";
      if (trip.mode === "Bus") modeIcon = "🚌";
      if (trip.mode === "Car") modeIcon = "🚗";
      if (trip.mode === "Metro") modeIcon = "🚇";
      if (trip.mode === "Other") modeIcon = "➕";

      return `
        <div class="travel-ticket-card">
          <!-- Ticket Top -->
          <div class="travel-ticket-header">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span class="travel-mode-badge ${trip.mode}">${modeIcon} ${trip.mode}</span>
              <span style="font-size:0.8rem; font-weight:700; color:var(--text-heading);">${trip.carrierName || trip.mode}</span>
            </div>
            ${countdownHtml}
          </div>

          <!-- Trip Title -->
          <div style="padding: 0.85rem 1.25rem 0.25rem;">
            <h4 style="font-size: 1rem; font-weight: 800; color:var(--text-heading);">${trip.title}</h4>
          </div>

          <!-- Route Station & Times -->
          <div class="travel-route-section">
            <div class="travel-station-block">
              <div class="travel-station-name">${trip.origin}</div>
              <div class="travel-station-time">⏰ ${trip.departureTime}</div>
              <div class="travel-station-date">📅 ${trip.departureDate}</div>
            </div>

            <div class="travel-route-arrow">
              <span style="font-size:1.2rem; line-height:1; color:var(--primary-600);">➔</span>
              <span style="font-size:0.68rem; color:var(--text-muted); font-weight:600;">${trip.mode}</span>
            </div>

            <div class="travel-station-block" style="text-align:right;">
              <div class="travel-station-name">${trip.destination}</div>
              <div class="travel-station-time">⏰ ${trip.arrivalTime || '--:--'}</div>
              <div class="travel-station-date">📅 ${trip.arrivalDate || trip.departureDate}</div>
            </div>
          </div>

          <!-- Ticket Body / PNR & Details -->
          <div class="travel-ticket-body">
            ${trip.pnrOrSeat ? `
              <div class="travel-pnr-pill">
                <span>🎫 <strong>${trip.pnrOrSeat}</strong></span>
                <button class="btn btn-secondary" style="padding:0.15rem 0.45rem; font-size:0.7rem;" onclick="app.copyTravelPnr('${trip.pnrOrSeat.replace(/'/g, "\\'")}')" title="Copy PNR Details">📋 Copy</button>
              </div>
            ` : ''}

            ${trip.notes ? `
              <div style="font-size:0.78rem; color:var(--text-muted); background:var(--bg-card-subtle); padding:0.45rem 0.75rem; border-radius:var(--radius-sm);">
                📝 <strong>Notes:</strong> ${trip.notes}
              </div>
            ` : ''}
          </div>

          <!-- Ticket Footer -->
          <div class="travel-ticket-footer">
            <div>
              <span style="font-weight:800; color:var(--text-heading); font-size:0.92rem;">${trip.fare > 0 ? `₹${parseFloat(trip.fare).toLocaleString()}` : 'Free / Not logged'}</span>
              <span style="margin-left:0.4rem; font-size:0.75rem; font-weight:700; color:${trip.status === 'Confirmed' ? 'var(--success)' : 'var(--warning)'};">• ${trip.status}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              ${trip.status !== 'Completed' ? `
                <button class="btn btn-secondary" style="padding:0.25rem 0.55rem; font-size:0.75rem; color:var(--success);" onclick="app.toggleTravelStatus('${trip.id}', 'Completed')" title="Mark journey completed">✓ Done</button>
              ` : `
                <button class="btn btn-secondary" style="padding:0.25rem 0.55rem; font-size:0.75rem; color:var(--primary-600);" onclick="app.toggleTravelStatus('${trip.id}', 'Confirmed')" title="Reopen as active">↺ Active</button>
              `}
              <button class="btn btn-secondary" style="padding:0.25rem 0.55rem; font-size:0.75rem; color:var(--danger);" onclick="app.deleteTravelTrip('${trip.id}')" title="Delete journey">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  filterTravelMode(mode) {
    this.activeTravelMode = mode;
    const btns = document.querySelectorAll(".travel-filter-btn");
    btns.forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-mode") === mode);
    });
    this.renderTravel();
  }

  onTravelModeChange() {
    const mode = document.getElementById("travelInputMode")?.value;
    const carrierLabel = document.getElementById("travelCarrierLabel");
    const carrierInput = document.getElementById("travelInputCarrier");
    const originLabel = document.getElementById("travelOriginLabel");
    const originInput = document.getElementById("travelInputOrigin");
    const destLabel = document.getElementById("travelDestLabel");
    const destInput = document.getElementById("travelInputDest");
    const pnrLabel = document.getElementById("travelPnrLabel");
    const pnrInput = document.getElementById("travelInputPnr");

    if (mode === "Flight") {
      if (carrierLabel) carrierLabel.textContent = "Flight / Airline Name & Flight Number";
      if (carrierInput) carrierInput.placeholder = "e.g. IndiGo 6E-204 / Air India AI-802";
      if (originLabel) originLabel.textContent = "Departure Airport & Terminal";
      if (originInput) originInput.placeholder = "e.g. New Delhi (DEL T3) / Mumbai (BOM T2)";
      if (destLabel) destLabel.textContent = "Arrival Airport & Terminal";
      if (destInput) destInput.placeholder = "e.g. Bengaluru (BLR T1) / Goa (GOI)";
      if (pnrLabel) pnrLabel.textContent = "Flight PNR / E-Ticket & Seat (e.g. 14A)";
      if (pnrInput) pnrInput.placeholder = "e.g. PNR: XYZ98K • Seat 12F (Window)";
    } else if (mode === "Bus") {
      if (carrierLabel) carrierLabel.textContent = "Bus Service / Operator Name";
      if (carrierInput) carrierInput.placeholder = "e.g. Zingbus / IntrCity SmartBus / State RTC Volvo";
      if (originLabel) originLabel.textContent = "Boarding Point / City";
      if (originInput) originInput.placeholder = "e.g. Kashmiri Gate ISBT / College Gate";
      if (destLabel) destLabel.textContent = "Drop Location / City";
      if (destInput) destInput.placeholder = "e.g. Dehradun Clock Tower / Jaipur Sindhi Camp";
      if (pnrLabel) pnrLabel.textContent = "Ticket Booking ID & Seat Number";
      if (pnrInput) pnrInput.placeholder = "e.g. Seat: U12 (Upper Sleeper) • Ref: ZB-4920";
    } else if (mode === "Car") {
      if (carrierLabel) carrierLabel.textContent = "Car Model / Cab Operator / Ride Details";
      if (carrierInput) carrierInput.placeholder = "e.g. Uber Outstation / Shared Swift Dzire / Self Drive";
      if (originLabel) originLabel.textContent = "Pickup Location";
      if (originInput) originInput.placeholder = "e.g. Hostel Gate 1 / PG Campus";
      if (destLabel) destLabel.textContent = "Drop Location";
      if (destInput) destInput.placeholder = "e.g. Home Address / Airport Road";
      if (pnrLabel) pnrLabel.textContent = "Vehicle Number & Driver Contact";
      if (pnrInput) pnrInput.placeholder = "e.g. DL 1Z 4920 • Shared with 3 classmates";
    } else {
      if (carrierLabel) carrierLabel.textContent = "Train Name & Train Number";
      if (carrierInput) carrierInput.placeholder = "e.g. 12952 Mumbai Rajdhani / 12004 Shatabdi";
      if (originLabel) originLabel.textContent = "Boarding Station (Code / Name)";
      if (originInput) originInput.placeholder = "e.g. New Delhi (NDLS)";
      if (destLabel) destLabel.textContent = "Destination Station (Code / Name)";
      if (destInput) destInput.placeholder = "e.g. Mumbai Central (MMCT)";
      if (pnrLabel) pnrLabel.textContent = "10-Digit PNR & Coach / Seat Details";
      if (pnrInput) pnrInput.placeholder = "e.g. PNR: 2458910291 • Coach B4-42 (SL)";
    }
  }

  copyTravelPnr(pnrText) {
    if (!pnrText) return;
    navigator.clipboard?.writeText(pnrText).then(() => {
      this.showToast(`Copied "${pnrText}" to clipboard! 📋`, "success");
    }).catch(() => {
      prompt("Copy booking reference:", pnrText);
    });
  }

  deleteTravelTrip(id) {
    if (confirm("Remove this journey from your travel records?")) {
      this.storage.deleteTravelTrip(id);
      this.showToast("Journey removed", "info");
    }
  }

  toggleTravelStatus(id, newStatus) {
    this.storage.updateTravelStatus(id, newStatus);
    this.showToast(`Journey marked as ${newStatus}!`, "success");
  }

  // ==========================================
  // 7. GLOBAL SEARCH PALETTE (CMD+K / CTRL+K)
  // ==========================================
  initSearch() {
    const modal = document.getElementById("searchModal");
    const input = document.getElementById("globalSearchInput");
    const resultsContainer = document.getElementById("searchResultsContainer");

    const openSearch = () => {
      if (modal) {
        modal.classList.add("active");
        if (input) {
          input.value = "";
          input.focus();
          this.executeSearch("");
        }
      }
    };

    const closeSearch = () => {
      if (modal) modal.classList.remove("active");
    };

    document.querySelectorAll(".open-search-trigger").forEach(btn => {
      btn.addEventListener("click", openSearch);
    });

    document.getElementById("closeSearchBtn")?.addEventListener("click", closeSearch);

    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeSearch();
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "Escape" && modal?.classList.contains("active")) {
        closeSearch();
      }
    });

    input?.addEventListener("input", (e) => {
      this.executeSearch(e.target.value);
    });
  }

  executeSearch(query) {
    const resultsContainer = document.getElementById("searchResultsContainer");
    if (!resultsContainer) return;

    const q = query.trim().toLowerCase();
    const data = this.storage.data;
    const matches = [];

    // Search Subjects
    data.subjects.forEach(s => {
      if (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) {
        matches.push({ type: "Subject / Attendance", title: `${s.code}: ${s.name}`, sub: `Faculty: ${s.faculty} (${s.attendedClasses}/${s.totalClasses} attended)`, view: "attendance" });
      }
    });

    // Search Assignments
    data.assignments.forEach(a => {
      if (!q || a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q)) {
        matches.push({ type: "Assignment", title: a.title, sub: `${a.subject} • Status: ${a.status}`, view: "assignments" });
      }
    });

    // Search Notes
    data.notes.forEach(n => {
      if (!q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        matches.push({ type: "Study Note", title: n.title, sub: `${n.subject} • ${n.tags?.join(", ")}`, view: "notes" });
      }
    });

    // Search Events
    data.events.forEach(e => {
      if (!q || e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)) {
        matches.push({ type: "Campus Event", title: e.title, sub: `${e.venue} • ${e.category}`, view: "events" });
      }
    });

    // Search Exams
    data.exams.forEach(ex => {
      if (!q || ex.subject.toLowerCase().includes(q)) {
        matches.push({ type: "Exam Schedule", title: ex.subject, sub: `Room: ${ex.room} • Seat: ${ex.seatNo}`, view: "exams" });
      }
    });

    // Search Travel & Journeys
    (data.travel || []).forEach(trv => {
      if (!q || trv.title.toLowerCase().includes(q) || trv.origin.toLowerCase().includes(q) || trv.destination.toLowerCase().includes(q) || (trv.carrierName && trv.carrierName.toLowerCase().includes(q)) || trv.mode.toLowerCase().includes(q)) {
        matches.push({ type: `Travel (${trv.mode})`, title: `${trv.title}: ${trv.origin} → ${trv.destination}`, sub: `${trv.departureDate} at ${trv.departureTime} • ${trv.carrierName || trv.mode} • ${trv.status}`, view: "travel" });
      }
    });

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No matching college records found for "${query}"</div>`;
      return;
    }

    resultsContainer.innerHTML = matches.slice(0, 8).map(m => `
      <div class="search-result-item" onclick="app.selectSearchResult('${m.view}')" style="padding:0.75rem 1rem; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all var(--transition-fast); border-bottom:1px solid var(--border-light);">
        <div>
          <div style="font-weight:700; font-size:0.92rem;">${m.title}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${m.sub}</div>
        </div>
        <span class="sub-code-badge">${m.type}</span>
      </div>
    `).join("");
  }

  selectSearchResult(view) {
    document.getElementById("searchModal")?.classList.remove("active");
    this.navigateTo(view);
  }

  // ==========================================
  // 8. MODALS & FORMS BINDING
  // ==========================================
  bindEvents() {
    // Mandatory Student Login / Verification Form
    const loginForm = document.getElementById("studentLoginForm");
    loginForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginInputEmail").value.trim();
      const phone = document.getElementById("loginInputPhone").value.trim();
      const name = document.getElementById("loginInputName").value.trim();
      const stream = document.getElementById("loginInputStream").value;
      const branch = document.getElementById("loginInputBranch").value;
      const semester = parseInt(document.getElementById("loginInputSemester").value) || 1;
      const college = document.getElementById("loginInputCollege").value.trim();

      if (!email || !phone || !name) {
        alert("Please enter all required student details including Gmail and Phone number.");
        return;
      }

      this.storage.updateProfile({
        name,
        email,
        phone,
        stream,
        branch,
        course: branch,
        shortCourse: branch.split(" ")[0],
        semester,
        college,
        isVerified: true
      });

      // Auto load branch curriculum if subjects list is empty
      if (this.storage.data.subjects.length === 0) {
        const catalogSubjects = (COURSE_CATALOG[stream] && COURSE_CATALOG[stream][branch]) ? COURSE_CATALOG[stream][branch] : [];
        catalogSubjects.forEach((subName, i) => {
          const words = subName.split(" ");
          const initials = words.map(w => w[0]).join("").toUpperCase().substring(0, 4);
          const colors = ["#4F46E5", "#06B6D4", "#8B5CF6", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];
          this.storage.data.subjects.push({
            id: "sub_" + (Date.now() + i),
            code: `${initials}${101 + i}`,
            name: subName,
            shortName: words[0],
            faculty: "Faculty Member",
            color: colors[i % colors.length],
            totalClasses: 0,
            attendedClasses: 0,
            type: "Theory + Lab",
            credits: 4
          });
        });
        this.storage.saveData();
      }

      this.closeModal("modalStudentLogin");
      
      const pinVal = document.getElementById("loginInputPin")?.value.trim();
      if (pinVal && pinVal.length === 4) {
        this.storage.setSecurityPin(pinVal);
        const lockDot = document.getElementById("pinLockStatusDot");
        if (lockDot) lockDot.style.background = "var(--success)";
      }

      this.showToast(`Welcome ${name}! Student verification complete 🎓`, "success");
    });

    // Add Assignment Modal Form
    const asgForm = document.getElementById("addAssignmentForm");
    asgForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const newAsg = {
        title: document.getElementById("asgInputTitle").value,
        subject: document.getElementById("asgInputSubject").value,
        deadline: document.getElementById("asgInputDeadline").value,
        priority: document.getElementById("asgInputPriority").value,
        points: document.getElementById("asgInputPoints").value,
        description: document.getElementById("asgInputDesc").value,
        status: "Pending"
      };
      this.storage.addAssignment(newAsg);
      this.closeModal("modalAddAssignment");
      asgForm.reset();
      this.showToast("Assignment added successfully!", "success");
    });

    // Add Expense Modal Form
    const expForm = document.getElementById("addExpenseForm");
    expForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const newExp = {
        title: document.getElementById("expInputTitle").value,
        category: document.getElementById("expInputCategory").value,
        amount: document.getElementById("expInputAmount").value,
        date: document.getElementById("expInputDate").value || new Date().toISOString().split("T")[0],
        mode: document.getElementById("expInputMode").value
      };
      this.storage.addExpense(newExp);
      this.closeModal("modalAddExpense");
      expForm.reset();
      this.showToast("Expense logged!", "success");
    });

    // Add Note Modal Form
    const noteForm = document.getElementById("addNoteForm");
    noteForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const tagsStr = document.getElementById("noteInputTags").value;
      const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];
      const hasPdf = !!this.currentAttachedNotePdf;
      const newNote = {
        title: document.getElementById("noteInputTitle").value,
        subject: document.getElementById("noteInputSubject").value,
        tags: tags,
        content: document.getElementById("noteInputContent").value,
        pinned: document.getElementById("noteInputPinned").checked,
        pdf: this.currentAttachedNotePdf || null
      };
      this.storage.addNote(newNote);
      this.closeModal("modalAddNote");
      noteForm.reset();
      this.removeAttachedNotePdf();
      this.showToast(hasPdf ? "Study note & PDF attached successfully! 📄" : "Study note saved!", "success");
    });

    // Edit Profile Modal Form
    const profForm = document.getElementById("editProfileForm");
    profForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const updated = {
        name: document.getElementById("profInputName").value,
        email: document.getElementById("profInputEmail").value,
        phone: document.getElementById("profInputPhone").value,
        rollNo: document.getElementById("profInputRoll").value,
        prn: document.getElementById("profInputPRN").value,
        stream: document.getElementById("profInputStream").value,
        branch: document.getElementById("profInputBranch").value,
        course: document.getElementById("profInputBranch").value,
        college: document.getElementById("profInputCollege").value,
        hostel: document.getElementById("profInputHostel").value
      };

      const manualCgpaVal = document.getElementById("profInputCGPA").value;
      if (manualCgpaVal !== "") {
        updated.cgpa = parseFloat(manualCgpaVal) || 0.00;
      }

      this.storage.updateProfile(updated);
      this.closeModal("modalEditProfile");
      this.showToast("Profile updated successfully!", "success");
    });

    // Add Class Form
    const classForm = document.getElementById("addClassForm");
    classForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const day = document.getElementById("classInputDay").value;
      const lecture = {
        subject: document.getElementById("classInputSubject").value,
        type: document.getElementById("classInputType").value,
        startTime: document.getElementById("classInputStartTime").value,
        endTime: document.getElementById("classInputEndTime").value,
        professor: document.getElementById("classInputProf").value,
        room: document.getElementById("classInputRoom").value
      };
      this.storage.addTimetableClass(day, lecture);
      this.closeModal("modalAddClass");
      classForm.reset();
      this.showToast(`Added class to ${day} schedule!`, "success");
    });

    // Add Subject Form
    const subForm = document.getElementById("addSubjectForm");
    subForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("subInputName").value.trim();
      if (!name) return;
      const words = name.split(" ");
      const initials = words.map(w => w[0]).join("").toUpperCase().substring(0, 4);
      const codeVal = document.getElementById("subInputCode").value.trim() || `${initials}101`;
      const shortVal = document.getElementById("subInputShort").value.trim() || words[0];
      const facultyVal = document.getElementById("subInputFaculty").value.trim() || "Department Faculty";
      const creditsVal = parseInt(document.getElementById("subInputCredits").value) || 4;
      const attendedVal = parseInt(document.getElementById("subInputAttended").value) || 0;
      const totalVal = parseInt(document.getElementById("subInputTotal").value) || 0;

      const colors = ["#4F46E5", "#06B6D4", "#8B5CF6", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];
      const i = this.storage.data.subjects.length;

      const newSub = {
        name: name,
        code: codeVal,
        shortName: shortVal,
        faculty: facultyVal,
        color: colors[i % colors.length],
        credits: creditsVal,
        attendedClasses: attendedVal,
        totalClasses: totalVal,
        type: "Theory + Lab"
      };

      this.storage.addSubject(newSub);
      this.closeModal("modalAddSubject");
      subForm.reset();
      this.showToast(`Subject "${newSub.name}" (${newSub.code}) added! 🎉`, "success");
    });

    // Add Exam Form
    const examForm = document.getElementById("addExamForm");
    examForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const newExam = {
        subject: document.getElementById("examInputSubject").value,
        subjectCode: document.getElementById("examInputCode").value,
        category: document.getElementById("examInputCategory").value,
        date: document.getElementById("examInputDate").value,
        weightage: document.getElementById("examInputWeightage").value,
        room: document.getElementById("examInputRoom").value,
        seatNo: document.getElementById("examInputSeat").value
      };
      this.storage.addExam(newExam);
      this.closeModal("modalAddExam");
      examForm.reset();
      this.showToast("Exam added to timetable!", "success");
    });

    // Add Semester SPI Form
    const spiForm = document.getElementById("addSpiForm");
    spiForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const semester = document.getElementById("spiInputSemester").value;
      const gpa = document.getElementById("spiInputGpa").value;
      const credits = document.getElementById("spiInputCredits").value;
      this.storage.addSemesterSpi(semester, gpa, credits);
      this.closeModal("modalAddSpi");
      spiForm.reset();
      this.showToast(`Saved ${semester} SPI (${gpa}) • CGPA updated to ${this.storage.data.profile.cgpa.toFixed(2)} 🎉`, "success");
    });

    // Set Monthly Budget Form
    const budgetForm = document.getElementById("setBudgetForm");
    budgetForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const amt = document.getElementById("budgetInputAmount").value;
      this.storage.updateMonthlyBudget(amt);
      this.closeModal("modalSetBudget");
      this.showToast(`Monthly budget updated to ₹${parseFloat(amt).toLocaleString()}!`, "success");
    });

    // Change Semester & Academic Year Form
    const semYearForm = document.getElementById("changeSemYearForm");
    semYearForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const sem = document.getElementById("semYearInputSemester").value;
      const year = document.getElementById("semYearInputYear").value.trim();
      const credits = parseInt(document.getElementById("semYearInputTotalCredits").value) || 160;

      this.storage.updateProfile({
        semester: parseInt(sem) || 1,
        academicYear: year,
        totalCredits: credits
      });

      this.closeModal("modalChangeSemYear");
      this.showToast(`Active academic session set to Semester ${sem} (${year})! 🎓`, "success");
    });

    // Add Travel Journey Form
    const travelForm = document.getElementById("addTravelForm");
    travelForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const mode = document.getElementById("travelInputMode").value;
      const title = document.getElementById("travelInputTitle").value.trim();
      const carrier = document.getElementById("travelInputCarrier").value.trim();
      const origin = document.getElementById("travelInputOrigin").value.trim();
      const dest = document.getElementById("travelInputDest").value.trim();
      const depDate = document.getElementById("travelInputDepDate").value;
      const depTime = document.getElementById("travelInputDepTime").value;
      const arrDate = document.getElementById("travelInputArrDate").value || depDate;
      const arrTime = document.getElementById("travelInputArrTime").value;
      const pnr = document.getElementById("travelInputPnr").value.trim();
      const fare = document.getElementById("travelInputFare").value;
      const status = document.getElementById("travelInputStatus").value;
      const notes = document.getElementById("travelInputNotes").value.trim();

      const newTrip = {
        mode,
        title,
        carrierName: carrier,
        origin,
        destination: dest,
        departureDate: depDate,
        departureTime: depTime,
        arrivalDate: arrDate,
        arrivalTime: arrTime,
        pnrOrSeat: pnr,
        fare: parseFloat(fare) || 0,
        status,
        notes
      };

      this.storage.addTravelTrip(newTrip);
      this.closeModal("modalAddTravel");
      travelForm.reset();
      this.showToast(`Saved ${mode} journey (${origin} → ${dest})! 🎫`, "success");
    });

    // Set / Change 4-Digit Security PIN Form
    const pinForm = document.getElementById("setSecurityPinForm");
    pinForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const newPin = document.getElementById("pinInputNew").value.trim();
      const confirmPin = document.getElementById("pinInputConfirm").value.trim();
      const isEnabled = document.getElementById("pinInputEnabled").checked;

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        alert("Please enter a valid 4-digit numeric PIN (e.g. 1234, 2026).");
        return;
      }

      if (newPin !== confirmPin) {
        alert("PIN confirmation does not match. Please re-enter.");
        return;
      }

      if (isEnabled) {
        this.storage.setSecurityPin(newPin);
        this.closeModal("modalSetSecurityPin");
        pinForm.reset();
        const lockDot = document.getElementById("pinLockStatusDot");
        if (lockDot) lockDot.style.background = "var(--success)";
        this.showToast("4-Digit PIN Security Active! 🔐", "success");
      } else {
        this.storage.disableSecurityPin();
        this.closeModal("modalSetSecurityPin");
        const lockDot = document.getElementById("pinLockStatusDot");
        if (lockDot) lockDot.style.background = "var(--text-subtle)";
        this.showToast("PIN protection disabled", "info");
      }
    });

    // Backdrop click to close modals (except mandatory login)
    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop && backdrop.id !== "modalStudentLogin") {
          backdrop.classList.remove("active");
        }
      });
    });
  }

  openChangeSemYearModal() {
    const prof = this.storage.data.profile;
    const semSelect = document.getElementById("semYearInputSemester");
    if (semSelect) semSelect.value = prof.semester || "1";
    const yearInput = document.getElementById("semYearInputYear");
    if (yearInput) yearInput.value = prof.academicYear || "2026-2027";
    const credInput = document.getElementById("semYearInputTotalCredits");
    if (credInput) credInput.value = prof.totalCredits || 160;
    this.openModal("modalChangeSemYear");
  }

  openSetBudgetModal() {
    const current = this.storage.data.expenses.monthlyBudget || 10000;
    const input = document.getElementById("budgetInputAmount");
    if (input) input.value = current;
    this.openModal("modalSetBudget");
  }

  deleteSemesterSpi(index) {
    if (confirm("Remove this semester SPI record? CGPA will be recalculated.")) {
      this.storage.deleteSemesterSpi(index);
      this.showToast("Semester SPI record removed", "info");
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
      if (modalId === "modalPdfViewer") {
        const iframe = document.getElementById("pdfViewerIframe");
        if (iframe) iframe.src = "about:blank"; // Frees PDF rendering memory
        if (this._activePdfBlobUrl) {
          URL.revokeObjectURL(this._activePdfBlobUrl);
          this._activePdfBlobUrl = null;
        }
      }
    }
  }

  // ==========================================
  // 9. STUDENT PROFILE PHOTO OPTIONS
  // ==========================================
  renderAvatarGallery() {
    const container = document.getElementById("avatarGalleryContainer");
    if (!container) return;

    const currentAvatar = this.storage.data.profile.avatar || PRESET_AVATARS[0].url;

    container.innerHTML = PRESET_AVATARS.map(av => `
      <div class="avatar-gallery-item ${av.url === currentAvatar ? 'active' : ''}" onclick="app.selectPresetAvatar('${av.url}')" title="${av.name}">
        <img src="${av.url}" alt="${av.name}" />
        <span class="avatar-name">${av.name}</span>
      </div>
    `).join("");
  }

  handleAvatarFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.showToast("Image file size should be under 5MB", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      this.setStudentAvatar(dataUrl);
      this.showToast("Photo uploaded and updated successfully! 📷", "success");
    };
    reader.readAsDataURL(file);
  }

  selectPresetAvatar(url) {
    this.setStudentAvatar(url);
    this.showToast("Profile avatar updated! 🎨", "success");
  }

  applyAvatarFromUrl() {
    const urlInput = document.getElementById("avatarInputUrl");
    const url = urlInput?.value.trim();
    if (!url) {
      this.showToast("Please enter a valid image URL", "warning");
      return;
    }
    this.setStudentAvatar(url);
    if (urlInput) urlInput.value = "";
    this.showToast("Profile photo updated from URL!", "success");
  }

  setStudentAvatar(avatarUrl) {
    this.storage.updateProfile({ avatar: avatarUrl });
    this.renderAvatarGallery();
    const preview = document.getElementById("avatarModalPreview");
    if (preview) preview.src = avatarUrl;
  }

  resetAvatarToDefault() {
    const defaultAv = PRESET_AVATARS[0].url;
    this.setStudentAvatar(defaultAv);
    this.showToast("Avatar reset to default", "info");
  }

  openEditAttendanceModal(subjectId) {
    const sub = this.storage.data.subjects.find(s => s.id === subjectId);
    if (!sub) return;

    const newAtt = prompt(`Update Attended Classes for ${sub.name} (Current: ${sub.attendedClasses}):`, sub.attendedClasses);
    if (newAtt === null) return;
    const newTot = prompt(`Update Total Conducted Classes for ${sub.name} (Current: ${sub.totalClasses}):`, sub.totalClasses);
    if (newTot === null) return;

    this.storage.updateSubjectAttendance(subjectId, newAtt, newTot);
    this.showToast(`Updated attendance for ${sub.shortName || sub.name}`, "success");
  }

  openEditProfileModal() {
    const p = this.storage.data.profile;
    document.getElementById("profInputName").value = p.name || "";
    document.getElementById("profInputEmail").value = p.email || "";
    document.getElementById("profInputPhone").value = p.phone || "";
    document.getElementById("profInputRoll").value = p.rollNo || "";
    document.getElementById("profInputPRN").value = p.prn || "";
    
    const streamEl = document.getElementById("profInputStream");
    if (streamEl && p.stream) {
      streamEl.value = p.stream;
      this.onStreamSelectChange("profInputStream", "profInputBranch");
      const branchEl = document.getElementById("profInputBranch");
      if (branchEl && p.branch) branchEl.value = p.branch;
    }
    
    document.getElementById("profInputCollege").value = p.college || "";
    document.getElementById("profInputCGPA").value = p.cgpa || "";
    document.getElementById("profInputHostel").value = p.hostel || "";
    this.openModal("modalEditProfile");
  }

  // ==========================================
  // 11. 4-DIGIT SECURITY PIN & PRIVACY VAULT
  // ==========================================
  initSecurityLock() {
    const prof = this.storage.data.profile;
    const lockDot = document.getElementById("pinLockStatusDot");
    if (lockDot) {
      lockDot.style.background = prof.isPinEnabled ? "var(--success)" : "var(--text-subtle)";
      lockDot.title = prof.isPinEnabled ? "4-Digit PIN Security Active" : "PIN Security Off";
    }

    if (prof.isPinEnabled && prof.securityPin) {
      this.lockApp();
    } else {
      this.isVaultUnlocked = true;
    }
  }

  lockApp() {
    const prof = this.storage.data.profile;
    const overlay = document.getElementById("appLockScreenOverlay");
    if (!overlay) return;

    if (!prof.isPinEnabled || !prof.securityPin) {
      this.openModal("modalSetSecurityPin");
      this.showToast("Set up your 4-Digit Security PIN first 🔐", "info");
      return;
    }

    this.isVaultUnlocked = false;
    this.currentPinBuffer = "";
    this.updatePinDotsUI();

    const nameEl = document.getElementById("lockscreenStudentName");
    const avatarEl = document.getElementById("lockscreenAvatar");
    const errorEl = document.getElementById("lockscreenErrorMsg");
    if (nameEl) nameEl.textContent = prof.name ? `${prof.name}'s Vault` : "Student Account Vault";
    if (avatarEl && prof.avatar) avatarEl.src = prof.avatar;
    if (errorEl) errorEl.textContent = "";

    overlay.classList.add("active");
  }

  unlockApp() {
    this.isVaultUnlocked = true;
    this.currentPinBuffer = "";
    this.updatePinDotsUI();
    const overlay = document.getElementById("appLockScreenOverlay");
    if (overlay) overlay.classList.remove("active");
    this.showToast("Vault Unlocked! Welcome back 🔓", "success");
  }

  enterPinDigit(digit) {
    if (this.currentPinBuffer.length >= 4) return;
    this.currentPinBuffer += digit;
    this.updatePinDotsUI();

    const errorEl = document.getElementById("lockscreenErrorMsg");
    if (errorEl) errorEl.textContent = "";

    if (this.currentPinBuffer.length === 4) {
      setTimeout(() => {
        if (this.storage.verifySecurityPin(this.currentPinBuffer)) {
          this.unlockApp();
        } else {
          // Trigger shake animation & error
          const box = document.getElementById("lockscreenContainerBox");
          if (box) {
            box.classList.remove("shake-animation");
            void box.offsetWidth;
            box.classList.add("shake-animation");
          }
          if (errorEl) errorEl.textContent = "❌ Incorrect 4-Digit PIN. Try again.";
          for (let i = 0; i < 4; i++) {
            const dot = document.getElementById(`pdot${i}`);
            if (dot) dot.classList.add("error");
          }
          setTimeout(() => {
            this.currentPinBuffer = "";
            this.updatePinDotsUI();
          }, 600);
        }
      }, 100);
    }
  }

  backspacePinEntry() {
    if (this.currentPinBuffer.length > 0) {
      this.currentPinBuffer = this.currentPinBuffer.slice(0, -1);
      this.updatePinDotsUI();
    }
  }

  clearPinEntry() {
    this.currentPinBuffer = "";
    this.updatePinDotsUI();
    const errorEl = document.getElementById("lockscreenErrorMsg");
    if (errorEl) errorEl.textContent = "";
  }

  updatePinDotsUI() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`pdot${i}`);
      if (dot) {
        dot.classList.remove("error");
        if (i < this.currentPinBuffer.length) {
          dot.classList.add("filled");
        } else {
          dot.classList.remove("filled");
        }
      }
    }
  }

  bindPinKeyboardListeners() {
    window.addEventListener("keydown", (e) => {
      const overlay = document.getElementById("appLockScreenOverlay");
      if (!overlay || !overlay.classList.contains("active")) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        this.enterPinDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        this.backspacePinEntry();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.clearPinEntry();
      }
    });
  }

  openForgotPinModal() {
    const prof = this.storage.data.profile;
    const promptAns = prompt(`🔐 Reset 4-Digit Security PIN:\nEnter your registered Gmail (${prof.email ? prof.email[0] + '***@***' : 'your Gmail'}) to verify identity:`);
    if (promptAns === null) return;

    if (prof.email && promptAns.trim().toLowerCase() === prof.email.trim().toLowerCase()) {
      this.unlockApp();
      this.openModal("modalSetSecurityPin");
      this.showToast("Identity verified! Set your new 4-digit PIN 🔑", "success");
    } else {
      alert("❌ Email verification does not match the registered student email.");
    }
  }

  openStudentLoginModal() {
    this.openModal("modalStudentLogin");
  }

  disableSecurityPin() {
    if (confirm("Disable 4-Digit PIN lock on this dashboard? Anyone on this device will be able to view your data.")) {
      this.storage.disableSecurityPin();
      this.closeModal("modalSetSecurityPin");
      this.unlockApp();
      const lockDot = document.getElementById("pinLockStatusDot");
      if (lockDot) lockDot.style.background = "var(--text-subtle)";
      this.showToast("PIN protection disabled", "info");
    }
  }

  // ==========================================
  // 9. UTILITIES & TOASTS
  // ==========================================
  calculateDaysRemaining(targetIsoDate) {
    const target = new Date(targetIsoDate);
    const now = new Date();
    const targetMid = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = targetMid.getTime() - nowMid.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "warning") icon = "⚠️";
    if (type === "danger") icon = "🚨";

    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${icon}</span>
      <span style="font-size: 0.86rem; font-weight: 600;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  resetAllData() {
    if (confirm("Reset dashboard data? You will be prompted to re-enter your student details and select your course.")) {
      this.storage.resetToDefaults();
      this.checkStudentVerification();
      this.showToast("Reset to fresh state", "info");
    }
  }
}
