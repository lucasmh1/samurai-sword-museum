/**
 * Tameshigiri (試し斬り) Cutting Mini-Game
 * Authentic Japanese target test-cutting simulation with real-time mesh slicing,
 * blade trail ribbons, cutting physics, and precision scoring.
 */

class TameshigiriDojo {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.active = false;
        this.targets = [];
        this.slicedParts = [];
        this.sparks = [];

        this.score = 0;
        this.combo = 0;
        this.highestCombo = 0;

        this.isCutting = false;
        this.cutStart = { x: 0, y: 0, time: 0 };
        this.cutPoints = [];

        // Blade trail line / mesh
        this.trailMesh = null;
        this.trailPoints = [];

        this.dojoGroup = new THREE.Group();
        this.dojoGroup.name = "TameshigiriDojoGroup";
        this.dojoGroup.visible = false;
        this.scene.add(this.dojoGroup);

        this.targetTypes = ['tatami', 'bamboo'];
        this.currentTargetType = 'tatami';

        this.initDojoStand();
        this.initTrailRenderer();
    }

    initDojoStand() {
        // Heavy wooden cutting stand (Dotan / Tameshigiri Dai)
        const standMat = new THREE.MeshStandardMaterial({
            color: 0x3d2716, // Stained cedar
            roughness: 0.7,
            metalness: 0.1
        });

        // 4-legged heavy base
        const standBaseGeom = new THREE.BoxGeometry(1.2, 0.15, 1.2);
        const standBase = new THREE.Mesh(standBaseGeom, standMat);
        standBase.position.set(0, -1.8, 0);
        standBase.receiveShadow = true;
        this.dojoGroup.add(standBase);

        // Center wooden peg/pillar holding targets
        const postGeom = new THREE.CylinderGeometry(0.08, 0.09, 1.2, 16);
        const post = new THREE.Mesh(postGeom, standMat);
        post.position.set(0, -1.15, 0);
        post.castShadow = true;
        this.dojoGroup.add(post);

        // Target mounting spike
        const spikeGeom = new THREE.ConeGeometry(0.025, 0.25, 12);
        const spikeMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.3 });
        const spike = new THREE.Mesh(spikeGeom, spikeMat);
        spike.position.set(0, -0.5, 0);
        this.dojoGroup.add(spike);
    }

    initTrailRenderer() {
        // Dynamic slash ribbon line
        const maxPoints = 25;
        const positions = new Float32Array(maxPoints * 3);
        const colors = new Float32Array(maxPoints * 3);

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: 3,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        this.trailLine = new THREE.Line(geom, mat);
        this.trailLine.frustumCulled = false;
        this.scene.add(this.trailLine);
    }

    start() {
        this.active = true;
        this.dojoGroup.visible = true;
        this.spawnTarget();
        this.score = 0;
        this.combo = 0;
        this.updateHUD();
    }

    stop() {
        this.active = false;
        this.dojoGroup.visible = false;
        this.clearAllTargets();
    }

    clearAllTargets() {
        this.targets.forEach(t => this.scene.remove(t.group));
        this.targets = [];
        this.slicedParts.forEach(p => this.scene.remove(p.mesh));
        this.slicedParts = [];
        this.sparks.forEach(s => this.scene.remove(s.mesh));
        this.sparks = [];
    }

    /**
     * Spawn an intact Tatami Omote roll or Bamboo stalk
     */
    spawnTarget(type = 'tatami') {
        this.clearAllTargets();
        this.currentTargetType = type;

        const targetGroup = new THREE.Group();
        targetGroup.position.set(0, 0.1, 0);

        let mesh;
        const radius = type === 'tatami' ? 0.22 : 0.15;
        const height = 1.6;

        if (type === 'tatami') {
            // Rolled tatami straw mat
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#9b8c5e'; // Dried green/amber rush straw
            ctx.fillRect(0, 0, 256, 256);

            // Straw weave bands and rope ties
            ctx.fillStyle = 'rgba(70, 60, 35, 0.25)';
            for (let y = 0; y < 256; y += 6) {
                ctx.fillRect(0, y, 256, 2);
            }
            // Bound rope cords (Nawa)
            ctx.fillStyle = '#3a2b16';
            ctx.fillRect(0, 40, 256, 12);
            ctx.fillRect(0, 120, 256, 12);
            ctx.fillRect(0, 200, 256, 12);

            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(4, 2);

            const geom = new THREE.CylinderGeometry(radius, radius * 1.02, height, 32);
            const mat = new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.85,
                metalness: 0.05
            });
            mesh = new THREE.Mesh(geom, mat);
        } else {
            // Fresh green Bamboo stalk (Take)
            const geom = new THREE.CylinderGeometry(radius, radius, height, 24);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x487d39, // Vibrant bamboo green
                roughness: 0.35,
                metalness: 0.1
            });
            mesh = new THREE.Mesh(geom, mat);

            // Bamboo node rings
            [-0.4, 0.1, 0.6].forEach(y => {
                const ringGeom = new THREE.TorusGeometry(radius * 1.02, 0.012, 8, 24);
                const ringMat = new THREE.MeshStandardMaterial({ color: 0x739649, roughness: 0.4 });
                const ring = new THREE.Mesh(ringGeom, ringMat);
                ring.rotation.x = Math.PI / 2;
                ring.position.y = y;
                mesh.add(ring);
            });
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        targetGroup.add(mesh);

        this.scene.add(targetGroup);

        this.targets.push({
            group: targetGroup,
            mesh: mesh,
            type: type,
            radius: radius,
            height: height,
            posY: targetGroup.position.y,
            isSliced: false
        });

        // Trigger entrance sound
        if (window.soundEngine) {
            window.soundEngine.playBell(330, 0.2, 1.0);
        }
    }

    /**
     * Mouse / Touch slash handling
     */
    onPointerDown(screenX, screenY) {
        if (!this.active) return;
        this.isCutting = true;
        this.cutStart = { x: screenX, y: screenY, time: performance.now() };
        this.cutPoints = [{ x: screenX, y: screenY, time: performance.now() }];
        this.trailPoints = [];
    }

    onPointerMove(screenX, screenY) {
        if (!this.active || !this.isCutting) return;
        const now = performance.now();
        this.cutPoints.push({ x: screenX, y: screenY, time: now });

        // Add 3D unprojected point for blade slash trail
        const vec = new THREE.Vector3(
            (screenX / window.innerWidth) * 2 - 1,
            -(screenY / window.innerHeight) * 2 + 1,
            0.5
        );
        vec.unproject(this.camera);
        // Project onto z = 0 plane where target sits
        const dir = vec.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        const posOnPlane = this.camera.position.clone().add(dir.multiplyScalar(distance));

        this.trailPoints.push({
            pos: posOnPlane,
            age: 0
        });

        if (this.trailPoints.length > 20) {
            this.trailPoints.shift();
        }
    }

    onPointerUp(screenX, screenY) {
        if (!this.active || !this.isCutting) return;
        this.isCutting = false;

        const duration = (performance.now() - this.cutStart.time) / 1000;
        const dx = screenX - this.cutStart.x;
        const dy = screenY - this.cutStart.y;
        const dist = Math.hypot(dx, dy);

        // Calculate velocity (pixels per sec)
        const velocity = dist / Math.max(0.05, duration);

        if (dist > 70 && velocity > 450) {
            // Calculate angle in degrees
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            this.executeSlash(this.cutStart, { x: screenX, y: screenY }, angle, velocity);
        }
    }

    /**
     * Test cut execution and precision evaluation
     */
    executeSlash(p1, p2, angleDeg, velocity) {
        // Play whoosh sound
        if (window.soundEngine) {
            window.soundEngine.playSlash(1.1);
        }

        // Raycast line against active target
        this.targets.forEach(target => {
            if (target.isSliced) return;

            // Project target center to screen
            const targetPos = target.group.position.clone();
            targetPos.project(this.camera);
            const screenTargetX = ((targetPos.x + 1) * window.innerWidth) / 2;
            const screenTargetY = ((-targetPos.y + 1) * window.innerHeight) / 2;

            // Check if slice segment passed near target
            const d = this.distToSegment({ x: screenTargetX, y: screenTargetY }, p1, p2);

            if (d < 160) {
                // Successful Hit! Perform target slicing!
                this.performCut(target, angleDeg, velocity, { x: screenTargetX, y: screenTargetY });
            }
        });
    }

    distToSegment(p, v, w) {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }

    /**
     * Physically split target mesh into two parts with sliding gravity physics
     */
    performCut(target, angleDeg, velocity, hitPoint) {
        target.isSliced = true;
        this.scene.remove(target.group);

        const cutAngleRad = (angleDeg * Math.PI) / 180;
        const normAngle = Math.abs(angleDeg % 180);

        // Grade the cut according to authentic Japanese swordsmanship (Kesa-giri)
        let grade = "IPPON";
        let gradeSub = "Clean Cut (一本)";
        let scoreBonus = 250;
        let isClean = true;

        // Perfect Kesa-giri is 30° to 50° downward diagonal
        if ((normAngle >= 25 && normAngle <= 55) || (normAngle >= 125 && normAngle <= 155)) {
            grade = "KANPEKI!";
            gradeSub = "Flawless Kesa-Giri (完璧)";
            scoreBonus = 500;
        } else if (normAngle <= 15 || normAngle >= 165) {
            grade = "SUIHEI!";
            gradeSub = "Horizontal Waist Slice (水平斬り)";
            scoreBonus = 350;
        } else if (normAngle >= 75 && normAngle <= 105) {
            grade = "KIRI-OROSHI!";
            gradeSub = "Vertical Cleave (唐竹割り)";
            scoreBonus = 400;
        }

        this.combo++;
        if (this.combo > this.highestCombo) this.highestCombo = this.combo;
        this.score += scoreBonus * Math.min(this.combo, 5);

        // Audio impact
        if (window.soundEngine) {
            window.soundEngine.playCutImpact(isClean);
        }

        // Show slice banner in HUD
        this.showSliceNotice(grade, gradeSub, `Angle: ${Math.round(normAngle)}° | Speed: ${Math.round(velocity)} px/s`);
        this.updateHUD();

        // Create the two severed 3D halves
        const h = target.height;
        const r = target.radius;
        const cutY = (target.posY || 0.1) + (Math.random() - 0.5) * 0.3;

        // Bottom fixed half
        const botHeight = (h * 0.5) + cutY;
        const botGeom = new THREE.CylinderGeometry(r, r * 1.02, botHeight, 24);
        const botMesh = new THREE.Mesh(botGeom, target.mesh.material);
        botMesh.position.set(0, -botHeight * 0.5 + cutY + 0.1, 0);
        botMesh.castShadow = true;
        this.scene.add(botMesh);
        this.slicedParts.push({ mesh: botMesh, vel: new THREE.Vector3(0, 0, 0), rotVel: new THREE.Vector3(0, 0, 0), isBase: true });

        // Top severed sliding half (falls off with dramatic angle)
        const topHeight = h - botHeight;
        const topGeom = new THREE.CylinderGeometry(r, r, topHeight, 24);
        const topMesh = new THREE.Mesh(topGeom, target.mesh.material);
        topMesh.position.set(0, topHeight * 0.5 + cutY + 0.12, 0);
        topMesh.castShadow = true;

        // Cut plane cap showing inner straw rings or bamboo hollow core
        const capGeom = new THREE.CircleGeometry(r, 16);
        const capMat = new THREE.MeshStandardMaterial({
            color: target.type === 'bamboo' ? 0xd1dfbe : 0xc7ab6b,
            roughness: 0.9
        });
        const capMesh = new THREE.Mesh(capGeom, capMat);
        capMesh.rotation.x = Math.PI / 2 + (cutAngleRad * 0.2);
        topMesh.add(capMesh);

        this.scene.add(topMesh);

        // Calculate slide impulse based on cut direction
        const slideDirection = Math.cos(cutAngleRad) >= 0 ? 1 : -1;
        const topVel = new THREE.Vector3(
            slideDirection * (1.8 + Math.random() * 0.8),
            0.6,
            (Math.random() - 0.5) * 0.6
        );
        const rotVel = new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            slideDirection * 3,
            -slideDirection * (3 + Math.random() * 2)
        );

        this.slicedParts.push({
            mesh: topMesh,
            vel: topVel,
            rotVel: rotVel,
            isBase: false
        });

        // Spawn bright sparks and straw flying debris
        this.spawnSparks(topMesh.position.clone(), slideDirection);

        // Respawn next target after a brief pause
        setTimeout(() => {
            if (this.active) {
                const nextType = Math.random() > 0.5 ? 'tatami' : 'bamboo';
                this.spawnTarget(nextType);
            }
        }, 1400);
    }

    spawnSparks(origin, direction) {
        const count = 35;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = origin.x;
            positions[i * 3 + 1] = origin.y;
            positions[i * 3 + 2] = origin.z;

            velocities.push(new THREE.Vector3(
                direction * (2 + Math.random() * 4),
                (Math.random() - 0.2) * 4,
                (Math.random() - 0.5) * 3
            ));
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xffd266, // Fiery gold sparks
            size: 0.08,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(geom, mat);
        this.scene.add(points);

        this.sparks.push({
            mesh: points,
            velocities: velocities,
            life: 0.6
        });
    }

    showSliceNotice(grade, sub, details) {
        const banner = document.getElementById('slice-banner');
        if (!banner) return;
        banner.innerHTML = `
            <div class="slice-grade">${grade}</div>
            <div class="slice-sub">${sub}</div>
            <div class="slice-details">${details}</div>
        `;
        banner.classList.remove('hidden');
        banner.classList.add('pop-in');

        clearTimeout(this.bannerTimeout);
        this.bannerTimeout = setTimeout(() => {
            banner.classList.add('hidden');
            banner.classList.remove('pop-in');
        }, 1500);
    }

    updateHUD() {
        const scoreEl = document.getElementById('dojo-score');
        const comboEl = document.getElementById('dojo-combo');
        if (scoreEl) scoreEl.innerText = this.score;
        if (comboEl) comboEl.innerText = `x${this.combo}`;
    }

    update(delta) {
        if (!this.active) return;

        // Physics for sliced falling parts
        for (let i = this.slicedParts.length - 1; i >= 0; i--) {
            const part = this.slicedParts[i];
            if (part.isBase) continue;

            part.vel.y -= 9.8 * delta; // Gravity
            part.mesh.position.addScaledVector(part.vel, delta);

            part.mesh.rotation.x += part.rotVel.x * delta;
            part.mesh.rotation.y += part.rotVel.y * delta;
            part.mesh.rotation.z += part.rotVel.z * delta;

            // Floor collision
            if (part.mesh.position.y < -2.0) {
                part.mesh.position.y = -2.0;
                part.vel.set(0, 0, 0);
                part.rotVel.set(0, 0, 0);
            }
        }

        // Sparks physics & fading
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const sp = this.sparks[i];
            sp.life -= delta;
            if (sp.life <= 0) {
                this.scene.remove(sp.mesh);
                this.sparks.splice(i, 1);
                continue;
            }

            const pos = sp.mesh.geometry.attributes.position.array;
            for (let j = 0; j < sp.velocities.length; j++) {
                sp.velocities[j].y -= 8.0 * delta;
                pos[j * 3 + 0] += sp.velocities[j].x * delta;
                pos[j * 3 + 1] += sp.velocities[j].y * delta;
                pos[j * 3 + 2] += sp.velocities[j].z * delta;
            }
            sp.mesh.geometry.attributes.position.needsUpdate = true;
            sp.mesh.material.opacity = sp.life / 0.6;
        }

        // Update sword trail line
        if (this.trailLine) {
            const count = this.trailPoints.length;
            const posAttr = this.trailLine.geometry.attributes.position;
            const colAttr = this.trailLine.geometry.attributes.color;

            for (let i = 0; i < count; i++) {
                const pt = this.trailPoints[i];
                pt.age += delta;
                posAttr.setXYZ(i, pt.pos.x, pt.pos.y, pt.pos.z);

                const alpha = Math.max(0, 1 - pt.age / 0.35);
                // Luminescent blade energy color (cyan-gold)
                colAttr.setXYZ(i, 0.4 * alpha, 0.9 * alpha, 1.0 * alpha);
            }
            for (let i = count; i < 25; i++) {
                if (count > 0) {
                    const last = this.trailPoints[count - 1];
                    posAttr.setXYZ(i, last.pos.x, last.pos.y, last.pos.z);
                    colAttr.setXYZ(i, 0, 0, 0);
                }
            }

            posAttr.needsUpdate = true;
            colAttr.needsUpdate = true;

            // Fade points
            this.trailPoints = this.trailPoints.filter(p => p.age < 0.35);
        }
    }
}

window.TameshigiriDojo = TameshigiriDojo;
