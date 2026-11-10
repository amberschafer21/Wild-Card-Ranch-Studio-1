
let colors=[], svg=null, activeColor=null, activeZone=null, undoStack=[];
const $=s=>document.querySelector(s);
const ramps={
"Blacks & Grays":["#171717","#302a2b","#55565a","#777879","#a2a3a0","#c5c5c1"],
"Browns & Tans":["#38251f","#4a2a20","#684638","#805b3e","#a17c5b","#c3b49a"],
"Yellows & Golds":["#fff29a","#f5e85a","#f3d331","#d9a82b","#bfa34a"],
"Oranges":["#f47a45","#f06b2e","#b86c32","#a8432e","#f45c1e"],
"Neutrals & Whites":["#d7c8b9","#cfc5a9","#e2dfc9","#f2ebd8","#fffdf7"],
"Reds":["#e52e32","#c91f2a","#b91e2a","#91312b","#782322"],
"Pinks & Corals":["#f6b6b4","#f6a995","#efa8bd","#e77d9b","#f22d78","#c82b7e"],
"Purples":["#e6d9e4","#c9b1d2","#9a6bb1","#713a9b","#54207d","#321b55"],
"Blues & Turquoises":["#d7f1e9","#a5d6f0","#71c9e1","#36b7b4","#168f98","#24517d","#17245f"],
"Greens":["#d6e9b9","#b8d66d","#8bcb43","#42a75d","#17834b","#214a32"]
};
function swatch(c){
  const a=ramps[c.family]||["#888"]; let n=0;
  for(const ch of c.name)n=(n*31+ch.charCodeAt(0))>>>0;
  return a[n%a.length];
}
function selectZone(z){
  activeZone=String(z);
  document.querySelectorAll(".zone").forEach(b=>b.classList.toggle("active",b.dataset.zone===activeZone));
  $("#selectedZone").textContent=`Section ${activeZone}`;
  $("#status").textContent=activeColor
    ? `Section ${activeZone} selected. Applying ${activeColor.name} when you choose Apply.`
    : `Section ${activeZone} selected. Choose a supplier color, then press Apply.`;
}
function applyColor(){
  if(!activeZone || !activeColor){$("#status").textContent="Select a section and a supplier color first.";return;}
  const targets=[...svg.querySelectorAll(`[data-zone="${activeZone}"]`)];
  if(!targets.length){$("#status").textContent=`No mapped pieces found for section ${activeZone}.`;return;}
  const before=targets.map(el=>({el,style:el.getAttribute("style")}));
  undoStack.push(before);
  targets.forEach(el=>el.style.setProperty("fill",activeColor.hex,"important"));
  $("#status").textContent=`Applied ${activeColor.name} (${activeColor.code}) to ${targets.length} mapped piece(s) in section ${activeZone}.`;
}
function undo(){
  const prev=undoStack.pop(); if(!prev)return;
  prev.forEach(x=>x.style===null?x.el.removeAttribute("style"):x.el.setAttribute("style",x.style));
  $("#status").textContent="Last color change undone.";
}
function reset(){
  svg.querySelectorAll("[data-zone]").forEach(el=>el.removeAttribute("style"));
  undoStack=[];$("#status").textContent="Design reset to the original grayscale artwork.";
}
function download(){
  const clone=svg.cloneNode(true);
  clone.querySelectorAll("[data-piece-id]").forEach(el=>{el.removeAttribute("data-piece-id");});
  const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:"image/svg+xml"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="wild-card-ranch-1-custom.svg";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function renderSwatches(){
  const family=$("#family").value,term=$("#search").value.toLowerCase();
  const filtered=colors.filter(c=>(family==="All"||c.family===family)&&(`${c.name} ${c.code}`.toLowerCase().includes(term)));
  $("#swatches").innerHTML=filtered.map((c,i)=>`<button class="swatch" data-i="${i}"><i style="background:${swatch(c)}"></i><small><b>${c.name}</b><br>${c.code}</small></button>`).join("");
  document.querySelectorAll(".swatch").forEach((b,i)=>b.onclick=()=>{
    activeColor={...filtered[i],hex:swatch(filtered[i])};
    document.querySelectorAll(".swatch").forEach(x=>x.classList.remove("active"));b.classList.add("active");
    $("#chip").style.background=activeColor.hex;$("#cname").textContent=activeColor.name;$("#ccode").textContent=activeColor.code;
    $("#status").textContent=activeZone?`${activeColor.name} selected for section ${activeZone}. Press Apply.`:`${activeColor.name} selected. Select a numbered section, then press Apply.`;
  });
}
async function init(){
  colors=await fetch("colors.json").then(r=>r.json());
  const families=[...new Set(colors.map(c=>c.family))];
  $("#family").innerHTML='<option value="All">All color families</option>'+families.map(f=>`<option>${f}</option>`).join("");
  $("#family").onchange=renderSwatches;$("#search").oninput=renderSwatches;
  $("#undo").onclick=undo;$("#reset").onclick=reset;$("#download").onclick=download;$("#apply").onclick=applyColor;
  const raw=await fetch("ranch-1-mapped.svg").then(r=>r.text());
  $("#pad").innerHTML=raw;svg=$("#pad svg");
  svg.removeAttribute("width");svg.removeAttribute("height");svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  document.querySelectorAll(".zone").forEach(b=>b.onclick=()=>selectZone(b.dataset.zone));
  svg.querySelectorAll("[data-zone]").forEach(el=>el.addEventListener("click",e=>{
    e.stopPropagation();
    selectZone(el.dataset.zone);
    if(activeColor)applyColor();
  }));
  renderSwatches();
  const mapped=[...svg.querySelectorAll("[data-zone]")].length;
  $("#status").textContent=`Ranch 1 loaded: ${mapped} mapped pieces across 31 numbered sections.`;
}
init().catch(e=>{$("#status").textContent="Could not load the mapped SVG or color library. Follow the README startup steps.";console.error(e)});
