/* ============================================================
   DEHA — SESSION PAGE JAVASCRIPT
   ============================================================ */

(function () {
  'use strict';

  /* ── Pose data ── */
  const POSES = {
    mountain: {
      name: 'Mountain Pose',
      sanskrit: 'Tadasana',
      tip: 'Stand with feet together, arms at sides. Ground through all four corners of each foot.',
      corrections: [
        { area: 'Spine',      text: 'Lengthen through the crown — lift your sternum gently upward', sev: 'error' },
        { area: 'Shoulders',  text: 'Roll shoulders back and draw them down away from the ears', sev: 'error' },
        { area: 'Feet',       text: 'Spread all ten toes wide and press them firmly down', sev: 'correct' },
        { area: 'Core',       text: 'Engage the lower abdomen lightly without holding your breath', sev: 'error' },
        { area: 'Arms',       text: 'Arms are relaxed by your sides, fingers pointing down', sev: 'correct' },
        { area: 'Chin',       text: 'Tuck the chin slightly to lengthen the back of the neck', sev: 'error' },
      ]
    },
    warrior1: {
      name: 'Warrior I',
      sanskrit: 'Virabhadrasana I',
      tip: 'Strong lunge with hips squared forward and arms lifted overhead.',
      corrections: [
        { area: 'Hips',       text: 'Square both hips toward the front of your mat', sev: 'error' },
        { area: 'Front Knee', text: 'Bend the front knee to 90° directly over the ankle', sev: 'error' },
        { area: 'Arms',       text: 'Reach actively through the fingertips with shoulders drawing down', sev: 'correct' },
        { area: 'Back Foot',  text: 'Press the outer edge of the back foot firmly into the mat', sev: 'error' },
        { area: 'Torso',      text: 'Lift the torso upright — resist leaning forward', sev: 'correct' },
        { area: 'Gaze',       text: 'Look forward or gently upward between your hands', sev: 'correct' },
      ]
    },
    warrior2: {
      name: 'Warrior II',
      sanskrit: 'Virabhadrasana II',
      tip: 'Open hip stance with arms extended parallel to the floor.',
      corrections: [
        { area: 'Front Knee', text: 'Track the knee directly over the second toe', sev: 'error' },
        { area: 'Arms',       text: 'Keep both arms actively parallel and energised', sev: 'correct' },
        { area: 'Hips',       text: 'Open the hips wide — do not let them tip forward', sev: 'error' },
        { area: 'Torso',      text: 'Stack the torso over the pelvis, not leaning to either side', sev: 'correct' },
        { area: 'Gaze',       text: 'Gaze steadily over the front middle finger', sev: 'correct' },
        { area: 'Shoulders',  text: 'Relax the shoulders — they tend to creep up here', sev: 'error' },
      ]
    },
    tree: {
      name: 'Tree Pose',
      sanskrit: 'Vrksasana',
      tip: 'Balance on one foot. Place the other foot on the inner thigh.',
      corrections: [
        { area: 'Standing Hip', text: 'Keep the standing hip neutral — do not hike it up', sev: 'error' },
        { area: 'Raised Foot',  text: 'Press foot firmly into thigh and thigh back into foot', sev: 'error' },
        { area: 'Arms',         text: 'Reach through the fingertips, lift through the chest', sev: 'correct' },
        { area: 'Gaze',         text: 'Fix your gaze on one still point ahead to steady the balance', sev: 'error' },
        { area: 'Core',         text: 'Engage the core gently — it is your anchor here', sev: 'correct' },
        { area: 'Spine',        text: 'Grow tall through the crown — avoid collapsing sideways', sev: 'error' },
      ]
    },
    triangle: {
      name: 'Triangle Pose',
      sanskrit: 'Trikonasana',
      tip: 'Wide-leg stance with a lateral stretch and spinal rotation.',
      corrections: [
        { area: 'Spine',      text: 'Lengthen first, then tilt — do not crunch into the side body', sev: 'error' },
        { area: 'Top Arm',    text: 'Stack the top arm directly above the bottom arm', sev: 'error' },
        { area: 'Hips',       text: 'Open both hips toward the long edge of the mat', sev: 'correct' },
        { area: 'Front Leg',  text: 'Keep the front leg straight but do not lock the knee', sev: 'error' },
        { area: 'Gaze',       text: 'Look up toward the upper hand, but keep the neck relaxed', sev: 'correct' },
        { area: 'Chest',      text: 'Open the chest — rotate the top shoulder back and upward', sev: 'error' },
      ]
    },
    eagle: {
      name: 'Eagle Pose',
      sanskrit: 'Garudasana',
      tip: 'Wrap one arm under the other and one leg over the other. Sink and balance.',
      corrections: [
        { area: 'Arms',         text: 'Wrap arms completely — lift the elbows to shoulder height', sev: 'error' },
        { area: 'Legs',         text: 'Squeeze the thighs together and lower the hips deeper', sev: 'error' },
        { area: 'Standing Heel',text: 'Ground through the standing heel actively', sev: 'correct' },
        { area: 'Gaze',         text: 'Fix gaze on a single point ahead to stabilise', sev: 'error' },
        { area: 'Spine',        text: 'Keep the spine tall — resist rounding forward', sev: 'correct' },
      ]
    },
    dancer: {
      name: "Dancer's Pose",
      sanskrit: 'Natarajasana',
      tip: 'Stand on one leg. Reach back for the lifted foot. Extend the opposite arm forward.',
      corrections: [
        { area: 'Standing Leg', text: 'Root the standing leg firmly — knee soft, not locked', sev: 'correct' },
        { area: 'Lifted Leg',   text: 'Kick the foot actively into the hand rather than just pulling', sev: 'error' },
        { area: 'Reach Arm',    text: 'Extend the front arm forward and upward energetically', sev: 'error' },
        { area: 'Hips',         text: 'Keep both hips squared forward — do not open to the side', sev: 'error' },
        { area: 'Gaze',         text: 'Soft, steady gaze forward to maintain balance', sev: 'correct' },
      ]
    },
    crow: {
      name: 'Crow Pose',
      sanskrit: 'Bakasana',
      tip: 'Arm balance. Knees on the upper arms, lean your weight forward.',
      corrections: [
        { area: 'Wrists',  text: 'Spread the fingers wide and distribute weight evenly across the palms', sev: 'error' },
        { area: 'Core',    text: 'Draw the belly in and upward strongly to lift the hips', sev: 'error' },
        { area: 'Gaze',    text: 'Look about 15 cm forward on the mat — not straight down', sev: 'error' },
        { area: 'Elbows',  text: 'Hold the elbows shoulder-width apart — do not let them flare outward', sev: 'correct' },
        { area: 'Knees',   text: 'Press both knees firmly into the upper arms to anchor the pose', sev: 'correct' },
      ]
    },
    child: {
      name: "Child's Pose",
      sanskrit: 'Balasana',
      tip: 'A resting fold. Hips toward heels, arms extended, forehead down.',
      corrections: [
        { area: 'Hips',     text: 'Sink hips back toward the heels completely', sev: 'error' },
        { area: 'Forehead', text: 'Rest the forehead gently on the mat and release the neck', sev: 'correct' },
        { area: 'Arms',     text: 'Extend arms fully forward and relax the shoulders', sev: 'error' },
        { area: 'Breath',   text: 'Breathe into the back body — let the ribs expand sideways', sev: 'correct' },
        { area: 'Neck',     text: 'Release all tension from the neck and jaw completely', sev: 'correct' },
      ]
    },
    lotus: {
      name: 'Lotus Pose',
      sanskrit: 'Padmasana',
      tip: 'Seated cross-leg with each foot resting on the opposite thigh.',
      corrections: [
        { area: 'Spine',     text: 'Sit tall — do not let the lower back collapse or round', sev: 'error' },
        { area: 'Knees',     text: 'Both knees should rest naturally toward the floor', sev: 'error' },
        { area: 'Hands',     text: 'Rest hands on knees, palms facing up or in Chin Mudra', sev: 'correct' },
        { area: 'Shoulders', text: 'Release the shoulders — let them fall away from the ears', sev: 'correct' },
        { area: 'Chin',      text: 'Tuck the chin very slightly to lengthen the back of the neck', sev: 'error' },
      ]
    },
    seated: {
      name: 'Seated Forward Fold',
      sanskrit: 'Paschimottanasana',
      tip: 'Sit tall, hinge forward from the hips, and reach toward the feet.',
      corrections: [
        { area: 'Spine',     text: 'Hinge from the hips — do not round the upper back to reach further', sev: 'error' },
        { area: 'Legs',      text: 'Press the backs of both legs firmly and evenly into the mat', sev: 'error' },
        { area: 'Reach',     text: 'Reach through the hands actively rather than just grabbing', sev: 'correct' },
        { area: 'Shoulders', text: 'Draw the shoulders down and away from the ears', sev: 'correct' },
        { area: 'Feet',      text: 'Flex the feet so toes point upward toward the ceiling', sev: 'error' },
      ]
    },
  };

  /* ── State ── */
  let sessionActive = false;
  let videoStream   = null;
  let confirmedName = '';
  let selectedPose  = '';
  let feedbackTimer = null;
  let scoreTimer    = null;
  let sessionClock  = null;
  let sessionSecs   = 0;
  let currentScore  = 72;
  let scoreHistory  = [];
  let correctionLog = {};

  /* ── DOM refs ── */
  const nameInput       = document.getElementById('nameInput');
  const nameConfirmed   = document.getElementById('nameConfirmed');
  const nameDisplay     = document.getElementById('nameDisplay');
  const poseSelect      = document.getElementById('poseSelect');
  const poseBrief       = document.getElementById('poseBrief');
  const poseBriefName   = document.getElementById('poseBriefName');
  const poseBriefTip    = document.getElementById('poseBriefTip');
  const btnStart        = document.getElementById('btnStart');
  const startNote       = document.querySelector('.start-note');
  const ctrlPanel       = document.getElementById('ctrlPanel');
  const feedbackPanel   = document.getElementById('feedbackPanel');
  const summaryPanel    = document.getElementById('summaryPanel');
  const cameraPlaceholder = document.getElementById('cameraPlaceholder');
  const cameraLive      = document.getElementById('cameraLive');
  const videoEl         = document.getElementById('videoEl');
  const skeletonCanvas  = document.getElementById('skeletonCanvas');
  const stopModal       = document.getElementById('stopModal');
  const statusDot       = document.getElementById('statusDot');
  const statusText      = document.getElementById('statusText');
  const fpiName         = document.getElementById('fpiName');
  const scorePill       = document.getElementById('scorePill');

  /* ── Pose change ── */
  window.onPoseChange = function () {
    selectedPose = poseSelect.value;
    if (selectedPose && POSES[selectedPose]) {
      const p = POSES[selectedPose];
      poseBriefName.textContent = p.name + ' — ' + p.sanskrit;
      poseBriefTip.textContent  = p.tip;
      poseBrief.style.display   = 'block';
      btnStart.disabled = false;
      startNote.textContent = '';
    } else {
      poseBrief.style.display = 'none';
      btnStart.disabled = true;
      startNote.textContent = 'Select a pose above to begin';
    }
  };

  /* ── Start Session ── */
  window.startSession = async function () {
    if (!selectedPose) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      videoStream = stream;
      videoEl.srcObject = stream;

      // Name
      try {
        const p = JSON.parse(localStorage.getItem('deha_profile'));
        confirmedName = p?.username || '';
    } catch (e) { confirmedName = ''; }

      const nametag = document.getElementById('cameraNametag');
      if (confirmedName) {
        nametag.textContent = confirmedName;
        nametag.style.display = 'block';
      }

      // Swap UI
      cameraPlaceholder.style.display = 'none';
      cameraLive.style.display = 'flex';
      ctrlPanel.style.display = 'none';
      feedbackPanel.style.display = 'block';

      // Status
      statusDot.classList.add('live');
      statusText.textContent = 'Live';
      fpiName.textContent = POSES[selectedPose].name;

      // Skeleton canvas size
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // Reset state
      sessionActive  = true;
      sessionSecs    = 0;
      currentScore   = 72;
      scoreHistory   = [];
      correctionLog  = {};

      // Begin loops
      sessionClock = setInterval(() => sessionSecs++, 1000);
      startFeedbackLoop();
      startScoreLoop();
      drawSkeletonLoop();

    } catch (err) {
      alert('Camera access was denied. Please allow camera permission in your browser and try again.');
    }
  };

  /* ── Stop modal ── */
  window.openStopModal  = () => stopModal.classList.add('open');
  window.closeStopModal = () => stopModal.classList.remove('open');

  window.confirmStop = function () {
    closeStopModal();
    endSession();
  };

  /* ── End session ── */
  function endSession() {
    // Stop camera
    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
      videoStream = null;
    }
    videoEl.srcObject = null;

    // Clear intervals
    clearInterval(feedbackTimer);
    clearInterval(scoreTimer);
    clearInterval(sessionClock);
    sessionActive = false;

    // Clear skeleton
    const ctx = skeletonCanvas.getContext('2d');
    ctx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
    window.removeEventListener('resize', resizeCanvas);

    // Status
    statusDot.classList.remove('live');
    statusText.textContent = 'Ended';

    // Hide camera, show placeholder end state
    cameraLive.style.display = 'none';
    cameraPlaceholder.style.display = 'flex';
    cameraPlaceholder.querySelector('.ph-title').textContent = 'Session ended';
    cameraPlaceholder.querySelector('.ph-desc').textContent =
      'Your summary is shown on the right. Start a new session when ready.';

    // Swap panels
    feedbackPanel.style.display = 'none';
    summaryPanel.style.display  = 'block';

    buildSummary();
  }

  /* ── Build summary ── */
  function buildSummary() {
    const avg = scoreHistory.length
      ? Math.round(scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length)
      : Math.round(currentScore);

    const stability = Math.min(99, Math.max(40, avg + Math.round((Math.random() - 0.4) * 10)));

    const mins = Math.floor(sessionSecs / 60);
    const secs = sessionSecs % 60;
    const durStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    const pose = POSES[selectedPose];

    // Most corrected area
    let topArea = null, topCount = 0;
    Object.entries(correctionLog).forEach(([area, count]) => {
      if (count > topCount) { topArea = area; topCount = count; }
    });

    document.getElementById('sumAccuracy').textContent  = avg + '%';
    document.getElementById('sumStability').textContent = stability + '%';
    document.getElementById('sumDuration').textContent  = durStr;
    document.getElementById('sumPose').textContent      = pose ? pose.name : '—';

    const nameStr = confirmedName ? confirmedName : 'you';
    const congrats = avg >= 80
      ? `Wonderful work, ${nameStr}! Your form was consistent and your body alignment stayed on point throughout the session.`
      : avg >= 60
        ? `Good effort, ${nameStr}! You kept at it and made real progress. A little more attention to the highlighted areas will have you nailing this pose.`
        : `Keep going, ${nameStr} — every session builds the muscle memory. Focus on the areas flagged below in your next practice.`;

    document.getElementById('summaryCongrats').textContent = congrats;

    const hlText = topArea && topCount > 0
      ? `Most worked area: ${topArea} — corrected ${topCount} time${topCount > 1 ? 's' : ''} during the session.`
      : 'Your form was consistent throughout the session. Keep building on this.';
    document.getElementById('sumHighlight').textContent = hlText;
  }

  /* ── Reset (new session) ── */
  window.resetSession = function () {
    summaryPanel.style.display = 'none';
    ctrlPanel.style.display    = 'block';

    cameraPlaceholder.querySelector('.ph-title').textContent = 'Camera will activate here';
    cameraPlaceholder.querySelector('.ph-desc').textContent  =
      'Fill in the controls on the right, then click Start Session to begin your practice.';
    cameraPlaceholder.style.display = 'flex';

    poseSelect.value = '';
    poseBrief.style.display = 'none';
    btnStart.disabled = true;
    startNote.textContent = 'Select a pose above to begin';
    nameInput.value = '';
    nameConfirmed.style.display = 'none';
    confirmedName = '';
    selectedPose = '';

    statusDot.classList.remove('live');
    statusText.textContent = 'Ready';
  };

  /* ── Feedback loop ── */
  function startFeedbackLoop() {
    updateFeedback();
    feedbackTimer = setInterval(updateFeedback, 3600);
  }

  function updateFeedback() {
    const pool = POSES[selectedPose]?.corrections || [];
    if (!pool.length) return;

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);

    shuffled.forEach(c => {
      if (c.sev === 'error') {
        correctionLog[c.area] = (correctionLog[c.area] || 0) + 1;
      }
    });

    ['slot0', 'slot1', 'slot2'].forEach((id, i) => {
      const el = document.getElementById(id);
      const c  = shuffled[i];
      if (!c) {
        el.className = 'feedback-slot empty';
        el.innerHTML = '';
        return;
      }
      el.className = `feedback-slot ${c.sev}`;
      el.innerHTML = `
        <div class="slot-dot"></div>
        <div>
          <div class="slot-area">${c.area}</div>
          <div class="slot-text">${c.text}</div>
        </div>
      `;
    });
  }

  /* ── Score loop ── */
  function startScoreLoop() {
    updateScore();
    scoreTimer = setInterval(updateScore, 2800);
  }

  function updateScore() {
    const delta = (Math.random() - 0.45) * 14;
    currentScore = Math.max(36, Math.min(97, currentScore + delta));
    const s = Math.round(currentScore);
    scoreHistory.push(s);

    if (s >= 80) {
      scorePill.textContent = s + '% — Good';
      scorePill.style.color = '#7DC49A';
      scorePill.style.borderColor = 'rgba(80,160,110,0.30)';
      scorePill.style.background  = 'rgba(80,160,110,0.10)';
    } else if (s >= 60) {
      scorePill.textContent = s + '% — Fair';
      scorePill.style.color = 'var(--gold)';
      scorePill.style.borderColor = 'rgba(212,175,55,0.30)';
      scorePill.style.background  = 'rgba(212,175,55,0.10)';
    } else {
      scorePill.textContent = s + '% — Adjust';
      scorePill.style.color = '#D98080';
      scorePill.style.borderColor = 'rgba(200,80,80,0.30)';
      scorePill.style.background  = 'rgba(200,80,80,0.10)';
    }
  }

  /* ── Skeleton canvas ── */
  function resizeCanvas() {
    skeletonCanvas.width  = cameraLive.offsetWidth;
    skeletonCanvas.height = cameraLive.offsetHeight;
  }

  const ERROR_JOINTS = new Set(['lHip', 'rHip', 'lKnee']);

  function drawSkeletonLoop() {
    if (!sessionActive) return;

    const canvas = skeletonCanvas;
    const ctx    = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const t = Date.now() / 1000;
    const sway = Math.sin(t * 0.35) * 0.014;
    const bob  = Math.sin(t * 0.55) * 0.007;

    const J = {
      nose:      [0.50 + sway, 0.11 + bob],
      lShoulder: [0.38 + sway, 0.24 + bob],
      rShoulder: [0.62 + sway, 0.24 + bob],
      lElbow:    [0.30 + sway, 0.36],
      rElbow:    [0.70 + sway, 0.36],
      lWrist:    [0.24 + sway, 0.49],
      rWrist:    [0.76 + sway, 0.49],
      lHip:      [0.42 + sway, 0.50 + bob],
      rHip:      [0.58 + sway, 0.50 + bob],
      lKnee:     [0.40 + sway, 0.67],
      rKnee:     [0.60 + sway, 0.67],
      lAnkle:    [0.40 + sway, 0.84],
      rAnkle:    [0.60 + sway, 0.84],
    };

    const CONNECTIONS = [
      ['lShoulder','rShoulder'],
      ['lShoulder','lElbow'],['lElbow','lWrist'],
      ['rShoulder','rElbow'],['rElbow','rWrist'],
      ['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],
      ['lHip','lKnee'],['lKnee','lAnkle'],
      ['rHip','rKnee'],['rKnee','rAnkle'],
    ];

    const px = (key) => [J[key][0] * W, J[key][1] * H];

    CONNECTIONS.forEach(([a, b]) => {
      const errA = ERROR_JOINTS.has(a);
      const errB = ERROR_JOINTS.has(b);
      ctx.beginPath();
      ctx.moveTo(...px(a));
      ctx.lineTo(...px(b));
      ctx.strokeStyle = (errA || errB)
        ? 'rgba(200,80,80,0.65)'
        : 'rgba(80,160,110,0.60)';
      ctx.lineWidth   = 2.4;
      ctx.lineCap     = 'round';
      ctx.stroke();
    });

    Object.keys(J).forEach(key => {
      const [x, y] = px(key);
      const isErr  = ERROR_JOINTS.has(key);
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle   = isErr ? 'rgba(217,83,79,0.88)' : 'rgba(80,160,110,0.88)';
      ctx.fill();
      ctx.strokeStyle = isErr ? 'rgba(217,83,79,0.25)' : 'rgba(80,160,110,0.25)';
      ctx.lineWidth   = 3.5;
      ctx.stroke();
    });

    requestAnimationFrame(drawSkeletonLoop);
  }

})();