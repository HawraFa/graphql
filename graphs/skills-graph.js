// --- Draw Skills Radar Chart ---
function drawSkillsGraph(data) {
  console.log("Raw data passed to drawSkillsGraph:", data);

  const container = document.getElementById("skills-graph");
  if (!container || !data?.length) {
    container.textContent = "No skills data";
    return;
  }

  // Define skill categories and their keywords
  const skillCategories = [
    { name: "go", keywords: ["go", "golang", "go-"] },
    { name: "back-end", keywords: ["backend", "back-end", "server", "api", "database", "sql", "postgres", "mysql"] },
    { name: "prog", keywords: ["programming", "algorithms", "data-structures", "logic", "problem-solving"] },
    { name: "front-end", keywords: ["frontend", "front-end", "ui", "ux", "interface", "design"] },
    { name: "js", keywords: ["javascript", "js", "node", "react", "vue", "angular", "typescript"] },
    { name: "html", keywords: ["html", "css", "web", "markup", "semantic"] }
  ];

  // Calculate XP for each skill
  const skillXP = {};
  skillCategories.forEach(cat => skillXP[cat.name] = 0);

  data.forEach(tx => {
    if (!tx.path || !tx.amount) return;
    const path = tx.path.toLowerCase();
    let matched = false;
    skillCategories.forEach(cat => {
      if (cat.keywords.some(keyword => path.includes(keyword))) {
        skillXP[cat.name] += tx.amount;
        matched = true;
      }
    });
    // If you want to count only transactions that match at least one skill, do nothing here.
    // If you want to count unmatched XP as "Other", you can add an "Other" category.
  });

  // Calculate total XP for all skills
  const totalXP = Object.values(skillXP).reduce((a, b) => a + b, 0) || 1;

  // Prepare data for radar chart (percentages)
  const skills = skillCategories.map(cat => cat.name);
  const values = skills.map(skill => skillXP[skill] / totalXP); // percent (0-1)

  // Radar chart settings
  const width = container.clientWidth || 400;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.36;
  const levels = 5;
  const angleStep = (2 * Math.PI) / skills.length;

  // SVG setup
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", height);
  svg.style.background = "transparent";

  // Draw grid (concentric polygons)
  for (let l = levels; l >= 1; l--) {
    const r = (radius * l) / levels;
    const points = skills.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    });
    const polygon = document.createElementNS(svgNS, "polygon");
    polygon.setAttribute("points", points.map(p => p.join(",")).join(" "));
    polygon.setAttribute("fill", l % 2 === 0 ? "#f5f7fa" : "#fff");
    polygon.setAttribute("stroke", "#e5e7eb");
    polygon.setAttribute("stroke-width", "1");
    svg.appendChild(polygon);
  }

  // Draw axes
  skills.forEach((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", cx);
    line.setAttribute("y1", cy);
    line.setAttribute("x2", x);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#e5e7eb");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
  });

  // Draw skill labels
  skills.forEach((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + (radius + 28) * Math.cos(angle);
    const y = cy + (radius + 28) * Math.sin(angle) + 6;
    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", y);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "18");
    label.setAttribute("font-family", "'Segoe UI', system-ui, sans-serif");
    label.setAttribute("fill", i === 0 ? "#111" : "#b0b4bb");
    label.textContent = skill;
    svg.appendChild(label);
  });

  // Tooltip setup
  const tooltip = document.createElement("div");
  Object.assign(tooltip.style, {
    position: "absolute",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    color: "#1e293b",
    padding: "14px 18px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "500",
    pointerEvents: "none",
    opacity: 0,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 1000,
    boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
    border: "1px solid #e5e7eb",
    minWidth: "120px",
    textAlign: "center",
    lineHeight: "1.4"
  });
  document.body.appendChild(tooltip);

  function showTooltip(x, y, skill, percent) {
    tooltip.innerHTML = `<div style='font-weight:600;font-size:16px;color:#3B82F6;'>${skill}</div><div style='font-size:15px;color:#1e293b;'>${(percent * 100).toFixed(1)}%</div>`;
    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    let left = x + 15;
    let top = y - 40;
    if (left + tooltipRect.width > windowWidth - 20) {
      left = x - tooltipRect.width - 15;
    }
    if (top < 20) {
      top = y + 15;
    }
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.opacity = 1;
    tooltip.style.transform = "translateY(-5px) scale(1.02)";
  }
  function hideTooltip() {
    tooltip.style.opacity = 0;
    tooltip.style.transform = "translateY(0px) scale(1)";
  }

  // Draw radar area (percentages)
  const radarPoints = values.map((percent, i) => {
    const r = percent * radius;
    const angle = i * angleStep - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
  const radarPolygon = document.createElementNS(svgNS, "polygon");
  radarPolygon.setAttribute("points", radarPoints.map(p => p.join(",")).join(" "));
  radarPolygon.setAttribute("fill", "#3b82f6");
  radarPolygon.setAttribute("fill-opacity", "0.18");
  radarPolygon.setAttribute("stroke", "#1e40af");
  radarPolygon.setAttribute("stroke-width", "3");
  svg.appendChild(radarPolygon);

  // Draw data points with hover
  radarPoints.forEach(([x, y], i) => {
    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", "6");
    dot.setAttribute("fill", "#1e40af");
    dot.setAttribute("stroke", "#fff");
    dot.setAttribute("stroke-width", "2");
    dot.style.cursor = "pointer";
    dot.addEventListener("mouseover", e => {
      showTooltip(e.pageX, e.pageY, skills[i], values[i]);
      dot.setAttribute("fill", "#2563EB");
      dot.setAttribute("r", "8");
    });
    dot.addEventListener("mouseout", () => {
      hideTooltip();
      dot.setAttribute("fill", "#1e40af");
      dot.setAttribute("r", "6");
    });
    svg.appendChild(dot);
  });

  container.innerHTML = "";
  container.appendChild(svg);
} 