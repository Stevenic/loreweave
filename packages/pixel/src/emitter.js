/**
 * Particle emitter simulation for Pixel Format v1.
 *
 * Runtime particle system per spec §10. The format stores emitter configs;
 * this module simulates the physics.
 */
/** Seeded PRNG for deterministic particle output. Uses a simple xorshift32. */
export class SeededRNG {
    state;
    constructor(seed) {
        this.state = seed | 0 || 1;
    }
    /** Return a number in [0, 1). */
    next() {
        let x = this.state;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        this.state = x;
        return (x >>> 0) / 4294967296;
    }
    /** Return a number in [min, max]. */
    range(min, max) {
        return min + this.next() * (max - min);
    }
    /** Return a number from a NumberRange. */
    fromRange(range) {
        return this.range(range.min, range.max);
    }
}
/** Emitter runtime state. */
export class ParticleEmitter {
    config;
    particles = [];
    rng;
    accumulator = 0;
    burstFired = false;
    elapsed = 0;
    constructor(config, seed = 42) {
        this.config = config;
        this.rng = new SeededRNG(seed);
    }
    /** Spawn a single particle at origin (0,0). */
    spawn() {
        const { config, rng } = this;
        return {
            x: 0,
            y: 0,
            vx: rng.fromRange(config.velocity.x),
            vy: rng.fromRange(config.velocity.y),
            age: 0,
            lifetime: rng.fromRange(config.lifetime),
            scale: config.scaleRange ? rng.fromRange(config.scaleRange) : 1,
            rotation: 0,
            rotationSpeed: config.rotationSpeed ? rng.fromRange(config.rotationSpeed) : 0,
            opacity: 1,
        };
    }
    /**
     * Advance the emitter by deltaMs milliseconds.
     * Spawns new particles, updates existing ones, removes dead ones.
     */
    update(deltaMs) {
        const { config, particles } = this;
        const maxParticles = config.maxParticles ?? 100;
        const deltaSec = deltaMs / 1000;
        this.elapsed += deltaMs;
        // Handle burst mode
        if (config.burst !== undefined && !this.burstFired) {
            const count = Math.min(config.burst, maxParticles);
            for (let i = 0; i < count; i++) {
                particles.push(this.spawn());
            }
            this.burstFired = true;
        }
        // Continuous emission (skip if burst-only)
        if (config.burst === undefined) {
            this.accumulator += deltaSec * config.rate;
            while (this.accumulator >= 1 && particles.length < maxParticles) {
                particles.push(this.spawn());
                this.accumulator -= 1;
            }
            if (this.accumulator >= 1) {
                this.accumulator = 0; // Cap if at max particles
            }
        }
        // Update existing particles
        const gravity = config.gravity ?? 0;
        const fadeOut = config.fadeOut ?? false;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.age += deltaMs;
            // Remove dead particles
            if (p.age >= p.lifetime) {
                particles.splice(i, 1);
                continue;
            }
            // Physics update
            p.vy += gravity * deltaSec;
            p.x += p.vx * deltaSec;
            p.y += p.vy * deltaSec;
            p.rotation += p.rotationSpeed * deltaSec;
            // Fade
            if (fadeOut) {
                p.opacity = 1 - p.age / p.lifetime;
            }
        }
    }
    /** Reset the emitter to initial state. */
    reset(seed) {
        this.particles.length = 0;
        this.accumulator = 0;
        this.burstFired = false;
        this.elapsed = 0;
        if (seed !== undefined) {
            this.rng = new SeededRNG(seed);
        }
    }
}
//# sourceMappingURL=emitter.js.map