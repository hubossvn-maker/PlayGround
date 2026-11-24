const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const hudHeight=document.querySelector('#height b'),message=document.getElementById('message');
let W,H,dpr;
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();

const keys={},touch={left:false,right:false,jump:false};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if([' ','arrowup','arrowleft','arrowright'].includes(e.key.toLower) )e.preventDefault()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function bind(id,key){const el=document.getElementById(id);for(const ev of ['pointerdown','pointerenter'])el.addEventListener(ev,e=>{if(ev==='pointerdown')el.setPointerCapture?.(e.pointerId);touch[key]=true});for(const ev of ['pointerup','pointercancel','pointerleave'])el.addEventListener(ev,()=>touch[key]=false)}bind('touchLeft','left');bind('touchRight','right');bind('touchJump','jump');

let started=false,paused=false,sound=true,last=0,camY=0,shake=0,elapsed=0;
const player={x:0,y:0,vx:0,vy:0,w:18,h:38,on:false,face:1,run:0,coins:0,death:false};
const platforms=[];const coins=[];const motes=[];
for(let i=0;i<62;i++){
  const y=-i*72;
  let w=210-Math.min(i*2,70); let x;
  if(i===0)x=-w/2+20;
  else if(i===61)x=-55;
  else x=Math.sin(i*1.73)*210;
  // alternating, reachable ledges
  platforms.push({x:x-w/2,y:y,w,h:18,moving:i>18&&i%7===0,phase:i*.8,sx:x-w/2});
  if(i>1&&i%4===0)coins.push({x:x,y:y-26,got:false,spin:i});
}
for(let i=0;i<55;i++)motes.push({x:Math.random(),y:Math.random(),r:Math.random()*1.5+.3,s:Math.random()*.4+.1});

function reset(){player.x=-60;player.y=-16;player.vx=0;player.vy=0;player.coins=0;player.death=false;coins.forEach(c=>c.got=false);camY=0;started=true;paused=false}
document.getElementById('startBtn').onclick=()=>{reset();document.getElementById('startScreen').classList.add('hidden')};
document.getElementById('pauseBtn').onclick=togglePause;document.getElementById('resumeBtn').onclick=togglePause;
function togglePause(){if(!started)return;paused=!paused;document.getElementById('pauseScreen').classList.toggle('hidden',!paused)}
document.getElementById('soundBtn').onclick=e=>{sound=!sound;e.currentTarget.textContent=sound?'♪':'×'};

function beep(freq,dur){if(!sound)return;try{const ac=new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.025,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+dur);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+dur)}catch(e){}}

function update(dt){
  if(!started||paused)return;elapsed+=dt;
  const left=keys.a||keys.arrowleft||touch.left,right=keys.d||keys.arrowright||touch.right,jump=keys.w||keys.arrowup||keys[' ']||touch.jump;
  const accel=850;
  if(left){player.vx-=accel*dt;player.face=-1} if(right){player.vx+=accel*dt;player.face=1}
  player.vx*=Math.pow(.002,dt);player.vx=Math.max(-230,Math.min(230,player.vx));
  if(jump&&player.on){player.vy=-520;player.on=false;beep(180,.12)}
  player.vy+=1250*dt;
  player.x+=player.vx*dt;player.y+=player.vy*dt;
  player.x=Math.max(-330,Math.min(330,player.x));
  player.on=false;
  platforms.forEach(p=>{if(p.moving)p.x=p.sx+Math.sin(elapsed*p.phase*.12)*45; const px=p.x,py=p.y;
    if(player.vy>=0&&player.x+player.w*.45>px&&player.x-player.w*.45<px+p.w&&player.y+player.h/2>=py&&player.y+player.h/2<=py+p.h+22&&player.y-player.h/2<py){player.y=py-player.h/2;player.vy=0;player.on=true}
  });
  coins.forEach(c=>{if(!c.got&&Math.hypot(player.x-c.x,(player.y-c.y))<34){c.got=true;player.coins++;beep(520+c.spin*10,.1)}});
  const bottomLimit=camY+H*.68;
  if(player.y>bottomLimit+120){player.death=true;shake=12;beep(80,.35);setTimeout(()=>{if(player.death){reset();camY=0}},700)}
  const target=-player.y-H*.34;if(target<camY)camY+=(target-camY)*Math.min(1,dt*3);
  camY=Math.min(camY,0);camY=Math.max(camY,-4000);
  if(shake>0)shake*=.88;
  if(player.y<-4350){started=false;showWin()}
  const depth=Math.max(0,Math.round(-player.y/10));hudHeight.textContent=depth+' m';
}
function showWin(){document.getElementById('objective').innerHTML='<span>ESCAPED</span><b>Temple reached</b>';document.getElementById('message').innerHTML='Surface restored · '+player.coins+' relics recovered';document.getElementById('message').classList.remove('hidden')}

