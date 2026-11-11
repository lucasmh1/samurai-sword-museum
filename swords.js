/**
 * Procedural 3D Japanese Sword Generator (Nihonto System)
 * Generates anatomically accurate Katana, Wakizashi, Tanto, Nodachi, Naginata, and Shirasaya.
 * Supports curvature (sori), hamon temper lines, ray-skin, wrapped tsuka, and scabbards (saya).
 */

class SwordGenerator {
    constructor() {
        this.textureCache = {};
    }

    // Generate procedural Hamon and Tamahagane folded steel texture
    createBladeTexture(hamonType = 'notare') {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Steel base: subtle horizontal folded grain (hada)
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#f2f6fa'); // Shinogi / ridge reflection
        grad.addColorStop(0.35, '#c5d1dc'); // Mune side
        grad.addColorStop(0.55, '#9aaab8'); // Ha side baseline
        grad.addColorStop(1.0, '#eaf1f7'); // Cutting edge (Ha) mirror polish
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 256);

        // Folded steel wood-grain (Itame hada)
        ctx.fillStyle = 'rgba(100, 120, 140, 0.04)';
        for (let i = 0; i < 400; i++) {
            const y = Math.random() * 256;
            const w = 50 + Math.random() * 200;
            const h = 0.5 + Math.random() * 1.5;
            ctx.fillRect(Math.random() * 1024, y, w, h);
        }

        // Draw Hamon line (differential hardening martensite crystal zone)
        ctx.save();
        ctx.beginPath();
        const baseY = 165;
        ctx.moveTo(0, baseY);

        for (let x = 0; x <= 1024; x += 8) {
            let offset = 0;
            if (hamonType === 'suguha') {
                // Straight classic hamon with tiny natural micro-variations
                offset = Math.sin(x * 0.05) * 2;
            } else if (hamonType === 'notare') {
                // Gentle rolling ocean waves
                offset = Math.sin(x * 0.015) * 16 + Math.sin(x * 0.04) * 8;
            } else if (hamonType === 'midare') {
                // Wild irregular turbulent waves
                offset = Math.sin(x * 0.03) * 20 + Math.cos(x * 0.07) * 14 + (Math.random() - 0.5) * 6;
            } else if (hamonType === 'gunome') {
                // Regular undulating rounded clove peaks
                offset = Math.abs(Math.sin(x * 0.05)) * 24 - 10;
            }
            ctx.lineTo(x, baseY + offset);
        }
        ctx.lineTo(1024, 256);
        ctx.lineTo(0, 256);
        ctx.closePath();

        // Hamon zone: brighter, crystalline, frosted steel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.fill();

        // Habuchi (crystalline border line of bright Nie / Nioi crystals)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 3;
        ctx.filter = 'blur(1px)';
        ctx.stroke();
        ctx.restore();

        // Kissaki (tip temper line - Boshi)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(1000, 160, 25, 0, Math.PI * 2);
        ctx.fill();

