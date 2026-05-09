# TableDesk PWA — Installation Guide

A digital order-taking system for hotel/restaurant staff.
Installable on iPhone, Android, and tablets.

---

## 📁 Files in This Folder

```
tabledesk-pwa/
├── index.html        ← Main app page
├── style.css         ← Styles (mobile-first, responsive)
├── app.js            ← App logic & storage
├── sw.js             ← Service Worker (offline support)
├── manifest.json     ← PWA manifest (install metadata)
├── icons/            ← App icons (all sizes)
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
└── README.md         ← This file
```

---

## 🚀 How to Deploy (Required for Install)

PWAs must be served over **HTTPS** to be installable.
Here are free hosting options:

### Option A — Netlify Drop (Easiest, Free)
1. Go to https://app.netlify.com/drop
2. Drag and drop the entire `tabledesk-pwa/` folder
3. Netlify gives you a free HTTPS URL instantly
4. Share that URL with your staff

### Option B — GitHub Pages (Free)
1. Create a GitHub account and a new repository
2. Upload all files from this folder
3. Go to Settings → Pages → set source to main branch
4. Your app will be live at `https://yourusername.github.io/repo-name`

### Option C — Any Web Host
Upload all files to your web server's public folder (e.g. `public_html/`).
Make sure the server supports HTTPS.

---

## 📲 Installing on iPhone / iPad

1. Open Safari and navigate to your hosted URL
2. Tap the **Share** button (box with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top right
5. TableDesk appears on your home screen like a native app!

> ⚠️ Must use Safari on iOS — Chrome/Firefox on iPhone cannot install PWAs

---

## 📱 Installing on Android

1. Open Chrome and navigate to your hosted URL
2. Tap the **three-dot menu** (⋮) in the top right
3. Tap **"Add to Home screen"** or **"Install app"**
4. Tap **"Install"** / **"Add"**
5. TableDesk appears on your home screen!

> Chrome may also show an automatic install banner at the bottom of the screen

---

## 💡 Features

- **12 table grid** — tap any table to open its order notepad
- **Save orders** — linked to each table, persists across sessions
- **Offline support** — works without internet after first load
- **Bottom sheet** on phones, centered dialog on tablets
- **Drag to dismiss** — swipe down to close the order sheet
- **Haptic feedback** on save (Android)
- **Real-time stats** — active/free table counts

---

## 🛠 Local Testing (without hosting)

To test locally before deploying:
```bash
# If you have Python installed:
cd tabledesk-pwa
python3 -m http.server 8080
# Then open http://localhost:8080 in Chrome
```

Note: Service Worker and install prompt require HTTPS (except localhost).
