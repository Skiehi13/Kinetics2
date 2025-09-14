// Simple slideshow controls
const slides = Array.from(document.querySelectorAll(".slide"));
const dots = Array.from(document.querySelectorAll(".dot"));
const prev = document.getElementById("prevBtn");
const next = document.getElementById("nextBtn");

let i = 0;
function show(n){
  i = (n + slides.length) % slides.length;
  slides.forEach((s,idx)=>{
    s.classList.toggle("current", idx===i);
    dots[idx].setAttribute("aria-selected", idx===i ? "true" : "false");
  });
}
prev.addEventListener("click", ()=>show(i-1));
next.addEventListener("click", ()=>show(i+1));
dots.forEach((d,idx)=>d.addEventListener("click", ()=>show(idx)));

show(0);

// Optional export: current slide to PNG using HTML2Canvas (tiny inline poly if needed)
// Keeping it dependency-free: use native SVG export for the first SVG inside current slide.
document.getElementById("downloadPng").addEventListener("click", ()=>{
  const slide = slides[i];
  const svg = slide.querySelector("svg");
  if(!svg){ alert("No SVG on this slide to export."); return; }
  const xml = new XMLSerializer().serializeToString(svg);
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const img = new Image();
  img.onload = ()=>{
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img,0,0);
    const a = document.createElement("a");
    a.download = `slide-${i+1}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = 'data:image/svg+xml;base64,' + svg64;
});
