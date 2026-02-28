/* ============================================================
   DEHA — AUTH PAGE LOGIC
   ============================================================ */

/* ── Flip between sign in / sign up ── */
function doFlip() {
  const card = document.getElementById('flipCard');
  if (card.classList.contains('flipped')) {
    card.classList.remove('flipped');
  } else {
    card.classList.add('flipped');
  }
}

/* ── Password visibility toggle ── */
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden
    ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
         <path d="M2 2l12 12M6.5 6.6A2.5 2.5 0 0 0 9.4 9.5M4.2 4.3C2.5 5.4 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.8-1M7 3.1C7.3 3 7.7 3 8 3c4.5 0 7 5 7 5s-.7 1.4-1.8 2.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/>
       </svg>`
    : `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
         <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" stroke-width="1.3" fill="none"/>
         <circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.3" fill="none"/>
       </svg>`;
}

/* ── Password strength ── */
const signupPassword = document.getElementById('signupPassword');
if (signupPassword) {
  signupPassword.addEventListener('input', () => {
    const val = signupPassword.value;
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!fill || !label) return;

    let strength = 'weak';
    if (val.length >= 12 && /[A-Z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)) {
      strength = 'strong';
    } else if (val.length >= 8 && (/[A-Z]/.test(val) || /[0-9]/.test(val))) {
      strength = 'medium';
    }

    fill.className  = 'auth-strength-fill ' + (val.length ? strength : '');
    label.className = 'auth-strength-label ' + (val.length ? strength : '');
    label.textContent = val.length === 0 ? '' :
      strength === 'strong' ? 'Strong password' :
      strength === 'medium' ? 'Getting there…' :
      'Too weak — add numbers & symbols';
  });
}

/* ── Show error message ── */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}
function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/* ── LOGIN handler ── */
function handleLogin(e) {
  e.preventDefault();
  clearError('loginError');

  const email = document.getElementById('loginEmail')?.value.trim();
  const pass  = document.getElementById('loginPassword')?.value;

  const users = JSON.parse(localStorage.getItem('deha_users') || '{}');

  if (!users[email]) {
    showError('loginError', 'No account found for that email. Create one first!');
    return;
  }
  if (users[email].password !== btoa(pass)) {
    showError('loginError', 'Incorrect password. Please try again.');
    return;
  }

  localStorage.setItem('deha_current_user', email);
  window.location.href = 'profile.html';
}

/* ── SIGNUP handler ── */
function handleSignup(e) {
  e.preventDefault();
  clearError('signupError');

  const email   = document.getElementById('signupEmail')?.value.trim();
  const pass    = document.getElementById('signupPassword')?.value;
  const confirm = document.getElementById('signupConfirm')?.value;

  if (pass !== confirm) {
    showError('signupError', 'Passwords don\'t match. Please check and try again.');
    return;
  }
  if (pass.length < 8) {
    showError('signupError', 'Password must be at least 8 characters.');
    return;
  }

  const users = JSON.parse(localStorage.getItem('deha_users') || '{}');
  if (users[email]) {
    showError('signupError', 'An account with that email already exists. Try signing in!');
    return;
  }

  users[email] = { password: btoa(pass), createdAt: Date.now() };
  localStorage.setItem('deha_users', JSON.stringify(users));
  localStorage.setItem('deha_current_user', email);
  window.location.href = 'profile.html';
}