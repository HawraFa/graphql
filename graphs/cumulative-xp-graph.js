// --- Draw Cumulative XP by Project Graph ---
function drawCumulativeXPGraph(data) {
  const svgElement = document.getElementById("cumulative-xp-graph");
  const container = svgElement.parentElement;
  if (!svgElement || !data?.length) {
    svgElement.textContent = "No XP data";
    return;
  }

  const getProjectName = (path) => {
    if (!path?.startsWith("/bahrain/bh-module/")) return null;
    if (path === "/bahrain/bh-module/piscine-js") return "piscine-js";
    if (path.includes("piscine-js")) return null;
    const match = path.match(/^\/bahrain\/bh-module\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const sortedTx = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const labelOrder = [];
  const xpByProject = {};
  sortedTx.forEach(tx => {
    if (!tx.path || !tx.amount) return;
    const label = getProjectName(tx.path);
    if (!label || label.toLowerCase().includes("checkpoint")) return;
    if (!xpByProject[label]) {
      xpByProject[label] = 0;
      labelOrder.push(label);
    }
    xpByProject[label] += tx.amount;
  });

  let cumulativeXP = 0;
  const points = labelOrder.map(label => {
    cumulativeXP += xpByProject[label];
    return { label, xp: cumulativeXP };
  });

  if (points.length === 0) {
    svgElement.textContent = "No valid project data";
    return;
  }

  const width = svgElement.clientWidth || 800;
  const height = 380; // Increased height to make it bigger
  const padding = { top: 60, right: 140, bottom: 120, left: 100 }; // Increased bottom padding for longer names

  const xps = points.map(p => p.xp);
  const maxXP = Math.max(...xps);
  const minXP = Math.min(...xps);
  const yTicks = 5;

  const roundedMin = Math.floor(minXP / 100000) * 100000;
  const roundedMax = Math.ceil(maxXP / 100000) * 100000;
  const step = Math.ceil((roundedMax - roundedMin) / yTicks / 10000) * 10000;
  const niceMin = roundedMin;
  const niceMax = niceMin + step * yTicks;

  const stepY = (height - padding.top - padding.bottom) / (niceMax - niceMin);
  const stepX = (width - padding.left - padding.right) / (points.length - 1 || 1);

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", height);
  svg.style.borderRadius = "0";
  svg.style.boxShadow = "none";
  svg.style.background = "transparent";
  svg.style.border = "none";

  // Create gradient definitions
  const defs = document.createElementNS(svgNS, "defs");
  
  // Line gradient
  const lineGradient = document.createElementNS(svgNS, "linearGradient");
  lineGradient.setAttribute("id", "lineGradient");
  lineGradient.setAttribute("x1", "0%");
  lineGradient.setAttribute("y1", "0%");
  lineGradient.setAttribute("x2", "100%");
  lineGradient.setAttribute("y2", "0%");
  
  const stop1 = document.createElementNS(svgNS, "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#1e293b");
  const stop2 = document.createElementNS(svgNS, "stop");
  stop2.setAttribute("offset", "50%");
  stop2.setAttribute("stop-color", "#1a0533");
  const stop3 = document.createElementNS(svgNS, "stop");
  stop3.setAttribute("offset", "100%");
  stop3.setAttribute("stop-color", "#701a75");
  
  lineGradient.appendChild(stop1);
  lineGradient.appendChild(stop2);
  lineGradient.appendChild(stop3);
  defs.appendChild(lineGradient);
  height
  // Area gradient
  const areaGradient = document.createElementNS(svgNS, "linearGradient");
  areaGradient.setAttribute("id", "areaGradient");
  areaGradient.setAttribute("x1", "0%");
  areaGradient.setAttribute("y1", "0%");
  areaGradient.setAttribute("x2", "0%");
  areaGradient.setAttribute("y2", "100%");
  
  const areaStop1 = document.createElementNS(svgNS, "stop");
  areaStop1.setAttribute("offset", "0%");
  areaStop1.setAttribute("stop-color", "rgba(26, 5, 51, 0.3)");
  const areaStop2 = document.createElementNS(svgNS, "stop");
  areaStop2.setAttribute("offset", "100%");
  areaStop2.setAttribute("stop-color", "rgba(26, 5, 51, 0.05)");
  
  areaGradient.appendChild(areaStop1);
  areaGradient.appendChild(areaStop2);
  defs.appendChild(areaGradient);

  svg.appendChild(defs);

  const tooltip = document.createElement("div");
  Object.assign(tooltip.style, {
    position: "absolute",
    background: "rgba(0, 0, 0, 0.8)",
    color: "#ffffff",
    padding: "16px 20px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    pointerEvents: "none",
    opacity: 0,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 1000,
    boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(20px)",
    minWidth: "180px",
    textAlign: "center",
    lineHeight: "1.4"
  });
  document.body.appendChild(tooltip);

  const showTooltip = (x, y, text) => {
    tooltip.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600; color: #60a5fa; font-size: 16px;">${text.project}</div>
      <div style="background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 20px; font-weight: 700; margin-bottom: 4px;">${text.xp.toLocaleString()} XP</div>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); font-weight: 400;">Cumulative Total</div>
    `;
    
    // Position tooltip to avoid going off-screen
    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let left = x + 15;
    let top = y - 40;
    
    // Adjust horizontal position if tooltip would go off-screen
    if (left + tooltipRect.width > windowWidth - 20) {
      left = x - tooltipRect.width - 15;
    }
    
    // Adjust vertical position if tooltip would go off-screen
    if (top < 20) {
      top = y + 15;
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.opacity = 1;
    tooltip.style.transform = "translateY(-5px) scale(1.02)";
  };
  const hideTooltip = () => {
    tooltip.style.opacity = 0;
    tooltip.style.transform = "translateY(0px) scale(1)";
  };

  // Background grid
  for (let i = 0; i <= yTicks; i++) {
    const value = niceMax - i * step;
    const y = padding.top + i * ((height - padding.top - padding.bottom) / yTicks);

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", padding.left);
    line.setAttribute("y1", y);
    line.setAttribute("x2", width - padding.right);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", i === 0 ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)");
    line.setAttribute("stroke-width", i === 0 ? "2" : "1");
    line.setAttribute("stroke-dasharray", i === 0 ? "none" : "4,4");
    svg.appendChild(line);

    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", padding.left - 20);
    label.setAttribute("y", y + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-size", "12");
    label.setAttribute("font-weight", "500");
    label.setAttribute("fill", "#1a0533");
    label.setAttribute("font-family", "'Rajdhani', sans-serif");
    label.setAttribute("font-weight", "600");
    label.textContent = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString();
    svg.appendChild(label);
  }

  // X-axis labels with better spacing and full names
  points.forEach((p, i) => {
    const x = padding.left + i * stepX;
    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", height - padding.bottom + 45);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "11");
    label.setAttribute("font-weight", "500");
    label.setAttribute("fill", "#1a0533");
    label.setAttribute("font-family", "'Rajdhani', sans-serif");
    label.setAttribute("font-weight", "600");
    
    // Always rotate labels for better readability and to fit longer names
    label.setAttribute("transform", `rotate(-30 ${x},${height - padding.bottom + 45})`);
    label.setAttribute("text-anchor", "end");
    
    // Show full project names without truncation
    label.textContent = p.label;
    svg.appendChild(label);
  });

  // Area fill
  const areaPathData = points.map((p, i) => {
    const x = padding.left + i * stepX;
    const y = height - padding.bottom - (p.xp - niceMin) * stepY;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ") + ` L${padding.left + (points.length - 1) * stepX},${height - padding.bottom} L${padding.left},${height - padding.bottom} Z`;

  const areaPath = document.createElementNS(svgNS, "path");
  areaPath.setAttribute("d", areaPathData);
  areaPath.setAttribute("fill", "url(#areaGradient)");
  areaPath.setAttribute("opacity", "0.8");
  svg.appendChild(areaPath);

  // Line path
  const pathData = points.map((p, i) => {
    const x = padding.left + i * stepX;
    const y = height - padding.bottom - (p.xp - niceMin) * stepY;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", pathData);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "url(#lineGradient)");
  path.setAttribute("stroke-width", "4");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("filter", "drop-shadow(0 6px 12px rgba(59, 130, 246, 0.4))");
  svg.appendChild(path);

  // Points with enhanced glow effect and better styling
  points.forEach((p, i) => {
    const x = padding.left + i * stepX;
    const y = height - padding.bottom - (p.xp - niceMin) * stepY;

    // Multiple glow layers for enhanced effect
    const outerGlow = document.createElementNS(svgNS, "circle");
    outerGlow.setAttribute("cx", x);
    outerGlow.setAttribute("cy", y);
    outerGlow.setAttribute("r", "15");
    outerGlow.setAttribute("fill", "rgba(59, 130, 246, 0.1)");
    outerGlow.setAttribute("filter", "blur(8px)");
    svg.appendChild(outerGlow);

    const innerGlow = document.createElementNS(svgNS, "circle");
    innerGlow.setAttribute("cx", x);
    innerGlow.setAttribute("cy", y);
    innerGlow.setAttribute("r", "10");
    innerGlow.setAttribute("fill", "rgba(139, 92, 246, 0.15)");
    innerGlow.setAttribute("filter", "blur(4px)");
    svg.appendChild(innerGlow);

    // Main dot with enhanced styling
    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", "7");
    dot.setAttribute("fill", "#3B82F6");
    dot.setAttribute("stroke", "#ffffff");
    dot.setAttribute("stroke-width", "3");
    dot.setAttribute("filter", "drop-shadow(0 4px 8px rgba(59, 130, 246, 0.5))");
    dot.style.cursor = "pointer";
    dot.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    dot.addEventListener("mouseover", e => {
      showTooltip(e.pageX, e.pageY, { project: p.label, xp: p.xp });
      dot.setAttribute("r", "10");
      dot.setAttribute("fill", "#2563EB");
      dot.setAttribute("stroke-width", "4");
      outerGlow.setAttribute("r", "20");
      outerGlow.setAttribute("fill", "rgba(59, 130, 246, 0.2)");
      innerGlow.setAttribute("r", "15");
      innerGlow.setAttribute("fill", "rgba(139, 92, 246, 0.25)");
    });
    dot.addEventListener("mouseout", () => {
      hideTooltip();
      dot.setAttribute("r", "7");
      dot.setAttribute("fill", "#3B82F6");
      dot.setAttribute("stroke-width", "3");
      outerGlow.setAttribute("r", "15");
      outerGlow.setAttribute("fill", "rgba(59, 130, 246, 0.1)");
      innerGlow.setAttribute("r", "10");
      innerGlow.setAttribute("fill", "rgba(139, 92, 246, 0.15)");
    });

    svg.appendChild(dot);
  });

  // Enhanced title with better styling
  const title = document.createElementNS(svgNS, "text");
  title.setAttribute("x", width / 2);
  title.setAttribute("y", 30);
  title.setAttribute("text-anchor", "middle");
  title.setAttribute("font-size", "20");
  title.setAttribute("font-weight", "700");
  title.setAttribute("fill", "#1a0533");
  title.setAttribute("font-family", "'Orbitron', sans-serif");
  title.setAttribute("font-weight", "700");
  title.setAttribute("filter", "drop-shadow(0 2px 4px rgba(76, 29, 149, 0.3))");
  title.textContent = "Cumulative XP Progress";
  svg.appendChild(title);

  // Add subtitle
  const subtitle = document.createElementNS(svgNS, "text");
  subtitle.setAttribute("x", width / 2);
  subtitle.setAttribute("y", 50);
  subtitle.setAttribute("text-anchor", "middle");
  subtitle.setAttribute("font-size", "12");
  subtitle.setAttribute("font-weight", "400");
  subtitle.setAttribute("fill", "#1a0533");
  subtitle.setAttribute("font-family", "'Rajdhani', sans-serif");
  subtitle.setAttribute("font-weight", "500");
  subtitle.textContent = "Track your learning journey across projects";
  svg.appendChild(subtitle);

  // Y-axis label
  const yAxisLabel = document.createElementNS(svgNS, "text");
  yAxisLabel.setAttribute("x", -height / 2);
  yAxisLabel.setAttribute("y", 15);
  yAxisLabel.setAttribute("text-anchor", "middle");
  yAxisLabel.setAttribute("font-size", "12");
  yAxisLabel.setAttribute("font-weight", "500");
  yAxisLabel.setAttribute("fill", "#1a0533");
  yAxisLabel.setAttribute("font-family", "'Rajdhani', sans-serif");
  yAxisLabel.setAttribute("font-weight", "600");
  yAxisLabel.setAttribute("transform", `rotate(-90, ${-height / 2}, 15)`);
  yAxisLabel.textContent = "Cumulative XP";
  svg.appendChild(yAxisLabel);

  svgElement.innerHTML = "";
  svgElement.appendChild(svg);
  
  // Add download dropdown
  createDownloadDropdown(container, svg, 'cumulative_xp_graph');
} 