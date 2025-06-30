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
}

// --- Show Profile ---
async function showProfile() {
  // Reset login button state
  loginBtnText.classList.remove("hidden");
  loginBtnLoading.classList.add("hidden");
  loginBtn.disabled = false;
  
  loginContainer.classList.add("hidden");
  profileContainer.classList.remove("hidden");

  // Show loading message
  userDetails.innerHTML = '<p class="loading">Loading user information...</p>';

  // Fetch user basic info
  let userInfo = await fetchGraphQL(
    `
    query {
      user {
        id
        login
        email
        attrs
        createdAt
        updatedAt
      }
    }
  `
  );

  // If the first query fails, try alternative query structure
  if (!userInfo || !userInfo.data || !userInfo.data.user) {
    console.log("First query failed, trying alternative structure...");
    userInfo = await fetchGraphQL(
      `
      query {
        user_by_pk(id: 1) {
          id
          login
          email
          attrs
        }
      }
    `
    );
  }

  // If still no success, try a simpler query
  if (!userInfo || !userInfo.data || !userInfo.data.user) {
    console.log("Second query failed, trying simple structure...");
    userInfo = await fetchGraphQL(
      `
      query {
        user {
          id
          login
          email
        }
      }
    `
    );
  }

  console.log("User info response:", userInfo);

  if (!userInfo) {
    userDetails.innerHTML = '<p class="error">Failed to load user info - GraphQL request failed.</p>';
    return;
  }

  if (!userInfo.data) {
    userDetails.innerHTML = '<p class="error">Failed to load user info - No data in response.</p>';
    return;
  }

  if (!userInfo.data.user) {
    userDetails.innerHTML = '<p class="error">Failed to load user info - No user data found.</p>';
    return;
  }

  if (!userInfo.data.user[0]) {
    userDetails.innerHTML = '<p class="error">Failed to load user info - User array is empty.</p>';
    return;
  }

  const user = userInfo.data.user[0];
  console.log("User info:", user);
  
  // Parse user attributes (attrs might contain additional user data)
  let userAttrs = {};
  if (user.attrs) {
    try {
      userAttrs = typeof user.attrs === 'string' ? JSON.parse(user.attrs) : user.attrs;
    } catch (e) {
      console.log("Could not parse user attrs:", e);
    }
  }
  
  // Fetch XP amount
  const xpData = await fetchGraphQL(
    `
    query {
      transaction_aggregate(where: {type: {_eq: "xp"}}) {
        aggregate {
          sum {
            amount
          }
          count
        }
      }
    }
  `
  );

  // Fetch audits
  const auditsData = await fetchGraphQL(
    `
    query {
      transaction(where: {type: {_eq: "up"}, amount: {_gt: 0}}, order_by: {createdAt: desc}, limit: 10) {
        id
        amount
        createdAt
        path
      }
    }
  `
  );

  // Calculate total XP
  let totalXP = 0;
  if (xpData && xpData.data && xpData.data.transaction_aggregate) {
    totalXP = xpData.data.transaction_aggregate.aggregate.sum.amount || 0;
  }

  // Store audits data globally for load more functionality
  window.allAudits = auditsData?.data?.transaction || [];
  window.currentAuditLimit = 10;

  // Format user details with better styling
  const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
  
  // Format date of birth properly
  let dateOfBirth = 'Not available';
  if (userAttrs.dateOfBirth) {
    try {
      const dob = new Date(userAttrs.dateOfBirth);
      dateOfBirth = dob.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      dateOfBirth = userAttrs.dateOfBirth;
    }
  }
  
  // Map the correct field names from attrs
  const degree = userAttrs.Degree || userAttrs.qualification || 'Not available';
  const country = userAttrs.country || 'Not available';
  const job = userAttrs.jobtitle || userAttrs.employment || 'Not available';
  const phone = userAttrs.PhoneNumber || userAttrs.phone || 'Not available';
  const firstName = userAttrs.firstName || '';
  const lastName = userAttrs.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Not available';
  
  userDetails.innerHTML = `
    <div class="user-info-grid">
      <div class="user-info-item">
        <span class="user-info-label">Full Name:</span>
        <span class="user-info-value">${fullName}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Username:</span>
        <span class="user-info-value">${user.login}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Email:</span>
        <span class="user-info-value">${user.email || 'Not available'}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Phone Number:</span>
        <span class="user-info-value">${phone}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Date of Birth:</span>
        <span class="user-info-value">${dateOfBirth}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Country:</span>
        <span class="user-info-value">${country}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Job:</span>
        <span class="user-info-value">${job}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Degree:</span>
        <span class="user-info-value">${degree}</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Total XP:</span>
        <span class="user-info-value">${totalXP.toLocaleString()} XP</span>
      </div>
      <div class="user-info-item">
        <span class="user-info-label">Member Since:</span>
        <span class="user-info-value">${createdAt}</span>
      </div>
    </div>
    
    ${auditsData && auditsData.data && auditsData.data.transaction.length > 0 ? `
    <div class="audits-section">
      <h4>Recent Audits</h4>
      <div id="audits-list" class="audits-list">
        ${displayAudits(auditsData.data.transaction.slice(0, 10))}
      </div>
      ${auditsData.data.transaction.length >= 10 ? `
        <button id="load-more-audits" class="load-more-btn" onclick="loadMoreAudits()">
          Load More Audits
        </button>
      ` : ''}
    </div>
    ` : ''}
  `;

  // Fetch XP transactions for XP graph
  const xpTransactionsData = await fetchGraphQL(
    `
    query {
      transaction(where: {type: {_eq: "xp"}} order_by: {createdAt: asc}) {
        amount
        createdAt
        path
      }
    }
  `
  );

  // Draw graphs
  if (xpTransactionsData && xpTransactionsData.data) {
    console.log("Skills graph data:", xpTransactionsData.data.transaction);
    console.log("drawSkillsGraph input data:", xpTransactionsData.data.transaction);
    drawSkillsGraph(xpTransactionsData.data.transaction);
  }
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

// --- Draw XP over time line graph ---
function drawXPGraph(data) {
  const svg = document.getElementById("xp-graph");
  svg.innerHTML = ""; // clear

  if (data.length === 0) {
    svg.textContent = "No XP data";
    return;
  }

  // Parse dates and amounts
  const points = data.map((item, i) => ({
    date: new Date(item.createdAt),
    amount: item.amount,
  }));

  // Calculate cumulative XP over time
  let cumulative = 0;
  points.forEach((p) => (cumulative += p.amount));
  let cumulativePoints = [];
  cumulative = 0;
  for (let i = 0; i < points.length; i++) {
    cumulative += points[i].amount;
    cumulativePoints.push({ date: points[i].date, amount: cumulative });
  }

  // SVG setup
  const width = svg.clientWidth;
  const height = svg.clientHeight;
  const margin = 40;

  // Scale functions
  const dates = cumulativePoints.map((p) => p.date);
  const amounts = cumulativePoints.map((p) => p.amount);

  const xMin = Math.min(...dates.map((d) => d.getTime()));
  const xMax = Math.max(...dates.map((d) => d.getTime()));

  const yMin = 0;
  const yMax = Math.max(...amounts);

  const scaleX = (d) =>
    margin + ((d.getTime() - xMin) / (xMax - xMin)) * (width - 2 * margin);
  const scaleY = (a) => height - margin - (a / yMax) * (height - 2 * margin);

  // Draw axis lines
  const axisColor = "#333";
  const axisStrokeWidth = 1;

  // X axis
  svg.appendChild(
    createLine(
      margin,
      height - margin,
      width - margin,
      height - margin,
      axisColor,
      axisStrokeWidth
    )
  );

  // Y axis
  svg.appendChild(
    createLine(margin, margin, margin, height - margin, axisColor, axisStrokeWidth)
  );

  // Draw polyline for XP
  const pointsStr = cumulativePoints
    .map((p) => `${scaleX(p.date)},${scaleY(p.amount)}`)
    .join(" ");

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", pointsStr);
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "blue");
  polyline.setAttribute("stroke-width", "2");
  svg.appendChild(polyline);

  // Labels
  // Y max label
  svg.appendChild(createText(margin - 30, scaleY(yMax), yMax.toFixed(0)));
  // Y zero label
  svg.appendChild(createText(margin - 30, scaleY(0), "0"));
}

