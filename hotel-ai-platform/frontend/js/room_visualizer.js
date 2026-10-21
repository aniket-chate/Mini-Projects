/**
 * Hotel Grand Bangalore — Interactive 3D WebGL Room Visualizer & Hybrid Photography Stage
 * Inspired by Taj Bangalore Luxury & Grand Emily Hotel Architecture
 */

class RoomVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentFilter = 'all';
        this.roomsData = [];
        this.current3DRoomType = 'Suite';
        this.currentLighting = 'sunset';
        this.currentCameraView = 'isometric';
        this.currentStageView = '3d'; // '3d', 'gallery', 'specs'

        // Three.js Scene Variables
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.roomGroup = null;
        this.pointLights = [];
        this.ambientLight = null;
        this.dirLight = null;
        this.hotspotObjects = [];
        this.is3DInitialized = false;

        // High-Resolution Luxury Room Photography Catalog & Specs (Taj Bangalore Heritage)
        this.roomImagery = {
            'Single': {
                name: 'Deluxe Single Sanctuary',
                tagline: 'Private garden-view retreat for the distinguished solo traveler',
                main: '/static/assets/rooms/single_101_main.jpg',
                gallery: [
                    { title: 'Plush Linen Queen Bed', url: '/static/assets/rooms/single_101_main.jpg' },
                    { title: 'Italian Marble Bathroom & Rain Shower', url: '/static/assets/rooms/single_101_bath.jpg' },
                    { title: 'Executive Ergonomic Workstation', url: '/static/assets/rooms/single_101_work.jpg' }
                ],
                specs: '1 Guest · 1 Queen Bed · 32 m² / 345 sq.ft · Courtyard Garden View',
                description: 'A thoughtfully appointed private sanctuary featuring hand-tufted carpets, an ergonomic walnut workstation, high-speed fiber connectivity, and a Serpeggiante marble bath with Forest Essentials amenities.',
                privileges: ['High-speed Wi-Fi', 'Courtyard Garden View', 'Rain Shower & Tub', '24/7 Room Service']
            },
            'Double': {
                name: 'Grand Double Suite',
                tagline: 'Expansive twin-queen sanctuary with skyline views',
                main: '/static/assets/rooms/double_201_main.jpg',
                gallery: [
                    { title: 'Dual Plush Custom Queen Beds', url: '/static/assets/rooms/double_201_main.jpg' },
                    { title: 'Sunlit Panoramic Lounge Alcove', url: '/static/assets/rooms/double_201_alcove.jpg' },
                    { title: 'Spacious Dressing Salon', url: '/static/assets/rooms/double_201_salon.jpg' }
                ],
                specs: '2 Guests · 2 Queen Beds · 42 m² / 450 sq.ft · Skyline & Atrium View',
                description: 'Filled with natural daylight through double-glazed soundproof windows, our Grand Double Suite features two custom-crafted queen beds, ambient mood lighting, a dedicated lounge alcove, and bespoke artisan bath rituals.',
                privileges: ['Dual Plush Queens', 'Skyline & Atrium View', 'Soundproof Glazing', '4K Smart Entertainment']
            },
            'Deluxe': {
                name: 'Executive Deluxe Suite',
                tagline: 'Private botanical terrace with acoustic soundproofing',
                main: '/static/assets/rooms/deluxe_301_main.jpg',
                gallery: [
                    { title: 'King Bed in 400-Thread Cotton', url: '/static/assets/rooms/deluxe_301_main.jpg' },
                    { title: 'Private Garden Verandah', url: '/static/assets/rooms/deluxe_301_balcony.jpg' },
                    { title: 'Four-Fixture Italian Marble Bath', url: '/static/assets/rooms/deluxe_301_bath.jpg' }
                ],
                specs: '2 Guests · 1 Royal King Bed · 54 m² / 580 sq.ft · Private Balcony Terrace',
                description: 'Our signature Deluxe Suite offers expansive luxury with a private garden balcony, bespoke king mattress wrapped in 400-thread-count Egyptian cotton, acoustic soundproofing, and automated climate presets.',
                privileges: ['Private Garden Balcony', 'Taj Club Privilege', 'Four-Fixture Marble Bath', 'Automated Mood Lighting']
            },
            'Suite': {
                name: 'Presidential Runway Suite',
                tagline: 'The ultimate royal sanctuary with runway & airfield panorama',
                main: '/static/assets/rooms/suite_401_main.jpg',
                gallery: [
                    { title: 'Presidential Master Suite Parlor', url: '/static/assets/rooms/suite_401_main.jpg' },
                    { title: 'Hydrotherapy Jacuzzi & Marble Spa', url: '/static/assets/rooms/suite_401_jacuzzi.jpg' },
                    { title: 'Private Dining Salon & Bar', url: '/static/assets/rooms/suite_401_dining.jpg' }
                ],
                specs: '4 Guests · 1 Presidential King · 92 m² / 1,000 sq.ft · Airfield & Sunset Vistas',
                description: 'The pinnacle of luxury hospitality. Spanning our top floor with panoramic Bangalore airport runway vistas, a master bedroom, deep soaking jacuzzi, walk-in dressing salon, separate entertaining parlor, and 24/7 Butler service.',
                privileges: ['24/7 Dedicated Butler', 'Taj Club Lounge Access', 'Hydrotherapy Jacuzzi Spa', 'Private Aviation Limousine']
            }
        };

        // Hotspots catalog for 3D exploration
        this.hotspotsCatalog = {
            'Suite': [
                {
                    title: '👑 Presidential King Bed',
                    desc: 'Wrap yourself in 600-thread-count organic Egyptian cotton with posture-contouring memory matrix.',
                    pos: [0, 1.2, -0.5]
                },
                {
                    title: '🛁 Hydrotherapy Jacuzzi Spa',
                    desc: 'Integrated ambient chromotherapy, aromatic eucalyptus bath salts, and hydro-massage jets.',
                    pos: [-3.2, 1.0, -1.8]
                },
                {
                    title: '🌆 Panoramic Runway Balcony',
                    desc: 'Floor-to-ceiling soundproof glass slider opening to private runway & sunset vistas.',
                    pos: [0, 1.5, 3.8]
                },
                {
                    title: '🤖 NOVA AI Butler Terminal',
                    desc: 'Voice and sensory control for climate, ambient soundscapes, and room service.',
                    pos: [2.5, 1.2, -2.5]
                }
            ],
            'Deluxe': [
                {
                    title: '✦ Executive King Suite',
                    desc: 'Custom engineered acoustic soundproofing and artisanal dark walnut platform bed.',
                    pos: [0, 1.2, -0.5]
                },
                {
                    title: '🌿 Botanical Balcony Alcove',
                    desc: 'Lush botanical garden terrace overlooking the private hotel courtyard sanctuary.',
                    pos: [0, 1.5, 3.8]
                }
            ],
            'Double': [
                {
                    title: '✦ Twin Deluxe Queens',
                    desc: 'Dual plush queen beds with independent touchless reading lights.',
                    pos: [0, 1.2, -0.5]
                }
            ],
            'Single': [
                {
                    title: '✦ Solo Sanctuary Bed',
                    desc: 'Ergonomic luxury mattress with ultra-fast fiber optic workstation.',
                    pos: [0, 1.2, -0.5]
                }
            ]
        };
    }

    async init() {
        await this.loadRooms();
        this.bindFilterEvents();
        this.init3DScene();
        this.bind3DControls();
        this.bindHybridStageControls();
    }

    // =========================================================================
    // 3D THREE.JS WEBGL ROOM SCENE
    // =========================================================================
    init3DScene() {
        const canvas = document.getElementById('roomThreeCanvas');
        if (!canvas || typeof THREE === 'undefined') {
            console.warn("Three.js not found or canvas missing.");
            return;
        }

        try {
            const width = canvas.parentElement.clientWidth || 800;
            const height = canvas.parentElement.clientHeight || 560;

            // 1. Scene & Camera
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x060908);
            this.scene.fog = null;

            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            this.setCameraPreset('isometric');

            // 2. Renderer
            this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // 3. Orbit Controls
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
                this.controls.minDistance = 4;
                this.controls.maxDistance = 22;
                this.controls.target.set(0, 1.2, 0);
            }

            // 4. Lights Setup
            this.setup3DLights();

            // 5. Build Room Architecture
            this.build3DRoom(this.current3DRoomType);

            // 6. Handle Window Resize
            window.addEventListener('resize', () => {
                if (!canvas.parentElement) return;
                const w = canvas.parentElement.clientWidth;
                const h = canvas.parentElement.clientHeight;
                this.camera.aspect = w / h;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(w, h);
            });

            // 7. Raycaster for 3D Hotspot Interactivity
            this.setupHotspotRaycasting(canvas);

            // 8. Animation Loop
            this.is3DInitialized = true;
            this.animate3D();
        } catch (err) {
            console.error("Error initializing 3D WebGL scene:", err);
        }
    }

    setup3DLights() {
        // Ambient Light
        this.ambientLight = new THREE.AmbientLight(0xfff4e6, 0.7);
        this.scene.add(this.ambientLight);

        // Directional Key Sun Light
        this.dirLight = new THREE.DirectionalLight(0xffe2b8, 1.4);
        this.dirLight.position.set(8, 14, 10);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.scene.add(this.dirLight);

        // Warm Gold Point Lights
        const light1 = new THREE.PointLight(0xdfb76c, 2.0, 14);
        light1.position.set(-3, 3.5, 2);
        this.scene.add(light1);
        this.pointLights.push(light1);

        const light2 = new THREE.PointLight(0xffe5b4, 1.8, 14);
        light2.position.set(3, 3.5, -2);
        this.scene.add(light2);
        this.pointLights.push(light2);

        this.applyLightingPreset(this.currentLighting);
    }

    applyLightingPreset(mode) {
        this.currentLighting = mode;
        if (!this.ambientLight || !this.dirLight) return;

        if (mode === 'daylight') {
            this.scene.background = new THREE.Color(0x0c141a);
            this.ambientLight.color.setHex(0xffffff);
            this.ambientLight.intensity = 1.1;
            this.dirLight.color.setHex(0xfffaed);
            this.dirLight.intensity = 2.0;
            this.pointLights.forEach(p => p.intensity = 0.6);
        } else if (mode === 'sunset') {
            this.scene.background = new THREE.Color(0x0a0c10);
            this.ambientLight.color.setHex(0xffd1a4);
            this.ambientLight.intensity = 0.8;
            this.dirLight.color.setHex(0xff9944);
            this.dirLight.intensity = 1.6;
            this.pointLights[0].color.setHex(0xdfb76c);
            this.pointLights[0].intensity = 2.2;
            this.pointLights[1].color.setHex(0xffe5b4);
            this.pointLights[1].intensity = 2.0;
        } else if (mode === 'cyber') {
            this.scene.background = new THREE.Color(0x040608);
            this.ambientLight.color.setHex(0x2d1a4d);
            this.ambientLight.intensity = 0.5;
            this.dirLight.color.setHex(0xdfb76c);
            this.dirLight.intensity = 0.9;
            this.pointLights[0].color.setHex(0xdfb76c);
            this.pointLights[0].intensity = 3.0;
            this.pointLights[1].color.setHex(0x3d8b62);
            this.pointLights[1].intensity = 2.5;
        } else if (mode === 'lounge') {
            this.scene.background = new THREE.Color(0x050907);
            this.ambientLight.color.setHex(0x13382c);
            this.ambientLight.intensity = 0.6;
            this.dirLight.color.setHex(0xdfb76c);
            this.dirLight.intensity = 1.1;
            this.pointLights[0].color.setHex(0x3d8b62);
            this.pointLights[0].intensity = 2.2;
            this.pointLights[1].color.setHex(0xdfb76c);
            this.pointLights[1].intensity = 2.0;
        }
    }

    build3DRoom(roomType) {
        if (!this.scene) return;
        this.current3DRoomType = roomType;

        // Synchronize HUD button active states
        document.querySelectorAll('.btn-3d-room-type').forEach(b => {
            if (b.dataset.roomType && b.dataset.roomType.toLowerCase() === roomType.toLowerCase()) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        // Update Title and Photo Gallery
        const info = this.roomImagery[roomType] || this.roomImagery['Suite'];
        const titleEl = document.getElementById('stage3DSuiteTitle');
        if (titleEl) {
            titleEl.innerHTML = `${info.name} <span style="font-size:0.8rem; color:var(--gold); font-weight:400;">(${info.specs})</span>`;
        }

        // Render Photo Gallery Frame Content
        this.updateStageGallery(roomType);

        // Clean & dispose existing room group
        if (this.roomGroup) {
            this.roomGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(this.roomGroup);
        }
        this.roomGroup = new THREE.Group();
        this.hotspotObjects = [];

        // --- 1. Materials Palette ---
        // Polished Serpeggiante Marble Floor
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x141b18,
            roughness: 0.2,
            metalness: 0.45
        });

        // Sadarhalli Granite / Teakwood Walls
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x1b2420,
            roughness: 0.75,
            metalness: 0.15
        });

        // Taj Regal Gold Accents
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xdfb76c,
            metalness: 0.9,
            roughness: 0.18
        });

        // Panoramic Double Glazing Glass
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x90d5ff,
            transparent: true,
            opacity: 0.4,
            roughness: 0.08,
            metalness: 0.15,
            transmission: 0.7
        });

        // 600-Thread Egyptian Cotton Bedding
        const fabricMat = new THREE.MeshStandardMaterial({
            color: 0xfaf9f6,
            roughness: 0.92
        });

        // Dark Teakwood Furnishings
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x332115,
            roughness: 0.55
        });

        // --- 2. Architecture: Floor & Walls ---
        const roomWidth = roomType === 'Suite' ? 10 : (roomType === 'Deluxe' ? 8.5 : 7.5);
        const roomDepth = 9;

        // Floor with gold marble inlay border
        const floorGeo = new THREE.BoxGeometry(roomWidth, 0.2, roomDepth);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = -0.1;
        floor.receiveShadow = true;
        this.roomGroup.add(floor);

        // Gold Inlay Grid Floor Trim
        const gridHelper = new THREE.GridHelper(Math.max(roomWidth, roomDepth), 12, 0xdfb76c, 0x1e2b25);
        gridHelper.position.y = 0.01;
        this.roomGroup.add(gridHelper);

        // Back Wall (Teakwood panelled)
        const backWallGeo = new THREE.BoxGeometry(roomWidth, 4.5, 0.2);
        const backWall = new THREE.Mesh(backWallGeo, wallMat);
        backWall.position.set(0, 2.25, -roomDepth / 2);
        backWall.receiveShadow = true;
        this.roomGroup.add(backWall);

        // Left Wall
        const leftWallGeo = new THREE.BoxGeometry(0.2, 4.5, roomDepth);
        const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
        leftWall.position.set(-roomWidth / 2, 2.25, 0);
        leftWall.receiveShadow = true;
        this.roomGroup.add(leftWall);

        // Sliding Glass Patio Doors leading to Balcony Terrace (Open walk-through center)
        const doorFrameMat = goldMat;
        // Left fixed glass door
        const leftDoorGlass = new THREE.Mesh(new THREE.BoxGeometry(roomWidth * 0.38, 4.2, 0.08), glassMat);
        leftDoorGlass.position.set(-roomWidth * 0.3, 2.1, roomDepth / 2);
        this.roomGroup.add(leftDoorGlass);

        // Right sliding door (tucked open)
        const rightDoorGlass = new THREE.Mesh(new THREE.BoxGeometry(roomWidth * 0.38, 4.2, 0.08), glassMat);
        rightDoorGlass.position.set(roomWidth * 0.38, 2.1, roomDepth / 2 + 0.08);
        this.roomGroup.add(rightDoorGlass);

        // Gold Transom Header Beam above patio doors
        const transomBeam = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.25, 0.2), doorFrameMat);
        transomBeam.position.set(0, 4.35, roomDepth / 2);
        this.roomGroup.add(transomBeam);

        // Architectural Gold LED Crown Molding
        const stripGeo = new THREE.BoxGeometry(roomWidth - 0.4, 0.08, 0.08);
        const stripMat = new THREE.MeshBasicMaterial({ color: 0xdfb76c });
        const ledStrip = new THREE.Mesh(stripGeo, stripMat);
        ledStrip.position.set(0, 4.25, -roomDepth / 2 + 0.12);
        this.roomGroup.add(ledStrip);

        // --- 3. Furniture: Platform King Bed ---
        const bedGroup = new THREE.Group();
        bedGroup.position.set(0, 0, -1);

        // Bed Base (Teakwood)
        const bedBaseGeo = new THREE.BoxGeometry(3.2, 0.5, 3.6);
        const bedBase = new THREE.Mesh(bedBaseGeo, woodMat);
        bedBase.position.y = 0.25;
        bedBase.castShadow = true;
        bedGroup.add(bedBase);

        // Plush Luxury Mattress
        const matGeo = new THREE.BoxGeometry(3.0, 0.55, 3.4);
        const mattress = new THREE.Mesh(matGeo, fabricMat);
        mattress.position.y = 0.75;
        mattress.castShadow = true;
        bedGroup.add(mattress);

        // Gold Framed Headboard
        const headGeo = new THREE.BoxGeometry(3.6, 2.2, 0.3);
        const headboard = new THREE.Mesh(headGeo, goldMat);
        headboard.position.set(0, 1.3, -1.7);
        headboard.castShadow = true;
        bedGroup.add(headboard);

        // Pillows
        const pillowGeo = new THREE.BoxGeometry(1.0, 0.25, 0.7);
        const pillow1 = new THREE.Mesh(pillowGeo, fabricMat);
        pillow1.position.set(-0.8, 1.1, -1.2);
        bedGroup.add(pillow1);

        const pillow2 = new THREE.Mesh(pillowGeo, fabricMat);
        pillow2.position.set(0.8, 1.1, -1.2);
        bedGroup.add(pillow2);

        this.roomGroup.add(bedGroup);

        // Nightstands with Glowing Lamps
        [-2.3, 2.3].forEach(x => {
            const standGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
            const stand = new THREE.Mesh(standGeo, woodMat);
            stand.position.set(x, 0.3, -2.7);
            stand.castShadow = true;
            this.roomGroup.add(stand);

            const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.5, 12), goldMat);
            lampBase.position.set(x, 0.85, -2.7);
            this.roomGroup.add(lampBase);

            const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.4, 16), new THREE.MeshBasicMaterial({ color: 0xffe8b3 }));
            lampShade.position.set(x, 1.15, -2.7);
            this.roomGroup.add(lampShade);
        });

        // 65" Smart Screen Display on Left Wall
        const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 2.8), new THREE.MeshStandardMaterial({ color: 0x050505 }));
        tvFrame.position.set(-roomWidth / 2 + 0.15, 2.3, 0);
        this.roomGroup.add(tvFrame);

        const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.45, 2.65), new THREE.MeshBasicMaterial({ color: 0xdfb76c }));
        tvScreen.position.set(-roomWidth / 2 + 0.16, 2.3, 0);
        this.roomGroup.add(tvScreen);

        // Special Suite Features: Hydrotherapy Jacuzzi Spa Tub
        if (roomType === 'Suite' || roomType === 'Deluxe') {
            const chairMat = new THREE.MeshStandardMaterial({ color: 0x24362d, roughness: 0.6 });
            const chair = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.4), chairMat);
            chair.position.set(2.8, 0.45, 1.5);
            chair.castShadow = true;
            this.roomGroup.add(chair);

            const table = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 24), goldMat);
            table.position.set(2.8, 0.2, 0);
            table.castShadow = true;
            this.roomGroup.add(table);

            if (roomType === 'Suite') {
                const jacuzzi = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.3, 0.8, 32), new THREE.MeshStandardMaterial({ color: 0xf0fdf4, roughness: 0.1 }));
                jacuzzi.position.set(-3.2, 0.4, -1.8);
                this.roomGroup.add(jacuzzi);

                const water = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.1, 32), new THREE.MeshBasicMaterial({ color: 0x3d8b62, transparent: true, opacity: 0.7 }));
                water.position.set(-3.2, 0.75, -1.8);
                this.roomGroup.add(water);
            }
        }

        // --- 4. Architectural Balcony Terrace ---
        const balconyDepth = 3.6;
        const balconyWidth = roomWidth;
        const balconyZ = roomDepth / 2 + balconyDepth / 2;

        // Balcony Teak Deck
        const balconyFloorGeo = new THREE.BoxGeometry(balconyWidth, 0.18, balconyDepth);
        const balconyFloor = new THREE.Mesh(balconyFloorGeo, woodMat);
        balconyFloor.position.set(0, -0.09, balconyZ);
        balconyFloor.receiveShadow = true;
        this.roomGroup.add(balconyFloor);

        // Balcony Glass Safety Railing (Front & Sides)
        const railGlassMat = new THREE.MeshPhysicalMaterial({
            color: 0xe6f7ff,
            metalness: 0.15,
            roughness: 0.05,
            transmission: 0.94,
            transparent: true,
            opacity: 0.6
        });

        // Front Glass Railing
        const frontRail = new THREE.Mesh(new THREE.BoxGeometry(balconyWidth, 1.25, 0.05), railGlassMat);
        frontRail.position.set(0, 0.62, balconyZ + balconyDepth / 2);
        this.roomGroup.add(frontRail);

        // Front Brass Handrail Top
        const topRail = new THREE.Mesh(new THREE.BoxGeometry(balconyWidth + 0.1, 0.08, 0.08), goldMat);
        topRail.position.set(0, 1.26, balconyZ + balconyDepth / 2);
        this.roomGroup.add(topRail);

        // Side Glass Rails & Brass Tops
        [-balconyWidth / 2, balconyWidth / 2].forEach(x => {
            const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.25, balconyDepth), railGlassMat);
            sideRail.position.set(x, 0.62, balconyZ);
            this.roomGroup.add(sideRail);

            const sideTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, balconyDepth), goldMat);
            sideTop.position.set(x, 1.26, balconyZ);
            this.roomGroup.add(sideTop);
        });

        // Balcony Bistro Furniture (Round marble table & 2 wicker chairs)
        const bistroTable = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.72, 24), goldMat);
        bistroTable.position.set(0, 0.36, balconyZ);
        bistroTable.castShadow = true;
        this.roomGroup.add(bistroTable);

        // Cocktail Glass on table
        const glassMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.18, 12), railGlassMat);
        glassMesh.position.set(0.12, 0.81, balconyZ + 0.05);
        this.roomGroup.add(glassMesh);

        [-1.2, 1.2].forEach(x => {
            const bChair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.7), new THREE.MeshStandardMaterial({ color: 0x1f2e27, roughness: 0.7 }));
            bChair.position.set(x, 0.42, balconyZ);
            bChair.castShadow = true;
            this.roomGroup.add(bChair);
        });

        // Botanical Planters along Balcony Railing
        [-balconyWidth / 2 + 1.2, balconyWidth / 2 - 1.2].forEach(x => {
            const planter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.35), new THREE.MeshStandardMaterial({ color: 0x2d3a33, roughness: 0.8 }));
            planter.position.set(x, 0.22, balconyZ + balconyDepth / 2 - 0.25);
            this.roomGroup.add(planter);

            const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), new THREE.MeshStandardMaterial({ color: 0x22543d, roughness: 0.9 }));
            foliage.position.set(x, 0.58, balconyZ + balconyDepth / 2 - 0.25);
            this.roomGroup.add(foliage);
        });

        // --- 5. Panoramic Horizon Backdrop Beyond Balcony ---
        const backdropGeo = new THREE.PlaneGeometry(28, 16);
        const backdropMat = new THREE.MeshBasicMaterial({
            map: this.createSkylineBackdropTexture(),
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
        backdropMesh.position.set(0, 6.5, balconyZ + 1.8);
        this.roomGroup.add(backdropMesh);

        // --- 6. Interactive 3D Hotspot Rings ---
        const hotspots = this.hotspotsCatalog[roomType] || this.hotspotsCatalog['Suite'];
        hotspots.forEach(spot => {
            const pinGroup = new THREE.Group();
            pinGroup.position.set(...spot.pos);

            const pinMesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xdfb76c })
            );
            pinGroup.add(pinMesh);

            const ringMesh = new THREE.Mesh(
                new THREE.RingGeometry(0.22, 0.3, 24),
                new THREE.MeshBasicMaterial({ color: 0xdfb76c, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
            );
            ringMesh.rotation.x = Math.PI / 2;
            pinGroup.add(ringMesh);

            pinGroup._hotspotData = spot;
            pinGroup._ring = ringMesh;
            this.hotspotObjects.push(pinGroup);
            this.roomGroup.add(pinGroup);
        });

        this.scene.add(this.roomGroup);

        if (hotspots.length > 0) {
            this.displayHotspotHUD(hotspots[0]);
        }
    }

    createSkylineBackdropTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Sky gradient (Sunset glow to deep royal twilight indigo)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
        skyGrad.addColorStop(0, '#0a1128'); // Deep indigo
        skyGrad.addColorStop(0.35, '#1e1c3a');
        skyGrad.addColorStop(0.65, '#6b2d3c'); // Sunset mauve
        skyGrad.addColorStop(0.82, '#e07a3c'); // Amber horizon
        skyGrad.addColorStop(1.0, '#dfb76c');  // Golden dusk line
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 1024, 512);

        // Glowing warm sun disc setting on the horizon
        const sunGrad = ctx.createRadialGradient(512, 410, 8, 512, 410, 130);
        sunGrad.addColorStop(0, 'rgba(255, 242, 204, 0.95)');
        sunGrad.addColorStop(0.35, 'rgba(223, 183, 108, 0.5)');
        sunGrad.addColorStop(1, 'rgba(223, 143, 74, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(512, 410, 130, 0, Math.PI * 2);
        ctx.fill();

        // Distant Bangalore Skyline Silhouettes (Towers & Luxury Hotels)
        ctx.fillStyle = '#0f171c';
        const buildings = [
            {x: 30, w: 55, h: 90}, {x: 95, w: 50, h: 140}, {x: 155, w: 80, h: 115},
            {x: 245, w: 60, h: 175}, {x: 315, w: 85, h: 135}, {x: 410, w: 65, h: 160},
            {x: 490, w: 100, h: 195}, {x: 600, w: 60, h: 145}, {x: 675, w: 80, h: 165},
            {x: 770, w: 55, h: 125}, {x: 835, w: 90, h: 150}, {x: 935, w: 60, h: 105}
        ];
        buildings.forEach(b => {
            ctx.fillRect(b.x, 420 - b.h, b.w, b.h);
            // Glowing warm windows
            ctx.fillStyle = 'rgba(223, 183, 108, 0.65)';
            for(let wy = 420 - b.h + 12; wy < 410; wy += 14) {
                for(let wx = b.x + 8; wx < b.x + b.w - 8; wx += 12) {
                    if((wx + wy) % 3 !== 0) {
                        ctx.fillRect(wx, wy, 3, 4);
                    }
                }
            }
            ctx.fillStyle = '#0f171c';
        });

        // Kempegowda Airport Runway Lights Strip
        ctx.fillStyle = '#3d8b62';
        ctx.fillRect(440, 422, 140, 4);
        for(let r = 0; r < 20; r++) {
            ctx.fillStyle = r % 2 === 0 ? '#dfb76c' : '#3d8b62';
            ctx.fillRect(380 + r * 14, 423, 4, 3);
        }

        // Tropical Botanical Palms in Foreground
        ctx.fillStyle = '#09120e';
        for(let p = 0; p < 14; p++) {
            const px = p * 80 + 15;
            ctx.beginPath();
            ctx.arc(px, 435, 42, 0, Math.PI, true);
            ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }

    updateStageGallery(roomType) {
        const info = this.roomImagery[roomType] || this.roomImagery['Suite'];
        const galleryContainer = document.getElementById('stageGalleryContainer');
        if (!galleryContainer) return;

        galleryContainer.innerHTML = `
            <div class="stage-gallery-deck">
                <div class="stage-gallery-hero">
                    <img src="${info.main}" alt="${info.name}" class="gallery-hero-img" id="stageMainHeroImg">
                    <div class="gallery-hero-overlay">
                        <span class="gallery-hero-tag">✦ ${info.name}</span>
                        <p class="gallery-hero-desc">${info.description}</p>
                    </div>
                </div>
                <div class="stage-gallery-thumbs">
                    ${info.gallery.map((g, idx) => `
                        <div class="gallery-thumb-card ${idx === 0 ? 'active' : ''}" onclick="App.roomVisualizer.switchGalleryHero('${g.url}', '${g.title.replace(/'/g, "\\'")}', this)">
                            <img src="${g.url}" alt="${g.title}">
                            <span>${g.title}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="stage-privileges-bar">
                    ${info.privileges.map(p => `
                        <div class="privilege-item">
                            <span class="privilege-icon">✦</span>
                            <span>${p}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    switchGalleryHero(url, title, el) {
        const heroImg = document.getElementById('stageMainHeroImg');
        if (heroImg) {
            heroImg.src = url;
        }
        document.querySelectorAll('.gallery-thumb-card').forEach(c => c.classList.remove('active'));
        if (el) el.classList.add('active');
    }

    // Toggle between 3D Model View and Ultra-HD Photo Gallery
    setStageView(view) {
        this.currentStageView = view;
        const canvasFrame = document.getElementById('stage3DCanvasFrame');
        const galleryFrame = document.getElementById('stageGalleryFrame');
        const tabs = document.querySelectorAll('.btn-stage-tab');
        
        tabs.forEach(btn => {
            if (btn.dataset.stageView === view) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        if (view === '3d') {
            if (canvasFrame) canvasFrame.style.display = 'block';
            if (galleryFrame) galleryFrame.style.display = 'none';
        } else if (view === 'gallery') {
            if (canvasFrame) canvasFrame.style.display = 'none';
            if (galleryFrame) galleryFrame.style.display = 'block';
            this.updateStageGallery(this.current3DRoomType);
        }
    }

    bindHybridStageControls() {
        document.querySelectorAll('.btn-stage-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.stageView;
                this.setStageView(view);
            });
        });
    }

    setCameraPreset(preset) {
        this.currentCameraView = preset;
        if (!this.camera) return;

        if (preset === 'isometric') {
            this.camera.position.set(8.5, 7.0, 9.5);
            if (this.controls) this.controls.target.set(0, 1.2, 0.5);
        } else if (preset === 'bed') {
            this.camera.position.set(0, 2.0, 4.0);
            if (this.controls) this.controls.target.set(0, 1.1, -1.0);
        } else if (preset === 'balcony') {
            // Panoramic view looking from suite out across the private terrace & sunset skyline
            this.camera.position.set(0, 1.8, 3.5);
            if (this.controls) this.controls.target.set(0, 1.5, 9.5);
        } else if (preset === 'orbit') {
            this.camera.position.set(6.5, 5.5, 7.5);
            if (this.controls) this.controls.target.set(0, 1.2, 1.5);
        }

        this.camera.lookAt(this.controls ? this.controls.target : new THREE.Vector3(0, 1.2, 0));
        if (this.controls) {
            this.controls.update();
        }
    }

    setupHotspotRaycasting(canvas) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        canvas.addEventListener('click', (event) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            const targets = this.hotspotObjects.map(g => g.children[0]);
            const intersects = raycaster.intersectObjects(targets);

            if (intersects.length > 0) {
                const clickedGroup = intersects[0].object.parent;
                if (clickedGroup && clickedGroup._hotspotData) {
                    this.displayHotspotHUD(clickedGroup._hotspotData);
                }
            }
        });
    }

    displayHotspotHUD(data) {
        const hud = document.getElementById('hotspotHudCard');
        if (!hud || !data) return;

        hud.innerHTML = `
            <div class="hotspot-hud-title">
                <span>✦</span> ${data.title}
            </div>
            <div class="hotspot-hud-desc">${data.desc}</div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-3d-primary" style="padding: 6px 14px; font-size: 0.75rem;"
                    onclick="App.openBookingModal({room_type: '${this.current3DRoomType}'})">
                    Reserve This Suite →
                </button>
            </div>
        `;
        hud.style.display = 'block';
    }

    bind3DControls() {
        // Room type buttons
        document.querySelectorAll('.btn-3d-room-type').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-3d-room-type').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const type = btn.dataset.roomType;
                this.build3DRoom(type);
            });
        });

        // Lighting preset buttons
        document.querySelectorAll('.btn-3d-lighting').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-3d-lighting').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.lighting;
                this.applyLightingPreset(mode);
            });
        });

        // Camera preset buttons
        document.querySelectorAll('.btn-3d-camera').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-3d-camera').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const preset = btn.dataset.camera;
                this.setCameraPreset(preset);
            });
        });
    }

    animate3D() {
        requestAnimationFrame(() => this.animate3D());

        if (this.controls) {
            this.controls.update();
        }

        // Animate Hotspot Rings
        const time = Date.now() * 0.003;
        this.hotspotObjects.forEach(pin => {
            if (pin._ring) {
                const scale = 1.0 + Math.sin(time) * 0.2;
                pin._ring.scale.set(scale, scale, 1);
            }
        });

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // =========================================================================
    // 3 DEDICATED CURATED ACCOMMODATION SHOWCASE COLLECTIONS
    // =========================================================================
    async loadRooms() {
        if (!this.container) return;
        this.container.innerHTML = '<div style="color: var(--gold); padding: 3rem; text-align: center; font-style: italic;">✦ Loading luxury suite inventory telemetry...</div>';

        try {
            const data = await API.getRooms();
            if (data.success) {
                this.roomsData = data.rooms;
                this.render();
            }
        } catch (err) {
            this.container.innerHTML = '<div style="color: var(--danger); padding: 2rem; text-align: center;">Unable to connect to hotel inventory. Please verify database connection.</div>';
        }
    }

    bindFilterEvents() {
        const filterBtns = document.querySelectorAll('.filter-pill-3d');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();

                if (btn.dataset.filter !== 'all') {
                    this.build3DRoom(btn.dataset.filter);
                }
            });
        });
    }

    switchSplitSamplePhoto(cardId, imgUrl, caption, thumbEl) {
        const card = document.getElementById(cardId);
        if (!card) return;

        const heroImg = card.querySelector('.split-hero-img');
        const captionEl = card.querySelector('.split-hero-caption');
        if (heroImg) heroImg.src = imgUrl;
        if (captionEl) captionEl.innerText = `✦ ${caption}`;

        card.querySelectorAll('.split-thumb-item').forEach(t => t.classList.remove('active'));
        if (thumbEl) thumbEl.classList.add('active');
    }

    render() {
        if (!this.container) return;

        // Structured Curated Collections Catalog
        const collections = [
            {
                id: 'presidential',
                key: 'Suite',
                badge: '👑',
                title: 'Presidential Suites Collection',
                tagline: 'Top-Floor Royal Residences with Runway & Sunset Panorama',
                samples: [
                    {
                        room_number: '401',
                        room_type: 'Suite',
                        name: 'Presidential Runway Suite',
                        price: 6000,
                        specs: '4 Guests · 1 Presidential King · 92 m² (1,000 sq.ft) · Airport Runway Vista',
                        features: ['Presidential King', 'Living Salon', 'Jacuzzi Spa', 'Runway Balcony'],
                        privileges: [
                            '24/7 Dedicated Butler Service',
                            'Private Hydrotherapy Jacuzzi Spa',
                            'Taj Club Executive Lounge Access',
                            'Aviation Limousine Airport Transfer'
                        ],
                        mainImg: '/static/assets/rooms/suite_401_main.jpg',
                        gallery: [
                            { title: 'Presidential Master Suite', url: '/static/assets/rooms/suite_401_main.jpg' },
                            { title: 'Hydrotherapy Jacuzzi Spa', url: '/static/assets/rooms/suite_401_jacuzzi.jpg' },
                            { title: 'Private Entertaining Salon', url: '/static/assets/rooms/suite_401_dining.jpg' }
                        ]
                    },
                    {
                        room_number: '402',
                        room_type: 'Suite',
                        name: 'Royal Panoramic Penthouse',
                        price: 6000,
                        specs: '4 Guests · 1 Royal King + 1 Queen · 96 m² (1,030 sq.ft) · Sunset Skyline Panorama',
                        features: ['Dual Queens', 'Sunset Terrace', 'Serpeggiante Bath', 'Private Bar'],
                        privileges: [
                            'Sunset Skyline Private Terrace',
                            'Sommelier Curated Wine Cellar',
                            'Bang & Olufsen Acoustic Sound',
                            'Chef Table Private Dining Privileges'
                        ],
                        mainImg: '/static/assets/rooms/suite_402_main.jpg',
                        gallery: [
                            { title: 'Sunset Penthouse Parlor', url: '/static/assets/rooms/suite_402_main.jpg' },
                            { title: 'Floor-to-Ceiling Balcony', url: '/static/assets/rooms/suite_402_terrace.jpg' },
                            { title: 'Artisan Wine Bar & Lounge', url: '/static/assets/rooms/suite_402_bar.jpg' }
                        ]
                    }
                ]
            },
            {
                id: 'deluxe',
                key: 'Deluxe',
                badge: '🌿',
                title: 'Executive Deluxe Terrace Collection',
                tagline: 'Acoustic Soundproofing & Private Botanical Terraces',
                samples: [
                    {
                        room_number: '301',
                        room_type: 'Deluxe',
                        name: 'Private Garden Terrace Deluxe',
                        price: 4000,
                        specs: '2 Guests · 1 Royal King Bed · 54 m² (580 sq.ft) · Courtyard Garden Verandah',
                        features: ['AC Climate', 'Mini Bar', 'Private Balcony', 'Smart 4K TV'],
                        privileges: [
                            'Private Botanical Courtyard Verandah',
                            'Four-Fixture Italian Marble Bath',
                            'Forest Essentials Aromatherapy Rituals',
                            'Automated Circadian Mood Presets'
                        ],
                        mainImg: '/static/assets/rooms/deluxe_301_main.jpg',
                        gallery: [
                            { title: 'King Bedroom with Verandah', url: '/static/assets/rooms/deluxe_301_main.jpg' },
                            { title: 'Botanical Garden Balcony', url: '/static/assets/rooms/deluxe_301_balcony.jpg' },
                            { title: 'Serene Walk-In Rain Shower', url: '/static/assets/rooms/deluxe_301_bath.jpg' }
                        ]
                    },
                    {
                        room_number: '302',
                        room_type: 'Deluxe',
                        name: 'Executive Skyline Deluxe',
                        price: 4000,
                        specs: '2 Guests · 1 Royal King Bed · 52 m² (560 sq.ft) · City Skyline Vistas',
                        features: ['King Bed', 'Ergonomic Desk', 'Double Glazing', '4K TV'],
                        privileges: [
                            'Double Acoustic Soundproof Glazing',
                            'Ergonomic Artisan Walnut Desk',
                            'Nespresso Master Coffee Bar',
                            'Taj Club Executive Privileges'
                        ],
                        mainImg: '/static/assets/rooms/deluxe_302_main.jpg',
                        gallery: [
                            { title: 'Executive Skyline Bed', url: '/static/assets/rooms/deluxe_302_main.jpg' },
                            { title: 'Sunlit Work Alcove', url: '/static/assets/rooms/deluxe_302_desk.jpg' },
                            { title: 'Luxury Dressing Salon', url: '/static/assets/rooms/deluxe_302_salon.jpg' }
                        ]
                    }
                ]
            },
            {
                id: 'single_double',
                key: 'Single',
                badge: '✦',
                title: 'Single & Grand Double Sanctuaries',
                tagline: 'Bespoke Comfort for Solo Dignitaries & Twin Travelers',
                samples: [
                    {
                        room_number: '101',
                        room_type: 'Single',
                        name: 'Deluxe Single Sanctuary',
                        price: 1500,
                        specs: '1 Guest · 1 Plush Queen Bed · 32 m² (345 sq.ft) · Courtyard Garden View',
                        features: ['1 Queen Bed', 'High-Speed Wi-Fi', 'Attached Bath', 'Workstation'],
                        privileges: [
                            'Ergonomic Walnut Workstation Desk',
                            'High-Speed Dedicated Fiber Internet',
                            'Italian Marble Rain Shower & Tub',
                            '24/7 In-Room Artisan Dining'
                        ],
                        mainImg: '/static/assets/rooms/single_101_main.jpg',
                        gallery: [
                            { title: 'Solo Plush Linen Queen Bed', url: '/static/assets/rooms/single_101_main.jpg' },
                            { title: 'Italian Marble Bathroom', url: '/static/assets/rooms/single_101_bath.jpg' },
                            { title: 'Fiber Optic Workstation', url: '/static/assets/rooms/single_101_work.jpg' }
                        ]
                    },
                    {
                        room_number: '201',
                        room_type: 'Double',
                        name: 'Grand Double Suite',
                        price: 2500,
                        specs: '2 Guests · 2 Custom Queen Beds · 42 m² (450 sq.ft) · Skyline & Courtyard Atrium',
                        features: ['2 Queen Beds', 'Wi-Fi', 'Attached Bath', '4K Smart TV'],
                        privileges: [
                            'Dual Custom-Crafted Queen Mattresses',
                            'Dedicated Lounge Alcove & Dressing Salon',
                            'Soundproof Double-Glazed Windows',
                            'Artisan Tea & Wellness Rituals'
                        ],
                        mainImg: '/static/assets/rooms/double_201_main.jpg',
                        gallery: [
                            { title: 'Dual Queen Beds Suite', url: '/static/assets/rooms/double_201_main.jpg' },
                            { title: 'Sunlit Lounge Alcove', url: '/static/assets/rooms/double_201_alcove.jpg' },
                            { title: 'Spacious Dressing Salon', url: '/static/assets/rooms/double_201_salon.jpg' }
                        ]
                    }
                ]
            }
        ];

        // Filter collections if filter is selected
        const visibleCollections = this.currentFilter === 'all'
            ? collections
            : collections.filter(c => c.key.toLowerCase() === this.currentFilter.toLowerCase() || (this.currentFilter === 'Double' && c.id === 'single_double'));

        this.container.innerHTML = visibleCollections.map(col => `
            <section class="luxury-collection-section" id="collection-${col.id}">
                <!-- Collection Header -->
                <div class="collection-header-deck">
                    <div class="collection-title-group">
                        <span class="collection-badge-icon">${col.badge}</span>
                        <div>
                            <h3 class="collection-heading">${col.title}</h3>
                            <span class="collection-tagline">${col.tagline}</span>
                        </div>
                    </div>
                </div>

                <!-- 2 Curated Sample Split Cards (Details on one side, Sample Image on the other) -->
                <div class="collection-samples-grid">
                    ${col.samples.map(sample => {
                        const cardId = `splitCard_${sample.room_number}`;
                        return `
                            <article class="luxury-split-card" id="${cardId}">
                                <!-- Left Column: Essential Suite Details & Privileges -->
                                <div class="split-card-details">
                                    <div>
                                        <div class="split-card-meta">
                                            <span class="split-room-number-tag">✦ SUITE #${sample.room_number}</span>
                                            <span class="split-room-status">
                                                <span class="live-beacon-dot" style="width: 6px; height: 6px; background: var(--emerald);"></span>
                                                Vacant · Ready
                                            </span>
                                        </div>

                                        <h4 class="split-card-name">${sample.name}</h4>
                                        <div class="split-specs-summary">${sample.specs}</div>

                                        <div class="split-essential-features">
                                            ${sample.features.map(f => `<span class="split-feature-chip">${f}</span>`).join('')}
                                        </div>
                                    </div>

                                    <!-- Privileges Grid -->
                                    <div class="split-privileges-list">
                                        ${sample.privileges.map(p => `
                                            <div class="split-privilege-bullet">
                                                <span>✦</span> ${p}
                                            </div>
                                        `).join('')}
                                    </div>

                                    <!-- Price & Actions Footer -->
                                    <div class="split-card-footer">
                                        <div class="split-price-box">
                                            <span class="split-price-val">₹${sample.price.toLocaleString('en-IN')}</span>
                                            <span class="split-price-sub">/ night incl. GST</span>
                                        </div>
                                        <div class="split-card-actions">
                                            <button type="button" class="btn-3d-cyan" 
                                                onclick="App.roomVisualizer.build3DRoom('${sample.room_type}'); document.getElementById('stage-3d-explorer').scrollIntoView({behavior:'smooth'});">
                                                <span>🏛️ View in 3D</span>
                                            </button>
                                            <button type="button" class="btn-3d-primary"
                                                onclick="App.openBookingModal({room_type: '${sample.room_type}', room_number: '${sample.room_number}'})">
                                                <span>✦ Reserve Suite</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Right Column: Sample Photography & Thumbnail Switcher -->
                                <div class="split-card-visual">
                                    <div class="split-hero-img-box">
                                        <img src="${sample.mainImg}" alt="${sample.name}" class="split-hero-img" loading="eager">
                                        <div class="split-hero-caption">✦ ${sample.gallery[0].title}</div>
                                    </div>

                                    <!-- Mini Photo Thumbnails -->
                                    <div class="split-thumb-strip">
                                        ${sample.gallery.map((g, idx) => `
                                            <button type="button" class="split-thumb-item ${idx === 0 ? 'active' : ''}"
                                                title="${g.title}"
                                                onclick="App.roomVisualizer.switchSplitSamplePhoto('${cardId}', '${g.url}', '${g.title.replace(/'/g, "\\'")}', this)">
                                                <img src="${g.url}" alt="${g.title}" loading="eager">
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                            </article>
                        `;
                    }).join('')}
                </div>
            </section>
        `).join('');
    }
}

window.RoomVisualizer = RoomVisualizer;
