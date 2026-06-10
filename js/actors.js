// actors.js — traffic cars, pedestrians, cops, money: spawning and AI
function mkCar(x,y,a,col,kind){return{x,y,a,va:a,s:0,col,kind};}

// random point on a sidewalk strip of a road line near pp
function randSidewalk(pp,R){
  const vert=rand()<0.5;
  const k=Math.round((vert?pp.x:pp.y)/P)+(((rand()*7)|0)-3);
  const side=rand()<0.5?33:-33;
  const u=k*P+side;
  const base=vert?pp.y:pp.x;
  const along=base+(rand()*2-1)*R;
  return vert?{x:u,y:along}:{x:along,y:u};
}
function retarget(pd){const pt=randSidewalk(pd,200);pd.tx=pt.x;pd.ty=pt.y;}
function spawnPed(){
  const pp=ppos();
  for(let t=0;t<40;t++){
    const pt=randSidewalk(pp,560);
    if(Math.hypot(pt.x-pp.x,pt.y-pp.y)>120){
      const pd={x:pt.x,y:pt.y,tx:pt.x,ty:pt.y,flee:0,fx:0,fy:0,col:PCOLS[(rand()*PCOLS.length)|0]};
      retarget(pd);peds.push(pd);return;
    }
  }
}
function newMoney(){
  const pp=ppos();
  for(let t=0;t<40;t++){
    const vert=rand()<0.5;
    const k=Math.round((vert?pp.x:pp.y)/P)+(((rand()*5)|0)-2);
    const u=k*P,off=(rand()*2-1)*15;
    const along=(vert?pp.y:pp.x)+(rand()*2-1)*430;
    const x=vert?u+off:along,y=vert?along:u+off;
    if(Math.hypot(x-pp.x,y-pp.y)>90)return{x,y,v:100};
  }
  return{x:pp.x+220,y:pp.y,v:100};
}
function spawnTraffic(){
  const pp=ppos();
  for(let t=0;t<30;t++){
    const horiz=rand()<0.5;
    const k=Math.round((horiz?pp.y:pp.x)/P)+(((rand()*7)|0)-3);
    const u=k*P;
    const base=horiz?pp.x:pp.y;
    const along=base+(rand()<0.5?-1:1)*(300+rand()*260);
    let dir,x,y;
    if(horiz){dir=rand()<0.5?0:2;x=along;y=u+(dir===0?13:-13);}
    else{dir=rand()<0.5?1:3;y=along;x=u+(dir===1?-13:13);}
    if(Math.hypot(x-pp.x,y-pp.y)<260)continue;
    const c=mkCar(x,y,DIRA[dir],TCOLS[(rand()*TCOLS.length)|0],'traffic');
    c.dir=dir;c.line=u;c.s=1.2;cars.push(c);return;
  }
}
function spawnCop(){
  const pp=ppos();
  for(let t=0;t<30;t++){
    const vert=rand()<0.5;
    const k=Math.round((vert?pp.x:pp.y)/P)+(((rand()*7)|0)-3);
    const u=k*P;
    const base=vert?pp.y:pp.x;
    const along=base+(rand()<0.5?-1:1)*(330+rand()*150);
    const x=vert?u:along,y=vert?along:u;
    if(Math.hypot(x-pp.x,y-pp.y)<260)continue;
    const c=mkCar(x,y,Math.atan2(pp.y-y,pp.x-x),'#ECE9E1','cop');
    c.hp=3;cops.push(c);return;
  }
}
function turnCar(c,ic){
  const horiz=(c.dir===0||c.dir===2);
  const cand=horiz?[1,3]:[0,2];
  const nd=cand[(rand()*2)|0];
  c.dir=nd;
  if(nd===0)c.y=ic+13;else if(nd===2)c.y=ic-13;else if(nd===1)c.x=ic-13;else c.x=ic+13;
  c.line=ic;
}
function stepTraffic(c){
  const ang=DIRA[c.dir],hx=Math.cos(ang),hy=Math.sin(ang);
  let blocked=false;
  const ahead=(ox,oy,rr)=>{const dx=ox-c.x,dy=oy-c.y;const f=dx*hx+dy*hy,l=Math.abs(dy*hx-dx*hy);return f>4&&f<rr&&l<13;};
  for(const o of cars){if(o!==c&&ahead(o.x,o.y,44)){blocked=true;break;}}
  if(!blocked)for(const o of cops){if(ahead(o.x,o.y,44)){blocked=true;break;}}
  if(!blocked&&mode==='foot'&&ahead(player.x,player.y,34))blocked=true;
  if(!blocked)for(const pd of peds){if(ahead(pd.x,pd.y,26)){blocked=true;break;}}
  c.s=blocked?Math.max(0,c.s-0.18):Math.min(1.55,c.s+0.045);
  if(c.s>0.05){
    const horiz=(c.dir===0||c.dir===2);
    const prev=horiz?c.x:c.y;
    c.x+=hx*c.s;c.y+=hy*c.s;
    const cur=horiz?c.x:c.y;
    const m=Math.round(((prev+cur)/2)/P),ic=m*P;
    if((prev-ic)*(cur-ic)<=0&&Math.abs(cur-prev)>0.01){
      if(rand()<0.4)turnCar(c,ic);
    }
  }
  c.va+=awrap(DIRA[c.dir]-c.va)*0.18;
}
function stepCop(c){
  const t=ppos();
  const want=Math.atan2(t.y-c.y,t.x-c.x);
  const d=awrap(want-c.a);
  c.a+=Math.max(-0.06,Math.min(0.06,d));
  if(Math.cos(d)>0.2)c.s=Math.min(4.1,c.s+0.12);else c.s*=0.93;
  c.s*=0.975;
  const px=c.x,py=c.y;
  c.x+=Math.cos(c.a)*c.s;c.y+=Math.sin(c.a)*c.s;
  if(hitBuilding(c.x,c.y,9)){c.x=px;c.y=py;c.s*=-0.4;}
  c.va=c.a;
  const dd=Math.hypot(c.x-t.x,c.y-t.y);
  if(invuln>0)return;
  if(mode==='foot'&&dd<15){busted();return;}
  if(mode==='drive'&&dd<24){
    copContact=true;
    if(Math.abs(pcar.s)<1){bustT++;if(bustT>50){busted();return;}}
    else{
      const ang=Math.atan2(pcar.y-c.y,pcar.x-c.x);
      pcar.x+=Math.cos(ang)*2;pcar.y+=Math.sin(ang)*2;
      pcar.s*=0.85;c.s*=0.6;shake=Math.max(shake,4);
    }
  }
}
// a ped goes down (punched / shot / run over): cash drop + wanted level
function killPed(pd,val,h){
  cash+=val;crime(h);floater(pd.x,pd.y,'+$'+val);shake=Math.max(shake,4);
  peds.splice(peds.indexOf(pd),1);hud();
}
function scarePeds(x,y,r){
  for(const pd of peds){
    const d=Math.hypot(pd.x-x,pd.y-y);
    if(d<r&&d>0.01){
      const a=Math.atan2(pd.y-y,pd.x-x);
      pd.fx=Math.cos(a);pd.fy=Math.sin(a);pd.flee=60;
    }
  }
}
function stepPeds(){
  for(let i=peds.length-1;i>=0;i--){
    const pd=peds[i];
    if(mode==='drive'&&Math.abs(pcar.s)>2&&Math.hypot(pcar.x-pd.x,pcar.y-pd.y)<60){
      const ang=Math.atan2(pd.y-pcar.y,pd.x-pcar.x);
      pd.fx=Math.cos(ang);pd.fy=Math.sin(ang);pd.flee=45;
    }
    let vx,vy,spd;
    if(pd.flee>0){pd.flee--;vx=pd.fx;vy=pd.fy;spd=1.35;}
    else{
      const dx=pd.tx-pd.x,dy=pd.ty-pd.y,dl=Math.hypot(dx,dy);
      if(dl<5){retarget(pd);continue;}
      vx=dx/dl;vy=dy/dl;spd=0.5;
    }
    const nx=pd.x+vx*spd,ny=pd.y+vy*spd;
    if(!hitBuilding(nx,ny,4)){pd.x=nx;pd.y=ny;}else retarget(pd);
    if(mode==='drive'&&Math.abs(pcar.s)>1.1&&Math.hypot(pcar.x-pd.x,pcar.y-pd.y)<13)killPed(pd,20,1);
  }
  for(let i=peds.length-1;i>=0;i--){
    const pp=ppos();
    if(Math.hypot(peds[i].x-pp.x,peds[i].y-pp.y)>750)peds.splice(i,1);
  }
  while(peds.length<24)spawnPed();
}
function enterCar(c){
  if(c.kind==='traffic'){
    crime(1);floater(c.x,c.y,'Угон!','#F1EFE8');
    const ang=c.va+Math.PI/2;
    const jx=c.x+Math.cos(ang)*14,jy=c.y+Math.sin(ang)*14;
    const pd={x:jx,y:jy,tx:jx,ty:jy,flee:70,fx:Math.cos(ang),fy:Math.sin(ang),col:PCOLS[(rand()*PCOLS.length)|0]};
    retarget(pd);peds.push(pd);
  }
  c.kind='pc';c.s=0;pcar=c;mode='drive';setHint();
}
function exitCar(){
  pcar.s=0;pcar.kind='free';
  for(const sgn of[1,-1]){
    const ang=pcar.a+sgn*Math.PI/2;
    const ex=pcar.x+Math.cos(ang)*17,ey=pcar.y+Math.sin(ang)*17;
    if(!hitBuilding(ex,ey,4)){player.x=ex;player.y=ey;mode='foot';setHint();return;}
  }
  player.x=pcar.x;player.y=pcar.y-20;mode='foot';setHint();
}
