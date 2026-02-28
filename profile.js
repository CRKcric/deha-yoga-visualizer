/* ============================================================
   DEHA — PROFILE PAGE JAVASCRIPT
   Storage: localStorage (SQLite will replace this on Flask integration)
   Keys used:
     deha_profile        → { username, email, gender, height }
     deha_sessions       → [ ...sessionObjects ]
   ============================================================ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     STORAGE HELPERS
  ───────────────────────────────────────── */
  function loadProfile() {
    try {
      return JSON.parse(localStorage.getItem('deha_profile')) || {};
    } catch { return {}; }
  }

  function saveProfileData(data) {
    localStorage.setItem('deha_profile', JSON.stringify(data));
  }

  function loadSessions() {
    try {
      return JSON.parse(localStorage.getItem('deha_sessions')) || [];
    } catch { return []; }
  }

  /* ─────────────────────────────────────────
     SEED DEMO DATA (only if no sessions exist)
     Remove this block once Flask saves real sessions.
  ───────────────────────────────────────── */
  function seedDemoSessions() {
    if (loadSessions().length > 0) return;

    const poses = [
      'Mountain Pose', 'Warrior I', 'Warrior II',
      'Tree Pose', 'Triangle Pose', 'Child\'s Pose',
      'Eagle Pose', 'Lotus Pose'
    ];
    const corrections = [
      'Hip alignment', 'Shoulder height', 'Knee tracking',
      'Spine extension', 'Arm position', 'Foot placement',
      'Core engagement', 'Head position'
    ];

    const sessions = [];
    const now = Date.now();

    for (let i = 0; i < 12; i++) {
      const pose  = poses[Math.floor(Math.random() * poses.length)];
      const score = Math.floor(Math.random() * 45) + 52; // 52–96
      const dur   = Math.floor(Math.random() * 240) + 40; // 40–280s
      const ts    = now - (i * 86400000 * (Math.random() + 0.3)); // spread over days

      // Pick 1–3 top correction areas for this session
      const shuffled = [...corrections].sort(() => Math.random() - 0.5);
      const topAreas = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);

      sessions.push({
        id:        Date.now() - i * 1000,
        pose,
        score,
        stability: Math.min(99, score + Math.floor((Math.random() - 0.4) * 10)),
        duration:  dur,
        timestamp: ts,
        topCorrections: topAreas,
        feedback: generateFeedbackText(pose, score, topAreas),
      });
    }

    // Sort newest first
    sessions.sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem('deha_sessions', JSON.stringify(sessions));
  }

  function generateFeedbackText(pose, score, areas) {
    const areaStr = areas.join(' and ').toLowerCase();
    if (score >= 80) {
      return `Strong session with ${pose}. Your form was consistent and well-controlled throughout. Keep building on this stability.`;
    } else if (score >= 65) {
      return `Good effort in ${pose}. Minor adjustments needed around ${areaStr} — focus on these in your next session and you'll see a clear improvement.`;
    } else {
      return `${pose} needs more practice. The main areas to work on are ${areaStr}. Try slowing down and holding the pose longer to build muscle memory.`;
    }
  }

  /* ─────────────────────────────────────────
     PROFILE FORM — LOAD & SAVE
  ───────────────────────────────────────── */
  function populateProfileForm() {
    const p = loadProfile();
    if (p.username) {
      document.getElementById('pfUsername').value = p.username;
      document.getElementById('profileNameDisplay').textContent = p.username;
      document.getElementById('profileAvatar').textContent = p.username.charAt(0).toUpperCase();
    }
    if (p.email) {
      document.getElementById('pfEmail').value = p.email;
      document.getElementById('profileEmailDisplay').textContent = p.email;
    }
    if (p.height) {
      document.getElementById('pfHeight').value = p.height;
    }
    if (p.gender) {
      const radio = document.querySelector(`input[name="gender"][value="${p.gender}"]`);
      if (radio) radio.checked = true;
    }
  }

  window.clearProfile = function() {
    localStorage.removeItem('deha_profile');
    location.reload();
  }

  window.saveProfile = function (e) {
    e.preventDefault();
    const username = document.getElementById('pfUsername').value.trim();
    const email    = document.getElementById('pfEmail').value.trim();
    const height   = document.getElementById('pfHeight').value.trim();
    const genderEl = document.querySelector('input[name="gender"]:checked');
    const gender   = genderEl ? genderEl.value : 'prefer_not';

    if (!username) return;

    const data = { username, email, gender, height };
    saveProfileData(data);

    // Update display
    document.getElementById('profileNameDisplay').textContent = username;
    document.getElementById('profileEmailDisplay').textContent = email || '—';
    document.getElementById('profileAvatar').textContent = username.charAt(0).toUpperCase();

    // Show saved message
    const msg = document.getElementById('pfSavedMsg');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 2800);
  };

  /* ─────────────────────────────────────────
     STATS ROW
  ───────────────────────────────────────── */
  function renderStats(sessions) {
    document.getElementById('statTotalSessions').textContent = sessions.length;

    // Avg accuracy
    if (sessions.length > 0) {
      const avg = Math.round(sessions.reduce((s, x) => s + x.score, 0) / sessions.length);
      document.getElementById('statAvgAccuracy').textContent = avg + '%';
    }

    // Most practiced pose
    if (sessions.length > 0) {
      const poseCounts = {};
      sessions.forEach(s => { poseCounts[s.pose] = (poseCounts[s.pose] || 0) + 1; });
      const top = Object.entries(poseCounts).sort((a, b) => b[1] - a[1])[0];
      // Shorten long names
      const shortName = top[0].split(' ').slice(0, 2).join(' ');
      document.getElementById('statFavPose').textContent = shortName;
    }

    // Streak — count consecutive days with at least one session
    const streak = calcStreak(sessions);
    document.getElementById('statStreak').textContent = streak;
  }

  function calcStreak(sessions) {
    if (!sessions.length) return 0;
    const days = new Set(
      sessions.map(s => new Date(s.timestamp).toDateString())
    );
    let streak = 0;
    let d = new Date();
    while (days.has(d.toDateString())) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  /* ─────────────────────────────────────────
     LAST SESSION
  ───────────────────────────────────────── */
  function renderLastSession(sessions) {
    if (!sessions.length) return;
    const block = document.getElementById('lastSessionBlock');
    block.style.display = 'flex';

    const s     = sessions[0];
    const card  = document.getElementById('lastSessionCard');
    const cls   = s.score >= 75 ? 'good' : s.score >= 55 ? 'fair' : 'needs';
    const label = s.score >= 75 ? 'Good form' : s.score >= 55 ? 'Fair form' : 'Needs work';

    card.innerHTML = `
      <div class="ls-item">
        <div class="ls-label">Pose</div>
        <div class="ls-val">${s.pose}</div>
      </div>
      <div class="ls-item">
        <div class="ls-label">Accuracy</div>
        <div class="ls-val ${cls}">${s.score}%</div>
      </div>
      <div class="ls-item">
        <div class="ls-label">Stability</div>
        <div class="ls-val">${s.stability}%</div>
      </div>
      <div class="ls-item">
        <div class="ls-label">Duration</div>
        <div class="ls-val">${formatDuration(s.duration)}</div>
      </div>
      <div class="ls-feedback">${s.feedback}</div>
    `;
  }

  /* ─────────────────────────────────────────
     PATTERN ANALYSIS
     Rule-based analysis on session history.
     Finds recurring correction areas and trends.
  ───────────────────────────────────────── */
  function renderPatterns(sessions) {
    if (sessions.length < 2) return;

    document.getElementById('patternBlock').style.display = 'flex';
    document.getElementById('patternDivider').style.display = 'flex';

    // Count how often each correction area appears across sessions
    const areaCounts = {};
    sessions.forEach(s => {
      (s.topCorrections || []).forEach(area => {
        areaCounts[area] = (areaCounts[area] || 0) + 1;
      });
    });

    const sorted = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);
    const total  = sessions.length;

    // Score trend: compare first half vs second half avg
    const mid        = Math.floor(sessions.length / 2);
    const recentAvg  = avg(sessions.slice(0, mid).map(s => s.score));
    const olderAvg   = avg(sessions.slice(mid).map(s => s.score));
    const improving  = recentAvg > olderAvg + 3;
    const declining  = recentAvg < olderAvg - 3;

    const patterns = [];

    // Top recurring correction areas (up to 2)
    sorted.slice(0, 2).forEach(([area, count]) => {
      const pct = Math.round((count / total) * 100);
      patterns.push({
        type:  'warn',
        area,
        desc:  `You frequently receive corrections for ${area.toLowerCase()} — appearing in ${pct}% of your sessions. Dedicating focused attention to this area will noticeably improve your overall accuracy.`,
        freq:  pct,
      });
    });

    // Trend pattern
    if (improving) {
      patterns.push({
        type: 'good',
        area: 'Improving Trend',
        desc: `Your accuracy has been climbing — recent sessions average ${Math.round(recentAvg)}% vs ${Math.round(olderAvg)}% earlier. Your consistency is paying off.`,
        freq: Math.round((recentAvg / 100) * 100),
      });
    } else if (declining) {
      patterns.push({
        type: 'warn',
        area: 'Score Dipping',
        desc: `Recent sessions average ${Math.round(recentAvg)}% vs ${Math.round(olderAvg)}% earlier. This might be fatigue or attempting harder poses — shorter focused sessions may help.`,
        freq: Math.round((recentAvg / 100) * 100),
      });
    } else {
      patterns.push({
        type: 'info',
        area: 'Steady Practice',
        desc: `Your scores are consistent across sessions — averaging ${Math.round(recentAvg)}%. You've built a stable baseline. Try pushing into harder poses to grow further.`,
        freq: Math.round((recentAvg / 100) * 100),
      });
    }

    const container = document.getElementById('patternCards');
    container.innerHTML = patterns.map(p => `
      <div class="pattern-card">
        <div class="pc-badge ${p.type}">
          <span class="pc-badge-dot"></span>
          ${p.type === 'warn' ? 'Recurring Issue' : p.type === 'good' ? 'Positive Trend' : 'Observation'}
        </div>
        <div class="pc-area">${p.area}</div>
        <div class="pc-desc">${p.desc}</div>
        <div class="pc-freq">Frequency: ${p.freq}%</div>
        <div class="pc-freq-bar">
          <div class="pc-freq-fill ${p.type}" style="width:${p.freq}%"></div>
        </div>
      </div>
    `).join('');
  }

  function avg(arr) {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  /* ─────────────────────────────────────────
     SESSION HISTORY LIST
  ───────────────────────────────────────── */
  function renderHistory(sessions) {
    if (!sessions.length) return;

    document.getElementById('historyBlock').style.display = 'flex';
    document.getElementById('historyDivider').style.display = 'flex';
    document.getElementById('emptyState').style.display = 'none';

    const list = document.getElementById('historyList');

    list.innerHTML = sessions.map((s, i) => {
      const cls   = s.score >= 75 ? 'good' : s.score >= 55 ? 'fair' : 'needs';
      const label = s.score >= 75 ? `${s.score}% — Good` : s.score >= 55 ? `${s.score}% — Fair` : `${s.score}% — Needs work`;
      const date  = formatDate(s.timestamp);

      return `
        <div class="history-item">
          <div>
            <div class="hi-pose">${s.pose}</div>
            <div class="hi-date">${date}</div>
          </div>
          <div class="hi-pill ${cls}">${label}</div>
          <div class="hi-duration">${formatDuration(s.duration)}</div>
          <button class="hi-expand-btn" onclick="toggleFeedback(${i})">Feedback</button>
          <div class="hi-feedback" id="hifeed-${i}">${s.feedback}</div>
        </div>
      `;
    }).join('');
  }

  window.toggleFeedback = function (i) {
    const el  = document.getElementById(`hifeed-${i}`);
    const btn = el.previousElementSibling;
    const open = el.classList.toggle('open');
    btn.textContent = open ? 'Hide' : 'Feedback';
  };

  /* ─────────────────────────────────────────
     FORMATTERS
  ───────────────────────────────────────── */
  function formatDuration(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ─────────────────────────────────────────
     REVEAL ANIMATION
  ───────────────────────────────────────── */
  function initReveal() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  /* ─────────────────────────────────────────
     INIT
  ───────────────────────────────────────── */
  function init() {
    seedDemoSessions();   // remove once Flask is live
    populateProfileForm();

    const sessions = loadSessions();

    if (sessions.length === 0) {
      document.getElementById('emptyState').style.display = 'flex';
    } else {
      document.getElementById('emptyState').style.display = 'none';
      renderStats(sessions);
      renderLastSession(sessions);
      renderPatterns(sessions);
      renderHistory(sessions);
    }

    initReveal();
  }

  document.addEventListener('DOMContentLoaded', init);

})();