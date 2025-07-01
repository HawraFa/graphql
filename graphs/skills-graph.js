// --- Draw Skills Radar Chart ---
async function drawSkillsGraph() {
  const svgElement = document.getElementById("skills-graph");
  const container = svgElement.parentElement;
  if (!svgElement) {
    svgElement.textContent = "No skills container found";
    return;
  }

  // Show loading state
  svgElement.innerHTML = '<div class="loading">Loading skills data...</div>';

  try {
    // Fetch skill data using your friend's query
    const skillsData = await fetchGraphQL(`
      query {
        skillTypes: transaction_aggregate(
          distinct_on: [type]
          where: { type: { _nin: ["xp", "level", "up", "down"] } }
          order_by: [{ type: asc }, { amount: desc }]
        ) {
          nodes {
            type
            amount
          }
        }
      }
    `);

    console.log("Skills data response:", skillsData);

    if (!skillsData || !skillsData.data || !skillsData.data.skillTypes || !skillsData.data.skillTypes.nodes) {
      svgElement.innerHTML = '<div class="error">No skills data found</div>';
      return;
    }

    const skills = skillsData.data.skillTypes.nodes;
    
    if (skills.length === 0) {
      svgElement.innerHTML = '<div class="error">No skills data available</div>';
      return;
    }

    console.log("Skills:", skills);

    // Define the skills we want to display (matching your data structure)
    const displaySkills = [
      'skill_go',
      'skill_back-end', 
      'skill_prog',
      'skill_front-end',
      'skill_js',
      'skill_html'
    ];
    
    // Filter the skills to only include the ones we want to display
    const filteredSkills = skills.filter(skill => displaySkills.includes(skill.type));

    // If no matching skills found, show error
    if (filteredSkills.length === 0) {
      svgElement.innerHTML = '<div class="error">No matching skills found</div>';
      return;
    }

    // Sort the filtered skills according to our display order
    const sortedSkills = displaySkills
      .map(skillType => filteredSkills.find(skill => skill.type === skillType))
      .filter(skill => skill); // Remove undefined if any skill is missing

    // Prepare data for radar chart - CHANGED TO USE PERCENTAGES DIRECTLY
    const skillNames = sortedSkills.map(skill => skill.type.replace('skill_', ''));
    const skillPercentages = sortedSkills.map(skill => skill.amount); // Use raw percentage values
    
    // Radar chart settings
    const width = svgElement.clientWidth || 400;
    const height = 400;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.36;
    const levels = 5;
    const angleStep = (2 * Math.PI) / skillNames.length;

    // SVG setup
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", height);
    svg.style.background = "transparent";

    // Draw grid (concentric polygons) - UPDATED FOR PERCENTAGE SCALE
    for (let l = levels; l >= 1; l--) {
      const r = (radius * l) / levels;
      const points = skillNames.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
      });
      const polygon = document.createElementNS(svgNS, "polygon");
      polygon.setAttribute("points", points.map(p => p.join(",")).join(" "));
      polygon.setAttribute("fill", l % 2 === 0 ? "rgba(76, 29, 149, 0.1)" : "rgba(76, 29, 149, 0.05)");
      polygon.setAttribute("stroke", "rgba(76, 29, 149, 0.3)");
      polygon.setAttribute("stroke-width", "1");
      svg.appendChild(polygon);
    }

    // Draw axes
    skillNames.forEach((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", cx);
      line.setAttribute("y1", cy);
      line.setAttribute("x2", x);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "rgba(76, 29, 149, 0.4)");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
    });

    // Draw skill labels
    skillNames.forEach((skill, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + (radius + 28) * Math.cos(angle);
      const y = cy + (radius + 28) * Math.sin(angle) + 6;
      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", x);
      label.setAttribute("y", y);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "14");
      label.setAttribute("font-family", "'Segoe UI', system-ui, sans-serif");
      label.setAttribute("fill", "#4c1d95");
      label.setAttribute("font-family", "'Rajdhani', sans-serif");
      label.setAttribute("font-weight", "600");
      label.textContent = skill;
      svg.appendChild(label);
    });

    // Tooltip setup - SIMPLIFIED TO SHOW JUST PERCENTAGE
    const tooltip = document.createElement("div");
    Object.assign(tooltip.style, {
      position: "absolute",
      background: "rgba(0, 0, 0, 0.8)",
      color: "#ffffff",
      padding: "14px 18px",
      borderRadius: "10px",
      fontSize: "15px",
      fontWeight: "500",
      pointerEvents: "none",
      opacity: 0,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      zIndex: 1000,
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      minWidth: "120px",
      textAlign: "center",
      lineHeight: "1.4"
    });
    document.body.appendChild(tooltip);

    function showTooltip(x, y, skill, percentage) {
      tooltip.innerHTML = `
        <div style='font-weight:600;font-size:16px;color:#60a5fa;'>${skill}</div>
        <div style='font-size:15px;color:#ffffff;'>${percentage}%</div>
      `;
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

    // Draw radar area - USING PERCENTAGES DIRECTLY
    const radarPoints = skillPercentages.map((percentage, i) => {
      const r = (percentage / 100) * radius; // Convert percentage to radius
      const angle = i * angleStep - Math.PI / 2;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    });
    
    const radarPolygon = document.createElementNS(svgNS, "polygon");
    radarPolygon.setAttribute("points", radarPoints.map(p => p.join(",")).join(" "));
    radarPolygon.setAttribute("fill", "#60a5fa");
    radarPolygon.setAttribute("fill-opacity", "0.3");
    radarPolygon.setAttribute("stroke", "#3b82f6");
    radarPolygon.setAttribute("stroke-width", "3");
    svg.appendChild(radarPolygon);

    // Draw data points with hover - USING PERCENTAGES DIRECTLY
    radarPoints.forEach(([x, y], i) => {
      const dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", "6");
      dot.setAttribute("fill", "#1e40af");
      dot.setAttribute("stroke", "#4c1d95");
      dot.setAttribute("stroke-width", "2");
      dot.style.cursor = "pointer";
      dot.addEventListener("mouseover", e => {
        showTooltip(e.pageX, e.pageY, skillNames[i], skillPercentages[i]);
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

  

    svgElement.innerHTML = "";
    svgElement.appendChild(svg);
    
    // Add download dropdown
    createDownloadDropdown(container, svg, 'skills_graph');

  } catch (error) {
    console.error("Error drawing skills graph:", error);
    svgElement.innerHTML = '<div class="error">Failed to load skills data</div>';
  }
}