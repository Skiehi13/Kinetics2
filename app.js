// === Basic SVG helpers =======================================================
const svg = document.getElementById("rcSVG");
const W = 960, H = 520;
svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

function el(name, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  for (const c of children) n.appendChild(c);
  return n;
}

function clearSVG(node){ while(node.lastChild) node.removeChild(node.lastChild); }

// === Axes and grid ===========================================================
function drawAxes() {
  const g = el("g",{id:"axes"});
  // grid
  for (let x=70; x<=W-40; x+=60){
    g.appendChild(el("line",{x1:x,y1:40,x2:x,y2:H-60,stroke:"#263042","stroke-width":1}));
  }
  for (let y=60; y<=H-60; y+=60){
    g.appendChild(el("line",{x1:60,y1:y,x2:W-40,y2:y,stroke:"#263042","stroke-width":1}));
  }

  // axes
  g.appendChild(el("line",{x1:60,y1:H-60,x2:W-40,y2:H-60,stroke:"#e8eff8","stroke-width":2})); // x (reaction coordinate)
  g.appendChild(el("line",{x1:60,y1:H-60,x2:60,y2:40,stroke:"#e8eff8","stroke-width":2})); // y (potential energy)

  // arrows
  g.appendChild(el("polygon",{points:`${W-40},${H-60} ${W-48},${H-64} ${W-48},${H-56}`,fill:"#e8eff8"}));
  g.appendChild(el("polygon",{points:`60,40 56,48 64,48`,fill:"#e8eff8"}));

  // labels
  g.appendChild(el("text",{x:W-48,y:H-70,fill:"#a8b3c4","font-size":"14"},[document.createTextNode("Reaction coordinate →")]));
  g.appendChild(el("text",{x:70,y:52,fill:"#a8b3c4","font-size":"14"},[document.createTextNode("Potential energy ↑")]));
  return g;
}

// === Reaction coordinate geometry ===========================================
// We model a one-step process using a cubic Bezier.
function buildCurve({exo, barrier}) {
  const xL = 100, xR = W-120;
  const yReact = 360; // baseline reactants energy
  const dH = exo ? -80 : +80; // products relative
  const yProd = yReact + dH;

  const xTS = (xL + xR) / 2;
  const basePeak = 150;             // lower number => higher on screen
  const peakY = basePeak + (1.0 - barrier) * 80; // scale with barrier

  const c1 = {
    p0: [xL, yReact],
    p1: [xL + 120, yReact],
    p2: [xTS - 120, peakY],
    p3: [xTS, peakY]
  };
  const c2 = {
    p0: [xTS, peakY],
    p1: [xTS + 120, peakY],
    p2: [xR - 120, yProd],
    p3: [xR, yProd]
  };

  const pathStr =
    `M ${c1.p0[0]} ${c1.p0[1]} C ${c1.p1[0]} ${c1.p1[1]} ${c1.p2[0]} ${c1.p2[1]} ${c1.p3[0]} ${c1.p3[1]} ` +
    `C ${c2.p1[0]} ${c2.p1[1]} ${c2.p2[0]} ${c2.p2[1]} ${c2.p3[0]} ${c2.p3[1]}`;

  return { pathStr, xL, xR, yReact, yProd, xTS, peakY };
}

// Catalyst curve: same endpoints, lower peak
function buildCatalystCurve(base, {exo, barrier}) {
  const lower = Math.max(0.5, barrier - 0.35); // lower Ea
  return buildCurve({exo, barrier: lower});
}

