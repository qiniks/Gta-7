// game.js — state machine, player control, HUD, main loop
const cashEl=document.getElementById('cash'),starsEl=document.getElementById('stars'),hintEl=document.getElementById('hint');
const ammoBox=document.getElementById('ammo-box'),ammoEl=document.getElementById('ammo');
const ovl=document.getElementById('ovl'),ovlT=document.getElementById('ovl-title'),ovlS=document.getElementById('ovl-sub');
const btnS=document.getElementById('btn-start'),btnN=document.getElementById('btn-next');
var lastHint='';
function hintSet(h){if(h!==lastHint){lastHint=h;hintEl.innerHTML=h;}}
function setHint(){
  if(area!=='city')return;
  hintSet(mode==='drive'
    ?'WASD / стрелки — газ и руль<br>Пробел — выйти из машины'
    :'WASD — ходьба · Пробел — машина / дверь<br>F — '+(gun?'выстрел':'удар'));
}
function hud(){
  cashEl.textContent='$'+cash;
  const st=Math.floor(heat);lastStars=st;
  let s='';
  for(let i=0;i<5;i++)s+='<span style="color:'+(i<st?'#EF9F27':'var(--color-border-secondary,#45443f)')+'">★</span>';
  starsEl.innerHTML=s;
  if(gun){ammoBox.style.display='';ammoEl.textContent=clip+'/'+reserve;}
  else ammoBox.style.display='none';
}
function stepPlayer(){
  if(mode==='drive'){
    const up=key('w','arrowup','ц'),dn=key('s','arrowdown','ы'),lf=key('a','arrowleft','ф'),rt=key('d','arrowright','в');
    if(up)pcar.s=Math.min(4.6,pcar.s+0.13);
    if(dn)pcar.s=pcar.s>0.3?pcar.s-0.22:Math.max(-1.9,pcar.s-0.1);
    pcar.s*=0.976;
    const turn=(rt?1:0)-(lf?1:0);
    pcar.a+=turn*0.052*Math.min(1,Math.abs(pcar.s)/1.1)*(pcar.s<0?-1:1);
    pcar.va=pcar.a;
    const ox=pcar.x,oy=pcar.y;
    pcar.x+=Math.cos(pcar.a)*pcar.s;pcar.y+=Math.sin(pcar.a)*pcar.s;
    if(hitBuilding(pcar.x,pcar.y,9)){pcar.x=ox;pcar.y=oy;pcar.s*=-0.35;shake=Math.max(shake,5);}
    for(const o of cars){
      if(o===pcar)continue;
      const dd=Math.hypot(o.x-pcar.x,o.y-pcar.y);
      if(dd<22&&dd>0.01){
        const ang=Math.atan2(pcar.y-o.y,pcar.x-o.x);
        pcar.x=o.x+Math.cos(ang)*22;pcar.y=o.y+Math.sin(ang)*22;
        pcar.s*=0.6;if(o.kind==='traffic')o.s=0;shake=Math.max(shake,3);
      }
    }
    if(prs(' ')){
      if(Math.abs(pcar.s)<1.2)exitCar();
      else floater(pcar.x,pcar.y,'Сначала остановись','#F1EFE8');
    }
  }else{
    let ix=(key('d','arrowright','в')?1:0)-(key('a','arrowleft','ф')?1:0);
    let iy=(key('s','arrowdown','ы')?1:0)-(key('w','arrowup','ц')?1:0);
    if(ix||iy){
      const il=Math.hypot(ix,iy);ix/=il;iy/=il;
      const c=Math.cos(cam.rot),s=Math.sin(cam.rot);
      const wx=ix*c+iy*s,wy=-ix*s+iy*c;
      const nx=player.x+wx*1.5,ny=player.y+wy*1.5;
      if(!hitBuilding(nx,ny,4)){player.x=nx;player.y=ny;player.fa=Math.atan2(wy,wx);}
    }
    if(prs(' ')){
      const db=doorAt(player.x,player.y);
      if(db)enterInterior(db);
      else{
        let best=null,bd=30;
        for(const c of cars){
          const dd=Math.hypot(c.x-player.x,c.y-player.y);
          if(dd<bd&&Math.abs(c.s)<2.5){bd=dd;best=c;}
        }
        if(best)enterCar(best);
      }
    }
    if(area==='city'&&prs('f','а'))doAttack();
  }
  if(area!=='city')return;
  const pp=ppos();
  for(const m of money){
    if(Math.hypot(m.x-pp.x,m.y-pp.y)<(mode==='drive'?16:10)){
      cash+=m.v;floater(m.x,m.y,'+$'+m.v);
      const nm=newMoney();m.x=nm.x;m.y=nm.y;
      hud();
      if(cash>=GOAL){win();return;}
    }
  }
}
function step(){
  if(area!=='city'){
    stepInterior();
    heat=Math.max(0,heat-0.0023);
    if(Math.floor(heat)!==lastStars)hud();
    return;
  }
  copContact=false;
  stepPlayer();
  if(state!=='play'||area!=='city')return;
  stepGun();stepBullets();
  for(const c of cars)if(c.kind==='traffic')stepTraffic(c);
  stepPeds();
  if(state!=='play')return;
  heat=Math.max(0,heat-0.0023);
  const st=Math.floor(heat);
  while(cops.length<st)spawnCop();
  if(cops.length>st)cops.length=st;
  for(const c of cops){stepCop(c);if(state!=='play')return;}
  if(!copContact)bustT=Math.max(0,bustT-2);
  if(invuln>0)invuln--;
  const pp=ppos();
  for(let i=cars.length-1;i>=0;i--){
    const c=cars[i];
    if(c.kind==='traffic'&&Math.hypot(c.x-pp.x,c.y-pp.y)>800)cars.splice(i,1);
  }
  let tc=0;for(const c of cars)if(c.kind==='traffic')tc++;
  while(tc<9){spawnTraffic();tc++;}
  for(const m of money){
    if(Math.hypot(m.x-pp.x,m.y-pp.y)>900){const nm=newMoney();m.x=nm.x;m.y=nm.y;}
  }
  if(st!==lastStars)hud();
}
function busted(){
  state='busted';
  cash=Math.floor(cash/2/10)*10;
  heat=0;cops.length=0;bustT=0;bullets=[];
  const hadAmmo=clip+reserve>0;
  clip=0;reserve=0;reloadT=0;
  hud();
  ovlT.textContent='Busted!';
  ovlS.textContent='Полиция забрала половину денег'+(hadAmmo?' и все патроны':'')+'. Осталось $'+cash+'. Тебя выпустили у ближайшего участка.';
  btnS.textContent='Продолжить';btnN.style.display='none';
  ovl.style.display='flex';
}
function win(){
  state='win';hud();
  ovlT.textContent='Город твой';
  ovlS.textContent='$'+GOAL+' собраны, полиция осталась ни с чем. GTA 7 пройдена на 100%.';
  btnS.textContent='Ещё раз';btnN.style.display='';
  ovl.style.display='flex';
}
function respawnBust(){
  area='city';interior=null;mode='foot';
  const ps=nearestPolice(player.x,player.y);
  if(ps){player.x=ps.door.x;player.y=ps.door.y+14;}
  invuln=210;bustT=0;
  let nearCar=false;
  for(const c of cars)if(c.kind!=='traffic'&&Math.hypot(c.x-player.x,c.y-player.y)<160)nearCar=true;
  if(!nearCar){
    const k=Math.round(player.y/P)*P;
    cars.push(mkCar(player.x-40,k+13,0,'#EF9F27','free'));
  }
  cam.x=player.x;cam.y=player.y;cam.rot=-Math.PI/2;
  setHint();hud();
}
function reset(){
  cash=0;heat=0;bustT=0;invuln=0;mode='drive';area='city';interior=null;
  gun=false;clip=0;reserve=0;reloadT=0;bullets=[];robbed={};
  pcar=mkCar(250,13,0,'#EF9F27','pc');
  cars=[pcar];cops=[];peds=[];money=[];floats=[];
  for(let i=0;i<8;i++)money.push(newMoney());
  for(let i=0;i<24;i++)spawnPed();
  for(let i=0;i<9;i++)spawnTraffic();
  cam.x=pcar.x;cam.y=pcar.y;cam.rot=-Math.PI/2;
  hud();setHint();
}
function updateCam(){
  if(area!=='city')return; // interior camera is fixed, set on enter
  const pp=ppos();
  let tx=pp.x,ty=pp.y,tr=cam.rot;
  if(mode==='drive'){tx+=Math.cos(pcar.a)*42;ty+=Math.sin(pcar.a)*42;tr=-Math.PI/2-pcar.a;}
  cam.x+=(tx-cam.x)*0.085;cam.y+=(ty-cam.y)*0.085;
  cam.rot+=awrap(tr-cam.rot)*0.075;
}
function tick(){
  frame++;
  if(state==='play')step();
  press={};
  updateCam();
  render();
  requestAnimationFrame(tick);
}
btnS.addEventListener('click',()=>{
  if(state==='idle'||state==='win')reset();
  else if(state==='busted')respawnBust();
  state='play';ovl.style.display='none';
});
btnN.addEventListener('click',()=>{if(typeof sendPrompt==='function')sendPrompt('create gta8');});
reset();
state='idle';
tick();
