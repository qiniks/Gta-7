// core.js — constants, canvas, shared state, input, math helpers
const cv=document.getElementById('gta'),ctx=cv.getContext('2d');
const W=648,H=430,DPR=Math.min(2,window.devicePixelRatio||1);
cv.width=W*DPR;cv.height=H*DPR;ctx.scale(DPR,DPR);
const CX=W/2,CY=H*0.6;
const P=170,RH=27,SW=12;
const SC=8; // super-chunk size in cells: one shop/gun shop/police station per super-chunk
const GOAL=5000;
const rand=Math.random;
const DIRA=[0,Math.PI/2,Math.PI,-Math.PI/2];
const PALS=[['#6b6a64','#57564f','#454440'],['#7d5a4c','#684a3e','#523a30'],['#5d6b78','#4c5864','#3d4751'],['#6e6557','#5a5347','#474138']];
const TCOLS=['#8a8782','#6f8fae','#a06a5a','#7a9367','#9b8eb8','#b8a36a'];
const PCOLS=['#b08c5f','#7f8da0','#9a7186','#6f9a83','#a8a08b','#8c6f5a'];

// deterministic hash for world generation: same (i,j,salt) -> same value, always
function hash2(i,j,s){
  let h=(Math.imul(i,374761393)+Math.imul(j,668265263)+Math.imul(s,2246822519))|0;
  h=Math.imul(h^(h>>>13),1274126177);
  h^=h>>>16;
  return (h>>>0)/4294967296;
}

// shared game state (var so it lands on window — handy for debugging)
var state='idle',mode='drive',area='city',frame=0;
var cash=0,heat=0,bustT=0,invuln=0,lastStars=-1,copContact=false;
var pcar=null;
var player={x:0,y:0,fa:0,col:'#EF9F27'};
var cars=[],cops=[],peds=[],money=[],floats=[],bullets=[];
var gun=false,clip=0,reserve=0,reloadT=0;
var interior=null;       // {type,cell,ret:{x,y}} while inside a building
var robbed={};           // cell key -> frame until which that register is empty

var cam={x:0,y:0,rot:-Math.PI/2};
var shake=0,shakeX=0,shakeY=0;

function proj(wx,wy,h){
  const dx=wx-cam.x,dy=wy-cam.y;
  const c=Math.cos(cam.rot),s=Math.sin(cam.rot);
  return{x:CX+dx*c-dy*s+shakeX,y:CY+(dx*s+dy*c)*0.5-(h||0)+shakeY};
}
function awrap(a){while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;}
function shade(col,f){
  const n=parseInt(col.slice(1),16);
  const r=((n>>16)&255)*f|0,g=((n>>8)&255)*f|0,b=(n&255)*f|0;
  return'rgb('+r+','+g+','+b+')';
}
function ppos(){return mode==='drive'?pcar:player;}
function floater(x,y,txt,col){floats.push({x,y,h:16,life:55,txt,col:col||'#C0DD97'});}
function crime(n){heat=Math.min(5,heat+n);}

// input: keys = held, press = went down this frame (cleared every tick)
var keys={},press={};
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  if(!keys[k])press[k]=true;
  keys[k]=true;
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
function key(){for(let i=0;i<arguments.length;i++)if(keys[arguments[i]])return true;return false;}
function prs(){for(let i=0;i<arguments.length;i++)if(press[arguments[i]])return true;return false;}
