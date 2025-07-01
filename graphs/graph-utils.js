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

function createText(x, y, text, anchor = "start", color = "#ffffff") {
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

// Graph Download Utilities
function downloadGraphAsPNG(svgElement, filename) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const img = new Image();
  
  canvas.width = svgElement.viewBox.baseVal.width || 800;
  canvas.height = svgElement.viewBox.baseVal.height || 600;
  
  img.onload = function() {
    ctx.drawImage(img, 0, 0);
    const pngFile = canvas.toDataURL('image/png');
    downloadFile(pngFile, filename + '.png');
  };
  
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function downloadGraphAsJPEG(svgElement, filename) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const img = new Image();
  
  canvas.width = svgElement.viewBox.baseVal.width || 800;
  canvas.height = svgElement.viewBox.baseVal.height || 600;
  
  // Set white background for JPEG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  img.onload = function() {
    ctx.drawImage(img, 0, 0);
    const jpegFile = canvas.toDataURL('image/jpeg', 0.9);
    downloadFile(jpegFile, filename + '.jpg');
  };
  
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function downloadGraphAsSVG(svgElement, filename) {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
  const svgUrl = URL.createObjectURL(svgBlob);
  downloadFile(svgUrl, filename + '.svg');
}

function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up object URL if it was created
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function createDownloadDropdown(container, svgElement, graphName) {
  const dropdown = document.createElement('div');
  dropdown.className = 'graph-download-dropdown';
  
  const trigger = document.createElement('button');
  trigger.className = 'download-trigger';
  trigger.innerHTML = '<img src="download.png" alt="Download" style="width: 16px; height: 16px;">';
  trigger.title = 'Download Graph';
  
  const menu = document.createElement('div');
  menu.className = 'download-menu';
  
  const formats = [
    { format: 'PNG', icon: '<img src="download.png" alt="PNG" style="width: 14px; height: 14px;">', func: downloadGraphAsPNG },
    { format: 'JPEG', icon: '<img src="download.png" alt="JPEG" style="width: 14px; height: 14px;">', func: downloadGraphAsJPEG },
    { format: 'SVG', icon: '<img src="download.png" alt="SVG" style="width: 14px; height: 14px;">', func: downloadGraphAsSVG }
  ];
  
  formats.forEach(({ format, icon, func }) => {
    const option = document.createElement('div');
    option.className = 'download-option';
    option.innerHTML = `${icon} ${format}`;
    option.onclick = () => {
      func(svgElement, `${graphName}_${format.toLowerCase()}`);
      menu.classList.remove('show');
    };
    menu.appendChild(option);
  });
  
  // Toggle menu on trigger click
  trigger.onclick = (e) => {
    e.stopPropagation();
    menu.classList.toggle('show');
  };
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      menu.classList.remove('show');
    }
  });
  
  dropdown.appendChild(trigger);
  dropdown.appendChild(menu);
  
  // Add to container
  container.appendChild(dropdown);
} 