// === Drawing the diagram =====================================================
function drawDiagram() {
  clearSVG(svg);

  const exo = document.getElementById("deltaH").value === "exo";
  const barrier = parseFloat(document.getElementById("barrier").value);
  const showCat = document.getElementById("toggleCatalyst").checked;
  const showHeat = document.getElementById("toggleHeat").checked;

  svg.appendChild(drawAxes());

  const base = buildCurve({exo, barrier});

  // Base curve
  const basePath = el("path",{
    d: base.pathStr,
    fill:"none",
    stroke:"#66d9ef",
    "stroke-width":4
  });
  svg.appendChild(basePath);

  // Labels: Reactants & Products
  svg.appendChild(el("text",{x: base.xL-10, y: base.yReact+22, fill:"#a6e22e","text-anchor":"end","font-size":"16"},[document.createTextNode("Reactants")]));
  svg.appendChild(el("circle",{cx:base.xL, cy:base.yReact, r:4, fill:"#a6e22e"}));

  svg.appendChild(el("text",{x: base.xR+10, y: base.yProd+22, fill:"#a6e22e","text-anchor":"start","font-size":"16"},[document.createTextNode("Products")]));
  svg.appendChild(el("circle",{cx:base.xR, cy:base.yProd, r:4, fill:"#a6e22e"}));

  // Transition State marker
  svg.appendChild(el("circle",{cx:base.xTS, cy:base.peakY, r:5, fill:"#ff6188"}));
  svg.appendChild(el("text",{x: base.xTS, y: base.peakY-10, fill:"#ff6188","text-anchor":"middle","font-size":"14"},[document.createTextNode("TS")]));

  // Ea arrow (reactants to TS)
  svg.appendChild(el("line",{x1:base.xL, y1:base.yReact, x2:base.xL, y2:base.peakY, stroke:"#e5c07b","stroke-width":3}));
  svg.appendChild(el("text",{x:base.xL+10,y:(base.yReact+base.peakY)/2,fill:"#e5c07b","font-size":"14"},[document.createTextNode("Eₐ")]));
  svg.appendChild(el("line",{x1:base.xL-6,y1:base.yReact,x2:base.xL+6,y2:base.yReact,stroke:"#e5c07b","stroke-width":3}));
  svg.appendChild(el("line",{x1:base.xL-6,y1:base.peakY,x2:base.xL+6,y2:base.peakY,stroke:"#e5c07b","stroke-width":3}));

  // ΔH arrow (reactants to products)
  const yMid = (base.yReact + base.yProd)/2;
  const xDH1 = base.xR + 45, xDH2 = base.xR + 45;
  svg.appendChild(el("line",{x1:xDH1,y1:base.yReact,x2:xDH2,y2:base.yProd,stroke:"#a6e22e","stroke-width":3}));
  svg.appendChild(el("line",{x1:xDH1-6,y1:base.yReact,x2:xDH1+6,y2:base.yReact,stroke:"#a6e22e","stroke-width":3}));
  svg.appendChild(el("line",{x1:xDH2-6,y1:base.yProd,x2:xDH2+6,y2:base.yProd,stroke:"#a6e22e","stroke-width":3}));
  svg.appendChild(el("text",{x:xDH2+8,y:yMid,fill:"#a6e22e","font-size":"14"},[document.createTextNode("ΔH")]));

  // Catalyst curve (dotted) + faster arrow
  if (showCat){
    const cat = buildCatalystCurve(base, {exo, barrier});
    const catPath = el("path",{
      d: cat.pathStr, fill:"none", stroke:"#e5c07b","stroke-width":4,
      "stroke-dasharray":"10 8"
    });
    svg.appendChild(catPath);

    // New TS point
    svg.appendChild(el("circle",{cx:cat.xTS, cy:cat.peakY, r:4, fill:"#e5c07b"}));
    svg.appendChild(el("text",{x: cat.xTS, y: cat.peakY-10, fill:"#e5c07b","text-anchor":"middle","font-size":"13"},[document.createTextNode("TS (a)")]));

    // Arrow + label showing faster rate
    svg.appendChild(el("path",{
      d:`M ${cat.xTS-120} ${cat.peakY+70} C ${cat.xTS-80} ${cat.peakY+20}, ${cat.xTS-40} ${cat.peakY+10}, ${cat.xTS-6} ${cat.peakY+4}`,
      fill:"none", stroke:"#e5c07b","stroke-width":2, "marker-end":"url(#arrow)"
    }));
    svg.appendChild(el("text",{x:cat.xTS-130,y:cat.peakY+92,fill:"#e5c07b","font-size":"14"},[document.createTextNode("lower Eₐ → faster")]));
  }

  // Heat overlay: dotted population & shaded fraction above Ea
  if (showHeat){
    const yPop = base.peakY + 26; // indicate more high-energy molecules
    svg.appendChild(el("line",{
      x1:60, y1:yPop, x2:W-40, y2:yPop,
      stroke:"#e5c07b","stroke-width":2,"stroke-dasharray":"6 6"
    }));
    svg.appendChild(el("text",{x:W-44,y:yPop-8,fill:"#e5c07b","font-size":"13","text-anchor":"end"},[document.createTextNode("b: +30 °C (more molecules ≥ Eₐ)")]));
    // Shade area “above Ea” cue
    const shade = el("rect",{ x:60, y:40, width: (W-100), height: (base.yReact - base.peakY), fill:"#6fa8dc", opacity:"0.10" });
    svg.appendChild(shade);
    // Pointer implying faster rate
    svg.appendChild(el("path",{
      d:`M ${base.xTS+100} ${base.peakY+110} Q ${base.xTS+40} ${base.peakY+40} ${base.xTS+8} ${base.peakY+6}`,
      fill:"none", stroke:"#a8b3c4","stroke-width":2, "marker-end":"url(#arrow)"
    }));
    svg.appendChild(el("text",{x:base.xTS+108,y:base.peakY+132,fill:"#a8b3c4","font-size":"14"},[document.createTextNode("higher T → more molecules clear Eₐ → faster")]));
  }

  // Legend
  const legend = el("g",{transform:`translate(${W-300}, ${60})`});
  legend.appendChild(el("rect",{x:0,y:0,width:260,height:76,rx:12,fill:"#121822",stroke:"#1e2635"}));
  legend.appendChild(el("line",{x1:16,y1:22,x2:76,y2:22,stroke:"#66d9ef","stroke-width":4}));
  legend.appendChild(el("text",{x:88,y:26,fill:"#a8b3c4","font-size":"14"},[document.createTextNode("Base reaction coordinate")]));
  legend.appendChild(el("line",{x1:16,y1:46,x2:76,y2:46,stroke:"#e5c07b","stroke-width":4,"stroke-dasharray":"10 8"}));
  legend.appendChild(el("text",{x:88,y:50,fill:"#a8b3c4","font-size":"14"},[document.createTextNode("Dotted: catalyst (a) or +30 °C overlay (b)")]));
  svg.appendChild(legend);

  // Define arrow marker once
  const defs = el("defs");
  defs.appendChild(el("marker",{
    id:"arrow", markerWidth:"10", markerHeight:"7", refX:"10", refY:"3.5", orient:"auto"
  },[ el("polygon",{points:"0 0, 10 3.5, 0 7", fill:"#e5c07b"}) ]));
  svg.appendChild(defs);
}

// === PNG Download ============================================================
function downloadPNG() {
  const serializer = new XMLSerializer();
  const src = serializer.serializeToString(svg);

  const svgBlob = new Blob([src], {type:"image/svg+xml;charset=utf-8"});
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = svg.viewBox.baseVal.width;
    canvas.height = svg.viewBox.baseVal.height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob)=>{
      const a = document.createElement("a");
      a.download = "reaction-coordinate.png";
      a.href = URL.createObjectURL(blob);
      a.click();
      URL.revokeObjectURL(a.href);
    },"image/png", 1.0);
  };
  img.src = url;
}

// === Wiring up controls ======================================================
["deltaH","barrier","toggleCatalyst","toggleHeat"].forEach(id=>{
  document.getElementById(id).addEventListener("input", drawDiagram);
});
document.getElementById("downloadPng").addEventListener("click", downloadPNG);

// Initial draw
drawDiagram();
