'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Box, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductDimensions } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChocolateMeshViewerProps {
  shape: string;
  dimensions: ProductDimensions;
  className?: string;
}

export function ChocolateMeshViewer({ shape, dimensions, className }: ChocolateMeshViewerProps) {
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
    lastMouseY: 0 
  });

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 300;
    const height = mountRef.current.clientHeight || 250;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, -5, -5);
    scene.add(pointLight);

    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.x += (controlsRef.current.rotationX - meshRef.current.rotation.x) * 0.1;
        meshRef.current.rotation.y += (controlsRef.current.rotationY - meshRef.current.rotation.y) * 0.1;
        const s = controlsRef.current.zoom;
        meshRef.current.scale.set(s, s, s);
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
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });

    resizeObserver.observe(mountRef.current);

    return () => {
      resizeObserver.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Geometry
  useEffect(() => {
    if (!sceneRef.current) return;
    
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      meshRef.current = null;
    }

    // Proportions
    // Use fallbacks to ensure something is always visible during entry
    const rawL = Number(dimensions.length || dimensions.sideLength || dimensions.diameter || dimensions.base || 50);
    const rawW = Number(dimensions.width || dimensions.sideLength || dimensions.diameter || 50);
    const rawH = Number(dimensions.height || 20);

    // Normalize so the object is a good size in the viewport (around 3 units max)
    const maxDim = Math.max(rawL, rawW, rawH);
    const scaleFactor = 3 / (maxDim || 1);
    
    const L = rawL * scaleFactor;
    const W = rawW * scaleFactor;
    const H = rawH * scaleFactor;

    const group = new THREE.Group();
    let geometry: THREE.BufferGeometry;

    switch (shape) {
      case 'Spherical':
        geometry = new THREE.SphereGeometry(L / 2, 64, 32);
        break;
      case 'Half Spherical':
        geometry = new THREE.SphereGeometry(L / 2, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        break;
      case 'Cylindrical':
      case 'Circular':
      case 'Conical':
        if (shape === 'Conical') {
          geometry = new THREE.ConeGeometry(L / 2, H, 64);
        } else {
          geometry = new THREE.CylinderGeometry(L / 2, L / 2, H, 64);
        }
        break;
      case 'Triangular':
        geometry = new THREE.CylinderGeometry(L / 2, L / 2, H, 3);
        break;
      case 'Oval':
        geometry = new THREE.SphereGeometry(1, 64, 32);
        geometry.scale(L / 2, H / 2, W / 2);
        break;
      default:
        geometry = new THREE.BoxGeometry(L, H, W);
        break;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x3d1e16,
      roughness: 0.4,
      metalness: 0.2,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Wireframe overlay for "mesh-net" look
    const wireframe = new THREE.WireframeGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xd4af37, 
      transparent: true, 
      opacity: 0.4 
    });
    const net = new THREE.LineSegments(wireframe, lineMaterial);
    
    group.add(mesh);
    group.add(net);
    
    sceneRef.current.add(group);
    meshRef.current = group;
  }, [shape, dimensions]);

  // Event Listeners
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
      controlsRef.current.lastMouseX = e.clientX;
      controlsRef.current.lastMouseY = e.clientY;
    };

    const onMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      controlsRef.current.zoom = Math.max(0.5, Math.min(3, controlsRef.current.zoom - e.deltaY * 0.001));
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

  const resetView = () => {
    controlsRef.current.rotationX = -0.5;
    controlsRef.current.rotationY = 0.8;
    controlsRef.current.zoom = 1;
  };

  return (
    <div className={cn("mt-4 p-4 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border flex flex-col items-center justify-center space-y-4 max-w-md mx-auto overflow-hidden relative group shadow-inner", className)}>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 bg-white/50 px-3 py-1 rounded-full shadow-sm">
        <Box className="h-3 w-3" /> {shape} Mesh Preview
      </div>
      <div ref={mountRef} className="h-[250px] w-full cursor-grab active:cursor-grabbing touch-none" />
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-none" onClick={resetView} title="Reset View">
           <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-none" onClick={() => controlsRef.current.zoom = Math.min(3, controlsRef.current.zoom + 0.2)} title="Zoom In">
           <Maximize2 className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-none" onClick={() => controlsRef.current.zoom = Math.max(0.5, controlsRef.current.zoom - 0.2)} title="Zoom Out">
           <Minimize2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-center">
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Drag to Rotate • Scroll to Zoom</p>
      </div>
    </div>
  );
}