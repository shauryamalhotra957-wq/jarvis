import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { locations } from "./data/worldIntel.js";
import { latLonToCartesian } from "./core/geo.js";

const EARTH_DAY_TEXTURE_URL = "/assets/earth/world-topo-bathy-5400.jpg";
const EARTH_NIGHT_TEXTURE_URL = "/assets/earth/earth-night-4096.jpg";

function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function loadSurfaceTexture(url, renderer) {
  const texture = new THREE.TextureLoader().load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy?.() || 1);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function closestAngle(current, target) {
  const wrapped = THREE.MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI;
  return current + wrapped;
}

function dampAngle(current, target, lambda, delta) {
  return THREE.MathUtils.damp(current, closestAngle(current, target), lambda, delta);
}

function createCloudTexture() {
  const random = seededRandom(24051977);
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let band = 0; band < 7; band += 1) {
    const y = canvas.height * (0.16 + random() * 0.68);
    const amplitude = 12 + random() * 34;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.035 + random() * 0.035})`;
    ctx.lineWidth = 8 + random() * 18;
    ctx.beginPath();
    for (let x = -60; x <= canvas.width + 60; x += 28) {
      const phase = x / (95 + random() * 110) + band * 1.7;
      const yy = y + Math.sin(phase) * amplitude + Math.cos(phase * 0.57) * amplitude * 0.55;
      if (x === -60) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 360; i += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const r = 16 + random() * 72;
    const stretch = 0.55 + random() * 1.9;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.05 + random() * 0.16})`);
    gradient.addColorStop(0.55, `rgba(230, 246, 255, ${0.025 + random() * 0.08})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((random() - 0.5) * 0.8);
    ctx.scale(stretch, 1);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function makeEarthMaterial(dayTexture, nightTexture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayTexture },
      nightTexture: { value: nightTexture },
      sunDirection: { value: new THREE.Vector3(4.2, 2.2, 3.4).normalize() },
      atmosphereColor: { value: new THREE.Color("#54e8ff") },
      displayMode: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform vec3 sunDirection;
      uniform vec3 atmosphereColor;
      uniform float displayMode;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;

      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        vec3 sun = normalize(sunDirection);

        vec3 dayColor = texture2D(dayTexture, vUv).rgb;
        vec3 nightColor = texture2D(nightTexture, vUv).rgb;

        float sunDot = dot(normal, sun);
        float daylight = smoothstep(-0.18, 0.32, sunDot);
        float nightStrength = 1.0 - smoothstep(-0.28, 0.16, sunDot);
        float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.35);
        float oceanHint = smoothstep(0.04, 0.26, dayColor.b - max(dayColor.r, dayColor.g));
        float oceanGlint = pow(max(dot(reflect(-sun, normal), viewDirection), 0.0), 18.0) * oceanHint * daylight;

        dayColor = pow(dayColor, vec3(0.92)) * vec3(0.95, 1.0, 1.08);
        nightColor = pow(nightColor, vec3(0.72)) * vec3(0.85, 1.02, 1.25) * 1.28;

        vec3 color = mix(dayColor * 0.16 + nightColor, dayColor, daylight);
        color += nightColor * nightStrength * 0.42;
        color += atmosphereColor * fresnel * (0.16 + nightStrength * 0.22);
        color += vec3(0.55, 0.86, 1.0) * oceanGlint * 0.38;

        float gridX = 1.0 - smoothstep(0.0, 0.012, abs(fract(vUv.x * 24.0) - 0.5));
        float gridY = 1.0 - smoothstep(0.0, 0.012, abs(fract(vUv.y * 12.0) - 0.5));
        float grid = max(gridX, gridY);
        vec3 nightView = nightColor * 1.9 + atmosphereColor * (0.12 + fresnel * 0.34) + dayColor * 0.08;
        vec3 tactical = color * vec3(0.22, 0.5, 0.58) + atmosphereColor * (0.18 + fresnel * 0.46);
        tactical = mix(tactical, vec3(0.18, 0.95, 1.0), grid * 0.28);

        vec3 finalColor = color;
        finalColor = mix(finalColor, nightView, smoothstep(0.35, 1.15, displayMode));
        finalColor = mix(finalColor, tactical, smoothstep(1.35, 2.0, displayMode));

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
}

function makeAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      glowColor: { value: new THREE.Color("#18d9ff") },
      coefficient: { value: 0.44 },
      power: { value: 2.2 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float coefficient;
      uniform float power;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        float intensity = pow(coefficient + dot(vNormal, normalize(vViewPosition)), power);
        gl_FragColor = vec4(glowColor, intensity * 0.65);
      }
    `
  });
}

