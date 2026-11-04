import * as THREE from 'three';
import {RELATIONSHIP_STYLES} from './relationships.js';

// The same perspective camera and OrbitControls drive this CPU renderer.
// It keeps the actual 3D map usable on browsers without a WebGL context.
export class CanvasFieldRenderer {
  constructor({getField}){this.domElement=document.createElement('canvas');this.ctx=this.domElement.getContext('2d');if(!this.ctx)throw Error('No canvas context');this.ratio=1;this.width=1;this.height=1;this.getField=getField;this.p=new THREE.Vector3();this.colors=new Map();}
  setPixelRatio(ratio){this.ratio=ratio;}
  getPixelRatio(){return this.ratio;}
  setSize(width,height){this.width=width;this.height=height;this.domElement.width=Math.round(width*this.ratio);this.domElement.height=Math.round(height*this.ratio);this.domElement.style.width=width+'px';this.domElement.style.height=height+'px';}
  project(v,camera){this.p.copy(v).project(camera);return{x:(this.p.x*.5+.5)*this.width,y:(-this.p.y*.5+.5)*this.height,z:this.p.z};}
  rgb(hex){if(!this.colors.has(hex)){const color=new THREE.Color(hex).getHexString(THREE.SRGBColorSpace);this.colors.set(hex,`${parseInt(color.slice(0,2),16)},${parseInt(color.slice(2,4),16)},${parseInt(color.slice(4,6),16)}`);}return this.colors.get(hex);}
  render(scene,camera){
    const field=this.getField(),{state,positions,edges,starfield,orbitLines,layoutGuides,domeGuides=[],core,groupMap,repoTint,repoGlow,nodeActive}=field;if(!positions.length)return;
    const c=this.ctx,w=this.width,h=this.height;camera.updateMatrixWorld();scene.updateMatrixWorld();c.setTransform(this.ratio,0,0,this.ratio,0,0);c.clearRect(0,0,w,h);c.fillStyle=state.theme==='lattice'?'#15101c':'#060d1f';c.fillRect(0,0,w,h);
    const vault=c.createRadialGradient(w*.5,h*.38,Math.min(w,h)*.06,w*.5,h*.46,Math.max(w,h)*.78);
    vault.addColorStop(0,state.theme==='lattice'?'rgba(119,78,116,.19)':'rgba(63,111,182,.2)');
    vault.addColorStop(.55,state.theme==='lattice'?'rgba(60,47,83,.13)':'rgba(38,63,117,.1)');
    vault.addColorStop(1,'rgba(6,10,25,0)');c.fillStyle=vault;c.fillRect(0,0,w,h);
    const dust=starfield.geometry.attributes.position.array;
    for(let i=0;i<dust.length;i+=3){const p=this.project(new THREE.Vector3(dust[i],dust[i+1],dust[i+2]),camera);if(p.z<0||p.z>1||p.x<0||p.x>w||p.y<0||p.y>h)continue;c.fillStyle=`rgba(162,194,243,${.12+(i%7)*.025})`;c.fillRect(p.x,p.y,i%11===0?1.2:.7,i%11===0?1.2:.7);}
    for(const line of [...domeGuides,...orbitLines,...layoutGuides]){if(!line.visible)continue;const values=line.geometry.attributes.position.array,segments=line.isLineSegments;c.beginPath();let started=false;for(let i=0;i<values.length;i+=3){const point=new THREE.Vector3(values[i],values[i+1],values[i+2]).applyMatrix4(line.matrixWorld),p=this.project(point,camera);if(p.z>1||p.z<0){started=false;continue;}if(!started||(segments&&i%6===0)){c.moveTo(p.x,p.y);started=true;}else c.lineTo(p.x,p.y);}c.strokeStyle=`rgba(${this.rgb('#'+line.material.color.getHexString())},${line.material.opacity})`;c.lineWidth=.7;c.stroke();}
    const nodes=positions.map((p,i)=>{const screen=this.project(p,camera),distance=p.distanceTo(camera.position),scale=h/(2*Math.tan(camera.fov*Math.PI/360))/Math.max(1,distance),repo=state.repos[i];return{...screen,scale,r:Math.max(1.3,repo.radius*scale),repo,i};}).filter(p=>p.z>0&&p.z<1).sort((a,b)=>b.z-a.z);
    const byIndex=new Map(nodes.map(n=>[n.i,n]));
    if(state.links)for(const [ai,bi,status]of edges){const a=byIndex.get(ai),b=byIndex.get(bi);if(!a||!b)continue;const visible=nodeActive(a.repo.id)&&nodeActive(b.repo.id),selected=a.repo.id===state.selected||b.repo.id===state.selected,timeline=state.layout==='helix'||state.layout==='spiral',color=state.architecture?RELATIONSHIP_STYLES[status].color:timeline?'#dfb86d':repoTint(a.repo);c.strokeStyle=`rgba(${this.rgb(color)},${visible?(selected?.75:state.architecture?.5:timeline?.22:.17):.008})`;c.lineWidth=selected?1.1:state.architecture?.9:.6;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
    const center=this.project(new THREE.Vector3(),camera),centerScale=h/(2*Math.tan(camera.fov*Math.PI/360))/camera.position.length();
    if(center.z<1){const r=Math.min(120,centerScale*8),g=c.createRadialGradient(center.x,center.y,0,center.x,center.y,r),gold=state.theme==='lattice';g.addColorStop(0,gold?'rgba(224,177,90,.2)':'rgba(154,210,248,.17)');g.addColorStop(.24,gold?'rgba(224,177,90,.07)':'rgba(110,175,231,.06)');g.addColorStop(1,'rgba(110,175,231,0)');c.fillStyle=g;c.fillRect(center.x-r,center.y-r,r*2,r*2);c.fillStyle=gold?'#f1cf8e':'#d5f0ff';c.beginPath();c.arc(center.x,center.y,Math.max(3,centerScale*.8),0,Math.PI*2);c.fill();
      for(let j=0;j<4;j++){c.beginPath();for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,v=new THREE.Vector3(Math.cos(a)*2.2,Math.sin(a)*2.2*Math.cos(j*.7),Math.sin(a)*2.2*Math.sin(j*.7)).applyMatrix4(core.matrixWorld),p=this.project(v,camera);if(i===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);}c.strokeStyle='rgba(174,211,249,.3)';c.lineWidth=.6;c.stroke();}
    }
    if(state.layout==='solar')for(const group of groupMap.values()){
      if(!state.repos.some(repo=>repo.group===group.id&&state.visible.has(repo.id)))continue;
      const center=this.project(new THREE.Vector3(...group.center),camera);
      if(center.z<=0||center.z>=1)continue;
      const scale=h/(2*Math.tan(camera.fov*Math.PI/360))/Math.max(1,camera.position.distanceTo(new THREE.Vector3(...group.center)));
      const radius=Math.max(3.5,scale*1.1),halo=radius*6.5;
      const g=c.createRadialGradient(center.x,center.y,0,center.x,center.y,halo);
      const color=this.rgb(group.color);
      g.addColorStop(0,`rgba(${color},.44)`);g.addColorStop(.22,`rgba(${color},.13)`);g.addColorStop(1,`rgba(${color},0)`);
      c.fillStyle=g;c.fillRect(center.x-halo,center.y-halo,halo*2,halo*2);
      c.beginPath();c.arc(center.x,center.y,radius,0,Math.PI*2);c.fillStyle=group.color;c.fill();
    }
    for(const node of nodes){const {x,y,r,repo}=node;if(x<-40||x>w+40||y<-40||y>h+40)continue;const visible=nodeActive(repo.id),selected=repo.id===state.selected,hovered=repo.id===state.hovered,color=this.rgb(repoTint(repo)),strength=repoGlow(repo),radius=Math.min(13,r)*(visible?(selected?1.35:hovered?1.2:1):.45);if(visible){const glowRadius=Math.max(8,radius*(selected||hovered?7:5)),g=c.createRadialGradient(x,y,0,x,y,glowRadius);g.addColorStop(0,`rgba(${color},${.42*strength})`);g.addColorStop(.16,`rgba(${color},${.15*strength})`);g.addColorStop(.45,`rgba(${color},${.035*strength})`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(x-glowRadius,y-glowRadius,glowRadius*2,glowRadius*2);}
      c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fillStyle=`rgba(${color},${visible?.96*strength:.06})`;c.fill();if(visible){c.beginPath();c.arc(x-radius*.18,y-radius*.18,Math.max(.55,radius*.42),0,Math.PI*2);c.fillStyle='rgba(242,249,228,.85)';c.fill();}if(selected||hovered){c.beginPath();c.arc(x,y,radius+5,0,Math.PI*2);c.strokeStyle=`rgba(${color},.7)`;c.lineWidth=.8;c.stroke();}
    }
  }
}