        // Engraving / Horimono near tang (dragon / Buddhist kanji)
        ctx.font = 'bold 16px "Noto Serif JP", serif';
        ctx.fillStyle = 'rgba(40, 50, 60, 0.35)';
        ctx.fillText('奉神 八幡大菩薩', 60, 100);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    }

    // Procedural Samegawa (Rayskin) bumpy texture for Tsuka
    createRayskinTexture() {
        if (this.textureCache.rayskin) return this.textureCache.rayskin;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f6f3eb';
        ctx.fillRect(0, 0, 256, 256);

        // Nodules / beads
        for (let i = 0; i < 900; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const r = 1.5 + Math.random() * 2.5;

            const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.7, '#ded8cb');
            g.addColorStop(1, '#b0a898');
            ctx.fillStyle = g;

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 8);
        this.textureCache.rayskin = tex;
        return tex;
    }

    // Procedural Tsuka-ito diamond wrap pattern texture
    createTsukaItoTexture(cordColor = '#111318') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = cordColor;
        ctx.fillRect(0, 0, 256, 256);

        // Diamond criss-cross cord weave lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 4;
        for (let x = -256; x < 512; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 256, 256);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, 256);
            ctx.lineTo(x + 256, 0);
            ctx.stroke();
        }

        // Diamond center opening revealing samegawa
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 6);
        return tex;
    }

    // Procedural Urushi lacquer & Maki-e gold dust texture for Saya
    createSayaTexture(style = 'black') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        if (style === 'black') {
            // Piano black roiro lacquer with subtle gold dust flakes
            ctx.fillStyle = '#0a0b0d';
            ctx.fillRect(0, 0, 512, 512);

            // Maki-e gold flakes
            for (let i = 0; i < 300; i++) {
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                const size = 1 + Math.random() * 2;
                ctx.fillStyle = Math.random() > 0.4 ? 'rgba(230, 190, 80, 0.6)' : 'rgba(255, 220, 120, 0.8)';
                ctx.fillRect(x, y, size, size);
            }
        } else if (style === 'crimson') {
            // Shu-urushi crimson lacquer with dark wood grain
            const grad = ctx.createLinearGradient(0, 0, 512, 512);
            grad.addColorStop(0, '#5a0a0d');
            grad.addColorStop(0.5, '#7f1318');
            grad.addColorStop(1, '#42080a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 512);

            ctx.fillStyle = 'rgba(20, 0, 0, 0.15)';
            for (let i = 0; i < 40; i++) {
                ctx.fillRect(0, Math.random() * 512, 512, 4 + Math.random() * 8);
            }
        } else if (style === 'wood') {
            // Raw polished Honoki magnolia wood (Shirasaya style)
            const grad = ctx.createLinearGradient(0, 0, 512, 0);
            grad.addColorStop(0, '#dfcfb5');
            grad.addColorStop(0.3, '#c9b79b');
            grad.addColorStop(0.7, '#e8dcbf');
            grad.addColorStop(1, '#d5c4a8');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 512);

            // Wood grain rings
            ctx.fillStyle = 'rgba(150, 120, 80, 0.12)';
            for (let i = 0; i < 150; i++) {
                const y = Math.random() * 512;
                ctx.fillRect(0, y, 512, 1 + Math.random() * 2);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 4);
        return tex;
    }

    /**
     * Build an authentic curved Japanese sword blade geometry with Nakago (tang)
     */
    buildBladeGeometry(bladeLength, bladeWidth, soriCurvature, tipLength) {
        const segments = 36;
        const geom = new THREE.BufferGeometry();
        const positions = [];
        const normals = [];
        const uvs = [];

        // Generate cross-sectional vertices along the curved spine
        // Shinogi-zukuri cross section: Mune (spine), Shinogi (ridge), Ha (cutting edge)
        const spineCurve = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = t * bladeLength;
            // Parabolic curve for authentic Sori curvature
            const y = Math.sin(t * Math.PI * 0.85) * soriCurvature;
            spineCurve.push({ x, y, t });
        }

        // Cross-section profiles:
        // P0: Mune top (spine)
        // P1: Left Shinogi ridge
        // P2: Right Shinogi ridge
        // P3: Ha bottom (sharp edge)
        const verticesGrid = [];

        for (let i = 0; i <= segments; i++) {
            const { x, y, t } = spineCurve[i];
            // Taper towards the kissaki (tip)
            const taper = t > 0.85 ? 1.0 - (t - 0.85) / 0.15 * 0.7 : 1.0;
            const halfW = (bladeWidth * 0.5) * taper;
            const thick = 0.022 * taper;

            // If at the very tip point
            if (i === segments) {
                verticesGrid.push([
                    new THREE.Vector3(x + tipLength, y + 0.01, 0),
                    new THREE.Vector3(x + tipLength, y + 0.01, 0),
                    new THREE.Vector3(x + tipLength, y + 0.01, 0),
                    new THREE.Vector3(x + tipLength, y + 0.01, 0)
                ]);
            } else {
                verticesGrid.push([
                    new THREE.Vector3(x, y + halfW * 0.45, 0),             // Mune (spine)
                    new THREE.Vector3(x, y + halfW * 0.1, thick * 0.6),    // Left Shinogi
                    new THREE.Vector3(x, y + halfW * 0.1, -thick * 0.6),   // Right Shinogi
                    new THREE.Vector3(x, y - halfW * 0.55, 0)              // Ha (sharp edge)
                ]);
            }
        }

        // Triangulate between segment i and i+1
        const indices = [];
        for (let i = 0; i < segments; i++) {
            const row1 = i * 4;
            const row2 = (i + 1) * 4;

            // Mune bevel left: row1[0], row2[0], row2[1], row1[1]
            indices.push(row1 + 0, row2 + 0, row2 + 1);
            indices.push(row1 + 0, row2 + 1, row1 + 1);

            // Ha bevel left (cutting edge with hamon!): row1[1], row2[1], row2[3], row1[3]
            indices.push(row1 + 1, row2 + 1, row2 + 3);
            indices.push(row1 + 1, row2 + 3, row1 + 3);

            // Mune bevel right: row1[0], row1[2], row2[2]; row1[0], row2[2], row2[0]
            indices.push(row1 + 0, row1 + 2, row2 + 2);
            indices.push(row1 + 0, row2 + 2, row2 + 0);

            // Ha bevel right: row1[2], row1[3], row2[3]; row1[2], row2[3], row2[2]
            indices.push(row1 + 2, row1 + 3, row2 + 3);
            indices.push(row1 + 2, row2 + 3, row2 + 2);
        }

        // Push positions & compute UVs
        for (let i = 0; i <= segments; i++) {
            const u = i / segments;
            const quad = verticesGrid[i];
            for (let j = 0; j < 4; j++) {
                positions.push(quad[j].x, quad[j].y, quad[j].z);
                const v = j / 3.0;
                uvs.push(u, v);
            }
        }

        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geom.setIndex(indices);
        geom.computeVertexNormals();

        return geom;
    }

    /**
     * Build the hidden Nakago (tang) with smith signature and peg hole
     */
    buildNakago(length = 0.55, width = 0.08) {
        const nakagoGroup = new THREE.Group();
        nakagoGroup.name = "Nakago (Tang)";

        const geom = new THREE.BoxGeometry(length, width, 0.016);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x4a433a, // Aged oxidized raw steel with natural patina
            roughness: 0.8,
            metalness: 0.5
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.x = -length * 0.5;
        nakagoGroup.add(mesh);

        // Mekugi-ana (peg hole)
        const holeGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.02, 16);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const hole = new THREE.Mesh(holeGeom, holeMat);
        hole.rotation.x = Math.PI / 2;
        hole.position.set(-length * 0.45, 0, 0);
        nakagoGroup.add(hole);

        return nakagoGroup;
    }

    /**
     * Build Habaki (blade collar)
     */
    buildHabaki(width = 0.1, length = 0.09, metalType = 'gold') {
        const group = new THREE.Group();
        group.name = "Habaki (Collar)";

        const habakiGeom = new THREE.BoxGeometry(length, width * 1.15, 0.038);
        const color = metalType === 'gold' ? 0xd4af37 : (metalType === 'copper' ? 0xb87333 : 0xcccccc);
        const habakiMat = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.9,
            roughness: 0.25
        });
        const mesh = new THREE.Mesh(habakiGeom, habakiMat);
        mesh.position.x = length * 0.5;
        group.add(mesh);

        // Decorative diagonal file marks (Neko-gaki cat scratches)
        const ringGeom = new THREE.TorusGeometry(0.025, 0.003, 8, 16);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xaa8822, metalness: 0.9, roughness: 0.3 });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = length * 0.5;
        group.add(ring);

        return group;
    }

    /**
     * Build Tsuba (Handguard) with authentic Sukashi pierced patterns
     */
    buildTsuba(radius = 0.18, shape = 'marugata', theme = 'dragon') {
        const group = new THREE.Group();
        group.name = "Tsuba (Guard)";

        // Iron plate
        const tsubaGeom = new THREE.CylinderGeometry(radius, radius, 0.02, 32);
        const tsubaMat = new THREE.MeshStandardMaterial({
            color: 0x222224, // Blackened patinated forged iron
            roughness: 0.6,
            metalness: 0.75
        });
        const tsuba = new THREE.Mesh(tsubaGeom, tsubaMat);
        tsuba.rotation.z = Math.PI / 2;
        group.add(tsuba);

        // Rim lip (Fukurin)
        const rimGeom = new THREE.TorusGeometry(radius, 0.008, 12, 32);
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xc89d30, // Gold gilt rim inlay
            roughness: 0.3,
            metalness: 0.9
        });
        const rim = new THREE.Mesh(rimGeom, rimMat);
        rim.rotation.y = Math.PI / 2;
        group.add(rim);

        // Sukashi cutouts (pierced openwork)
        const cutoutGeom = new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, 0.024, 16);
        const cutoutMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
        const cutout1 = new THREE.Mesh(cutoutGeom, cutoutMat);
        cutout1.rotation.z = Math.PI / 2;
        cutout1.position.set(0, radius * 0.45, 0);
        group.add(cutout1);

        const cutout2 = cutout1.clone();
        cutout2.position.set(0, -radius * 0.45, 0);
        group.add(cutout2);

        // Seppa (brass washers on each side of tsuba)
        const seppaGeom = new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, 0.006, 24);
        const seppaMat = new THREE.MeshStandardMaterial({ color: 0xb58925, metalness: 0.9, roughness: 0.3 });

        const seppaFront = new THREE.Mesh(seppaGeom, seppaMat);
        seppaFront.name = "Seppa (Spacer Front)";
        seppaFront.rotation.z = Math.PI / 2;
        seppaFront.position.x = 0.013;
        group.add(seppaFront);

        const seppaBack = new THREE.Mesh(seppaGeom, seppaMat);
        seppaBack.name = "Seppa (Spacer Back)";
        seppaBack.rotation.z = Math.PI / 2;
        seppaBack.position.x = -0.013;
        group.add(seppaBack);

        return group;
    }

    /**
     * Build Tsuka (Hilt / Handle) with Samegawa rayskin and braided Tsuka-ito cord
     */
    buildTsuka(length = 0.65, width = 0.09, cordColor = '#111318') {
        const group = new THREE.Group();
        group.name = "Tsuka (Hilt)";

        // Handle core covered in Samegawa ray-skin
        const rayskinTex = this.createRayskinTexture();
        const tsukaGeom = new THREE.CylinderGeometry(width * 0.48, width * 0.52, length, 24);
        const tsukaMat = new THREE.MeshStandardMaterial({
            map: rayskinTex,
            roughness: 0.5,
            metalness: 0.05
        });
        const handleCore = new THREE.Mesh(tsukaGeom, tsukaMat);
        handleCore.rotation.z = Math.PI / 2;
        handleCore.position.x = -length * 0.5;
        group.add(handleCore);

        // Tsuka-ito diamond wrap rings over ray skin
        const itoTex = this.createTsukaItoTexture(cordColor);
        const itoGeom = new THREE.CylinderGeometry(width * 0.53, width * 0.55, length * 0.94, 24);
        const itoMat = new THREE.MeshStandardMaterial({
            map: itoTex,
            roughness: 0.7,
            metalness: 0.1,
            transparent: true,
            opacity: 0.96
        });
        const itoWrap = new THREE.Mesh(itoGeom, itoMat);
        itoWrap.rotation.z = Math.PI / 2;
        itoWrap.position.x = -length * 0.5;
        group.add(itoWrap);

        // Fuchi (collar at tsuba junction)
        const fuchiGeom = new THREE.CylinderGeometry(width * 0.55, width * 0.55, 0.035, 24);
        const fittingsMat = new THREE.MeshStandardMaterial({
            color: 0x1f2022,
            metalness: 0.85,
            roughness: 0.35
        });
        const fuchi = new THREE.Mesh(fuchiGeom, fittingsMat);
        fuchi.rotation.z = Math.PI / 2;
        fuchi.position.x = -0.02;
        group.add(fuchi);

        // Kashira (buttcap / pommel)
        const kashiraGeom = new THREE.CylinderGeometry(width * 0.5, width * 0.48, 0.035, 24);
        const kashira = new THREE.Mesh(kashiraGeom, fittingsMat);
        kashira.rotation.z = Math.PI / 2;
        kashira.position.x = -length + 0.015;
        group.add(kashira);

        // Menuki (ornamental gold dragon charm under the braid)
        const menukiGeom = new THREE.SphereGeometry(0.018, 12, 12);
        menukiGeom.scale(2.2, 0.7, 0.7);
        const menukiMat = new THREE.MeshStandardMaterial({
            color: 0xdeb838, // Antique Gold
            metalness: 0.95,
            roughness: 0.25
        });
        const menuki1 = new THREE.Mesh(menukiGeom, menukiMat);
        menuki1.name = "Menuki (Charm)";
        menuki1.position.set(-length * 0.4, 0, width * 0.52);
        group.add(menuki1);

        const menuki2 = menuki1.clone();
        menuki2.position.set(-length * 0.7, 0, -width * 0.52);
        group.add(menuki2);

        // Mekugi (bamboo pin locking nakago)
        const mekugiGeom = new THREE.CylinderGeometry(0.01, 0.01, width * 1.1, 12);
        const mekugiMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3b, roughness: 0.8 });
        const mekugi = new THREE.Mesh(mekugiGeom, mekugiMat);
        mekugi.name = "Mekugi (Bamboo Peg)";
        mekugi.rotation.x = Math.PI / 2;
        mekugi.position.set(-length * 0.25, 0, 0);
        group.add(mekugi);

        return group;
    }

    /**
     * Build Saya (Scabbard / Sheath) matching the exact curvature of the blade
     */
    buildSaya(bladeLength, bladeWidth, soriCurvature, lacquerStyle = 'black') {
        const group = new THREE.Group();
        group.name = "Saya (Scabbard)";

        const segments = 32;
        const curvePoints = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = t * (bladeLength + 0.08);
            const y = Math.sin(t * Math.PI * 0.85) * soriCurvature;
            curvePoints.push(new THREE.Vector3(x, y, 0));
        }

        const curve = new THREE.CatmullRomCurve3(curvePoints);
        const tubeGeom = new THREE.TubeGeometry(curve, 32, bladeWidth * 0.65, 16, false);
        tubeGeom.scale(1, 0.7, 0.5); // Flattened elliptical cross section

        const sayaTex = this.createSayaTexture(lacquerStyle);
        const sayaMat = new THREE.MeshStandardMaterial({
            map: sayaTex,
            roughness: lacquerStyle === 'wood' ? 0.45 : 0.08,
            metalness: lacquerStyle === 'wood' ? 0.02 : 0.25,
            clearcoat: lacquerStyle === 'wood' ? 0.1 : 0.95,
            clearcoatRoughness: 0.05
        });

        const scabbardMesh = new THREE.Mesh(tubeGeom, sayaMat);
        group.add(scabbardMesh);

        // Koiguchi (mouth of scabbard - buffalo horn or brass)
        const koiguchiGeom = new THREE.TorusGeometry(bladeWidth * 0.42, 0.015, 12, 24);
        const koiguchiMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3 });
        const koiguchi = new THREE.Mesh(koiguchiGeom, koiguchiMat);
        koiguchi.name = "Koiguchi (Scabbard Mouth)";
        koiguchi.rotation.y = Math.PI / 2;
        koiguchi.scale.set(1, 1.4, 0.8);
        group.add(koiguchi);

        // Kurikata (knob for sageo cord)
        const kurikataGeom = new THREE.BoxGeometry(0.06, 0.04, 0.035);
        const kurikata = new THREE.Mesh(kurikataGeom, koiguchiMat);
        kurikata.name = "Kurikata (Cord Knob)";
        kurikata.position.set(bladeLength * 0.14, bladeWidth * 0.45, 0.02);
        group.add(kurikata);

        // Sageo (wrapped silk cord around kurikata)
        const sageoGeom = new THREE.TorusGeometry(0.04, 0.014, 12, 24);
        const sageoMat = new THREE.MeshStandardMaterial({
            color: lacquerStyle === 'crimson' ? 0x222222 : 0x9b7a42,
            roughness: 0.75
        });
        const sageo = new THREE.Mesh(sageoGeom, sageoMat);
        sageo.name = "Sageo (Silk Cord)";
        sageo.position.copy(kurikata.position);
        sageo.rotation.z = Math.PI / 4;
        group.add(sageo);

        // Kojiri (protective end cap)
        const kojiriGeom = new THREE.SphereGeometry(bladeWidth * 0.35, 16, 16);
        kojiriGeom.scale(0.8, 1.1, 0.6);
        const kojiri = new THREE.Mesh(kojiriGeom, koiguchiMat);
        kojiri.name = "Kojiri (End Cap)";
        const endPt = curvePoints[curvePoints.length - 1];
        kojiri.position.set(endPt.x, endPt.y, endPt.z);
        group.add(kojiri);

        return group;
    }

    /**
     * Build the Complete Samurai Sword Set (Blade + Hilt + Saya)
     */
    createSword(typeKey = 'katana', hamonType = 'notare') {
        const rootGroup = new THREE.Group();
        rootGroup.name = typeKey;

        // Configuration specs for each traditional blade type
        const specs = {
            katana: {
                name: 'Katana (刀)',
                era: 'Muromachi / Edo Period',
                smith: 'Gassan Sadatoshi (月山貞利)',
                bladeLength: 2.2,
                bladeWidth: 0.088,
                soriCurvature: 0.14,
                tipLength: 0.08,
                tsukaLength: 0.75,
                tsukaWidth: 0.082,
                tsubaRadius: 0.18,
                lacquer: 'black',
                cordColor: '#121418',
                description: 'The iconic soul of the samurai. Balanced for two-handed strikes and lightning-fast quick-draw cuts (Iaijutsu).'
            },
            wakizashi: {
                name: 'Wakizashi (脇差)',
                era: 'Edo Period (Daisho Pair)',
                smith: 'Horikawa Kunihiro (堀川国広)',
                bladeLength: 1.4,
                bladeWidth: 0.078,
                soriCurvature: 0.11,
                tipLength: 0.065,
                tsukaLength: 0.52,
                tsukaWidth: 0.075,
                tsubaRadius: 0.15,
                lacquer: 'crimson',
                cordColor: '#2b1b17',
                description: 'The sidearm companion to the katana. Permitted indoors where katana were surrendered, and ideal for close-quarter combat.'
            },
            tanto: {
                name: 'Tanto (短刀)',
                era: 'Kamakura Period',
                smith: 'Awataguchi Yoshimitsu (粟田口吉光)',
                bladeLength: 0.85,
                bladeWidth: 0.072,
                soriCurvature: 0.04,
                tipLength: 0.055,
                tsukaLength: 0.42,
                tsukaWidth: 0.068,
                tsubaRadius: 0.12,
                lacquer: 'crimson',
                cordColor: '#3a201c',
                description: 'A lethal armor-piercing dagger. Worn tucked into the obi sash, revered for ceremonial purity and supreme craftsmanship.'
            },
            nodachi: {
                name: 'Nodachi / Odachi (野太刀)',
                era: 'Nanboku-chō Battlefield Era',
                smith: 'Bizen Osafune Tomomitsu (備前長船友光)',
                bladeLength: 3.4,
                bladeWidth: 0.12,
                soriCurvature: 0.28,
                tipLength: 0.14,
                tsukaLength: 1.25,
                tsukaWidth: 0.105,
                tsubaRadius: 0.24,
                lacquer: 'black',
                cordColor: '#0a0d14',
                description: 'A monumental two-handed battlefield great sword capable of slicing through cavalry and pike formations in open war.'
            },
            shirasaya: {
                name: 'Shirasaya (白鞘)',
                era: 'Meiji Restoration Era',
                smith: 'Masamune Okisaki (正宗)',
                bladeLength: 2.15,
                bladeWidth: 0.085,
                soriCurvature: 0.13,
                tipLength: 0.075,
                tsukaLength: 0.72,
                tsukaWidth: 0.08,
                tsubaRadius: 0.0, // No handguard! Minimalist resting mount
                lacquer: 'wood',
                cordColor: '#cfbe9e',
                description: 'Pristine "white scabbard" crafted from unlacquered Honoki magnolia wood to store and preserve prized masterwork blades.'
            },
            naginata: {
                name: 'Naginata Blade (薙刀)',
                era: 'Heian / Muromachi Period',
                smith: 'Nagayoshi (長吉)',
                bladeLength: 1.7,
                bladeWidth: 0.11,
                soriCurvature: 0.22,
                tipLength: 0.12,
                tsukaLength: 1.8, // Polearm shaft
                tsukaWidth: 0.065,
                tsubaRadius: 0.14,
                lacquer: 'black',
                cordColor: '#1a1820',
                description: 'The curved polearm blade famous for sweeping strikes on horseback, favored by warrior monks (Sohei) and samurai women (Onna-musha).'
            }
        };

        const spec = specs[typeKey] || specs.katana;
        rootGroup.userData.spec = spec;

        // 1. Blade assembly (Blade + Nakago + Habaki + Tsuka + Tsuba)
        const bladeAssembly = new THREE.Group();
        bladeAssembly.name = "BladeAssembly";

        // Steel Blade Mesh
        const bladeGeom = this.buildBladeGeometry(spec.bladeLength, spec.bladeWidth, spec.soriCurvature, spec.tipLength);
        const bladeTex = this.createBladeTexture(hamonType);
        const bladeMat = new THREE.MeshStandardMaterial({
            map: bladeTex,
            metalness: 0.95,
            roughness: 0.18,
            envMapIntensity: 1.8
        });
        const bladeMesh = new THREE.Mesh(bladeGeom, bladeMat);
        bladeMesh.name = "Ha (Blade Edge & Spine)";
        bladeMesh.castShadow = true;
        bladeAssembly.add(bladeMesh);

        // Nakago (tang)
        const nakago = this.buildNakago(spec.tsukaLength * 0.75, spec.bladeWidth * 0.85);
        bladeAssembly.add(nakago);

        // Habaki (collar)
        const habaki = this.buildHabaki(spec.bladeWidth, 0.09, typeKey === 'shirasaya' ? 'copper' : 'gold');
        bladeAssembly.add(habaki);

        // Tsuba (guard - omitted on shirasaya)
        let tsuba = null;
        if (spec.tsubaRadius > 0.05) {
            tsuba = this.buildTsuba(spec.tsubaRadius);
            bladeAssembly.add(tsuba);
        }

        // Tsuka (hilt)
        const tsuka = this.buildTsuka(spec.tsukaLength, spec.tsukaWidth, spec.cordColor);
        bladeAssembly.add(tsuka);

        rootGroup.add(bladeAssembly);

        // 2. Saya (Scabbard)
        const saya = this.buildSaya(spec.bladeLength, spec.bladeWidth, spec.soriCurvature, spec.lacquer);
        rootGroup.add(saya);

        // Store references for animations (sheathing / exploded views)
        rootGroup.userData.components = {
            bladeAssembly,
            bladeMesh,
            nakago,
            habaki,
            tsuba,
            tsuka,
            saya
        };

        // Center sword in scene
        rootGroup.position.set(-spec.bladeLength * 0.35, 0, 0);

        return rootGroup;
    }
}

window.swordGenerator = new SwordGenerator();
