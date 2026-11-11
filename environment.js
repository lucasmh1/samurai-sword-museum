/**
 * 3D Atmospheric Japanese Museum & Dojo Environment
 * Includes custom wooden sword rack (Katanakake), tatami flooring, shoji screens,
 * floating sakura cherry blossom particle physics, and dynamic lighting.
 */

class MuseumEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.sakuraParticles = null;
        this.dustParticles = null;
        this.spotlight = null;
        this.katanaKakeGroup = null;
    }

    init() {
        this.setupLighting();
        this.buildMuseumArchitecture();
        this.buildSwordRack();
        this.initSakuraParticles();
        this.initDustMotes();
    }

    setupLighting() {
        // Soft warm ambient fill (candlelight & moonlight balance)
        const ambientLight = new THREE.AmbientLight(0xffecd4, 0.45);
        this.scene.add(ambientLight);

        // Main museum dramatic key spotlight (illuminating blade surface and hamon)
        this.spotlight = new THREE.SpotLight(0xfff6e8, 3.2);
        this.spotlight.position.set(2, 6, 4);
        this.spotlight.angle = Math.PI / 5;
        this.spotlight.penumbra = 0.6;
        this.spotlight.decay = 1.4;
        this.spotlight.distance = 25;
        this.spotlight.castShadow = true;
        this.spotlight.shadow.mapSize.width = 2048;
        this.spotlight.shadow.mapSize.height = 2048;
        this.spotlight.shadow.camera.near = 1;
        this.spotlight.shadow.camera.far = 20;
        this.spotlight.shadow.bias = -0.001;
        this.scene.add(this.spotlight);

        // Blade edge rim light (cool steel blue reflection from opposite side)
        const rimLight = new THREE.DirectionalLight(0x99c2ff, 1.4);
        rimLight.position.set(-4, 3, -3);
        this.scene.add(rimLight);

        // Warm under-lighting from lanterns
        const lanternLight = new THREE.PointLight(0xff9d42, 1.8, 8);
        lanternLight.position.set(0, -1.8, 1.5);
        this.scene.add(lanternLight);
        this.lanternLight = lanternLight;
    }

    buildMuseumArchitecture() {
        // 1. Tatami mat flooring
        const tatamiCanvas = document.createElement('canvas');
        tatamiCanvas.width = 512;
        tatamiCanvas.height = 512;
        const ctx = tatamiCanvas.getContext('2d');

        // Woven rush straw base
        ctx.fillStyle = '#b7a884';
        ctx.fillRect(0, 0, 512, 512);

        // Woven fiber lines
        ctx.fillStyle = 'rgba(120, 105, 75, 0.2)';
        for (let y = 0; y < 512; y += 4) {
            ctx.fillRect(0, y, 512, 2);
        }
        // Black fabric borders (Heri)
        ctx.fillStyle = '#1c1b18';
        ctx.fillRect(0, 0, 36, 512);
        ctx.fillRect(476, 0, 36, 512);

        const tatamiTex = new THREE.CanvasTexture(tatamiCanvas);
        tatamiTex.wrapS = THREE.RepeatWrapping;
        tatamiTex.wrapT = THREE.RepeatWrapping;
        tatamiTex.repeat.set(6, 6);

        const floorGeom = new THREE.PlaneGeometry(28, 28);
        const floorMat = new THREE.MeshStandardMaterial({
            map: tatamiTex,
            roughness: 0.85,
            metalness: 0.05
        });
        const floor = new THREE.Mesh(floorGeom, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2.2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 2. Traditional Shoji Paper Screens in Background
        const shojiGroup = new THREE.Group();
        const shojiCanvas = document.createElement('canvas');
        shojiCanvas.width = 512;
        shojiCanvas.height = 512;
        const sCtx = shojiCanvas.getContext('2d');

        // Translucent washi paper
        sCtx.fillStyle = '#f8f4ec';
        sCtx.fillRect(0, 0, 512, 512);

        // Dark cedar lattice grid (Kumiko)
        sCtx.strokeStyle = '#2c1e13';
        sCtx.lineWidth = 14;
        sCtx.strokeRect(0, 0, 512, 512);

        sCtx.lineWidth = 6;
        for (let x = 64; x < 512; x += 64) {
            sCtx.beginPath();
            sCtx.moveTo(x, 0);
            sCtx.lineTo(x, 512);
            sCtx.stroke();
        }
        for (let y = 64; y < 512; y += 64) {
            sCtx.beginPath();
            sCtx.moveTo(0, y);
            sCtx.lineTo(512, y);
            sCtx.stroke();
        }

        const shojiTex = new THREE.CanvasTexture(shojiCanvas);
        shojiTex.wrapS = THREE.RepeatWrapping;
        shojiTex.wrapT = THREE.RepeatWrapping;
        shojiTex.repeat.set(3, 2);

        const shojiGeom = new THREE.PlaneGeometry(22, 10);
        const shojiMat = new THREE.MeshStandardMaterial({
            map: shojiTex,
            roughness: 0.9,
            metalness: 0.05
        });
        const shojiWall = new THREE.Mesh(shojiGeom, shojiMat);
        shojiWall.position.set(0, 2.5, -5.5);
        shojiGroup.add(shojiWall);

        // Backlight behind shoji screen creating authentic warm diffuse glow
        const shojiBacklight = new THREE.PointLight(0xffbe6b, 2.5, 18);
        shojiBacklight.position.set(0, 3, -6.5);
        shojiGroup.add(shojiBacklight);

        this.scene.add(shojiGroup);

        // 3. Hanging Japanese Scroll (Kakemono) with Kanji calligraphy: "Zanshin" (Remaining Mind / Total Focus)
        const scrollCanvas = document.createElement('canvas');
        scrollCanvas.width = 256;
        scrollCanvas.height = 512;
        const kCtx = scrollCanvas.getContext('2d');

        // Silk mount
        kCtx.fillStyle = '#313a37';
        kCtx.fillRect(0, 0, 256, 512);
        // Center paper
        kCtx.fillStyle = '#eee6d5';
        kCtx.fillRect(28, 40, 200, 432);

        // Kanji ink calligraphy: "残心" (Zanshin) & "無双" (Muso)
        kCtx.font = 'bold 80px "Noto Serif JP", serif';
        kCtx.fillStyle = '#111111';
        kCtx.textAlign = 'center';
        kCtx.fillText('残', 128, 170);
        kCtx.fillText('心', 128, 270);

        // Red Hanko signature stamp
        kCtx.fillStyle = '#b7221d';
        kCtx.fillRect(108, 380, 40, 40);
        kCtx.font = 'bold 20px sans-serif';
        kCtx.fillStyle = '#ffffff';
        kCtx.fillText('印', 128, 408);

        const scrollTex = new THREE.CanvasTexture(scrollCanvas);
        const scrollGeom = new THREE.PlaneGeometry(1.6, 3.2);
        const scrollMat = new THREE.MeshStandardMaterial({ map: scrollTex, roughness: 0.8 });
        const scrollMesh = new THREE.Mesh(scrollGeom, scrollMat);
        scrollMesh.position.set(4.2, 1.8, -5.4);
        this.scene.add(scrollMesh);
    }

    /**
     * Authentic Japanese Sword Stand (Katanakake)
     */
    buildSwordRack() {
        this.katanaKakeGroup = new THREE.Group();
        this.katanaKakeGroup.name = "Katanakake";

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x181310, // Dark lacquered ebony / rosewood
            roughness: 0.35,
            metalness: 0.15
        });

        // Base plinth
        const baseGeom = new THREE.BoxGeometry(2.4, 0.12, 0.8);
        const base = new THREE.Mesh(baseGeom, woodMat);
        base.position.set(0, -1.2, 0);
        base.receiveShadow = true;
        this.katanaKakeGroup.add(base);

        // Two vertical upright pillars with curved rests
        const pillarMat = woodMat;
        [-0.7, 0.7].forEach(posX => {
            const pillarGeom = new THREE.BoxGeometry(0.09, 1.0, 0.22);
            const pillar = new THREE.Mesh(pillarGeom, pillarMat);
            pillar.position.set(posX, -0.7, 0);
            pillar.castShadow = true;
            this.katanaKakeGroup.add(pillar);

            // Curved rest saddles (cushioned in crimson felt)
            const feltMat = new THREE.MeshStandardMaterial({ color: 0x8a1c1c, roughness: 0.9 });
            const restGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.14, 16, 1, false, 0, Math.PI);
            const restMesh = new THREE.Mesh(restGeom, feltMat);
            restMesh.rotation.z = Math.PI;
            restMesh.rotation.y = Math.PI / 2;
            restMesh.position.set(posX, -0.25, 0);
            this.katanaKakeGroup.add(restMesh);
        });

        // Central crossbeam
        const beamGeom = new THREE.BoxGeometry(1.6, 0.08, 0.08);
        const beam = new THREE.Mesh(beamGeom, woodMat);
        beam.position.set(0, -0.65, 0);
        this.katanaKakeGroup.add(beam);

        this.scene.add(this.katanaKakeGroup);
    }

    /**
     * Falling Sakura (Cherry Blossom) Petals with realistic air flutter physics
     */
    initSakuraParticles() {
        const count = 280;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const rotations = new Float32Array(count * 3);
        const speeds = new Float32Array(count * 3);
        const scales = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 16;
            positions[i * 3 + 1] = Math.random() * 10 - 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12;

            rotations[i * 3 + 0] = Math.random() * Math.PI * 2;
            rotations[i * 3 + 1] = Math.random() * Math.PI * 2;
            rotations[i * 3 + 2] = Math.random() * Math.PI * 2;

            speeds[i * 3 + 0] = (Math.random() - 0.4) * 0.015; // Drift
            speeds[i * 3 + 1] = 0.008 + Math.random() * 0.016;  // Fall speed
            speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.012;

            scales[i] = 0.06 + Math.random() * 0.07;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Procedural Sakura petal canvas texture (soft notched pink petal)
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(255, 192, 203, 0.95)';
        ctx.beginPath();
        // Heart-like notched cherry blossom petal
        ctx.moveTo(32, 58);
        ctx.bezierCurveTo(8, 40, 4, 18, 22, 10);
        ctx.bezierCurveTo(28, 6, 32, 16, 32, 20);
        ctx.bezierCurveTo(32, 16, 36, 6, 42, 10);
        ctx.bezierCurveTo(60, 18, 56, 40, 32, 58);
        ctx.closePath();
        ctx.fill();

        // Delicate inner vein & blush
        const rad = ctx.createRadialGradient(32, 38, 0, 32, 38, 24);
        rad.addColorStop(0, 'rgba(255, 130, 160, 0.7)');
        rad.addColorStop(1, 'rgba(255, 220, 230, 0)');
        ctx.fillStyle = rad;
        ctx.fill();

        const petalTex = new THREE.CanvasTexture(canvas);

        const mat = new THREE.PointsMaterial({
            size: 0.18,
            map: petalTex,
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
            blending: THREE.NormalBlending
        });

        this.sakuraParticles = new THREE.Points(geom, mat);
        this.sakuraSpeeds = speeds;
        this.scene.add(this.sakuraParticles);
    }

    /**
     * Atmospheric golden dust motes caught in the museum spotlight
     */
    initDustMotes() {
        const count = 180;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 1] = Math.random() * 5 - 1.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.04,
            color: 0xffe6a3,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending
        });

        this.dustParticles = new THREE.Points(geom, mat);
        this.scene.add(this.dustParticles);
    }

    /**
     * Update animations (fluttering sakura, breathing lantern flicker, dust motion)
     */
    update(delta, time) {
        // Flicker lantern light slightly for organic candle warmth
        if (this.lanternLight) {
            this.lanternLight.intensity = 1.8 + Math.sin(time * 6) * 0.15 + (Math.random() - 0.5) * 0.08;
        }

        // Update Sakura petals falling
        if (this.sakuraParticles) {
            const pos = this.sakuraParticles.geometry.attributes.position.array;
            const count = pos.length / 3;

            for (let i = 0; i < count; i++) {
                // Flutter sideways with sine wave
                pos[i * 3 + 0] += Math.sin(time * 1.5 + i) * 0.006 + this.sakuraSpeeds[i * 3 + 0];
                pos[i * 3 + 1] -= this.sakuraSpeeds[i * 3 + 1];
                pos[i * 3 + 2] += Math.cos(time * 1.2 + i) * 0.005;

                // Reset to top if below floor
                if (pos[i * 3 + 1] < -2.1) {
                    pos[i * 3 + 1] = 6.0;
                    pos[i * 3 + 0] = (Math.random() - 0.5) * 14;
                    pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
                }
            }
            this.sakuraParticles.geometry.attributes.position.needsUpdate = true;
            this.sakuraParticles.rotation.y = time * 0.02;
        }

        // Update dust motes
        if (this.dustParticles) {
            const dPos = this.dustParticles.geometry.attributes.position.array;
            for (let i = 0; i < dPos.length / 3; i++) {
                dPos[i * 3 + 1] += Math.sin(time + i * 2) * 0.001;
                dPos[i * 3 + 0] += Math.cos(time * 0.5 + i) * 0.001;
            }
            this.dustParticles.geometry.attributes.position.needsUpdate = true;
        }
    }
}

window.MuseumEnvironment = MuseumEnvironment;
