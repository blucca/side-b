// A horizontal plane cuts the mesh into segments. Rays read the outer contour.
// This is a musical mapping, not a simulation of material acoustics.
export function sliceProfile(positions, indices, height, bins = 64) {
  const segments = [];
  const count = indices ? indices.length : positions.length / 3;
  for (let i = 0; i < count; i += 3) {
    const points = [0, 1, 2].map(k => {
      const j = (indices ? indices[i + k] : i + k) * 3;
      return [positions[j], positions[j + 1], positions[j + 2]];
    });
    const hits = [];
    for (let k = 0; k < 3; k++) {
      const a = points[k], b = points[(k + 1) % 3];
      if ((a[1] <= height && b[1] > height) || (b[1] <= height && a[1] > height)) {
        const t = (height - a[1]) / (b[1] - a[1]);
        hits.push([a[0] + t * (b[0] - a[0]), a[2] + t * (b[2] - a[2])]);
      }
    }
    if (hits.length === 2) segments.push(hits);
  }
  const profile = new Float32Array(bins);
  for (let i = 0; i < bins; i++) {
    const angle = i / bins * Math.PI * 2, dx = Math.cos(angle), dz = Math.sin(angle);
    for (const [a, b] of segments) {
      const vx = b[0] - a[0], vz = b[1] - a[1], det = dx * vz - dz * vx;
      if (Math.abs(det) < 1e-9) continue;
      const t = (a[0] * vz - a[1] * vx) / det;
      const u = (a[0] * dz - a[1] * dx) / det;
      if (t >= 0 && u >= -1e-6 && u <= 1 + 1e-6) profile[i] = Math.max(profile[i], t);
    }
  }
  return profile;
}

const pentatonic = [0, 2, 4, 7, 9];
export function scoreProfile(profile, radius, track) {
  return Array.from({ length: 32 }, (_, step) => {
    const i = step * 2, r = profile[i] / radius;
    const previous = profile[(i + 62) % 64] / radius;
    if (r < .015 || (step % 4 && Math.abs(r - previous) < .055)) return null;
    const degree = Math.min(9, Math.floor(r * 10));
    return {
      midi: [36, 60, 72][track] + pentatonic[degree % 5] + Math.floor(degree / 5) * 12,
      strength: .5 + r * .5,
    };
  });
}
