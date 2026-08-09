
'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Box,
  RotateCcw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductDimensions } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChocolateMeshViewerProps {
  shape: string;
  dimensions: ProductDimensions;
  className?: string;
}

export function ChocolateMeshViewer({
  shape,
  dimensions,
  className,
}: ChocolateMeshViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number | null>(null);

  const controlsRef = useRef({
    rotationX: -0.5,
    rotationY: 0.8,
    zoom: 1,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(0, 0, 7);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 8, 10);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
    fillLight.position.set(-6, 2, 5);
    scene.add(fillLight);

    const animate = () => {
      if (meshRef.current) {
        const target = controlsRef.current;
        meshRef.current.rotation.x += (target.rotationX - meshRef.current.rotation.x) * 0.1;
        meshRef.current.rotation.y += (target.rotationY - meshRef.current.rotation.y) * 0.1;
        const zoom = target.zoom;
        meshRef.current.scale.set(zoom, zoom, zoom);
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !cameraRef.current || !rendererRef.current) return;
      const { width: w, height: h } = entries[0].contentRect;
      if (w <= 0 || h <= 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (meshRef.current) {
      const oldGroup = meshRef.current;
      scene.remove(oldGroup);
      oldGroup.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
      meshRef.current = null;
    }

    const rawLength = Number(dimensions.length || dimensions.sideLength || dimensions.diameter || dimensions.base || dimensions.width || 50);
    const rawWidth = Number(dimensions.width || dimensions.sideLength || dimensions.diameter || 50);
    const rawHeight = Number(dimensions.height || 20);

    const safeLength = Number.isFinite(rawLength) && rawLength > 0 ? rawLength : 50;
    const safeWidth = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : 50;
    const safeHeight = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : 20;

    const maxDimension = Math.max(safeLength, safeWidth, safeHeight);
    const scaleFactor = maxDimension > 0 ? 3 / maxDimension : 1;
    const L = safeLength * scaleFactor;
    const W = safeWidth * scaleFactor;
    const H = safeHeight * scaleFactor;

    const group = new THREE.Group();
    let geometry: THREE.BufferGeometry;

    switch (shape) {
      case 'Spherical':
        geometry = new THREE.SphereGeometry(L / 2, 64, 40);
        break;
      case 'Half Spherical':
        geometry = new THREE.SphereGeometry(L / 2, 64, 40, 0, Math.PI * 2, 0, Math.PI / 2);
        break;
      case 'Cylindrical':
      case 'Circular':
        geometry = new THREE.CylinderGeometry(L / 2, L / 2, H, 64, 1);
        break;
      case 'Conical':
        geometry = new THREE.ConeGeometry(L / 2, H, 64, 1);
        break;
      case 'Triangular':
        geometry = new THREE.CylinderGeometry(L / 2, L / 2, H, 3, 1);
        break;
      case 'Heart': {
        const heartShape = new THREE.Shape();
        heartShape.moveTo(0.25, 0.25);
        heartShape.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
        heartShape.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
        heartShape.bezierCurveTo(-0.3, 0.55, -0.15, 0.77, 0.25, 0.95);
        heartShape.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
        heartShape.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
        heartShape.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
        const extrudeSettings = { depth: 0.4, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.05, bevelThickness: 0.05 };
        geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        geometry.rotateX(Math.PI);
        geometry.scale(L * 0.8, L * 0.8, H * 2.5);
        break;
      }
      case 'Oval':
        geometry = new THREE.SphereGeometry(1, 64, 40);
        geometry.scale(L / 2, H / 2, W / 2);
        break;
      default:
        geometry = new THREE.BoxGeometry(L, H, W);
    }

    geometry.center();

    const material = new THREE.MeshStandardMaterial({ color: 0x3d1e16, roughness: 0.38, metalness: 0.08 });
    const mesh = new THREE.Mesh(geometry, material);
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.48 });
    const net = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

    group.add(mesh);
    group.add(net);
    scene.add(group);
    meshRef.current = group;

    if (cameraRef.current) {
      const groupBox = new THREE.Box3().setFromObject(group);
      const boundingSphere = groupBox.getBoundingSphere(new THREE.Sphere());
      const radius = Math.max(boundingSphere.radius, 0.5);
      const fov = THREE.MathUtils.degToRad(cameraRef.current.fov);
      const distance = radius / Math.sin(fov / 2);
      const safeDistance = Math.max(distance * 1.35, 4.5);
      cameraRef.current.position.set(0, 0, safeDistance);
      cameraRef.current.lookAt(0, 0, 0);
      cameraRef.current.updateProjectionMatrix();
    }
  }, [shape, dimensions]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.lastMouseX = e.clientX;
      controlsRef.current.lastMouseY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!controlsRef.current.isDragging) return;
      const dx = e.clientX - controlsRef.current.lastMouseX;
      const dy = e.clientY - controlsRef.current.lastMouseY;
      controlsRef.current.rotationY += dx * 0.01;
      controlsRef.current.rotationX += dy * 0.01;
      controlsRef.current.rotationX = Math.max(-Math.PI, Math.min(Math.PI, controlsRef.current.rotationX));
      controlsRef.current.lastMouseX = e.clientX;
      controlsRef.current.lastMouseY = e.clientY;
    };
    const onMouseUp = () => { controlsRef.current.isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      controlsRef.current.zoom = Math.max(0.55, Math.min(2.5, controlsRef.current.zoom - e.deltaY * 0.001));
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  const resetView = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    controlsRef.current.rotationX = -0.5;
    controlsRef.current.rotationY = 0.8;
    controlsRef.current.zoom = 1;
  };

  const handleZoom = (e: React.MouseEvent, delta: number) => {
    e.preventDefault(); e.stopPropagation();
    controlsRef.current.zoom = Math.max(0.55, Math.min(2.5, controlsRef.current.zoom + delta));
  };

  return (
    <div className={cn('mt-4 p-4 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border flex flex-col items-center justify-center w-full max-w-md mx-auto overflow-hidden relative group shadow-inner', className)}>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 bg-white/50 px-3 py-1 rounded-full shadow-sm z-10">
        <Box className="h-3 w-3" /> {shape} Mesh Preview
      </div>
      <div ref={mountRef} className="h-[250px] w-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none overflow-hidden relative [&>canvas]:block [&>canvas]:!w-full [&>canvas]:!h-full" />
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-none" onClick={resetView} title="Reset View"><RotateCcw className="h-4 w-4" /></Button>
        <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-none" onClick={(e) => handleZoom(e, 0.2)} title="Zoom In"><Maximize2 className="h-4 w-4" /></Button>
        <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-none" onClick={(e) => handleZoom(e, -0.2)} title="Zoom Out"><Minimize2 className="h-4 w-4" /></Button>
      </div>
      <div className="text-center"><p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Drag to Rotate • Scroll to Zoom</p></div>
    </div>
  );
}
