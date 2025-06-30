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

function createText(x, y, text, anchor = "start", color = "#333") {
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", x);
  t.setAttribute("y", y);
  t.setAttribute("font-size", "12");
  t.setAttribute("fill", color);
  if (anchor) t.setAttribute("text-anchor", anchor);
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