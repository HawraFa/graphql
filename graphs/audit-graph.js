// --- Draw Audit Points & Ratio Graph ---
function drawAuditGraph(auditData) {
  const svg = document.getElementById("audit-graph");
  svg.innerHTML = ""; // clear

  if (!auditData || !auditData.up || !auditData.down) {
    svg.textContent = "No audit data";
    return;
  }

  const upPoints = Math.round(auditData.up);
  const downPoints = Math.round(auditData.down);
  const ratio = upPoints / downPoints;
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
  const roundedRatio = roundAuditRatio(ratio);

  // Set viewBox for responsive scaling
  const viewBoxWidth = 800;
  const viewBoxHeight = 300;
  svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  // SVG setup with viewBox coordinates
  const width = viewBoxWidth;
  const height = viewBoxHeight;
  const margin = { top: 80, right: 100, bottom: 60, left: 140 };

  // Calculate bar positions and widths for horizontal layout
  const maxPoints = Math.max(upPoints, downPoints) * 1.2;
  const barHeight = 40;
  const spacing = 25;
  const upY = margin.top + 30;
  const downY = upY + barHeight + spacing;
  
  // Scale function for horizontal bars
  const scaleX = (value) => margin.left + (value / maxPoints) * (width - margin.left - margin.right);
  
  const upWidth = scaleX(upPoints) - margin.left;
  const downWidth = scaleX(downPoints) - margin.left;

  // Create gradient definitions
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  
  // Given audits gradient (cosmic blue)
  const upGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  upGradient.setAttribute("id", "upGradient");
  upGradient.setAttribute("x1", "0%");
  upGradient.setAttribute("y1", "0%");
  upGradient.setAttribute("x2", "100%");
  upGradient.setAttribute("y2", "0%");
  
  const upStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  upStop1.setAttribute("offset", "0%");
  upStop1.setAttribute("stop-color", "#60a5fa");
  const upStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  upStop2.setAttribute("offset", "100%");
  upStop2.setAttribute("stop-color", "#3b82f6");
  
  upGradient.appendChild(upStop1);
  upGradient.appendChild(upStop2);
  defs.appendChild(upGradient);

  // Received audits gradient (cosmic purple)
  const downGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  downGradient.setAttribute("id", "downGradient");
  downGradient.setAttribute("x1", "0%");
  downGradient.setAttribute("y1", "0%");
  downGradient.setAttribute("x2", "100%");
  downGradient.setAttribute("y2", "0%");
  
  const downStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  downStop1.setAttribute("offset", "0%");
  downStop1.setAttribute("stop-color", "#a78bfa");
  const downStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  downStop2.setAttribute("offset", "100%");
  downStop2.setAttribute("stop-color", "#8b5cf6");
  
  downGradient.appendChild(downStop1);
  downGradient.appendChild(downStop2);
  defs.appendChild(downGradient);

  svg.appendChild(defs);

  // Draw modern ratio display at the top
  const ratioX = width / 2;
  const ratioY = margin.top - 20; // Position at the top
  
  // Create a modern ratio background
  const ratioBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  ratioBg.setAttribute("x", ratioX - 80);
  ratioBg.setAttribute("y", ratioY - 25);
  ratioBg.setAttribute("width", 160);
  ratioBg.setAttribute("height", 50);
  ratioBg.setAttribute("fill", "rgba(96, 165, 250, 0.15)");
  ratioBg.setAttribute("rx", "12");
  ratioBg.setAttribute("ry", "12");
  ratioBg.setAttribute("stroke", "#60a5fa");
  ratioBg.setAttribute("stroke-width", "2");
  ratioBg.setAttribute("filter", "drop-shadow(0 4px 12px rgba(96, 165, 250, 0.4))");
  svg.appendChild(ratioBg);

  // Ratio text with enhanced typography
  const ratioText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  ratioText.setAttribute("x", ratioX);
  ratioText.setAttribute("y", ratioY - 8);
  ratioText.setAttribute("text-anchor", "middle");
  ratioText.setAttribute("dominant-baseline", "middle");
  ratioText.setAttribute("font-size", "22");
  ratioText.setAttribute("font-weight", "800");
  ratioText.setAttribute("fill", "#4c1d95");
  ratioText.setAttribute("font-family", "'Orbitron', sans-serif");
  ratioText.textContent = roundedRatio.toFixed(1);
  svg.appendChild(ratioText);

  // Ratio label with enhanced styling
  const ratioLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  ratioLabel.setAttribute("x", ratioX);
  ratioLabel.setAttribute("y", ratioY + 15);
  ratioLabel.setAttribute("text-anchor", "middle");
  ratioLabel.setAttribute("font-size", "12");
  ratioLabel.setAttribute("font-weight", "600");
  ratioLabel.setAttribute("fill", "#4c1d95");
  ratioLabel.setAttribute("font-family", "'Rajdhani', sans-serif");
  ratioLabel.setAttribute("font-weight", "600");
  ratioLabel.textContent = "AUDIT RATIO";
  svg.appendChild(ratioLabel);

  // Draw timeline scale markers
  const timelineY = height - 35; // Moved up from height - 20
  const timelineStart = margin.left;
  const timelineEnd = width - margin.right;
  const timelineWidth = timelineEnd - timelineStart;
  
  // Calculate scale markers based on maxPoints
  const scaleMarkers = [];
  const maxScale = Math.ceil(maxPoints / 250000) * 250000;
  for (let i = 0; i <= 4; i++) {
    scaleMarkers.push((maxScale / 4) * i);
  }
  
  // Draw timeline axis
  svg.appendChild(
    createLine(timelineStart, timelineY, timelineEnd, timelineY, "rgba(255, 255, 255, 0.5)", 2)
  );
  
  // Draw scale markers and labels
  scaleMarkers.forEach((marker, index) => {
    const markerX = timelineStart + (marker / maxScale) * timelineWidth;
    
    // Draw marker line
    svg.appendChild(
      createLine(markerX, timelineY - 8, markerX, timelineY + 8, "rgba(255, 255, 255, 0.5)", 1)
    );
    
    // Draw marker label
    const markerLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    markerLabel.setAttribute("x", markerX);
    markerLabel.setAttribute("y", timelineY + 25);
    markerLabel.setAttribute("text-anchor", "middle");
    markerLabel.setAttribute("font-size", "12");
    markerLabel.setAttribute("font-weight", "500");
    markerLabel.setAttribute("fill", "#4c1d95");
    markerLabel.setAttribute("font-family", "'Rajdhani', sans-serif");
    markerLabel.setAttribute("font-weight", "600");
    markerLabel.textContent = marker.toLocaleString();
    svg.appendChild(markerLabel);
  });

  // Draw horizontal bars with enhanced styling
  // Given audits bar
  const upBar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  upBar.setAttribute("x", margin.left);
  upBar.setAttribute("y", upY);
  upBar.setAttribute("width", upWidth);
  upBar.setAttribute("height", barHeight);
  upBar.setAttribute("fill", "url(#upGradient)");
  upBar.setAttribute("rx", "12");
  upBar.setAttribute("ry", "12");
  upBar.setAttribute("filter", "drop-shadow(0 6px 16px rgba(96, 165, 250, 0.5))");
  svg.appendChild(upBar);

  // Received audits bar
  const downBar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  downBar.setAttribute("x", margin.left);
  downBar.setAttribute("y", downY);
  downBar.setAttribute("width", downWidth);
  downBar.setAttribute("height", barHeight);
  downBar.setAttribute("fill", "url(#downGradient)");
  downBar.setAttribute("rx", "12");
  downBar.setAttribute("ry", "12");
  downBar.setAttribute("filter", "drop-shadow(0 6px 16px rgba(167, 139, 250, 0.5))");
  svg.appendChild(downBar);

  // Add enhanced value labels on bars
  const upLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  upLabel.setAttribute("x", margin.left + upWidth + 15);
  upLabel.setAttribute("y", upY + barHeight/2);
  upLabel.setAttribute("dominant-baseline", "middle");
  upLabel.setAttribute("font-size", "16");
  upLabel.setAttribute("font-weight", "700");
  upLabel.setAttribute("fill", "#4c1d95");
  upLabel.setAttribute("font-family", "'Rajdhani', sans-serif");
  upLabel.setAttribute("font-weight", "700");
  upLabel.textContent = upPoints.toLocaleString();
  svg.appendChild(upLabel);

  const downLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  downLabel.setAttribute("x", margin.left + downWidth + 15);
  downLabel.setAttribute("y", downY + barHeight/2);
  downLabel.setAttribute("dominant-baseline", "middle");
  downLabel.setAttribute("font-size", "16");
  downLabel.setAttribute("font-weight", "700");
  downLabel.setAttribute("fill", "#4c1d95");
  downLabel.setAttribute("font-family", "'Rajdhani', sans-serif");
  downLabel.setAttribute("font-weight", "700");
  downLabel.textContent = downPoints.toLocaleString();
  svg.appendChild(downLabel);

  // Add enhanced bar labels
  const upBarLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  upBarLabel.setAttribute("x", margin.left - 15);
  upBarLabel.setAttribute("y", upY + barHeight/2);
  upBarLabel.setAttribute("text-anchor", "end");
  upBarLabel.setAttribute("dominant-baseline", "middle");
  upBarLabel.setAttribute("font-size", "14");
  upBarLabel.setAttribute("font-weight", "600");
  upBarLabel.setAttribute("fill", "#4c1d95");
  upBarLabel.setAttribute("font-family", "'Rajdhani', sans-serif");
  upBarLabel.setAttribute("font-weight", "600");
  upBarLabel.textContent = "Done";
  svg.appendChild(upBarLabel);

  const downBarLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  downBarLabel.setAttribute("x", margin.left - 15);
  downBarLabel.setAttribute("y", downY + barHeight/2);
  downBarLabel.setAttribute("text-anchor", "end");
  downBarLabel.setAttribute("dominant-baseline", "middle");
  downBarLabel.setAttribute("font-size", "14");
  downBarLabel.setAttribute("font-weight", "600");
  downBarLabel.setAttribute("fill", "#4c1d95");
  downBarLabel.setAttribute("font-family", "'Rajdhani', sans-serif");
  downBarLabel.setAttribute("font-weight", "600");
  downBarLabel.textContent = "Received";
  svg.appendChild(downBarLabel);

  // Draw enhanced grid lines
  const gridStep = (width - margin.left - margin.right) / 5;
  for (let i = 1; i <= 4; i++) {
    const gridX = margin.left + gridStep * i;
    svg.appendChild(
      createLine(gridX, margin.top, gridX, timelineY, "rgba(255, 255, 255, 0.1)", 1)
    );
  }
  
  // Add download dropdown
  createDownloadDropdown(svg.parentElement, svg, 'audit_graph');
} 