function projectY(y){return H*.62+(y-camY)}
function draw(){
  ctx.clearRect(0,0,W,H);
  const g=ctx.createRadialGradient(W*.5,H*.45,20,W*.5,H*.45,Math.max(W,H)*.7);g.addColorStop(0,'#183c3b');g.addColorStop(.55,'#0a2022');g.addColorStop(1,'#03090a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.save();if(shake>0)ctx.translate((Math.random-.5)*shake,(Math.random-.5)*shake);
  // distant shafts and columns
  const cy=projectY(0);ctx.strokeStyle='rgba(13,48,48,.45)';ctx.lineWidth=1;
  for(let i=-4;i<=4;i++){const x=W/2+i*82;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(W/2+i*35,H);ctx.stroke()}
  motes.forEach(m=>{const py=(m.y*H+elapsed*5*m.s)%H,px=m.x*W;ctx.fillStyle='rgba(177,205,173,.18)';ctx.beginPath();ctx.arc(px,py,m.r,0,Math.PI*2);ctx.fill()});
  // temple walls
  ctx.fillStyle='#0b1718';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W*.27,0);ctx.lineTo(W*.34,H);ctx.lineTo(0,H);ctx.fill();ctx.beginPath();ctx.moveTo(W,0);ctx.lineTo(W*.73,0);ctx.lineTo(W*.66,H);ctx.lineTo(W,H);ctx.fill();
  ctx.fillStyle='rgba(4,12,13,.75)';ctx.fillRect(W*.26,0,W*.48,H);
  // carved wall arches
  ctx.strokeStyle='rgba(82,119,105,.16)';ctx.lineWidth=14;
  for(let y=projectY(-400);y<H+200;y+=190){ctx.beginPath();ctx.moveTo(W*.31,y);ctx.quadraticCurveTo(W*.5,y-90,W*.69,y);ctx.stroke()}
  // top glow
  const glowY=projectY(-4350);if(glowY>-200&&glowY<H){const rg=ctx.createRadialGradient(W/2,glowY,10,W/2,glowY,180);rg.addColorStop(0,'rgba(226,213,145,.8)');rg.addColorStop(.15,'rgba(226,213,145,.25)');rg.addColorStop(1,'transparent');ctx.fillStyle=rg;ctx.fillRect(0,glowY-180,W,360)}
  // platforms
  platforms.forEach(p=>{const sy=projectY(p.y);if(sy<-80||sy>H+100)return;const cx=W/2+p.x,ww=p.w;
    ctx.fillStyle='#18302d';ctx.beginPath();ctx.moveTo(cx,sy);ctx.lineTo(cx+ww,sy);ctx.lineTo(cx+ww+22,sy+12);ctx.lineTo(cx+12,sy+12);ctx.closePath();ctx.fill();
    ctx.fillStyle='#2c4841';ctx.fillRect(cx,sy-7,ww,10);ctx.strokeStyle='rgba(201,177,111,.22)';ctx.strokeRect(cx,sy-7,ww,10);
    ctx.fillStyle='#102321';ctx.beginPath();ctx.moveTo(cx+12,sy+12);ctx.lineTo(cx+ww+22,sy+12);ctx.lineTo(cx+ww+14,sy+20);ctx.lineTo(cx+8,sy+20);ctx.closePath();ctx.fill();
  });
  // coins
  coins.forEach(c=>{if(c.got)return;const sy=projectY(c.y);if(sy<-30||sy>H+30)return;const cx=W/2+c.x,s=4+Math.abs(Math.sin(elapsed*3+c.spin))*5;ctx.save();ctx.translate(cx,sy);ctx.scale(.45+s/12,1);ctx.fillStyle='#d7b66b';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f1dfa5';ctx.stroke();ctx.restore()});
  // player
  const px=W/2+player.x,py=projectY(player.y);
  ctx.save();ctx.translate(px,py);ctx.scale(player.face,1);
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,player.h/2+8,21,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#b6a889';ctx.fillRect(-10,-19,20,25);ctx.fillStyle='#c8a66b';ctx.fillRect(-12,-16,24,8);
  ctx.fillStyle='#c5b89a';ctx.fillRect(-7,-30,14,13);ctx.fillStyle='#172523';ctx.fillRect(-8,-31,16,5);
  ctx.strokeStyle='#b7aa8c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-7,7);ctx.lineTo(-12,19);ctx.moveTo(7,7);ctx.lineTo(12,19);ctx.stroke();
  ctx.fillStyle='#d8c99f';ctx.fillRect(-15,-13,5,19);ctx.restore();
  ctx.restore();
}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
