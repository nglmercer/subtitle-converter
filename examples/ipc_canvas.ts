import { serve } from "bun";
import { parseToUniversal, renderHtml, renderJson } from "../src/index.ts";

const ass = `[Script Info]
Title: Demo Complex
ScriptType: v4.00+
PlayResX: 640
PlayResY: 360

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TopWhite,Arial,22,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,3,2,8,10,10,20,1
Style: CenterGreen,Arial,24,&H0000FF00,&H000000FF,&HFF000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,5,10,10,10,1
Style: BottomBlue,Arial,22,&H00FF0000,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:02.00,TopWhite,,0,0,20,,{\pos(320,40)}Primera línea {\c&HFF0000&}azul
Dialogue: 0,0:00:03.00,0:00:04.00,CenterGreen,,0,0,10,,{\pos(320,180)}Segunda línea {\c&H00FF00&}verde
Dialogue: 0,0:00:05.00,0:00:06.00,BottomBlue,,0,0,30,,{\pos(320,320)}Tercera línea {\c&H0000FF&}roja`;

const universal = parseToUniversal(ass, "ass");

function randSvg(w = 640, h = 360) {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="rgb(${r},${g},${b})"/></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const htmlOverlay = renderHtml(universal, { includeMetadata: true, containerClass: "subs", cueClass: "cue", usePlainText: false, processAssOverrides: true });
const stylesBrowser = renderJson(universal, { target: "browser", compact: false });

const page = (img: string) => `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;display:grid;place-items:center;background:#111}#wrap{position:relative}canvas{display:block}.subs{position:absolute;inset:0;width:640px;height:360px;pointer-events:none}.cue{position:absolute;}</style></head><body><div id="wrap"><canvas id="cv" width="640" height="360"></canvas>${htmlOverlay}</div><script>const img='${img}';const styleMap=${stylesBrowser};const c=document.getElementById('cv');const x=c.getContext('2d');const i=new Image();i.onload=()=>{x.drawImage(i,0,0,c.width,c.height)};i.src=img;function toCssColor(h){if(!h)return'';if(h.startsWith('#'))return h;let m=h.match(/^&H([0-9A-Fa-f]{8})$/);if(m){const hex=m[1];const aa=parseInt(hex.slice(0,2),16);const bb=parseInt(hex.slice(2,4),16);const gg=parseInt(hex.slice(4,6),16);const rr=parseInt(hex.slice(6,8),16);const a=1-aa/255;return 'rgba('+rr+','+gg+','+bb+','+a.toFixed(3)+')';}m=h.match(/^&H([0-9A-Fa-f]{6})$/);if(m){const hex=m[1];const bb=parseInt(hex.slice(0,2),16);const gg=parseInt(hex.slice(2,4),16);const rr=parseInt(hex.slice(4,6),16);return 'rgb('+rr+','+gg+','+bb+')';}return h;}function applyTransformByAlignment(el, an){let tx=0,ty=0;if(an===2||an===5||an===8)tx=-50;else if(an===3||an===6||an===9)tx=-100;if(an===4||an===5||an===6)ty=-50;else if(an===1||an===2||an===3)ty=-100;el.style.transform='translate('+tx+'%,'+ty+'%)';}(()=>{const cues=[...document.querySelectorAll('.cue')];cues.forEach(el=>{el.style.display='none';const name=el.getAttribute('data-style');let alignNum=0;if(name&&styleMap.styles&&styleMap.styles[name]){const s=styleMap.styles[name];if(s.color)el.style.color=s.color;if(s.fontFamily)el.style.fontFamily=s.fontFamily;if(s.fontSize)el.style.fontSize=s.fontSize;if(s.textShadow)el.style.textShadow=s.textShadow;if(s.textAlign)el.style.textAlign=s.textAlign;if(typeof s.alignment==='number')alignNum=s.alignment;}const px=el.getAttribute('data-pos-x');const py=el.getAttribute('data-pos-y');const oc=el.getAttribute('data-override-color');if(px&&py){el.style.left=px+'px';el.style.top=py+'px';}if(oc){el.style.color=toCssColor(oc);}if(alignNum)applyTransformByAlignment(el,alignNum);const s=+el.getAttribute('data-start')||0;const e=+el.getAttribute('data-end')||0;setTimeout(()=>{el.style.display='block'},s);setTimeout(()=>{el.style.display='none'},e);});})();try{const url=(location.protocol==='https:'?'wss://':'ws://')+location.host;const ws=new WebSocket(url);ws.onmessage=(e)=>console.log('IPC',e.data)}catch(e){}</script></body></html>`;

serve({
  port: 3000,
  fetch() {
    return new Response(page(randSvg()), { headers: { "content-type": "text/html" } });
  },
  websocket: {
    open(ws) {
      ws.send(renderJson(universal, { target: "browser", compact: true }));
    },
    message() {},
  },
});