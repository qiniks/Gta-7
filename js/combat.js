// combat.js — punching, the pistol and its bullets
function doAttack(){
  if(gun&&clip>0&&reloadT===0){
    clip--;
    const a=player.fa;
    bullets.push({x:player.x+Math.cos(a)*7,y:player.y+Math.sin(a)*7,vx:Math.cos(a)*8,vy:Math.sin(a)*8,life:55});
    scarePeds(player.x,player.y,110);
    shake=Math.max(shake,2);hud();
  }else if(gun&&reserve>0){
    if(reloadT===0)reloadT=36;
  }else{
    // bare fists: short arc in front of the player
    let hit=null;
    for(const pd of peds){
      const dx=pd.x-player.x,dy=pd.y-player.y;
      if(Math.hypot(dx,dy)<16&&Math.cos(Math.atan2(dy,dx)-player.fa)>0.2){hit=pd;break;}
    }
    if(hit){killPed(hit,20,1);scarePeds(player.x,player.y,70);}
    else shake=Math.max(shake,1.5);
  }
}
function stepGun(){
  if(reloadT>0){
    reloadT--;
    if(reloadT===0){
      const n=Math.min(8,reserve);
      clip=n;reserve-=n;hud();
      floater(player.x,player.y,'Перезарядка','#F1EFE8');
    }
  }else if(gun&&clip===0&&reserve>0)reloadT=36;
}
function stepBullets(){
  for(let i=bullets.length-1;i>=0;i--){
    const bl=bullets[i];let dead=false;
    for(let s=0;s<3&&!dead;s++){
      bl.x+=bl.vx/3;bl.y+=bl.vy/3;
      if(hitBuilding(bl.x,bl.y,1)){dead=true;break;}
      for(const pd of peds){
        if(Math.hypot(pd.x-bl.x,pd.y-bl.y)<6){killPed(pd,40,2);dead=true;break;}
      }
      if(dead)break;
      for(let ci=cops.length-1;ci>=0;ci--){
        const c=cops[ci];
        if(Math.hypot(c.x-bl.x,c.y-bl.y)<11){
          c.hp--;c.flash=6;dead=true;
          if(c.hp<=0){
            cops.splice(ci,1);crime(1); // taking out a patrol escalates the manhunt
            floater(c.x,c.y,'Патруль выбит','#F1EFE8');shake=Math.max(shake,5);
          }
          break;
        }
      }
      if(dead)break;
      for(const c of cars){
        if(Math.hypot(c.x-bl.x,c.y-bl.y)<11){dead=true;break;}
      }
    }
    if(--bl.life<=0)dead=true;
    if(dead)bullets.splice(i,1);
  }
}
