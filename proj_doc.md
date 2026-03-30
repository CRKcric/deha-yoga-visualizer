# DEHA — Yoga Web App
## Project Requirements & Progress Doc
*Last updated: current session*

---

## 🎨 Design System

- **Palette:** Dusty rose (#AE7C7E, #8D5E5E), Gold (#D4AF37), Cream background (#faf4f1), Dark panels (#1a0e0e)
- **Fonts:** Cormorant Garamond (headings/display), Nunito (body/UI)
- **CSS variables:** `--gold`, `--r5`, `--border-rose`, `--bg-cream`, `--text-muted`
- **Theme:** Luxury wellness, refined minimal, warm dark tones

---

## 📁 File Structure

```
yoga_project/
├── index.html          ✅ Landing page
├── session.html        ✅ Session page
├── profile.html        ✅ Profile page
├── auth.html           ✅ Auth page
├── style.css           ✅ Global styles
├── session.css         ✅ Session page styles + ✅ Tutorial popup styles
├── session.js          ✅ Session page logic + ✅ Tutorial popup logic
├── profile.css         ✅ Profile styles
├── profile.js          ✅ Profile logic
├── auth.css            ✅ Auth styles
├── auth.js             ✅ Auth logic
├── splash.css          ✅ Splash screen styles
├── splash.js           ✅ Splash screen logic      
├── pose_test.py        ✅ Python MediaPipe pose tracker
└── assets/
    ├── logo.png
    ├── splash-logo.png  ✅ Cropped D lettermark for splash
    ├── Palm Tree Pose.jpg
    ├── Warrior I.jpg
    ├── Warrior II.jpg
    ├── Tree pose.jpg
    ├── Triangle pose.jpg
    ├── Eagle pose.jpg
    ├── Dancers pose.jpg
    ├── Child pose.jpg
    ├── Lotus pose.jpg
    └── Forward fold.jpg
```

---

## ✅ COMPLETED FEATURES

### index.html — Landing Page
- 10 pose cards with image, name, sanskrit, description, difficulty tag
- Pose renamed: Mountain Pose → **Palm Tree Pose (Tadasana)**
- Images stored in `assets/` folder with correct paths (no spaces issue — user renamed files)

### auth.html — Authentication
- 60/40 vertical split layout
- Flip animation (front = login, back = sign up) — works both directions
- `pointer-events` CSS fix so both sides are clickable
- Uses `localStorage` key: `deha_current_user`

### profile.html — Profile Page
- Displays session history stats (currently placeholder/mock data)
- Save profile button — saves to `localStorage` key: `deha_profile`
- Clear profile button — uses `window.clearProfile` pattern
- **Sign Out button** — top-right corner, fixed position, circular power icon
  - Gold underline on hover (matches navbar style)
  - "Sign Out" tooltip appears below on hover
  - Calls `logOut()` → removes `deha_current_user` → redirects to `auth.html`
- `window.logOut`, `window.saveProfile`, `window.clearProfile` all exposed on window

### session.html + session.js — Session Page

**Auth Guard:**
- Start button disabled if not logged in
- `startSession()` returns early if no `deha_current_user` in localStorage
- Shows sign in / create account link in start note

**Pose Dropdown (10 poses only):**
- Standing: Palm Tree, Warrior I, Warrior II, Tree, Triangle
- Balance: Eagle, Dancer's
- Floor: Child's, Lotus, Seated Forward Fold

**Tutorial Popup (tut-popup.css + session.html):**
- Opens before session starts AND via info button during session
- Layout: Left = pose image, Right = YouTube embed + step-by-step instructions
- Header: pose name + sanskrit
- Footer: 
  - **"Don't show for this session" checkbox** (`id="skipTutCheck"`)
  - When checked → pose switches skip popup for rest of session
  - Skip button + Begin Session button
- Closes on X, skip, or begin
- YouTube video stops when closed (src cleared)
- Info button (ℹ) in feedback panel header opens tutorial for current pose anytime

**Live Session:**
- Camera starts only AFTER tutorial skip or begin is clicked
- Camera requested **once only** — no repeated permission popups on pose switch
- Live feedback panel with 3 correction slots, updates every 3.6s
- Score pill updates every 2.8s (Good/Fair/Adjust)
- Animated skeleton overlay on canvas
- Live badge, name tag overlay, stop button

**Pose Switcher (mid-session):**
- 10 pill buttons visible in feedback panel during session
- Centre aligned, gold underline on active pill
- Click any pill → tutorial popup (unless skip checkbox was checked)
- After tutorial skip/begin → switches pose instantly, no camera re-request
- `window.switchPoseTo(key)` respects `skipTutorial_` state

**Session Tracking:**
- `posesPracticed[]` — array of all pose keys used in session
- `allScores{}` — per-pose average score saved on each switch
- Final accuracy = average across ALL poses practiced
- Stability = derived from accuracy

**Session Summary:**
- Shows all poses practiced (comma separated) — not just one
- Accuracy averaged across all poses
- Stability, duration, congrats message
- Most corrected area highlighted

**Reset Session:**
- Clears `posesPracticed`, `allScores`, `skipTutorial_`, `selectedPose`

### splash.js + splash.css — Splash Screen
- Dark background (#1a0e0e)
- Uses `assets/splash-logo.png` (user-cropped D lettermark)
- Scale up + fade in animation on logo
- Gold line grows underneath
- "move with intention" tagline fades up
- Dismisses after 1.8s with fade out
- Added to ALL pages via `<link rel="stylesheet" href="splash.css">` in head
  and `<script src="splash.js"></script>` as first script in body

### pose_test.py — Python Pose Tracker
- MediaPipe Tasks API, OpenCV, Python 3.10.2
- **10 poses** with angle checks:
  1. Palm Tree Pose (Tadasana) — key 1
  2. Warrior I — key 2
  3. Warrior II — key 3
  4. Tree Pose — key 4
  5. Triangle Pose — key 5
  6. Eagle Pose — key 6
  7. Child's Pose — key 7
  8. Seated Forward Fold — key 8
  9. Lotus Pose — key 9
  10. Dancer's Pose — key 0
- Debug mode (D key) — shows live angle values for calibration
- Sanskrit names + difficulty levels displayed
- Score bar, correction feedback panel
- Skeleton overlay (green = correct, red = incorrect joints)
- `POSE_NAMES` list fixed, `KEY_MAP` for fast key lookup

---

## ⏳ PENDING FEATURES

### YouTube Video IDs
- `TUTORIAL_DATA` in `session.js` has placeholder video IDs
- Need real short tutorial videos (1-2 min) for each of the 10 poses
- User will manually find and update `videoId` for each pose

### Angle Calibration (pose_test.py)
- Current angle ranges are anatomically estimated
- Use debug mode (D key) to measure real angles
- User holds each pose → record actual angle → set range around it
- Test with wrong form to verify corrections trigger

### Flask Backend Integration
- Python pose tracker needs Flask wrapper
- WebSocket or API to stream results to session.html
- This is the **next major milestone**

### Profile Session History (BLOCKED — needs backend)
- Currently profile shows mock/placeholder data
- After Flask: save real session data to database
- Display per-session breakdown with:
  - Each pose practiced in that session
  - Per-pose accuracy score
  - Duration per pose
  - Corrections logged per pose
  - Total session duration
- User needs clear understanding of full session — not just averages
- **Do not build until Flask backend is complete**

---

## 🔑 localStorage Keys
| Key | Purpose |
|-----|---------|
| `deha_current_user` | Logged in user identifier |
| `deha_profile` | User profile data (username etc.) |

---

## 🚫 Known Issues / Notes
- Tutorial popup YouTube video IDs are placeholders — need real ones
- Pose image aspect ratio in tutorial popup set to portrait (3/4) — user will replace with proper portrait images
- Profile session history is all mock data — intentionally left until backend
- `pose_test.py` is standalone desktop app — NOT integrated with HTML yet (Flask integration is next step)
- Splash logo path: `assets/splash-logo.png` — must exist in each page's relative assets folder

---

## 🏗 Build Order (Remaining)
1. Find + update YouTube video IDs for 10 poses
2. Calibrate angle ranges in pose_test.py using debug mode
3. Flask backend — wrap pose_test.py, stream to session.html
4. Real session data saving
5. Profile session history with full per-pose breakdown
6. Final UI polish pass

# DEHA — Yoga Web App
## Project Requirements & Progress Doc
*Last updated: current session*

---

## 🎨 Design System

- **Palette:** Dusty rose (#AE7C7E, #8D5E5E), Gold (#D4AF37), Cream background (#faf4f1), Dark panels (#1a0e0e)
- **Fonts:** Cormorant Garamond (headings/display), Nunito (body/UI)
- **CSS variables:** `--gold`, `--r5`, `--border-rose`, `--bg-cream`, `--text-muted`
- **Theme:** Luxury wellness, refined minimal, warm dark tones

---

## 📁 File Structure

```
yoga_project/
├── index.html          ✅ Landing page
├── session.html        ✅ Session page
├── profile.html        ✅ Profile page
├── auth.html           ✅ Auth page
├── style.css           ✅ Global styles
├── session.css         ✅ Session page styles + ✅ Tutorial popup styles
├── session.js          ✅ Session page logic + ✅ Tutorial popup logic
├── profile.css         ✅ Profile styles
├── profile.js          ✅ Profile logic
├── auth.css            ✅ Auth styles
├── auth.js             ✅ Auth logic
├── splash.css          ✅ Splash screen styles
├── splash.js           ✅ Splash screen logic      
├── pose_test.py        ✅ Python MediaPipe pose tracker
└── assets/
    ├── logo.png
    ├── splash-logo.png  ✅ Cropped D lettermark for splash
    ├── Palm Tree Pose.jpg
    ├── Warrior I.jpg
    ├── Warrior II.jpg
    ├── Tree pose.jpg
    ├── Triangle pose.jpg
    ├── Eagle pose.jpg
    ├── Dancers pose.jpg
    ├── Child pose.jpg
    ├── Lotus pose.jpg
    └── Forward fold.jpg
```

---

## ✅ COMPLETED FEATURES

### index.html — Landing Page
- 10 pose cards with image, name, sanskrit, description, difficulty tag
- Pose renamed: Mountain Pose → **Palm Tree Pose (Tadasana)**
- Images stored in `assets/` folder with correct paths (no spaces issue — user renamed files)

### auth.html — Authentication
- 60/40 vertical split layout
- Flip animation (front = login, back = sign up) — works both directions
- `pointer-events` CSS fix so both sides are clickable
- Uses `localStorage` key: `deha_current_user`

### profile.html — Profile Page
- Displays session history stats (currently placeholder/mock data)
- Save profile button — saves to `localStorage` key: `deha_profile`
- Clear profile button — uses `window.clearProfile` pattern
- **Sign Out button** — top-right corner, fixed position, circular power icon
  - Gold underline on hover (matches navbar style)
  - "Sign Out" tooltip appears below on hover
  - Calls `logOut()` → removes `deha_current_user` → redirects to `auth.html`
- `window.logOut`, `window.saveProfile`, `window.clearProfile` all exposed on window

### session.html + session.js — Session Page

**Auth Guard:**
- Start button disabled if not logged in
- `startSession()` returns early if no `deha_current_user` in localStorage
- Shows sign in / create account link in start note

**Pose Dropdown (10 poses only):**
- Standing: Palm Tree, Warrior I, Warrior II, Tree, Triangle
- Balance: Eagle, Dancer's
- Floor: Child's, Lotus, Seated Forward Fold

**Tutorial Popup (tut-popup.css + session.html):**
- Opens before session starts AND via info button during session
- Layout: Left = pose image, Right = YouTube embed + step-by-step instructions
- Header: pose name + sanskrit
- Footer: 
  - **"Don't show for this session" checkbox** (`id="skipTutCheck"`)
  - When checked → pose switches skip popup for rest of session
  - Skip button + Begin Session button
- Closes on X, skip, or begin
- YouTube video stops when closed (src cleared)
- Info button (ℹ) in feedback panel header opens tutorial for current pose anytime

**Live Session:**
- Camera starts only AFTER tutorial skip or begin is clicked
- Camera requested **once only** — no repeated permission popups on pose switch
- Live feedback panel with 3 correction slots, updates every 3.6s
- Score pill updates every 2.8s (Good/Fair/Adjust)
- Animated skeleton overlay on canvas
- Live badge, name tag overlay, stop button

**Pose Switcher (mid-session):**
- 10 pill buttons visible in feedback panel during session
- Centre aligned, gold underline on active pill
- Click any pill → tutorial popup (unless skip checkbox was checked)
- After tutorial skip/begin → switches pose instantly, no camera re-request
- `window.switchPoseTo(key)` respects `skipTutorial_` state

**Session Tracking:**
- `posesPracticed[]` — array of all pose keys used in session
- `allScores{}` — per-pose average score saved on each switch
- Final accuracy = average across ALL poses practiced
- Stability = derived from accuracy

**Session Summary:**
- Shows all poses practiced (comma separated) — not just one
- Accuracy averaged across all poses
- Stability, duration, congrats message
- Most corrected area highlighted

**Reset Session:**
- Clears `posesPracticed`, `allScores`, `skipTutorial_`, `selectedPose`

### splash.js + splash.css — Splash Screen
- Dark background (#1a0e0e)
- Uses `assets/splash-logo.png` (user-cropped D lettermark)
- Scale up + fade in animation on logo
- Gold line grows underneath
- "move with intention" tagline fades up
- Dismisses after 1.8s with fade out
- Added to ALL pages via `<link rel="stylesheet" href="splash.css">` in head
  and `<script src="splash.js"></script>` as first script in body

### pose_test.py — Python Pose Tracker
- MediaPipe Tasks API, OpenCV, Python 3.10.2
- **10 poses** with angle checks:
  1. Palm Tree Pose (Tadasana) — key 1
  2. Warrior I — key 2
  3. Warrior II — key 3
  4. Tree Pose — key 4
  5. Triangle Pose — key 5
  6. Eagle Pose — key 6
  7. Child's Pose — key 7
  8. Seated Forward Fold — key 8
  9. Lotus Pose — key 9
  10. Dancer's Pose — key 0
- Debug mode (D key) — shows live angle values for calibration
- Sanskrit names + difficulty levels displayed
- Score bar, correction feedback panel
- Skeleton overlay (green = correct, red = incorrect joints)
- `POSE_NAMES` list fixed, `KEY_MAP` for fast key lookup

---

## ⏳ PENDING FEATURES

### YouTube Video IDs
- `TUTORIAL_DATA` in `session.js` has placeholder video IDs
- Need real short tutorial videos (1-2 min) for each of the 10 poses
- User will manually find and update `videoId` for each pose

### Angle Calibration (pose_test.py)
- Current angle ranges are anatomically estimated
- Use debug mode (D key) to measure real angles
- User holds each pose → record actual angle → set range around it
- Test with wrong form to verify corrections trigger

### Flask Backend Integration
- Python pose tracker needs Flask wrapper
- WebSocket or API to stream results to session.html
- This is the **next major milestone**

### Profile Session History (BLOCKED — needs backend)
- Currently profile shows mock/placeholder data
- After Flask: save real session data to database
- Display per-session breakdown with:
  - Each pose practiced in that session
  - Per-pose accuracy score
  - Duration per pose
  - Corrections logged per pose
  - Total session duration
- User needs clear understanding of full session — not just averages
- **Do not build until Flask backend is complete**

---

## 🔑 localStorage Keys
| Key | Purpose |
|-----|---------|
| `deha_current_user` | Logged in user identifier |
| `deha_profile` | User profile data (username etc.) |

---

## 🚫 Known Issues / Notes
- Tutorial popup YouTube video IDs are placeholders — need real ones
- Pose image aspect ratio in tutorial popup set to portrait (3/4) — user will replace with proper portrait images
- Profile session history is all mock data — intentionally left until backend
- `pose_test.py` is standalone desktop app — NOT integrated with HTML yet (Flask integration is next step)
- Splash logo path: `assets/splash-logo.png` — must exist in each page's relative assets folder

---

## 🏗 Build Order (Remaining)
1. Find + update YouTube video IDs for 10 poses
2. Calibrate angle ranges in pose_test.py using debug mode
3. Flask backend — wrap pose_test.py, stream to session.html
4. Real session data saving
5. Profile session history with full per-pose breakdown
6. Final UI polish pass
---

## 🐛 Issues Faced & Solutions

### 1. Auth flip animation broken in one direction
**Issue:** Flip card only worked front→back, not back→front.
**Solution:** Added `pointer-events: none` to the inactive face and `pointer-events: auto` to the active face so clicks weren't being intercepted by the hidden side.

### 2. Pose card images not loading
**Issue:** Images showing as broken on index.html pose cards.
**Solution:** Paths were missing the `assets/` prefix. Fixed by adding `assets/` to all image src values.

### 3. Session starting without login
**Issue:** Start Session button worked even when not logged in.
**Solution:** Added auth guard in `startSession()` — checks `localStorage.getItem('deha_current_user')` and returns early with a sign-in prompt if not found. Also added `DOMContentLoaded` listener to disable the button on page load if not logged in.

### 4. Tutorial popup functions out of scope
**Issue:** `openTutorial()`, `skipTutorial()`, `beginAfterTutorial()` were defined inside the IIFE and not accessible from `onclick` handlers in HTML.
**Solution:** Exposed them on `window` — e.g. `window.openTutorial = function(...)`.

### 5. Camera permission popup on every pose switch
**Issue:** Every time user switched poses mid-session or clicked the ℹ tutorial button, the browser asked for camera permission again.
**Solution:** Added early return in `closeTutorialAndStart()` — if `sessionActive` is true and `window._pendingPose` is null (meaning it was just the info button, not a real switch), function returns immediately without requesting camera.

### 6. Tutorial popup alignment broken — entire layout broke
**Issue:** Adding the tutorial ℹ button to the feedback header broke the whole page layout.
**Solution:** Was a missing `>` on the closing `</button` tag. Single character fix restored layout.

### 7. YouTube iframe not playing — "Video unavailable"
**Issue:** Most YouTube videos block iframe embedding by default.
**Solution:** Replaced `<iframe>` entirely with a clickable thumbnail image that opens the video in a new tab. Thumbnail loaded from `https://img.youtube.com/vi/{videoId}/hqdefault.jpg` — always works regardless of embedding restrictions.

### 8. SVG splash screen showing as dark oval blob
**Issue:** Hand-traced SVG paths for the D lettermark didn't render correctly — looked like a dark oval message box.
**Solution:** Abandoned SVG tracing entirely. User cropped the actual logo PNG to just the D lettermark (`splash-logo.png`) and used that with a CSS scale + fade-in animation instead.

### 9. Poses Practiced box overflowing in summary
**Issue:** When multiple poses were practiced, the names overflowed the summary stat box and broke the grid layout.
**Solution:** Added `font-size: clamp(0.7rem, 1.5vw, 1rem)`, `line-height: 1.4`, and `max-height` with `overflow-y: auto` on `.sum-stat .sum-val`.

### 10. Poses Practiced showing only one pose
**Issue:** Session summary always showed only the initially selected pose, not all poses switched to during the session.
**Solution:** Added `posesPracticed[]` array and `allScores{}` object to state. On each pose switch, current pose score is saved to `allScores` and new pose key pushed to `posesPracticed`. Summary reads from `posesPracticed` and averages all values in `allScores`.

### 11. Controls column not scrolling — pills cut off
**Issue:** Pose switcher pills at the bottom of the feedback panel were getting cut off with no scrollbar visible.
**Solution:** Added `max-height: calc(100vh - 60px)` on desktop and `max-height: 60vh` on mobile to `.controls-col`, along with `overflow-y: auto` and custom scrollbar styling. Also changed `.feedback-panel` from `overflow: hidden` to `overflow: visible`.

### 12. Crow Pose appearing in pose switcher pills
**Issue:** Crow Pose pill was showing during session even though it was removed from the dropdown.
**Solution:** Removed the entire `crow` entry from the `POSES` object in `session.js`.

### 13. localStorage key mismatch on profile clear
**Issue:** `window.clearProfile` wasn't clearing the right keys causing stale data.
**Solution:** Used `window.clearProfile` pattern with explicit key names and verified correct `deha_profile` and `deha_current_user` keys throughout.