"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Props = { onReady?: () => void; onError?: () => void };

// Arka (yarim doira bilan tugaydigan) deraza yo'li
function archPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  g.beginPath();
  g.moveTo(x, y + h);
  g.lineTo(x, y + r);
  g.arc(x + r, y + r, r, Math.PI, 0);
  g.lineTo(x + w, y + h);
  g.closePath();
}

/** Devor teksturasi: rangli xarita + yonib turadigan derazalar uchun alohida (emissive) xarita */
function wallTextures(rows: { n: number; w: number; h: number; y: number; glow: string }[], base: string) {
  const W = 512;
  const H = 256;
  const mk = () => Object.assign(document.createElement("canvas"), { width: W, height: H });
  const color = mk();
  const glow = mk();
  const gc = color.getContext("2d")!;
  const ge = glow.getContext("2d")!;
  gc.fillStyle = base;
  gc.fillRect(0, 0, W, H);
  gc.fillStyle = "rgba(110,90,70,0.18)";
  gc.fillRect(0, H * 0.06, W, 4);
  gc.fillRect(0, H * 0.52, W, 3);
  ge.fillStyle = "#000";
  ge.fillRect(0, 0, W, H);
  for (const row of rows) {
    for (let i = 0; i < row.n; i++) {
      const x = (W / row.n) * (i + 0.5) - row.w / 2;
      archPath(gc, x, row.y, row.w, row.h);
      gc.fillStyle = "#2a1d14";
      gc.fill();
      archPath(ge, x, row.y, row.w, row.h);
      ge.fillStyle = row.glow;
      ge.fill();
    }
  }
  const t1 = new THREE.CanvasTexture(color);
  const t2 = new THREE.CanvasTexture(glow);
  t1.colorSpace = t2.colorSpace = THREE.SRGBColorSpace;
  t1.anisotropy = t2.anisotropy = 4;
  return [t1, t2] as const;
}

