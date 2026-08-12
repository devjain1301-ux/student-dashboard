# 🎓 College Dashboard — Smart Student Portal

A state-of-the-art, privacy-first **College Student Dashboard & Academic Suite** engineered for undergraduate, engineering, medical, commerce, arts, and science students.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 🌟 Key Features

- 🔒 **4-Digit Student Privacy PIN & Vault**:
  - Keep your CGPA, timetable, attendance, travel tickets, notes, and hostel expenses private with a custom 4-digit PIN lock screen and on-screen keypad.
  
- 📄 **Study Notes with PDF Attachments**:
  - Attach lecture notes, cheatsheets, question banks, and handwritten PDF materials.
  - Built-in interactive in-app PDF reader modal, fullscreen preview, and instant one-click download.
  - High-performance hybrid architecture using **IndexedDB** for zero lag and zero browser tab freezes.

- 🚆 **Travel & Transit Journey Planner**:
  - Track Train (10-digit PNR, coach & seat), Flight (airline, flight number, terminal, gate), Bus (operator, boarding point), and Car/Cab rides.
  - Live countdown timers (*"⚡ Departing Today"*, *"🔥 Tomorrow"*, *"⏳ In 3 days"*), boarding-pass UI, and 1-click PNR copier.

- 📊 **Attendance & 75% Rule Predictor**:
  - Automatic calculation of classes you can safely bunk or must attend to maintain 75% or 80% criteria.
  - 1-click quick attendance markers (`+ Attended`, `+ Missed`).

- 📅 **Interactive Timetable & Schedule**:
  - Daily & weekly schedule with room indicators, faculty names, and real-time class banner.
  - Custom stream & branch catalog support with preset subject loaders.

- 🎯 **Academic CGPA & Semester SPI Tracker**:
  - Manual CGPA/SPI addition across Semester 1–8 with automatic percentage estimation.
  - Academic session manager (e.g. `2026-2027`, `26-27`).

- 💰 **Hostel & PG Expense Tracker**:
  - Monthly budget limit indicator with live progress bars, categories (Food, Mess, Books, Travel, Utilities), and transaction ledgers.

- 🎨 **Student Profile & Custom Photo Options**:
  - Upload profile photo from device, choose from 12 curated avatars, or paste custom image URLs.

- ⚡ **Global Search Palette (`⌘K` / `Ctrl+K`)**:
  - Quick-jump across subjects, tasks, notes, exams, travel bookings, and events.

---

## 🚀 Instant Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import the `student-dashboard` repository (`devjain1301-ux/student-dashboard`).
4. Click **Deploy**. Vercel will automatically detect the static project and deploy it with global CDN caching and SSL enabled!

### Option 2: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 💻 Local Development

Run the dashboard locally with any static server or Node:

```bash
# Using npx serve
npx serve -l 5173 .

# Or using python
python -m http.server 5173
```
Then visit `http://localhost:5173` in your browser.

---

## 🛠️ Technology Stack

- **Frontend**: Pure Semantic HTML5, Vanilla JavaScript (ES6+ Classes), Modern CSS3 with Design Tokens & Glassmorphism.
- **Data & Binary Persistence**: High-speed **IndexedDB** for document and PDF storage + **LocalStorage** state manager.
- **Icons & Typography**: Plus Jakarta Sans, Outfit, Fira Code, and Feather/Lucide SVG icons.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
