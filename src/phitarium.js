/**
 * FieldConstellation's public-data planetarium installation.
 * Decorative dome paths, and a short read-only planetarium show. Neither
 * feature invents integration edges, alters the repo catalog, or awards XP.
 */

export const SHOWTIME_NAMES=Object.freeze([
  'FieldConstellation','FieldAtlas','PhiOS','PhiServe','BTM','GenEWrist'
]);
export const SHOWTIME_INTERVAL_MS=8000;

/** Public-only, canonical, stable-order show. No private or deleted stars. */
export function resolveShowtimeStops(repos){
  const publicByName=new Map(repos.filter(repo=>repo.visibility==='public')
    .map(repo=>[repo.name.toLowerCase(),repo]));
  return SHOWTIME_NAMES.map(name=>publicByName.get(name.toLowerCase()))
    .filter(Boolean);
}

/** Finite, deterministic half-sphere meridians and parallel rings (xyz pairs).
 * Radius is well outside the repository constellation, in world coordinates.
 * The result is all line *segments*, so both WebGL and Canvas renderers can
 * project the same planetarium geometry without a shader dependency.
 */
export function domeLinePositions({radius=190,baseY=-50,meridians=12,steps=48}={}){
  if(!Number.isFinite(radius)||radius<10||radius>500||
     !Number.isFinite(baseY)||Math.abs(baseY)>500||
     !Number.isInteger(meridians)||meridians<4||meridians>36||
     !Number.isInteger(steps)||steps<8||steps>100)throw new RangeError('Invalid dome geometry bounds');
  const vertices=[];
  const put=(a,b)=>vertices.push(...a,...b);
  const point=(az,elevation)=>[
    radius*Math.cos(elevation)*Math.cos(az),
    baseY+radius*Math.sin(elevation),
    radius*Math.cos(elevation)*Math.sin(az)
  ];
  // Twelve fine longitude arcs pass through the zenith.
  for(let m=0;m<meridians;m++){
    const az=m/meridians*2*Math.PI;
    for(let i=1;i<=steps;i++){
      const e0=(i-1)/steps*Math.PI/2,e1=i/steps*Math.PI/2;
      put(point(az,e0),point(az,e1));
    }
  }
  // Graduated altitude circles project the hemispherical theater ceiling.
  for(const degrees of [0,15,30,45,60,75]){
    const elevation=degrees*Math.PI/180,segments=steps*meridians;
    for(let i=0;i<segments;i++){
      const az=i/segments*2*Math.PI,az1=(i+1)/segments*2*Math.PI;
      put(point(az,elevation),point(az1,elevation));
    }
  }
  return vertices;
}

/** A subtle non-pickable drawing behind real project stars. */
export function installDome(THREE,scene){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(domeLinePositions(),3));
  const material=new THREE.LineBasicMaterial({
    color:'#7c92c6',transparent:true,opacity:.13,depthWrite:false,
    depthTest:false,fog:false
  });
  const guide=new THREE.LineSegments(geometry,material);
  guide.frustumCulled=false;
  guide.renderOrder=-50;
  guide.userData.phitarium=true;
  scene.add(guide);
  return {
    guides:[guide],
    setPalette(gold){material.color.set(gold?'#bda071':'#7c92c6');material.opacity=gold?.16:.13;},
    dispose(){scene.remove(guide);geometry.dispose();material.dispose();}
  };
}
