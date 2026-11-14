const form = document.getElementById('authForm');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const fullNameGroup = document.getElementById('fullNameGroup');
const confirmGroup = document.getElementById('confirmGroup');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const heading = document.getElementById('heading');
const subtitle = document.getElementById('subtitle');
const emailLabel = document.getElementById('emailLabel');
const passwordHint = document.getElementById('passwordHint');
const submitButton = document.getElementById('submitButton');
const message = document.getElementById('message');

let mode = 'login';
let redirectingToStore = false;

function showMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`;
}

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === 'register';
  loginTab.classList.toggle('active', !registering);
  registerTab.classList.toggle('active', registering);
  loginTab.setAttribute('aria-selected', String(!registering));
  registerTab.setAttribute('aria-selected', String(registering));
  fullNameGroup.hidden = !registering;
  confirmGroup.hidden = !registering;
  fullNameInput.required = registering;
  confirmInput.required = registering;
  emailInput.type = registering ? 'email' : 'text';
  emailInput.autocomplete = registering ? 'email' : 'username';
  emailInput.placeholder = registering ? 'you@example.com' : 'Enter email or username';
  emailLabel.textContent = registering ? 'Email address' : 'Email or username';
  passwordInput.autocomplete = registering ? 'new-password' : 'current-password';
  passwordInput.minLength = registering ? 12 : 1;
  passwordHint.hidden = !registering;
  heading.textContent = registering ? 'Create your account.' : 'Welcome back.';
  subtitle.textContent = registering
    ? 'Join TechStore and enjoy a better shopping experience.'
    : 'Sign in to continue your shopping experience.';
  submitButton.textContent = registering ? 'Create account' : 'Sign in';
  showMessage('');
}

async function redirectIfAlreadyLoggedIn() {
  if (redirectingToStore) return;

  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });

    if (response.ok) {
      redirectingToStore = true;
      window.location.replace('/');
    }
  } catch (error) {
    console.warn('Unable to check the existing TechStore session.', error);
  }
}

// Redirect an existing customer away from the sign-in/register page.
redirectIfAlreadyLoggedIn();

// Recheck if the browser restores this page from its back/forward cache.
window.addEventListener('pageshow', redirectIfAlreadyLoggedIn);

loginTab.addEventListener('click', () => setMode('login'));
registerTab.addEventListener('click', () => setMode('register'));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage('');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (mode === 'register') {
    if (fullNameInput.value.trim().length < 2) {
      showMessage('Please enter your full name.', 'error');
      return;
    }
    if (password.length < 12 || new TextEncoder().encode(password).length > 72) {
      showMessage('Password must be at least 12 characters and no more than 72 bytes.', 'error');
      return;
    }
    if (password !== confirmInput.value) {
      showMessage('Passwords do not match.', 'error');
      return;
    }
  }

  submitButton.disabled = true;
  try {
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = mode === 'register'
      ? { fullName: fullNameInput.value.trim(), email, password }
      : { email, password };

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed. Please try again.');
    }

    if (mode === 'register') {
      showMessage('Account created successfully. Please sign in.', 'success');
      emailInput.value = email;
      passwordInput.value = '';
      confirmInput.value = '';
      setMode('login');
      showMessage('Account created successfully. Please sign in.', 'success');
      passwordInput.focus();
    } else {
      showMessage('Login successful. Welcome to TechStore!', 'success');
      redirectingToStore = true;
      // Replace auth page in browser history after successful login.
      window.location.replace('/');
    }
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
});
