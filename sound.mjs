export function strike(context, bus, note, when, track) {
  const frequency = 440 * 2 ** ((note.midi - 69) / 12);
  const duration = [.48, .72, .42][track];
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0, when);
  envelope.gain.linearRampToValueAtTime([.20, .15, .08][track] * note.strength, when + .006);
  envelope.gain.exponentialRampToValueAtTime(.0001, when + duration);
  envelope.connect(bus);
  for (const [multiple, level] of [[1, 1], [2, .22], [3, .055]]) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency * multiple;
    gain.gain.value = level;
    oscillator.connect(gain).connect(envelope);
    oscillator.start(when); oscillator.stop(when + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  setTimeout(() => envelope.disconnect(), Math.max(0, (when + duration + .1 - context.currentTime) * 1000));
}

export class TurntableSound {
  constructor(score, onStep) { this.score = score; this.onStep = onStep; this.bpm = 120; this.playing = false; }
  async start() {
    if (!this.context) {
      this.context = new AudioContext();
      this.bus = this.context.createGain(); this.bus.gain.value = .6;
      const limiter = this.context.createDynamicsCompressor();
      limiter.threshold.value = -15; limiter.ratio.value = 4;
      this.bus.connect(limiter).connect(this.context.destination);
    }
    await this.context.resume();
    this.playing = true; this.step = 0; this.next = this.context.currentTime + .06;
    this.epoch = this.next;
    this.timer = setInterval(() => this.schedule(), 20); this.schedule();
  }
  schedule() {
    while (this.playing && this.next < this.context.currentTime + .09) {
      const step = this.step % 32;
      this.score().forEach((track, i) => { if (track[step]) strike(this.context, this.bus, track[step], this.next, i); });
      const delay = Math.max(0, (this.next - this.context.currentTime) * 1000);
      const generation = this.epoch;
      setTimeout(() => { if (this.playing && generation === this.epoch) this.onStep(step); }, delay);
      this.next += 30 / this.bpm; this.step++;
    }
  }
  async stop() {
    this.playing = false; clearInterval(this.timer);
    if (this.context) await this.context.suspend();
  }
  phase() { return this.playing ? Math.max(0, (this.context.currentTime - this.epoch) / (960 / this.bpm)) % 1 : 0; }
}
