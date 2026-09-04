// interiors.js — enterable buildings: room layouts, enter/exit, what you can do inside
const ROOMW=420,ROOMH=300;
const ROOMS={
  shop:{floor:'#43314a',name:'МИНИМАРКЕТ «УДАЧА»',clerkCol:'#b08c5f',furn:[
    {x:40,y:130,w:110,h:16},{x:270,y:130,w:110,h:16},
    {x:40,y:200,w:110,h:16},{x:270,y:200,w:110,h:16}
  ]},
  gun:{floor:'#383832',name:'ОРУЖЕЙНЫЙ «КАЛИБР»',clerkCol:'#7f8da0',furn:[
    {x:40,y:140,w:95,h:16},{x:285,y:140,w:95,h:16},
    {x:40,y:220,w:120,h:14},{x:260,y:220,w:120,h:14}
  ]},
  police:{floor:'#2f3a44',name:'ПОЛИЦЕЙСКИЙ УЧАСТОК',clerkCol:'#5a8ec2',furn:[
    {x:40,y:150,w:100,h:14},{x:280,y:150,w:100,h:14},
    {x:300,y:20,w:80,h:46}
  ]}
};
const COUNTER={x:ROOMW/2-70,y:64,w:140,h:18};
const CLERK={x:ROOMW/2,y:52};
const WALLS=[
  {x:-12,y:-12,w:ROOMW+24,h:12},
  {x:-12,y:0,w:12,h:ROOMH+12},
  {x:ROOMW,y:0,w:12,h:ROOMH+12},
  {x:-12,y:ROOMH,w:ROOMW/2-6,h:12},          // door gap in the middle of the south wall
  {x:ROOMW/2+18,y:ROOMH,w:ROOMW/2-6,h:12}
];
function hitRoom(x,y,r){
  const rects=WALLS.concat([COUNTER],ROOMS[interior.type].furn);
  for(const rc of rects){
    const nx=Math.max(rc.x,Math.min(x,rc.x+rc.w)),ny=Math.max(rc.y,Math.min(y,rc.y+rc.h));
    if((x-nx)*(x-nx)+(y-ny)*(y-ny)<r*r)return true;
  }
  return false;
}
function enterInterior(b){
  area=b.special;floats=[];
  interior={type:b.special,cell:b.i+','+b.j,ret:{x:b.door.x,y:b.door.y+10}};
  player.x=ROOMW/2;player.y=ROOMH-24;player.fa=-Math.PI/2;
  cam.x=ROOMW/2;cam.y=ROOMH/2+14;cam.rot=0;
}
function exitInterior(){
  player.x=interior.ret.x;player.y=interior.ret.y;
  area='city';interior=null;floats=[];
  invuln=Math.max(invuln,50); // don't get busted by a cop camping the door
  cam.x=player.x;cam.y=player.y;cam.rot=-Math.PI/2;
  setHint();
}
function stepInterior(){
  let ix=(key('d','arrowright','в')?1:0)-(key('a','arrowleft','ф')?1:0);
  let iy=(key('s','arrowdown','ы')?1:0)-(key('w','arrowup','ц')?1:0);
  if(ix||iy){
    const il=Math.hypot(ix,iy);ix/=il;iy/=il;
    const nx=player.x+ix*1.5,ny=player.y+iy*1.5;
    if(!hitRoom(nx,ny,4)){player.x=nx;player.y=ny;player.fa=Math.atan2(iy,ix);}
  }
  if(player.y>ROOMH-6&&Math.abs(player.x-ROOMW/2)<17){exitInterior();return;}
  const st=Math.floor(heat);
  let h='Выход — дверь внизу';
  if(Math.hypot(player.x-CLERK.x,player.y-CLERK.y)<55){
    if(interior.type==='shop'){
      if(frame<(robbed[interior.cell]||0))h='Касса пуста — зайди позже';
      else{
        h='F — ограбить кассу';
        if(prs('f','а')){
          const take=150+((rand()*250)|0);
          cash+=take;robbed[interior.cell]=frame+5400;crime(2);
          floater(player.x,player.y,'+$'+take);shake=6;hud();
          if(cash>=GOAL){win();return;}
        }
      }
    }else if(interior.type==='gun'){
      h=(gun?'Пистолет уже куплен':'1 — Пистолет — $400')+'<br>2 — Патроны ×12 — $50';
      if(prs('1')&&!gun){
        if(cash>=400){
          cash-=400;gun=true;clip=8;reserve=16;hud();
          floater(player.x,player.y,'Пистолет!','#F1EFE8');
        }else floater(player.x,player.y,'Не хватает денег','#F1EFE8');
      }
      if(prs('2')){
        if(reserve>=96)floater(player.x,player.y,'Карманы полны','#F1EFE8');
        else if(cash>=50){
          cash-=50;reserve=Math.min(96,reserve+12);hud();
          floater(player.x,player.y,'+12 патронов');
        }else floater(player.x,player.y,'Не хватает денег','#F1EFE8');
      }
    }else{ // police
      if(st>0){
        const cost=300*st;
        h='1 — Взятка $'+cost+' — снять розыск';
        if(prs('1')){
          if(cash>=cost){
            cash-=cost;heat=0;cops.length=0;bustT=0;hud();
            floater(player.x,player.y,'Розыск снят');
          }else floater(player.x,player.y,'Не хватает денег','#F1EFE8');
        }
      }else h='Розыска нет. Веди себя хорошо';
    }
  }
  hintSet(h);
}
