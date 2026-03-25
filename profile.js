/* ============================================================
   DEHA — PROFILE PAGE JAVASCRIPT (Firebase + Firestore)
   ============================================================ */

import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { collection, getDocs, orderBy, query, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

(function () {
  'use strict';

  let currentUser = null;

  /* ─────────────────────────────────────────
     AUTH — redirect if not logged in
  ───────────────────────────────────────── */
  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = 'auth.html'; return; }
    currentUser = user;
    document.getElementById('profileEmailDisplay').textContent = user.email || '—';
    await loadProfileFromFirestore(user.uid);
    await loadSessionsFromFirestore(user.uid);
    initReveal();
  });

  /* ─────────────────────────────────────────
     LOGOUT
  ───────────────────────────────────────── */
  window.logOut = async function () {
    await signOut(auth);
    window.location.href = 'auth.html';
  };

  /* ─────────────────────────────────────────
     DELETE ACCOUNT
  ───────────────────────────────────────── */
  window.openDeleteModal  = () => document.getElementById('deleteModal').classList.add('open');
  window.closeDeleteModal = () => document.getElementById('deleteModal').classList.remove('open');

  window.deleteAccount = async function () {
    if (!currentUser) return;
    const btn = document.querySelector('.pf-delete-confirm-btn');
    btn.textContent = 'Deleting…';
    btn.disabled = true;

    try {
      // Delete all sessions
      const snap = await getDocs(collection(db, 'users', currentUser.uid, 'sessions'));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'users', currentUser.uid, 'sessions', d.id))));

      // Delete profile doc
      await deleteDoc(doc(db, 'users', currentUser.uid, 'profile', 'data'));

      // Delete Firebase Auth account
      await deleteUser(currentUser);

      window.location.href = 'auth.html';
    } catch (err) {
      console.error('[Deha] Delete failed:', err);
      if (err.code === 'auth/requires-recent-login') {
        alert('For security, please sign out and sign back in before deleting your account.');
        closeDeleteModal();
      } else {
        alert('Something went wrong. Please try again.');
      }
      btn.textContent = 'Yes, Delete';
      btn.disabled = false;
    }
  };

  /* ─────────────────────────────────────────
     PROFILE FORM — LOAD & SAVE (Firestore)
  ───────────────────────────────────────── */
  async function loadProfileFromFirestore(uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'profile', 'data'));
      if (snap.exists()) {
        const p = snap.data();
        if (p.username) {
          document.getElementById('pfUsername').value              = p.username;
          document.getElementById('profileNameDisplay').textContent = p.username;
          document.getElementById('profileAvatar').textContent     = p.username.charAt(0).toUpperCase();
        }
        if (p.email)   document.getElementById('pfEmail').value  = p.email;
        if (p.height)  document.getElementById('pfHeight').value = p.height;
        if (p.gender) {
          const radio = document.querySelector(`input[name="gender"][value="${p.gender}"]`);
          if (radio) radio.checked = true;
        }
      }
    } catch (err) { console.error('[Deha] Failed to load profile:', err); }
  }

  window.saveProfile = async function (e) {
    e.preventDefault();
    if (!currentUser) return;

    const username = document.getElementById('pfUsername').value.trim();
    const email    = document.getElementById('pfEmail').value.trim();
    const height   = document.getElementById('pfHeight').value.trim();
    const genderEl = document.querySelector('input[name="gender"]:checked');
    const gender   = genderEl ? genderEl.value : 'prefer_not';
    if (!username) return;

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'data'), { username, email, gender, height });
      document.getElementById('profileNameDisplay').textContent  = username;
      document.getElementById('profileEmailDisplay').textContent = email || currentUser.email || '—';
      document.getElementById('profileAvatar').textContent       = username.charAt(0).toUpperCase();
      const msg = document.getElementById('pfSavedMsg');
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display = 'none'; }, 2800);
    } catch (err) { console.error('[Deha] Failed to save profile:', err); }
  };

  window.clearProfile = async function () {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'data'), {});
      location.reload();
    } catch (err) { console.error('[Deha] Failed to clear profile:', err); }
  };

  /* ─────────────────────────────────────────
     LOAD SESSIONS FROM FIRESTORE
  ───────────────────────────────────────── */
  async function loadSessionsFromFirestore(uid) {
    try {
      const q    = query(collection(db, 'users', uid, 'sessions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);

      const sessions = snap.docs.map(d => {
        const data = d.data();
        return {
          id:            d.id,
          pose:          data.pose        || '—',
          score:         data.accuracy    || 0,
          stability:     data.stability   || 0,
          duration:      data.durationSecs || 0,
          durationStr:   data.duration    || '—',
          topArea:       data.topArea     || 'None',
          timestamp:     data.createdAt?.toMillis() || Date.now(),
          feedback:      generateFeedbackText(data.pose, data.accuracy, [data.topArea]),
          topCorrections: data.topArea ? [data.topArea] : [],
        };
      });

      if (sessions.length === 0) {
        document.getElementById('emptyState').style.display = 'flex';
      } else {
        document.getElementById('emptyState').style.display = 'none';
        renderStats(sessions);
        renderLastSession(sessions);
        renderPatterns(sessions);
        renderHistory(sessions);
      }
    } catch (err) {
      console.error('[Deha] Failed to load sessions:', err);
      document.getElementById('emptyState').style.display = 'flex';
    }
  }

  function generateFeedbackText(pose, score, areas) {
    const areaStr = (areas || []).filter(a => a && a !== 'None').join(' and ').toLowerCase();
    if (score >= 80) return `Strong session with ${pose}. Your form was consistent throughout. Keep building on this stability.`;
    if (score >= 65) return `Good effort in ${pose}. ${areaStr ? `Minor adjustments needed around ${areaStr}.` : 'Keep refining your form.'}`;
    return `${pose} needs more practice. ${areaStr ? `Focus on ${areaStr}.` : 'Try holding the pose longer.'} Build muscle memory with consistent practice.`;
  }

  /* ─────────────────────────────────────────
     STATS ROW
  ───────────────────────────────────────── */
  function renderStats(sessions) {
    document.getElementById('statTotalSessions').textContent = sessions.length;
    if (sessions.length > 0) {
      const avg = Math.round(sessions.reduce((s, x) => s + x.score, 0) / sessions.length);
      document.getElementById('statAvgAccuracy').textContent = avg + '%';
      const poseCounts = {};
      sessions.forEach(s => { poseCounts[s.pose] = (poseCounts[s.pose] || 0) + 1; });
      const top = Object.entries(poseCounts).sort((a, b) => b[1] - a[1])[0];
      document.getElementById('statFavPose').textContent = top[0].split(' ').slice(0, 2).join(' ');
    }
    document.getElementById('statStreak').textContent = calcStreak(sessions);
  }

  function calcStreak(sessions) {
    if (!sessions.length) return 0;
    const days = new Set(sessions.map(s => new Date(s.timestamp).toDateString()));
    let streak = 0, d = new Date();
    while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  }

  /* ─────────────────────────────────────────
     LAST SESSION
  ───────────────────────────────────────── */
  function renderLastSession(sessions) {
    if (!sessions.length) return;
    document.getElementById('lastSessionBlock').style.display = 'flex';
    const s   = sessions[0];
    const cls = s.score >= 75 ? 'good' : s.score >= 55 ? 'fair' : 'needs';
    document.getElementById('lastSessionCard').innerHTML = `
      <div class="ls-item"><div class="ls-label">Pose</div><div class="ls-val">${s.pose}</div></div>
      <div class="ls-item"><div class="ls-label">Accuracy</div><div class="ls-val ${cls}">${s.score}%</div></div>
      <div class="ls-item"><div class="ls-label">Stability</div><div class="ls-val">${s.stability}%</div></div>
      <div class="ls-item"><div class="ls-label">Duration</div><div class="ls-val">${s.durationStr || formatDuration(s.duration)}</div></div>
      <div class="ls-feedback">${s.feedback}</div>
    `;
  }

  /* ─────────────────────────────────────────
     PATTERN ANALYSIS
  ───────────────────────────────────────── */
  function renderPatterns(sessions) {
    if (sessions.length < 2) return;
    document.getElementById('patternBlock').style.display   = 'flex';
    document.getElementById('patternDivider').style.display = 'flex';

    const areaCounts = {};
    sessions.forEach(s => {
      (s.topCorrections || []).forEach(area => {
        if (area && area !== 'None') areaCounts[area] = (areaCounts[area] || 0) + 1;
      });
    });

    const sorted    = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);
    const total     = sessions.length;
    const mid       = Math.floor(sessions.length / 2);
    const recentAvg = avgArr(sessions.slice(0, mid).map(s => s.score));
    const olderAvg  = avgArr(sessions.slice(mid).map(s => s.score));
    const improving = recentAvg > olderAvg + 3;
    const declining = recentAvg < olderAvg - 3;

    const patterns = [];
    sorted.slice(0, 2).forEach(([area, count]) => {
      const pct = Math.round((count / total) * 100);
      patterns.push({ type: 'warn', area, desc: `You frequently receive corrections for ${area.toLowerCase()} — appearing in ${pct}% of sessions.`, freq: pct });
    });

    if (improving) patterns.push({ type: 'good', area: 'Improving Trend', desc: `Recent sessions average ${Math.round(recentAvg)}% vs ${Math.round(olderAvg)}% earlier. Keep it up!`, freq: Math.round(recentAvg) });
    else if (declining) patterns.push({ type: 'warn', area: 'Score Dipping', desc: `Recent sessions average ${Math.round(recentAvg)}% vs ${Math.round(olderAvg)}% earlier. Try shorter focused sessions.`, freq: Math.round(recentAvg) });
    else patterns.push({ type: 'info', area: 'Steady Practice', desc: `Scores consistent at ~${Math.round(recentAvg)}%. Try harder poses to grow further.`, freq: Math.round(recentAvg) });

    document.getElementById('patternCards').innerHTML = patterns.map(p => `
      <div class="pattern-card">
        <div class="pc-badge ${p.type}"><span class="pc-badge-dot"></span>${p.type === 'warn' ? 'Recurring Issue' : p.type === 'good' ? 'Positive Trend' : 'Observation'}</div>
        <div class="pc-area">${p.area}</div>
        <div class="pc-desc">${p.desc}</div>
        <div class="pc-freq">Frequency: ${p.freq}%</div>
        <div class="pc-freq-bar"><div class="pc-freq-fill ${p.type}" style="width:${p.freq}%"></div></div>
      </div>
    `).join('');
  }

  function avgArr(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

  /* ─────────────────────────────────────────
     SESSION HISTORY LIST
  ───────────────────────────────────────── */
  function renderHistory(sessions) {
    if (!sessions.length) return;
    document.getElementById('historyBlock').style.display   = 'flex';
    document.getElementById('historyDivider').style.display = 'flex';
    document.getElementById('emptyState').style.display     = 'none';

    document.getElementById('historyList').innerHTML = sessions.map((s, i) => {
      const cls   = s.score >= 75 ? 'good' : s.score >= 55 ? 'fair' : 'needs';
      const label = s.score >= 75 ? `${s.score}% — Good` : s.score >= 55 ? `${s.score}% — Fair` : `${s.score}% — Needs work`;
      return `
        <div class="history-item">
          <div><div class="hi-pose">${s.pose}</div><div class="hi-date">${formatDate(s.timestamp)}</div></div>
          <div class="hi-pill ${cls}">${label}</div>
          <div class="hi-duration">${s.durationStr || formatDuration(s.duration)}</div>
          <button class="hi-expand-btn" onclick="toggleFeedback(${i})">Feedback</button>
          <div class="hi-feedback" id="hifeed-${i}">${s.feedback}</div>
        </div>
      `;
    }).join('');
  }

  window.toggleFeedback = function (i) {
    const el = document.getElementById(`hifeed-${i}`);
    const open = el.classList.toggle('open');
    el.previousElementSibling.textContent = open ? 'Hide' : 'Feedback';
  };

  function formatDuration(secs) {
    const m = Math.floor(secs / 60), s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ─────────────────────────────────────────
     REVEAL ANIMATION
  ───────────────────────────────────────── */
  function initReveal() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

})();