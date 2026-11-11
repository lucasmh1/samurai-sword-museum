/**
 * Main Application Controller for 3D Samurai Sword Museum & Dojo Experience
 */

class SamuraiMuseumApp {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.currentBladeKey = 'katana';
        this.currentHamon = 'notare';
        this.activeMode = 'museum'; // 'museum' or 'dojo'

        this.currentSwordGroup = null;
        this.isExploded = false;
        this.drawProgress = 0.0; // 0 = fully sheathed, 1 = fully drawn
        this.isAutoRotating = true;

        this.cameraTargets = {
            museum: { pos: new THREE.Vector3(0, 0.5, 4.2), target: new THREE.Vector3(0, 0, 0) },
            dojo: { pos: new THREE.Vector3(0, 0.4, 4.8), target: new THREE.Vector3(0, 0.1, 0) },
            closeup: { pos: new THREE.Vector3(0.5, 0.2, 1.8), target: new THREE.Vector3(0.5, 0, 0) }
        };

        this.initThree();
        this.initEnvironment();
        this.loadSword(this.currentBladeKey, this.currentHamon);
        this.initDojo();
        this.bindEvents();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0c10);
        this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.05);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
        this.camera.position.copy(this.cameraTargets.museum.pos);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // Orbit control state variables
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.spherical = { radius: 4.2, theta: 0.1, phi: Math.PI / 2.3 };
        this.targetLookAt = new THREE.Vector3(0, 0, 0);

        this.clock = new THREE.Clock();
    }

    initEnvironment() {
        this.environment = new MuseumEnvironment(this.scene);
        this.environment.init();
    }

    initDojo() {
        this.dojo = new TameshigiriDojo(this.scene, this.camera, this.renderer);
    }

    loadSword(typeKey, hamonType) {
        if (this.currentSwordGroup) {
            this.scene.remove(this.currentSwordGroup);
        }

        this.currentBladeKey = typeKey;
        this.currentHamon = hamonType;
        this.currentSwordGroup = window.swordGenerator.createSword(typeKey, hamonType);
        this.scene.add(this.currentSwordGroup);

        // Reset positions
        this.isExploded = false;
        this.drawProgress = 0.0;
        const slider = document.getElementById('draw-slider');
        if (slider) slider.value = 0;

        this.updateSwordPositions();
        this.updateInfoCard(this.currentSwordGroup.userData.spec);

        // Play chime
        if (window.soundEngine) {
            window.soundEngine.playBladeChime();
        }
    }

    updateSwordPositions() {
        if (!this.currentSwordGroup) return;
        const comps = this.currentSwordGroup.userData.components;
        const spec = this.currentSwordGroup.userData.spec;

        if (this.isExploded) {
            // Disassembled view: parts spread out along X and Z axes
            // Saya slides far forward
            comps.saya.position.set(spec.bladeLength * 0.95, -0.35, 0.4);
            comps.saya.rotation.set(0, 0, 0);

            // Habaki floats forward
            comps.habaki.position.set(0.45, 0, 0);

            // Tsuba floats slightly back from blade root
            if (comps.tsuba) {
                comps.tsuba.position.set(-0.25, 0, 0);
            }

            // Tsuka (hilt) pulls back far to completely expose Nakago (tang)
            comps.tsuka.position.set(-spec.tsukaLength * 1.35, 0, 0);

            // Blade stays centered
            comps.bladeAssembly.position.set(0, 0, 0);
        } else {
            // Normal view with unsheathing slide offset
            // When drawProgress goes from 0 to 1, Saya slides along the blade's curve
            const drawDist = this.drawProgress * (spec.bladeLength * 1.15);
            comps.saya.position.set(drawDist, 0, 0);
            comps.saya.rotation.set(0, 0, 0);

            // Reset internal blade components
            comps.habaki.position.set(0, 0, 0);
            if (comps.tsuba) comps.tsuba.position.set(0, 0, 0);
            comps.tsuka.position.set(0, 0, 0);
            comps.bladeAssembly.position.set(0, 0, 0);
        }
    }

    updateInfoCard(spec) {
        document.getElementById('blade-title').innerText = spec.name;
        document.getElementById('blade-era').innerText = spec.era;
        document.getElementById('blade-smith').innerText = spec.smith;
        document.getElementById('blade-length').innerText = `${Math.round(spec.bladeLength * 33)} cm (${(spec.bladeLength * 1.1).toFixed(1)} Shaku)`;
        document.getElementById('blade-sori').innerText = `${(spec.soriCurvature * 15).toFixed(1)} cm curvature`;
        document.getElementById('blade-desc').innerText = spec.description;

        // Show/hide parts annotations if exploded
        this.updateAnnotationMarkers();
    }

    updateAnnotationMarkers() {
        const container = document.getElementById('annotations-container');
        if (!container) return;
        container.innerHTML = '';

        if (!this.isExploded || this.activeMode !== 'museum') return;

        const spec = this.currentSwordGroup.userData.spec;
        const comps = this.currentSwordGroup.userData.components;

        const markers = [
            { name: "Kissaki (切先)", desc: "Geometric razor-sharp hardened tip with Yokote dividing line", target: new THREE.Vector3(spec.bladeLength * 0.9, 0, 0) },
            { name: "Hamon (刃文)", desc: `${this.currentHamon.toUpperCase()} differential crystal hardening line created with Yakiba clay`, target: new THREE.Vector3(spec.bladeLength * 0.45, -0.05, 0) },
            { name: "Habaki (鎺)", desc: "Precision gold/brass blade collar locking blade into saya without friction", target: new THREE.Vector3(0.45, 0, 0) },
            { name: "Nakago (茎)", desc: "Unpolished tang signed by master swordsmith with Mekugi peg hole", target: new THREE.Vector3(-spec.tsukaLength * 0.4, 0, 0) },
            { name: "Saya (鞘)", desc: "Traditional Honoki magnolia wood sheath coated in multi-layered Urushi lacquer", target: new THREE.Vector3(spec.bladeLength * 0.95, -0.35, 0.4) }
        ];

        if (comps.tsuba) {
            markers.push({ name: "Tsuba (鍔)", desc: "Hand-forged iron guard with openwork sukashi pierced motifs", target: new THREE.Vector3(-0.25, 0, 0) });
        }

        markers.forEach(m => {
            const el = document.createElement('div');
            el.className = 'annotation-badge';
            el.innerHTML = `
                <div class="badge-pin"></div>
                <div class="badge-content">
                    <span class="badge-title">${m.name}</span>
                    <span class="badge-text">${m.desc}</span>
                </div>
            `;
            container.appendChild(el);
            m.element = el;
        });

        this.activeMarkers = markers;
    }

    bindEvents() {
        const dom = this.renderer.domElement;

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Mouse & Touch Controls
        dom.addEventListener('mousedown', (e) => {
            if (this.activeMode === 'dojo') {
                this.dojo.onPointerDown(e.clientX, e.clientY);
            } else {
                this.isDragging = true;
                this.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.activeMode === 'dojo') {
                this.dojo.onPointerMove(e.clientX, e.clientY);
            } else if (this.isDragging) {
                const deltaX = e.clientX - this.previousMousePosition.x;
                const deltaY = e.clientY - this.previousMousePosition.y;

                this.spherical.theta -= deltaX * 0.006;
                this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi - deltaY * 0.006));
                this.isAutoRotating = false;

                this.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (this.activeMode === 'dojo') {
                this.dojo.onPointerUp(e.clientX, e.clientY);
            } else {
                this.isDragging = false;
            }
        });

        // Touch support
        dom.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const t = e.touches[0];
                if (this.activeMode === 'dojo') {
                    this.dojo.onPointerDown(t.clientX, t.clientY);
                } else {
                    this.isDragging = true;
                    this.previousMousePosition = { x: t.clientX, y: t.clientY };
                }
            }
        }, { passive: false });

        dom.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                const t = e.touches[0];
                if (this.activeMode === 'dojo') {
                    this.dojo.onPointerMove(t.clientX, t.clientY);
                } else if (this.isDragging) {
                    const deltaX = t.clientX - this.previousMousePosition.x;
                    const deltaY = t.clientY - this.previousMousePosition.y;

                    this.spherical.theta -= deltaX * 0.007;
                    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi - deltaY * 0.007));
                    this.isAutoRotating = false;

                    this.previousMousePosition = { x: t.clientX, y: t.clientY };
                }
            }
        }, { passive: false });

        dom.addEventListener('touchend', (e) => {
            if (this.activeMode === 'dojo') {
                const t = e.changedTouches[0];
                this.dojo.onPointerUp(t.clientX, t.clientY);
            } else {
                this.isDragging = false;
            }
        });

        // Scroll zoom
        dom.addEventListener('wheel', (e) => {
            if (this.activeMode === 'museum') {
                this.spherical.radius = Math.max(1.2, Math.min(8.0, this.spherical.radius + e.deltaY * 0.003));
            }
        }, { passive: true });

        // Blade selector buttons
        document.querySelectorAll('.blade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.blade-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const key = btn.dataset.blade;
                this.loadSword(key, this.currentHamon);
            });
        });

        // Hamon selector buttons
        document.querySelectorAll('.hamon-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.hamon-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const hamon = btn.dataset.hamon;
                this.loadSword(this.currentBladeKey, hamon);
            });
        });

        // Sheath / Draw Slider
        const drawSlider = document.getElementById('draw-slider');
        if (drawSlider) {
            let lastValue = 0;
            drawSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                const prev = this.drawProgress;
                this.drawProgress = val;

                if (window.soundEngine) {
                    if (val > prev && prev === 0) {
                        window.soundEngine.playDraw(1.2);
                    } else if (val < prev && val === 0) {
                        window.soundEngine.playSheathe();
                    }
                }

                this.updateSwordPositions();
            });
        }

        // Exploded View / Disassembly Toggle
        const explodeBtn = document.getElementById('btn-explode');
        if (explodeBtn) {
            explodeBtn.addEventListener('click', () => {
                this.isExploded = !this.isExploded;
                explodeBtn.classList.toggle('active', this.isExploded);
                explodeBtn.innerText = this.isExploded ? "Assemble (組立)" : "Disassemble (解体)";

                if (window.soundEngine) {
                    window.soundEngine.playBell(this.isExploded ? 520 : 390, 0.25, 1.5);
                }

                this.updateSwordPositions();
                this.updateAnnotationMarkers();
            });
        }

        // Mode switch tabs: Museum vs Dojo
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                this.setMode(mode);
            });
        });

        // Audio Mute Toggle Button
        const audioBtn = document.getElementById('btn-audio');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                const isMuted = window.soundEngine.toggleMute();
                audioBtn.classList.toggle('muted', isMuted);
                audioBtn.innerHTML = isMuted ? '🔇 Audio Off' : '🔊 Soundscape On';
            });
        }

        // Quick draw button ("Iaido Strike!")
        const btnDraw = document.getElementById('btn-quick-draw');
        if (btnDraw) {
            btnDraw.addEventListener('click', () => {
                this.triggerQuickDraw();
            });
        }

        // Initialize audio context on first user click anywhere
        window.addEventListener('click', () => {
            if (window.soundEngine && !window.soundEngine.initialized) {
                window.soundEngine.init();
            }
        }, { once: true });
    }

    setMode(mode) {
        if (this.activeMode === mode) return;
        this.activeMode = mode;

        document.querySelectorAll('.mode-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.mode === mode);
        });

        const museumUI = document.getElementById('museum-ui');
        const dojoUI = document.getElementById('dojo-ui');

        if (mode === 'dojo') {
            museumUI.style.display = 'none';
            dojoUI.style.display = 'block';

            // Hide sword stand & sword from museum position
            if (this.environment.katanaKakeGroup) this.environment.katanaKakeGroup.visible = false;
            if (this.currentSwordGroup) this.currentSwordGroup.visible = false;

            this.dojo.start();
            this.targetCamera(this.cameraTargets.dojo.pos, this.cameraTargets.dojo.target);
        } else {
            museumUI.style.display = 'block';
            dojoUI.style.display = 'none';

            if (this.environment.katanaKakeGroup) this.environment.katanaKakeGroup.visible = true;
            if (this.currentSwordGroup) this.currentSwordGroup.visible = true;

            this.dojo.stop();
            this.targetCamera(this.cameraTargets.museum.pos, this.cameraTargets.museum.target);
            this.updateAnnotationMarkers();
        }

        if (window.soundEngine) {
            window.soundEngine.playBell(mode === 'dojo' ? 440 : 587, 0.3, 2.0);
        }
    }

    targetCamera(pos, target) {
        this.camera.position.copy(pos);
        this.targetLookAt.copy(target);
        this.camera.lookAt(this.targetLookAt);
    }

    triggerQuickDraw() {
        const slider = document.getElementById('draw-slider');
        if (this.drawProgress === 0) {
            // Draw out
            let start = performance.now();
            if (window.soundEngine) window.soundEngine.playDraw(2.0);

            const animateDraw = (now) => {
                const elapsed = (now - start) / 400; // 400ms quick strike
                if (elapsed < 1.0) {
                    this.drawProgress = Math.min(1.0, elapsed);
                    if (slider) slider.value = this.drawProgress;
                    this.updateSwordPositions();
                    requestAnimationFrame(animateDraw);
                } else {
                    this.drawProgress = 1.0;
                    if (slider) slider.value = 1.0;
                    this.updateSwordPositions();
                }
            };
            requestAnimationFrame(animateDraw);
        } else {
            // Sheathe back
            let start = performance.now();
            const animateSheathe = (now) => {
                const elapsed = (now - start) / 500;
                if (elapsed < 1.0) {
                    this.drawProgress = Math.max(0, 1.0 - elapsed);
                    if (slider) slider.value = this.drawProgress;
                    this.updateSwordPositions();
                    requestAnimationFrame(animateSheathe);
                } else {
                    this.drawProgress = 0;
                    if (slider) slider.value = 0;
                    this.updateSwordPositions();
                    if (window.soundEngine) window.soundEngine.playSheathe();
                }
            };
            requestAnimationFrame(animateSheathe);
        }
    }

    update3DAnnotations() {
        if (!this.activeMarkers || !this.isExploded || this.activeMode !== 'museum') return;

        this.activeMarkers.forEach(m => {
            const worldPos = m.target.clone();
            // Transform by sword group matrix
            if (this.currentSwordGroup) {
                worldPos.applyMatrix4(this.currentSwordGroup.matrixWorld);
            }
            worldPos.project(this.camera);

            // Check if in front of camera
            if (worldPos.z < 1.0) {
                const x = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;
                m.element.style.transform = `translate(${x}px, ${y}px)`;
                m.element.style.display = 'block';
            } else {
                m.element.style.display = 'none';
            }
        });
    }

    animate() {
        requestAnimationFrame(this.animate);

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // Auto rotate in museum mode if not dragging
        if (this.activeMode === 'museum' && this.isAutoRotating && !this.isDragging) {
            this.spherical.theta += delta * 0.2;
        }

        // Compute camera orbit from spherical coordinates
        if (this.activeMode === 'museum') {
            const x = this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);
            const y = this.spherical.radius * Math.cos(this.spherical.phi);
            const z = this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);

            this.camera.position.set(x, y, z);
            this.camera.lookAt(this.targetLookAt);
        }

        // Update environment (sakura petals, lantern flicker)
        this.environment.update(delta, time);

        // Update Dojo mini-game
        if (this.activeMode === 'dojo') {
            this.dojo.update(delta);
        }

        // Update 3D annotation labels
        this.update3DAnnotations();

        this.renderer.render(this.scene, this.camera);
    }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new SamuraiMuseumApp();
});