function softSprite(inner: string, outer: string) {
  const c = Object.assign(document.createElement("canvas"), { width: 128, height: 128 });
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export default function MosqueScene({ onReady, onError }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      onError?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
    camera.position.set(0, 4.2, 19.4);
    camera.lookAt(0, 2.0, 0);

    // Kech tushayotgan quyosh: iliq asosiy yorug'lik, qizil va ko'k qo'shimchalar
    const key = new THREE.DirectionalLight(0xffd9a3, 2.5);
    key.position.set(4, 5, 6);
    const rim = new THREE.PointLight(0x3b6ce1, 34, 22);
    rim.position.set(-5, 3, 4);
    const back = new THREE.PointLight(0x2fbfbc, 18, 20);
    back.position.set(4, 4, -6);
    scene.add(key, rim, back, new THREE.AmbientLight(0x7f93d8, 0.18));

    const geometries: THREE.BufferGeometry[] = [];
    const disposables: { dispose: () => void }[] = [];
    const geo = <T extends THREE.BufferGeometry>(g: T) => (geometries.push(g), g);
    const own = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

    // ───── Materiallar ─────
    const [hallMap, hallGlow] = wallTextures(
      [{ n: 3, w: 64, h: 104, y: 124, glow: "#ffb45a" }, { n: 6, w: 34, h: 56, y: 34, glow: "#ff9d3c" }],
      "#e6dac8",
    );
    const [drumMap, drumGlow] = wallTextures([{ n: 12, w: 20, h: 70, y: 100, glow: "#ffc070" }], "#e0d3bf");
    own(hallMap); own(hallGlow); own(drumMap); own(drumGlow);
    const hallMat = own(new THREE.MeshStandardMaterial({ map: hallMap, emissiveMap: hallGlow, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.85 }));
    const drumMat = own(new THREE.MeshStandardMaterial({ map: drumMap, emissiveMap: drumGlow, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.85 }));
    const stoneMat = own(new THREE.MeshStandardMaterial({ color: 0xe9dfd0, roughness: 0.8 }));
    const leadMat = own(new THREE.MeshPhysicalMaterial({ color: 0x5d7898, metalness: 0.55, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.3 }));
    const goldMat = own(new THREE.MeshStandardMaterial({ color: 0xe3ae5b, metalness: 1, roughness: 0.25 }));
    const groundMat = own(new THREE.MeshStandardMaterial({ color: 0x0d1733, roughness: 0.3, metalness: 0.3 }));

    const mosque = new THREE.Group();

    // ───── Maydon (poydevor) ─────
    const ground = new THREE.Mesh(geo(new THREE.CylinderGeometry(4.35, 4.5, 0.16, 64)), groundMat);
    ground.position.y = -0.08;
    const platform = new THREE.Mesh(geo(new THREE.CylinderGeometry(3.85, 3.95, 0.22, 64)), stoneMat);
    platform.position.y = 0.11;
    mosque.add(ground, platform);
    const PY = 0.22; // poydevor usti

    // ───── Asosiy zal ─────
    const hall = new THREE.Mesh(geo(new THREE.BoxGeometry(3.0, 1.15, 3.0)), hallMat);
    hall.position.y = PY + 0.575;
    mosque.add(hall);
    const HALL_TOP = PY + 1.15;

    // ───── Gumbaz birligi: baraban (deraza) + gumbaz + oltin uchi ─────
    const addDome = (r: number, x: number, z: number, baseY: number, drumH: number) => {
      const u = new THREE.Group();
      u.position.set(x, baseY, z);
      const drum = new THREE.Mesh(geo(new THREE.CylinderGeometry(r * 0.97, r, drumH, 36)), drumMat);
      drum.position.y = drumH / 2;
      const dg = geo(new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2));
      dg.scale(1, 0.92, 1);
      const dome = new THREE.Mesh(dg, leadMat);
      dome.position.y = drumH;
      const apex = drumH + r * 0.92;
      const stem = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.012, 0.02, r * 0.32, 8)), goldMat);
      stem.position.y = apex + r * 0.14;
      const ball = new THREE.Mesh(geo(new THREE.SphereGeometry(0.05 + r * 0.03, 12, 12)), goldMat);
      ball.position.y = apex + r * 0.3;
      u.add(drum, dome, stem, ball);
      mosque.add(u);
    };
    addDome(1.22, 0, 0, HALL_TOP, 0.55); // markaziy katta gumbaz
    [[1.45, 0], [-1.45, 0], [0, 1.45], [0, -1.45]].forEach(([x, z]) => addDome(0.72, x, z, HALL_TOP, 0.2)); // yon gumbazlar
    [[1.2, 1.2], [-1.2, 1.2], [1.2, -1.2], [-1.2, -1.2]].forEach(([x, z]) => addDome(0.5, x, z, HALL_TOP, 0.18)); // burchak gumbazlari

    // ───── Minoralar (jami 6 ta) ─────
    const addMinaret = (x: number, z: number, h: number, balconies: number[]) => {
      const m = new THREE.Group();
      m.position.set(x, PY, z);
      const shaft = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.085, 0.115, h, 20)), stoneMat);
      shaft.position.y = h / 2;
      m.add(shaft);
      for (const by of balconies) {
        const b = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.21, 0.19, 0.07, 24)), stoneMat);
        b.position.y = by;
        const rail = new THREE.Mesh(geo(new THREE.TorusGeometry(0.205, 0.012, 8, 28)), goldMat);
        rail.rotation.x = Math.PI / 2;
        rail.position.y = by + 0.07;
        m.add(b, rail);
      }
      const cap = new THREE.Mesh(geo(new THREE.ConeGeometry(0.15, 0.62, 20)), leadMat);
      cap.position.y = h + 0.31;
      const tip = new THREE.Mesh(geo(new THREE.SphereGeometry(0.035, 10, 10)), goldMat);
      tip.position.y = h + 0.66;
      m.add(cap, tip);
      mosque.add(m);
    };
    [[2.3, 2.3], [-2.3, 2.3], [2.3, -2.3], [-2.3, -2.3]].forEach(([x, z]) => addMinaret(x, z, 3.5, [1.7, 2.5, 3.05]));
    [[1.75, 3.35], [-1.75, 3.35]].forEach(([x, z]) => addMinaret(x, z, 2.7, [1.5, 2.2]));

    mosque.position.y = -0.1;
    scene.add(mosque);

    // ───── Yarim oy va yulduzlar (osmon) ─────
    const crescentShape = new THREE.Shape();
    crescentShape.absarc(0, 0, 0.5, 0.95, Math.PI * 2 - 0.95, false);
    crescentShape.absarc(0.24, 0, 0.4, Math.PI * 2 - 1.15, 1.15, true);
    const moon = new THREE.Mesh(
      geo(new THREE.ShapeGeometry(crescentShape, 48)),
      own(new THREE.MeshBasicMaterial({ color: 0xffe3a0, side: THREE.DoubleSide, toneMapped: false })),
    );
    moon.position.set(-3.1, 4.6, -4);
    moon.rotation.z = 0.5;
    const haloTex = own(softSprite("rgba(255,214,140,0.55)", "rgba(255,214,140,0)"));
    const halo = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    halo.position.copy(moon.position);
    halo.scale.setScalar(3.4);
    scene.add(moon, halo);

    const COUNT = 150;
    const pts = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 6 + Math.random() * 7;
      pts[i * 3] = Math.cos(a) * r;
      pts[i * 3 + 1] = 0.8 + Math.random() * 7;
      pts[i * 3 + 2] = Math.sin(a) * r - 3;
    }
    const starsGeo = geo(new THREE.BufferGeometry());
    starsGeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    const starsMat = own(new THREE.PointsMaterial({ size: 0.07, color: 0xfff1cf, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // ───── O'lcham, sichqoncha, tsikl ─────
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let onScreen = true;
    let raf = 0;
    let rotY = 0.6;
    let tiltX = 0;
    let first = true;
    const timer = new THREE.Timer();
    // Dasturchi kaliti: localStorage.sh3d = "force" tezlik tekshiruvini o'chiradi (sinov uchun)
    let force = false;
    try { force = localStorage.getItem("sh3d") === "force"; } catch { /* ruxsat yo'q */ }

    // Jonli tezlik tekshiruvi: dastlabki kadrlar juda sekin bo'lsa (< ~10 kadr/s), yengil rasmga qaytadi
    let frames = 0;
    let slow = 0;
    let lastNow = performance.now();

    const frame = () => {
      raf = 0;
      if (!onScreen || document.hidden) return;
      const now = performance.now();
      if (frames++ >= 8 && frames <= 60) {
        if (now - lastNow > 110) slow++;
        if (!force && slow >= 12) {
          onError?.();
          return;
        }
      }
      lastNow = now;
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
      const t = timer.getElapsed();

      rotY += dt * 0.22;
      tiltX += (pointer.y * 0.1 - tiltX) * Math.min(1, dt * 4);
      mosque.rotation.y = rotY + pointer.x * 0.45;
      mosque.rotation.x = tiltX;
      mosque.position.y = -0.1 + Math.sin(t * 0.8) * 0.03;
      hallMat.emissiveIntensity = drumMat.emissiveIntensity = 0.8 + Math.sin(t * 1.3) * 0.08; // derazalar nafas olgandek
      stars.rotation.y = t * 0.012;
      starsMat.opacity = 0.7 + Math.sin(t * 1.6) * 0.15;
      renderer.render(scene, camera);
      if (first) {
        first = false;
        onReady?.();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && onScreen && !document.hidden) {
        timer.update();
        raf = requestAnimationFrame(frame);
      }
    };

    // Ekrandan chiqsa yoki tab yashirinsa, hisoblash to'xtaydi (batareya va protsessor uchun)
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) start();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", start);
    start();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", start);
      window.removeEventListener("pointermove", onMove);
      geometries.forEach((g) => g.dispose());
      disposables.forEach((d) => d.dispose());
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [onReady, onError]);

  return <div ref={hostRef} className="h-full w-full" />;
}
