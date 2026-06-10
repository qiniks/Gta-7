// render.js — all drawing: city, buildings, actors, interiors, minimap
function fq(p,col){
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);
  for(let i=1;i<p.length;i++)ctx.lineTo(p[i].x,p[i].y);
  ctx.closePath();ctx.fill();
}
function drawGround(){
  ctx.fillStyle='#2C2C2A';ctx.fillRect(0,0,W,H);
  const R=650;
  const i0=Math.floor((cam.x-R)/P),i1=Math.floor((cam.x+R)/P);
  const j0=Math.floor((cam.y-R)/P),j1=Math.floor((cam.y+R)/P);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){
    const b=getBlock(i,j);
    const cx=b.x0+b.sz/2,cy=b.y0+b.sz/2;
    if(Math.abs(cx-cam.x)+Math.abs(cy-cam.y)>650)continue;
    fq([proj(b.x0,b.y0,0),proj(b.x0+b.sz,b.y0,0),proj(b.x0+b.sz,b.y0+b.sz,0),proj(b.x0,b.y0+b.sz,0)],'#3B3A36');
    const a0=b.x0+SW,a1=b.x0+b.sz-SW,c0=b.y0+SW,c1=b.y0+b.sz-SW;
    fq([proj(a0,c0,0),proj(a1,c0,0),proj(a1,c1,0),proj(a0,c1,0)],b.park?'#2E4023':'#33322E');
  }
  // dashed center lines along every road in view
  ctx.strokeStyle='#55524B';ctx.lineWidth=2;ctx.beginPath();
  for(let k=Math.ceil((cam.x-420)/P);k<=Math.floor((cam.x+420)/P);k++){
    const u=k*P,y0=cam.y-360,y1=cam.y+360;
    for(let y=Math.floor(y0/30)*30;y<y1;y+=30){
      const a=proj(u,y,0),b=proj(u,y+14,0);
      ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    }
  }
  for(let k=Math.ceil((cam.y-420)/P);k<=Math.floor((cam.y+420)/P);k++){
    const u=k*P,x0=cam.x-360,x1=cam.x+360;
    for(let x=Math.floor(x0/30)*30;x<x1;x+=30){
      const a=proj(x,u,0),b=proj(x+14,u,0);
      ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    }
  }
  ctx.stroke();
}
function drawPrism(bx,by,bw,bh,hgt,pal,outline){
  const c4=[proj(bx,by,0),proj(bx+bw,by,0),proj(bx+bw,by+bh,0),proj(bx,by+bh,0)];
  const t4=c4.map(p=>({x:p.x,y:p.y-hgt}));
  const cy=(c4[0].y+c4[1].y+c4[2].y+c4[3].y)/4;
  const cx=(c4[0].x+c4[1].x+c4[2].x+c4[3].x)/4;
  for(let e=0;e<4;e++){
    const p1=c4[e],p2=c4[(e+1)%4];
    if((p1.y+p2.y)/2>cy)fq([p1,p2,t4[(e+1)%4],t4[e]],((p1.x+p2.x)/2<cx)?pal[1]:pal[2]);
  }
  fq(t4,pal[0]);
  if(outline){
    ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(t4[0].x,t4[0].y);
    for(let i=1;i<4;i++)ctx.lineTo(t4[i].x,t4[i].y);
    ctx.closePath();ctx.stroke();
  }
}
function drawBuilding(b){
  drawPrism(b.bx,b.by,b.bw,b.bh,b.hgt,b.pal,true);
  if(b.special){
    const d=SPEC_DEF[b.special];
    fq([proj(b.door.x-7,b.by+b.bh,0),proj(b.door.x+7,b.by+b.bh,0),proj(b.door.x+7,b.door.y+6,0),proj(b.door.x-7,b.door.y+6,0)],'#191917');
    const s0=proj(b.door.x,b.by+b.bh,b.hgt+12);
    ctx.save();
    ctx.font='600 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor=d.col;ctx.shadowBlur=10;ctx.fillStyle=d.col;
    ctx.fillText(d.sign,s0.x,s0.y);
    ctx.fillText(d.sign,s0.x,s0.y);
    ctx.restore();
  }
}
function drawTree(t){
  const s0=proj(t.x,t.y,0);
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath();ctx.ellipse(s0.x,s0.y,t.r*0.9,t.r*0.45,0,0,7);ctx.fill();
  ctx.strokeStyle='#5a4632';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(s0.x,s0.y);ctx.lineTo(s0.x,s0.y-11);ctx.stroke();
  ctx.fillStyle='#3F5E2E';
  ctx.beginPath();ctx.arc(s0.x,s0.y-14,t.r,0,7);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=1;ctx.stroke();
}
function carQuad(c,l,w,h,bk){
  const ca=Math.cos(c.va),sa=Math.sin(c.va);
  const pts=[[l/2+bk,w/2],[l/2+bk,-w/2],[-l/2+bk,-w/2],[-l/2+bk,w/2]];
  return pts.map(p=>proj(c.x+p[0]*ca-p[1]*sa,c.y+p[0]*sa+p[1]*ca,h));
}
function drawCar(c){
  fq(carQuad(c,27,15,0,0),'rgba(0,0,0,0.35)');
  const b0=carQuad(c,26,13,2,0),b1=carQuad(c,26,13,7,0);
  const cy=(b0[0].y+b0[1].y+b0[2].y+b0[3].y)/4;
  const cx=(b0[0].x+b0[1].x+b0[2].x+b0[3].x)/4;
  for(let e=0;e<4;e++){
    const p1=b0[e],p2=b0[(e+1)%4];
    if((p1.y+p2.y)/2>cy)fq([p1,p2,b1[(e+1)%4],b1[e]],((p1.x+p2.x)/2<cx)?shade(c.col,0.72):shade(c.col,0.52));
  }
  fq(b1,c.col);
  if(c.flash>0){c.flash--;fq(b1,'rgba(255,255,255,0.7)');}
  fq(carQuad(c,11,10,10,-2),'#23262B');
  if(c.kind==='cop')fq(carQuad(c,4,8,11,-1),((frame>>3)%2)?'#E24B4A':'#378ADD');
}
function drawPed(pd){
  const s0=proj(pd.x,pd.y,0);
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath();ctx.ellipse(s0.x,s0.y,4,2,0,0,7);ctx.fill();
  ctx.fillStyle=pd.col;
  ctx.beginPath();ctx.arc(s0.x,s0.y-5.5,3.4,0,7);ctx.fill();
  ctx.fillStyle='#d9af8b';
  ctx.beginPath();ctx.arc(s0.x,s0.y-10,2.3,0,7);ctx.fill();
}
function drawCoin(m){
  const bob=Math.sin(frame*0.1+m.x)*1.5;
  const s0=proj(m.x,m.y,0);
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath();ctx.ellipse(s0.x,s0.y,4.5,2.2,0,0,7);ctx.fill();
  ctx.fillStyle='#97C459';
  ctx.beginPath();ctx.arc(s0.x,s0.y-6-bob,5,0,7);ctx.fill();
  ctx.strokeStyle='#2e4d12';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle='#173404';ctx.font='500 9px sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('$',s0.x,s0.y-5.5-bob);
}
function drawBullets(){
  ctx.fillStyle='#FFE9A8';
  for(const bl of bullets){
    const s0=proj(bl.x,bl.y,6);
    ctx.fillRect(s0.x-1.5,s0.y-1.5,3,3);
  }
}
function drawFloats(){
  ctx.font='500 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=floats.length-1;i>=0;i--){
    const f=floats[i];
    f.h+=0.5;f.life--;
    if(f.life<=0){floats.splice(i,1);continue;}
    ctx.globalAlpha=Math.min(1,f.life/40);
    const s0=proj(f.x,f.y,f.h);
    ctx.fillStyle=f.col;ctx.fillText(f.txt,s0.x,s0.y);
  }
  ctx.globalAlpha=1;
}
function drawMinimap(){
  const M=92,mx=W-M-12,my=12,RNG=560,sc=M/(RNG*2);
  const pp=ppos();
  ctx.fillStyle='rgba(18,18,17,0.72)';
  ctx.fillRect(mx-3,my-3,M+6,M+6);
  ctx.save();ctx.beginPath();ctx.rect(mx,my,M,M);ctx.clip();
  const wx=x=>mx+(x-pp.x+RNG)*sc,wy=y=>my+(y-pp.y+RNG)*sc;
  const i0=Math.floor((pp.x-RNG)/P),i1=Math.floor((pp.x+RNG)/P);
  const j0=Math.floor((pp.y-RNG)/P),j1=Math.floor((pp.y+RNG)/P);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){
    const b=getBlock(i,j);
    if(b.special){
      ctx.fillStyle=SPEC_DEF[b.special].col;
      ctx.fillRect(wx(b.x0),wy(b.y0),b.sz*sc+1,b.sz*sc+1);
    }else{
      ctx.fillStyle='rgba(125,122,113,0.5)';
      ctx.fillRect(wx(b.x0),wy(b.y0),b.sz*sc,b.sz*sc);
    }
  }
  ctx.fillStyle='#97C459';
  for(const m of money)ctx.fillRect(wx(m.x)-1,wy(m.y)-1,2.5,2.5);
  ctx.fillStyle='#E24B4A';
  for(const c of cops)ctx.fillRect(wx(c.x)-1.5,wy(c.y)-1.5,3.5,3.5);
  const pa=mode==='drive'?pcar.a:player.fa;
  ctx.translate(mx+M/2,my+M/2);
  ctx.rotate(pa);
  ctx.fillStyle='#F1EFE8';
  ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-3,-2.6);ctx.lineTo(-3,2.6);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.strokeStyle='rgba(125,122,113,0.6)';ctx.lineWidth=1;
  ctx.strokeRect(mx-3,my-3,M+6,M+6);
}
function renderInterior(){
  ctx.fillStyle='#191917';ctx.fillRect(0,0,W,H);
  const R=ROOMS[interior.type];
  fq([proj(0,0,0),proj(ROOMW,0,0),proj(ROOMW,ROOMH,0),proj(0,ROOMH,0)],R.floor);
  fq([proj(ROOMW/2-16,ROOMH-8,0),proj(ROOMW/2+16,ROOMH-8,0),proj(ROOMW/2+16,ROOMH+8,0),proj(ROOMW/2-16,ROOMH+8,0)],'#4a5a3a');
  const wallPal=['#56544e','#454440','#3a3935'];
  const items=[];
  for(const wq of WALLS)items.push({y:proj(wq.x+wq.w/2,wq.y+wq.h/2,0).y,f:()=>drawPrism(wq.x,wq.y,wq.w,wq.h,34,wallPal,true)});
  items.push({y:proj(COUNTER.x+COUNTER.w/2,COUNTER.y+COUNTER.h/2,0).y,f:()=>drawPrism(COUNTER.x,COUNTER.y,COUNTER.w,COUNTER.h,16,['#6e5d49','#5a4c3b','#463b2e'],true)});
  for(const fr of R.furn)items.push({y:proj(fr.x+fr.w/2,fr.y+fr.h/2,0).y,f:()=>drawPrism(fr.x,fr.y,fr.w,fr.h,18,['#5a5650','#48453f','#393733'],true)});
  items.push({y:proj(CLERK.x,CLERK.y,0).y,f:()=>drawPed({x:CLERK.x,y:CLERK.y,col:R.clerkCol})});
  items.push({y:proj(player.x,player.y,0).y,f:()=>drawPed(player)});
  items.sort((a,b)=>a.y-b.y);
  for(const it of items)it.f();
  ctx.font='600 14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#F1EFE8';
  ctx.fillText(R.name,CX,proj(ROOMW/2,0,0).y-48);
  drawFloats();
}
function near(o,r){return Math.abs(o.x-cam.x)+Math.abs(o.y-cam.y)<r;}
function render(){
  shakeX=(rand()*2-1)*shake;shakeY=(rand()*2-1)*shake;shake*=0.85;
  if(shake<0.3)shake=0;
  if(area!=='city'){renderInterior();return;}
  drawGround();
  const items=[];
  const R=650;
  const i0=Math.floor((cam.x-R)/P),i1=Math.floor((cam.x+R)/P);
  const j0=Math.floor((cam.y-R)/P),j1=Math.floor((cam.y+R)/P);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){
    const b=getBlock(i,j);
    const cx=b.x0+b.sz/2,cy=b.y0+b.sz/2;
    if(Math.abs(cx-cam.x)+Math.abs(cy-cam.y)>650)continue;
    if(b.park){for(const t of b.trees)items.push({y:proj(t.x,t.y,0).y,f:drawTree.bind(null,t)});}
    else items.push({y:proj(b.bx+b.bw/2,b.by+b.bh/2,0).y,f:drawBuilding.bind(null,b)});
  }
  for(const m of money)if(near(m,500))items.push({y:proj(m.x,m.y,0).y,f:drawCoin.bind(null,m)});
  for(const c of cars){
    if(!near(c,550))continue;
    if(c===pcar&&mode==='drive'&&invuln>0&&((frame>>2)%2===0))continue;
    items.push({y:proj(c.x,c.y,0).y,f:drawCar.bind(null,c)});
  }
  for(const c of cops)if(near(c,550))items.push({y:proj(c.x,c.y,0).y,f:drawCar.bind(null,c)});
  for(const pd of peds)if(near(pd,500))items.push({y:proj(pd.x,pd.y,0).y,f:drawPed.bind(null,pd)});
  if(mode==='foot'&&!(invuln>0&&((frame>>2)%2===0)))items.push({y:proj(player.x,player.y,0).y,f:drawPed.bind(null,player)});
  items.sort((a,b)=>a.y-b.y);
  for(const it of items)it.f();
  drawBullets();
  drawFloats();
  drawMinimap();
}
