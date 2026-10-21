import assert from 'node:assert/strict';
import {sliceProfile,scoreProfile} from './geometry.mjs';
// Four vertical walls of a 2×2 box. Horizontal rays must hit x/z = ±1.
const positions=[],triangles=[];
for(const [a,b] of [[[1,1],[-1,1]],[[-1,1],[-1,-1]],[[-1,-1],[1,-1]],[[1,-1],[1,1]]]){
  const n=positions.length/3;positions.push(a[0],0,a[1],b[0],0,b[1],a[0],2,a[1],b[0],2,b[1]);triangles.push(n,n+1,n+2,n+2,n+1,n+3);
}
const p=sliceProfile(positions,triangles,1);
assert.ok(Math.abs(p[0]-1)<1e-6);assert.ok(Math.abs(p[8]-Math.SQRT2)<1e-6);
assert.ok(p.every(x=>x>=1-1e-6&&x<=Math.SQRT2+1e-6));
assert.ok(sliceProfile(positions,triangles,3).every(x=>x===0));
assert.equal(scoreProfile(p,Math.SQRT2,1).length,32);
assert.ok(scoreProfile(p,Math.SQRT2,1).some(x=>x&&x.midi>=60));
assert.ok(scoreProfile(new Float32Array(64),1,0).every(x=>x===null));
console.log('Mechanical check passed: actual mesh cross-sections → deterministic score, holes → rests.');
