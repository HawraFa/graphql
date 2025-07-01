const API_BASE = "https://learn.reboot01.com/api";
const GRAPHQL_ENDPOINT = API_BASE + "/graphql-engine/v1/graphql";
const SIGNIN_ENDPOINT = API_BASE + "/auth/signin";

const loginContainer = document.getElementById("login-container");
const profileContainer = document.getElementById("profile-container");
const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const loginBtnText = document.getElementById("login-btn-text");
const loginBtnLoading = document.getElementById("login-btn-loading");
const logoutBtn = document.getElementById("logout-btn");
const loginError = document.getElementById("login-error");
const userDetails = document.getElementById("user-details");

let jwtToken = null;

// --- Login function ---
async function login(event) {
  if (event) event.preventDefault();
  
  // Show loading state
  loginBtnText.classList.add("hidden");
  loginBtnLoading.classList.remove("hidden");
  loginBtn.disabled = true;
  loginError.classList.add("hidden");
  
  const usernameEmail = document.getElementById("usernameEmail").value.trim();
  const password = document.getElementById("password").value;

  if (!usernameEmail || !password) {
    showLoginError("Please enter username/email and password.");
    return;
  }

  const credentials = btoa(`${usernameEmail}:${password}`);

  try {
    const res = await fetch(SIGNIN_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json();
      showLoginError(err.message || "Login failed.");
      return;
    }

    const data = await res.json();
    console.log("Login response data:", data);
    
    // Handle different response formats
    let token;
    if (typeof data === 'string') {
      // API returns token directly as string
      token = data;
    } else if (data.access_token) {
      // API returns object with access_token property
      token = data.access_token;
    } else {
      console.error("Unexpected login response format:", data);
      showLoginError("Unexpected response format from server.");
      return;
    }
    
    jwtToken = token;
    console.log("JWT token received:", jwtToken);
    console.log("JWT token length:", jwtToken ? jwtToken.length : 'No token');
    console.log("JWT token parts:", jwtToken ? jwtToken.split('.').length : 'No token');
    
    // Validate JWT format
    if (jwtToken && jwtToken.split('.').length !== 3) {
      console.error("Invalid JWT token format - expected 3 parts, got:", jwtToken.split('.').length);
      showLoginError("Invalid token received from server.");
      return;
    }
    
    localStorage.setItem("jwtToken", jwtToken);
    console.log("Token stored in localStorage, now calling showProfile...");
    showProfile();
  } catch (e) {
    showLoginError("Network error. Please check your connection.");
    console.error(e);
  }
}

function showLoginError(message) {
  loginError.textContent = message;
  loginError.classList.remove("hidden");
  
  // Reset button state
  loginBtnText.classList.remove("hidden");
  loginBtnLoading.classList.add("hidden");
  loginBtn.disabled = false;
}

// --- Logout ---
function logout() {
  jwtToken = null;
  localStorage.removeItem("jwtToken");
  profileContainer.classList.add("hidden");
  loginContainer.classList.remove("hidden");
  
  // Reset form
  document.getElementById("usernameEmail").value = "";
  document.getElementById("password").value = "";
  loginError.classList.add("hidden");
  
  // Disable scrolling on login page
  document.body.classList.add('no-scroll');
}

// --- Helper: GraphQL fetch ---
async function fetchGraphQL(query) {
  try {
    console.log("Sending GraphQL query:", query);
    console.log("Using JWT token:", jwtToken ? "Present" : "Missing");
    
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ query }),
    });
    
    console.log("GraphQL response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("GraphQL HTTP error:", res.status, errorText);
      return null;
    }
    
    const data = await res.json();
    console.log("GraphQL response data:", data);
    
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error("GraphQL fetch error:", e);
    return null;
  }
}

// --- Initialization ---
loginForm.addEventListener("submit", login);
logoutBtn.addEventListener("click", logout);

// Try auto-login if JWT present
window.addEventListener("load", () => {
  // Disable scrolling on login page by default
  document.body.classList.add('no-scroll');
  
  const token = localStorage.getItem("jwtToken");
  console.log("Retrieved token from localStorage:", token);
  console.log("Token parts:", token ? token.split('.').length : 'No token');
  if (token) {
    jwtToken = token;
    showProfile();
  }
});

// Route checking functionality for 404 handling
function checkRoute() {
  const validRoutes = ['/', '/index.html', '/login', '/profile', '/404.html']; // Add all your valid routes
  const currentPath = window.location.pathname;
  
  // Check if the current path is valid
  if (!validRoutes.includes(currentPath)) {
    // Check if it's a file extension that doesn't exist
    if (currentPath.includes('.html') || currentPath.includes('.js') || currentPath.includes('.css')) {
      window.location.href = '/404.html';
      return;
    }
    
    // For other invalid routes, redirect to 404
    window.location.href = '/404.html';
  }
}

// Call this on page load
window.addEventListener('load', checkRoute);

// Also check on navigation (for single-page app behavior)
window.addEventListener('popstate', checkRoute); 