export class JarvisGlobe {
  constructor(mount, tooltip) {
    this.mount = mount;
    this.tooltip = tooltip;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 1.05, 5.3);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(mount.clientWidth, mount.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = false;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 7;

    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.markerGroup = new THREE.Group();
    this.orbitGroup = new THREE.Group();
    this.scene.add(this.markerGroup, this.orbitGroup);
    this.clock = new THREE.Clock();
    this.focusTarget = null;
    this.focusRotation = null;
    this.scanVelocity = 0.07;
    this.pulse = 0;

    this.setupScene();
    this.setupEvents();
    this.resize();
    this.animate();
  }

  setupScene() {
    this.scene.add(new THREE.AmbientLight("#7eeaff", 0.65));
    const key = new THREE.DirectionalLight("#dffbff", 2.4);
    key.position.set(4, 2, 3);
    this.scene.add(key);
    const rim = new THREE.PointLight("#0fdcff", 90, 16);
    rim.position.set(-3, 1.6, 3);
    this.scene.add(rim);

    const dayTexture = loadSurfaceTexture(EARTH_DAY_TEXTURE_URL, this.renderer);
    const nightTexture = loadSurfaceTexture(EARTH_NIGHT_TEXTURE_URL, this.renderer);
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1.52, 160, 128),
      makeEarthMaterial(dayTexture, nightTexture)
    );
    this.earth = earth;
    this.group.add(earth);

    this.clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.552, 128, 96),
      new THREE.MeshLambertMaterial({
        map: createCloudTexture(),
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      })
    );
    this.group.add(this.clouds);

    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.7, 96, 96), makeAtmosphereMaterial());
    this.group.add(atmosphere);

    const stars = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 1800; i += 1) {
      const radius = 18 + Math.random() * 24;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }
    stars.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
    this.scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: "#7eeaff", size: 0.026, transparent: true, opacity: 0.72 })));

    this.createMarkers();
    this.createSatellitePointer();
    this.createFocusLock();
  }

  createMarkers() {
    const markerGeometry = new THREE.SphereGeometry(0.022, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: "#50f5ff" });
    for (const location of locations) {
      const vector = latLonToCartesian(location.lat, location.lon, 1.57);
      const marker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
      marker.position.set(vector.x, vector.y, vector.z);
      marker.userData = location;
      this.markerGroup.add(marker);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.055, 0.003, 8, 28),
        new THREE.MeshBasicMaterial({ color: "#4ef4ff", transparent: true, opacity: 0.52 })
      );
      ring.position.copy(marker.position);
      ring.lookAt(0, 0, 0);
      this.markerGroup.add(ring);
    }
  }

  createSatellitePointer() {
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(2.28, 0.005, 8, 220),
      new THREE.MeshBasicMaterial({ color: "#28d8ff", transparent: true, opacity: 0.36 })
    );
    orbit.rotation.x = Math.PI / 2.7;
    this.orbitGroup.add(orbit);

    this.satellite = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.065, 0),
      new THREE.MeshStandardMaterial({ color: "#d7fbff", emissive: "#28d8ff", emissiveIntensity: 1.3, metalness: 0.6, roughness: 0.2 })
    );
    this.orbitGroup.add(this.satellite);

    const beamMaterial = new THREE.LineBasicMaterial({ color: "#37eaff", transparent: true, opacity: 0.85 });
    this.beamGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    this.beam = new THREE.Line(this.beamGeometry, beamMaterial);
    this.scene.add(this.beam);
  }

  createFocusLock() {
    this.focusLock = new THREE.Group();
    this.focusLock.visible = false;

    const primary = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.006, 8, 64),
      new THREE.MeshBasicMaterial({ color: "#4df3ff", transparent: true, opacity: 0.92 })
    );
    const secondary = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.003, 8, 84),
      new THREE.MeshBasicMaterial({ color: "#ffcf6e", transparent: true, opacity: 0.62 })
    );
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 18, 18),
      new THREE.MeshBasicMaterial({ color: "#4dffc3", transparent: true, opacity: 0.96 })
    );
    primary.userData.spin = 1;
    secondary.userData.spin = -0.74;
    this.focusLock.add(primary, secondary, beacon);
    this.markerGroup.add(this.focusLock);
  }

  setupEvents() {
    window.addEventListener("resize", () => this.resize());
    this.renderer.domElement.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.renderer.domElement.addEventListener("click", (event) => this.onPointerClick(event));
  }

  onPointerMove(event) {
    const hit = this.pickMarker(event);
    if (!hit) {
      if (this.tooltip) this.tooltip.hidden = true;
      return;
    }
    const location = hit.object.userData;
    if (this.tooltip) {
      this.tooltip.hidden = false;
      this.tooltip.style.left = `${event.clientX + 18}px`;
      this.tooltip.style.top = `${event.clientY - 18}px`;
      this.tooltip.querySelector("#tooltipType").textContent = location.type.toUpperCase();
      this.tooltip.querySelector("#tooltipTitle").textContent = location.name;
      this.tooltip.querySelector("#tooltipBody").textContent = location.signal;
    }
  }

  onPointerClick(event) {
    const hit = this.pickMarker(event);
    if (hit) {
      const customEvent = new CustomEvent("jarvis-location", { detail: hit.object.userData });
      window.dispatchEvent(customEvent);
    }
  }

  pickMarker(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, this.camera);
    return raycaster.intersectObjects(this.markerGroup.children.filter((item) => item.userData?.id), false)[0] || null;
  }

  focusLocation(focus) {
    if (!focus) return;
    const vector = latLonToCartesian(focus.lat, focus.lon, 1.64);
    const surfaceVector = latLonToCartesian(focus.lat, focus.lon, 1.595);
    this.focusTarget = {
      ...focus,
      vector: new THREE.Vector3(vector.x, vector.y, vector.z)
    };
    this.focusRotation = {
      x: THREE.MathUtils.clamp(THREE.MathUtils.degToRad(focus.lat * 0.28), -0.42, 0.42),
      y: -THREE.MathUtils.degToRad(focus.lon + 90)
    };
    this.scanVelocity = 0.014;
    this.focusLock.position.set(surfaceVector.x, surfaceVector.y, surfaceVector.z);
    this.focusLock.lookAt(0, 0, 0);
    this.focusLock.visible = true;
    this.focusLock.scale.setScalar(0.55);
    this.pulse = 1.35;
  }

  runGlobalScan() {
    this.focusLocation({ lat: 18, lon: 25, label: "Global scan", id: "global", type: "planetary" });
    this.focusRotation = null;
    this.scanVelocity = 0.42;
    this.pulse = 1.4;
  }

  setVisualMode(mode) {
    const value = { earth: 0, night: 1, tactical: 2 }[mode] ?? 0;
    if (this.earth?.material?.uniforms?.displayMode) {
      this.earth.material.uniforms.displayMode.value = value;
    }
    this.pulse = 1.25;
  }

  resize() {
    const width = this.mount.clientWidth || 800;
    const height = this.mount.clientHeight || 600;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  updateSatellite(elapsed) {
    const radius = 2.28;
    const speed = elapsed * 0.42;
    const y = Math.sin(speed * 1.4) * 0.64;
    const x = Math.cos(speed) * radius;
    const z = Math.sin(speed) * radius;
    this.satellite.position.set(x, y, z);
    this.satellite.rotation.set(elapsed * 1.2, elapsed * 1.8, elapsed * 0.7);
    const target = this.focusTarget?.vector ? this.focusTarget.vector.clone().applyEuler(this.group.rotation) : new THREE.Vector3(0, 0, 0);
    this.beamGeometry.setFromPoints([this.satellite.position, target]);
    this.beam.material.opacity = 0.4 + Math.sin(elapsed * 6) * 0.18 + this.pulse * 0.2;
  }

  updateFocusLock(elapsed) {
    if (!this.focusLock?.visible) return;
    const scale = 1 + Math.sin(elapsed * 5.4) * 0.1 + this.pulse * 0.18;
    this.focusLock.scale.setScalar(scale);
    this.focusLock.children.forEach((child) => {
      child.rotation.z += (child.userData.spin || 0.2) * 0.012;
      if (child.material) {
        child.material.opacity = child.geometry.type === "SphereGeometry"
          ? 0.75 + Math.sin(elapsed * 8) * 0.2
          : 0.42 + this.pulse * 0.35;
      }
    });
  }

  animate() {
    const delta = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;
    if (this.focusRotation) {
      this.group.rotation.x = THREE.MathUtils.damp(this.group.rotation.x, this.focusRotation.x, 3.5, delta);
      this.group.rotation.y = dampAngle(this.group.rotation.y, this.focusRotation.y, 3.5, delta);
    } else {
      this.group.rotation.x = THREE.MathUtils.damp(this.group.rotation.x, 0, 2.2, delta);
      this.group.rotation.y += delta * this.scanVelocity;
    }
    this.clouds.rotation.y += delta * 0.045;
    this.markerGroup.rotation.copy(this.group.rotation);
    this.updateSatellite(elapsed);
    this.updateFocusLock(elapsed);
    if (this.pulse > 0) this.pulse *= 0.96;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }
}
