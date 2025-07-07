// --- Show Profile ---
async function showProfile() {
  // Reset login button state
  loginBtnText.classList.remove("hidden");
  loginBtnLoading.classList.add("hidden");
  loginBtn.disabled = false;
  
  loginContainer.classList.add("hidden");
  profileContainer.classList.remove("hidden");

  // Enable scrolling on dashboard/profile
  document.body.classList.remove('no-scroll');

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
  
  // Fetch XP amount and level data
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

  // Fetch all XP transactions for detailed history
  const xpTransactionsData = await fetchGraphQL(
    `
    query {
      transaction(where: {type: {_eq: "xp"}}, order_by: {createdAt: desc}) {
        id
        amount
        createdAt
        path
      }
    }
  `
  );

  // Calculate total XP and level
  let totalXP = 0;
  let transactionCount = 0;
  if (xpData && xpData.data && xpData.data.transaction_aggregate) {
    totalXP = xpData.data.transaction_aggregate.aggregate.sum.amount || 0;
    transactionCount = xpData.data.transaction_aggregate.aggregate.count || 0;
  }

  // Calculate current level (assuming each level requires 1000 XP)
  const currentLevel = Math.floor(totalXP / 1000) + 1;

  // Store XP transactions globally for load more functionality
  window.allXPTransactions = xpTransactionsData?.data?.transaction || [];
  window.currentXPTransactionLimit = 20;

  // Process XP data using friend's logic for the XP board
  const getProjectName = (path) => {
    if (!path?.startsWith("/bahrain/bh-module/")) return null;
    if (path === "/bahrain/bh-module/piscine-js") return "piscine-js";
    if (path === "/bahrain/bh-module/piscine-rust") return "piscine-rust";
    if (path.includes("piscine-js")) return null;
    if (path.includes("piscine-rust")) return null;
    const match = path.match(/^\/bahrain\/bh-module\/([^\/]+)/);
    return match ? match[1] : null;
  };

  // Sort transactions by createdAt ascending
  const sortedTx = [...window.allXPTransactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const labelOrder = [];
  const xpByProject = {};
  
  sortedTx.forEach(tx => {
    if (!tx.path || !tx.amount) return;
    const label = getProjectName(tx.path);
    if (!label) return;
    // Exclude any project with 'checkpoint' in the name (case-insensitive)
    if (label.toLowerCase().includes('checkpoint')) return;
    if (!xpByProject[label]) {
      xpByProject[label] = 0;
      labelOrder.push(label);
    }
    xpByProject[label] += tx.amount;
  });

  // Now build cumulative XP
  let cumulativeXP = 0;
  const cumulativeXPByProject = {};
  labelOrder.forEach(label => {
    cumulativeXP += xpByProject[label];
    cumulativeXPByProject[label] = cumulativeXP;
  });

  // Use the calculated total XP from the same logic as the cumulative graph
  const calculatedTotalXP = cumulativeXP;

  // Get the last 5 transactions for display
  const last5Transactions = window.allXPTransactions.slice(0, 5);

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
        <span class="user-info-label">Member Since:</span>
        <span class="user-info-value">${createdAt}</span>
      </div>
    </div>
    
    ${xpTransactionsData && xpTransactionsData.data && xpTransactionsData.data.transaction.length > 0 ? `
    <div class="xp-board-section">
      <div class="xp-board-header">
        <h4>XP Board</h4>
        <div class="xp-stats">
          <div class="xp-stat-item">
            <span class="xp-stat-label">Total XP:</span>
            <span class="xp-stat-value">${calculatedTotalXP.toLocaleString()} XP</span>
          </div>
        </div>
      </div>
      
      <div class="xp-transactions-section">
        <h5>Last Transaction History</h5>
        <div id="xp-transactions-list" class="xp-transactions-list">
          ${displayXPTransactions(last5Transactions)}
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Audit Section -->
    <div class="audit-section">
      <h3>Audit Overview</h3>
      <div class="audit-overview">
        <div class="audit-ratio-display">
          <h4>Audit Ratio</h4>
          <div id="audit-ratio-container" class="audit-ratio-container">
            <div class="audit-ratio-value" id="audit-ratio-value">--</div>
            <div class="audit-ratio-label">Done / Received</div>
          </div>
        </div>
        <div class="recent-audits">
          <h4>Recent Audits</h4>
          <div id="recent-audits-list" class="recent-audits-list">
            <!-- Recent audits will be populated here -->
          </div>
        </div>
      </div>
    </div>
  `;

  // Draw graphs
  if (xpTransactionsData && xpTransactionsData.data) drawCumulativeXPGraph(xpTransactionsData.data.transaction);
  drawSkillsGraph();
  const auditData = await fetchGraphQL(
    `
    query {
      up: transaction_aggregate(where: {type: {_eq: "up"}}) {
        aggregate {
          sum {
            amount
          }
        }
      }
      down: transaction_aggregate(where: {type: {_eq: "down"}}) {
        aggregate {
          sum {
            amount
          }
        }
      }
    }
  `
  );
  // Prepare audit data for the graph
const auditPoints = {
  up: auditData?.data?.up?.aggregate?.sum?.amount || 0,
  down: auditData?.data?.down?.aggregate?.sum?.amount || 0
};

// Draw audit graph
if (auditPoints.up > 0 || auditPoints.down > 0) {
  drawAuditGraph(auditPoints);
}

// --- Populate new Audit Section ---
// Set audit ratio
const auditRatioValue = document.getElementById('audit-ratio-value');
if (auditRatioValue) {
  let ratio = auditPoints.down > 0 ? (auditPoints.up / auditPoints.down) : 0;
  // Custom rounding: only round up if the second decimal is 5 or more
  function roundAuditRatio(val) {
    const tenth = Math.floor(val * 10) / 10;
    const secondDecimal = Math.floor((val * 100) % 10);
    if (secondDecimal >= 5) {
      return (tenth + 0.1);
    } else {
      return tenth;
    }
  }
  let roundedRatio = auditPoints.down > 0 ? roundAuditRatio(ratio) : 0;
  auditRatioValue.textContent = auditPoints.down > 0 ? roundedRatio.toFixed(1) : '--';
}
// Fetch and display last 5 audits
const recentAuditsList = document.getElementById('recent-audits-list');
if (recentAuditsList) {
  // Fetch last 5 audits (type: up, amount > 0)
  const auditsData = await fetchGraphQL(`
    query {
      transaction(where: {type: {_eq: "up"}, amount: {_gt: 0}}, order_by: {createdAt: desc}, limit: 5) {
        id
        amount
        createdAt
        path
      }
    }
  `);
  const audits = auditsData?.data?.transaction || [];
  recentAuditsList.innerHTML = audits.length === 0 ? '<div class="no-audits">No audits found.</div>' : audits.map(audit => {
    // Extract project name from path (last part after the last slash)
    const projectName = audit.path.split('/').pop() || audit.path;
    return `
      <div class="recent-audit-item">
        <div class="audit-project-info">
          <span class="recent-audit-project">${projectName}</span>
          <span class="audit-status">Completed</span>
        </div>
        <span class="recent-audit-date">${new Date(audit.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}</span>
      </div>
    `;
  }).join('');
}
}

// --- Helper function to display XP transactions ---
function displayXPTransactions(transactions) {
  return transactions.map(transaction => {
    // Extract project name using friend's logic
    const getProjectName = (path) => {
      if (!path || !path.startsWith("/bahrain/bh-module/")) return path.split('/').pop() || path;
    
      if (path === "/bahrain/bh-module/piscine-js") {
        return "piscine-js";
      }

      if (path === "/bahrain/bh-module/piscine-rust") {
        return "piscine-rust";
      }

      if (path.startsWith("/bahrain/bh-module/") && path.includes("piscine-js")) return path.split('/').pop() || path;
      if (path.startsWith("/bahrain/bh-module/") && path.includes("piscine-rust")) return path.split('/').pop() || path;
    
      const match = path.match(/^\/bahrain\/bh-module\/([^\/]+)/);
      return match ? match[1] : (path.split('/').pop() || path);
    };
    
    const projectName = getProjectName(transaction.path);
    
    // Format XP amount (show full amount with proper formatting)
    let formattedAmount;
    formattedAmount = `${transaction.amount.toLocaleString()} XP`;
    
    // Format date
    const date = new Date(transaction.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Determine transaction type based on path
    let transactionType = 'project';
    if (transaction.path.includes('exercise')) {
      transactionType = 'exercise';
    } else if (transaction.path.includes('exam')) {
      transactionType = 'exam';
    } else if (transaction.path.includes('piscine')) {
      transactionType = 'piscine';
    }
    
    return `
      <div class="xp-transaction-item">
        <div class="xp-transaction-main">
          <span class="xp-project-name">${projectName}</span>
          <span class="xp-amount">${formattedAmount}</span>
        </div>
        <div class="xp-transaction-details">
          <span class="xp-date">${formattedDate}</span>
          <span class="xp-type">${transactionType}</span>
          <span class="xp-repository">repository</span>
        </div>
      </div>
    `;
  }).join('');
}

// --- Load more XP transactions function ---
async function loadMoreXPTransactions() {
  const loadMoreBtn = document.getElementById('load-more-xp');
  const transactionsList = document.getElementById('xp-transactions-list');
  
  // Show loading state
  loadMoreBtn.textContent = 'Loading...';
  loadMoreBtn.disabled = true;
  
  try {
    // Fetch more XP transactions
    const moreXPData = await fetchGraphQL(
      `
      query {
        transaction(where: {type: {_eq: "xp"}}, order_by: {createdAt: desc}, limit: 20, offset: ${window.currentXPTransactionLimit}) {
          id
          amount
          createdAt
          path
        }
      }
    `
    );
    
    if (moreXPData && moreXPData.data && moreXPData.data.transaction.length > 0) {
      // Add new transactions to the global array
      window.allXPTransactions = [...window.allXPTransactions, ...moreXPData.data.transaction];
      window.currentXPTransactionLimit += 20;
      
      // Update the display
      transactionsList.innerHTML = displayXPTransactions(window.allXPTransactions);
      
      // Hide button if no more data
      if (moreXPData.data.transaction.length < 20) {
        loadMoreBtn.style.display = 'none';
      }
    } else {
      // No more data
      loadMoreBtn.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading more XP transactions:', error);
    loadMoreBtn.textContent = 'Error loading more';
  }
  
  // Reset button state
  loadMoreBtn.textContent = 'Load More Transactions';
  loadMoreBtn.disabled = false;
} 