// --- SVG helper functions ---

function createLine(x1, y1, x2, y2, color, width) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", width);
  return line;
}

function createText(x, y, text) {
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", x);
  t.setAttribute("y", y);
  t.setAttribute("font-size", "12");
  t.setAttribute("fill", "#333");
  t.textContent = text;
  return t;
}

function createArc(cx, cy, r, startAngle, endAngle, color, label) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  const startX = cx + r * Math.cos(startAngle);
  const startY = cy + r * Math.sin(startAngle);
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy + r * Math.sin(endAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  const d = [
    `M ${cx} ${cy}`,
    `L ${startX} ${startY}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    "Z",
  ].join(" ");

  path.setAttribute("d", d);
  path.setAttribute("fill", color);

  // Add label in the middle of the arc
  const midAngle = (startAngle + endAngle) / 2;
  const labelX = cx + (r / 2) * Math.cos(midAngle);
  const labelY = cy + (r / 2) * Math.sin(midAngle);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", labelX);
  text.setAttribute("y", labelY);
  text.setAttribute("fill", "white");
  text.setAttribute("font-weight", "bold");
  text.setAttribute("font-size", "16");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.textContent = label;

  // Return both elements as an array
  return [path, text];
}

// --- Helper function to display audits ---
function displayAudits(audits) {
  return audits.map(audit => {
    // Extract project name from path (last part after the last slash)
    const projectName = audit.path.split('/').pop() || audit.path;
    // Display correct sign based on amount
    const sign = audit.amount >= 0 ? '+' : '';
    return `
      <div class="audit-item">
        <span class="audit-path">${projectName}</span>
        <span class="audit-amount">${sign}${audit.amount} XP</span>
        <span class="audit-date">${new Date(audit.createdAt).toLocaleDateString()}</span>
      </div>
    `;
  }).join('');
}

// --- Load more audits function ---
async function loadMoreAudits() {
  const loadMoreBtn = document.getElementById('load-more-audits');
  const auditsList = document.getElementById('audits-list');
  
  // Show loading state
  loadMoreBtn.textContent = 'Loading...';
  loadMoreBtn.disabled = true;
  
  try {
    // Fetch more audits
    const moreAuditsData = await fetchGraphQL(
      `
      query {
        transaction(where: {type: {_eq: "up"}, amount: {_gt: 0}}, order_by: {createdAt: desc}, limit: 20, offset: ${window.currentAuditLimit}) {
          id
          amount
          createdAt
          path
        }
      }
    `
    );
    
    if (moreAuditsData && moreAuditsData.data && moreAuditsData.data.transaction.length > 0) {
      // Add new audits to the global array
      window.allAudits = [...window.allAudits, ...moreAuditsData.data.transaction];
      window.currentAuditLimit += 20;
      
      // Update the display
      auditsList.innerHTML = displayAudits(window.allAudits);
      
      // Hide button if no more data
      if (moreAuditsData.data.transaction.length < 20) {
        loadMoreBtn.style.display = 'none';
      }
    } else {
      // No more data
      loadMoreBtn.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading more audits:', error);
    loadMoreBtn.textContent = 'Error loading more';
  }
  
  // Reset button state
  loadMoreBtn.textContent = 'Load More Audits';
  loadMoreBtn.disabled = false;
}

// --- Initialization ---
loginForm.addEventListener("submit", login);
logoutBtn.addEventListener("click", logout);

// Try auto-login if JWT present
window.addEventListener("load", () => {
  const token = localStorage.getItem("jwtToken");
  console.log("Retrieved token from localStorage:", token);
  console.log("Token parts:", token ? token.split('.').length : 'No token');
  if (token) {
    jwtToken = token;
    showProfile();
  }
});

