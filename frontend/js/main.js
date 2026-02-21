/**
 * MAIN.JS - LOGIN PAGE
 * Handles user login/registration
 * 
 * WORKFLOW:
 * 1. User enters name and email
 * 2. Form submits to backend (POST /api/users)
 * 3. Backend creates/returns user
 * 4. User data stored in localStorage
 * 5. Redirect to products.html
 */

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM
const tabSignIn = document.getElementById('tabSignIn');
const tabSignUp = document.getElementById('tabSignUp');
const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const storekeeperFields = document.getElementById('storekeeperFields');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Sign in elements
const signinEmail = document.getElementById('signinEmail');
const signinPassword = document.getElementById('signinPassword');

// Sign up elements
const signupUsername = document.getElementById('signupUsername');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupRoleRadios = document.getElementsByName('role');
const storeNameInput = document.getElementById('storeName');
const storeLocationInput = document.getElementById('storeLocation');

document.addEventListener('DOMContentLoaded', () => {
  // Tab handlers
  tabSignIn.addEventListener('click', () => switchTab('signin'));
  tabSignUp.addEventListener('click', () => switchTab('signup'));

  // Role toggle for signup
  signupRoleRadios.forEach(r => r.addEventListener('change', onRoleChange));

  // Form handlers
  signInForm.addEventListener('submit', handleSignIn);
  signUpForm.addEventListener('submit', handleSignUp);

  // If already logged in, redirect based on stored user
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    try {
      const u = JSON.parse(user);
      redirectByRole(u.role);
    } catch (e) {
      // ignore
    }
  }
});

function switchTab(tab) {
  if (tab === 'signin') {
    tabSignIn.classList.add('active');
    tabSignUp.classList.remove('active');
    signInForm.style.display = '';
    signUpForm.style.display = 'none';
  } else {
    tabSignIn.classList.remove('active');
    tabSignUp.classList.add('active');
    signInForm.style.display = 'none';
    signUpForm.style.display = '';
  }
  hideMessages();
}

function onRoleChange() {
  const role = Array.from(signupRoleRadios).find(r => r.checked).value;
  if (role === 'storekeeper') {
    storekeeperFields.style.display = '';
  } else {
    storekeeperFields.style.display = 'none';
  }
}

async function handleSignIn(e) {
  e.preventDefault();
  hideMessages();

  const email = signinEmail.value.trim();
  const password = signinPassword.value;

  if (!email || !password) {
    showError('Email and password are required');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/users/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sign in failed');

    // Save access token, refresh token and user
    localStorage.setItem('token', data.accessToken || data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    showSuccess('Signed in successfully — redirecting...');
    setTimeout(() => redirectByRole(data.user.role), 800);
  } catch (err) {
    showError(err.message || 'Sign in failed');
  }
}

async function handleSignUp(e) {
  e.preventDefault();
  hideMessages();

  const username = signupUsername.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  const role = Array.from(signupRoleRadios).find(r => r.checked).value;

  if (!username || !email || !password || !role) {
    showError('Please fill in username, email, password and role');
    return;
  }

  // Basic email/password validation
  if (!isValidEmail(email)) { showError('Enter a valid email'); return; }
  if (password.length < 6) { showError('Password must be at least 6 characters'); return; }

  // Build payload
  const payload = { username, email, password, role };

  if (role === 'storekeeper') {
    // require store metadata only (products added later)
    const storeName = storeNameInput.value.trim();
    const storeLocation = storeLocationInput.value.trim();

    if (!storeName || !storeLocation) {
      showError('Store name and location are required for store keepers');
      return;
    }

    payload.storeName = storeName;
    payload.location = storeLocation;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sign up failed');

    // Save access token, refresh token and user
    localStorage.setItem('token', data.accessToken || data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    showSuccess('Sign up successful — redirecting...');
    setTimeout(() => redirectByRole(data.user.role), 800);
  } catch (err) {
    showError(err.message || 'Sign up failed');
  }
}

function redirectByRole(role) {
  if (role === 'storekeeper') window.location.href = 'storekeeper-dashboard.html';
  else window.location.href = 'student-dashboard.html';
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showError(msg) { errorMessage.textContent = msg; errorMessage.style.display = 'block'; successMessage.style.display = 'none'; }
function showSuccess(msg) { successMessage.textContent = msg; successMessage.style.display = 'block'; errorMessage.style.display = 'none'; }
function hideMessages() { errorMessage.style.display = 'none'; successMessage.style.display = 'none'; }
