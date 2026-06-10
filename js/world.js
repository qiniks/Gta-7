// world.js — chunk-based generative city: blocks created on demand from hash2, cached
const blockCache=new Map();
const SPECIALS=['shop','gun','police'];
const SPEC_DEF={
  shop:{sign:'МАГАЗИН',col:'#97C459',pal:['#6e6557','#5a5347','#474138']},
  gun:{sign:'ОРУЖИЕ',col:'#EF9F27',pal:['#7d5a4c','#684a3e','#523a30']},
  police:{sign:'ПОЛИЦИЯ',col:'#6FB3FF',pal:['#5d6b78','#4c5864','#3d4751']}
};
// each SCxSC super-chunk hash-places one cell per special type (earlier type wins a collision)
function specialAt(i,j){
  const si=Math.floor(i/SC),sj=Math.floor(j/SC);
  for(let t=0;t<3;t++){
    const ci=si*SC+((hash2(si,sj,100+t*7)*SC)|0);
    const cj=sj*SC+((hash2(si,sj,200+t*7)*SC)|0);
    if(ci===i&&cj===j)return SPECIALS[t];
  }
  return null;
}
function getBlock(i,j){
  const k=i+','+j;
  let b=blockCache.get(k);
  if(b)return b;
  if(blockCache.size>1200)blockCache.clear(); // regeneration is deterministic, eviction is free
  const x0=i*P+RH,y0=j*P+RH,sz=P-2*RH;
  b={i,j,x0,y0,sz};
  const sp=specialAt(i,j);
  if(sp){
    const d=SPEC_DEF[sp];
    b.special=sp;b.pal=d.pal;b.hgt=34;
    b.bw=sz-2*SW;b.bh=64;b.bx=x0+SW;b.by=y0+SW;
    b.door={x:b.bx+b.bw/2,y:b.by+b.bh+5};
  }else if(hash2(i,j,1)<0.13){
    b.park=true;b.trees=[];
    const n=2+((hash2(i,j,2)*2)|0);
    for(let t=0;t<n;t++)b.trees.push({
      x:x0+16+hash2(i,j,30+t*3)*(sz-32),
      y:y0+16+hash2(i,j,31+t*3)*(sz-32),
      r:7+hash2(i,j,32+t*3)*4
    });
  }else{
    const bw=sz-2*SW-hash2(i,j,6)*22,bh=sz-2*SW-hash2(i,j,7)*22;
    b.bx=x0+(sz-bw)/2;b.by=y0+(sz-bh)/2;b.bw=bw;b.bh=bh;
    b.hgt=26+hash2(i,j,8)*70;b.pal=PALS[(hash2(i,j,9)*PALS.length)|0];
  }
  blockCache.set(k,b);
  return b;
}
function hitBuilding(x,y,r){
  const gi=Math.floor((x-RH)/P),gj=Math.floor((y-RH)/P);
  for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){
    const b=getBlock(gi+di,gj+dj);
    if(b.park){
      for(const t of b.trees)if(Math.hypot(x-t.x,y-t.y)<r+3)return true;
      continue;
    }
    const nx=Math.max(b.bx,Math.min(x,b.bx+b.bw)),ny=Math.max(b.by,Math.min(y,b.by+b.bh));
    if((x-nx)*(x-nx)+(y-ny)*(y-ny)<r*r)return true;
  }
  return false;
}
// special-building door near a point (for entering on foot)
function doorAt(x,y){
  const gi=Math.floor((x-RH)/P),gj=Math.floor((y-RH)/P);
  for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){
    const b=getBlock(gi+di,gj+dj);
    if(b.special&&Math.hypot(x-b.door.x,y-b.door.y)<16)return b;
  }
  return null;
}
// nearest police station door, derived from super-chunk hashes (salts must match specialAt t=2)
function nearestPolice(x,y){
  const si0=Math.floor(Math.round(x/P)/SC),sj0=Math.floor(Math.round(y/P)/SC);
  let best=null,bd=1e9;
  for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++){
    const si=si0+a,sj=sj0+c;
    const pi=si*SC+((hash2(si,sj,114)*SC)|0),pj=sj*SC+((hash2(si,sj,214)*SC)|0);
    const b=getBlock(pi,pj);
    if(b.special!=='police')continue; // lost the cell to a colliding shop/gun shop
    const d=Math.hypot(b.door.x-x,b.door.y-y);
    if(d<bd){bd=d;best=b;}
  }
  return best;
}
