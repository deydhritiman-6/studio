
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE_LIB from 'three';
import {
  Box,
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  Component,
  Cuboid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductDimensions, SurfacePattern, SegmentType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CHOCOLATE_TEXTURES, DEFAULT_TEXTURE } from '@/lib/textures';

interface ChocolateMeshViewerProps {
  shape: string;
  dimensions: ProductDimensions;
  textureId?: string;
  surfacePattern?: SurfacePattern;
  segmentType?: SegmentType;
  className?: string;
}

export function ChocolateMeshViewer({
  shape,
  dimensions,
  textureId,
  surfacePattern = 'None',
  segmentType = 'Square',
  className,
}: ChocolateMeshViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'material' | 'mesh' | 'technical'>('material');

  const sceneRef = useRef<THREE_LIB.Scene | null>(null);
  const rendererRef = useRef<THREE_LIB.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE_LIB.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE_LIB.Group | null>(null);
  const frameRef = useRef<number | null>(null);

  const controlsRef = useRef({
    rotationX: -0.5,
    rotationY: 0.8,
    zoom: 1,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  const activeTexture = useMemo(() => {
    return CHOCOLATE_TEXTURES.find(t => t.id === textureId) || DEFAULT_TEXTURE;
  }, [textureId]);

  const createProceduralNormalMap = (type?: string, tiling = 1) => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, size, size);

    const repeat = Math.max(1, Math.floor(10 / (tiling || 1)));

    if (type === 'Velvet') {
      for (let i = 0; i < 20000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 128 + (Math.random() - 0.5) * 40;
        const g = 128 + (Math.random() - 0.5) * 40;
        ctx.fillStyle = `rgb(${r}, ${g}, 255)`;
        ctx.fillRect(x, y, 1, 1);
      }
    } else if (type === 'Hammered') {
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = 10 + Math.random() * 30;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, 'rgb(100, 100, 255)');
        grad.addColorStop(1, 'rgb(128, 128, 255)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'Ridged' || type === 'Ribbed Surface') {
      const step = size / repeat;
      for (let i = 0; i < size; i += step) {
        ctx.fillStyle = 'rgb(140, 140, 255)';
        ctx.fillRect(i, 0, step / 2, size);
      }
    } else if (type === 'Wavy' || type === 'Wavy Surface') {
      const step = size / repeat;
      for (let i = 0; i < size; i += 2) {
        const y = (Math.sin((i / size) * Math.PI * 2 * repeat) + 1) / 2;
        ctx.fillStyle = `rgb(${128 + y * 60}, 128, 255)`;
        ctx.fillRect(i, 0, 2, size);
      }
    } else if (type === 'Dusted') {
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const noise = Math.random() * 60;
        ctx.fillStyle = `rgb(${128 + noise}, ${128 + noise}, 255)`;
        ctx.fillRect(x, y, 2, 2);
      }
    } else if (type === 'Bubbles') {
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = 2 + Math.random() * 8;
        ctx.fillStyle = 'rgb(150, 150, 255)';
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === 'Cracked') {
      ctx.strokeStyle = 'rgb(100, 100, 255)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * size, Math.random() * size);
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(Math.random() * size, Math.random() * size);
        }
        ctx.stroke();
      }
    } else if (type === 'Rippled' || type === 'Rippled Surface') {
      const step = size / repeat;
      for (let i = 0; i < size; i += step) {
        const grad = ctx.createLinearGradient(0, i, 0, i + step);
        grad.addColorStop(0, 'rgb(120, 120, 255)');
        grad.addColorStop(0.5, 'rgb(160, 160, 255)');
        grad.addColorStop(1, 'rgb(120, 120, 255)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, i, size, step);
      }
    }

    const tex = new THREE_LIB.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE_LIB.RepeatWrapping;
    return tex;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;

    const scene = new THREE_LIB.Scene();
    sceneRef.current = scene;

    const camera = new THREE_LIB.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(0, 0, 7);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE_LIB.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE_LIB.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE_LIB.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE_LIB.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 8, 10);
    scene.add(directionalLight);

    const fillLight = new THREE_LIB.DirectionalLight(0xffffff, 0.5);
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
      cameraRef.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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
        if (child instanceof THREE_LIB.Mesh || child instanceof THREE_LIB.LineSegments) {
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

    const group = new THREE_LIB.Group();

    // Priority for surface pattern mapping
    const effectiveNormalType = surfacePattern !== 'None' && surfacePattern !== 'Molded Chocolate Grid Texture' 
      ? surfacePattern 
      : activeTexture.normalType;

    const normalMap = createProceduralNormalMap(effectiveNormalType, dimensions.patternSize);
    
    const material = new THREE_LIB.MeshStandardMaterial({ 
      color: activeTexture.color, 
      roughness: activeTexture.roughness, 
      metalness: activeTexture.metalness,
      normalMap: normalMap,
      normalScale: new THREE_LIB.Vector2(1.8, 1.8),
      visible: viewMode !== 'mesh'
    });

    const createShapeGeometry = () => {
      let geo: THREE_LIB.BufferGeometry;
      switch (shape) {
        case 'Spherical':
          geo = new THREE_LIB.SphereGeometry(L / 2, 64, 40);
          break;
        case 'Half Spherical':
        case 'Dome':
          geo = new THREE_LIB.SphereGeometry(L / 2, 64, 40, 0, Math.PI * 2, 0, Math.PI / 2);
          break;
        case 'Cylindrical':
        case 'Circular':
        case 'Round':
          geo = new THREE_LIB.CylinderGeometry(L / 2, L / 2, H, 64, 1);
          break;
        case 'Conical':
          geo = new THREE_LIB.ConeGeometry(L / 2, H, 64, 1);
          break;
        case 'Triangular':
          geo = new THREE_LIB.CylinderGeometry(L / 2, L / 2, H, 3, 1);
          break;
        case 'Heart': {
          const heartShape = new THREE_LIB.Shape();
          heartShape.moveTo(0, 0);
          heartShape.bezierCurveTo(0.5, 0.5, 1, 0.5, 1, 0);
          heartShape.bezierCurveTo(1, -0.5, 0.5, -0.8, 0, -1);
          heartShape.bezierCurveTo(-0.5, -0.8, -1, -0.5, -1, 0);
          heartShape.bezierCurveTo(-1, 0.5, -0.5, 0.5, 0, 0);
          const extrudeSettings = { depth: 0.4, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.05, bevelThickness: 0.05 };
          geo = new THREE_LIB.ExtrudeGeometry(heartShape, extrudeSettings);
          geo.rotateX(Math.PI);
          geo.scale(L * 0.4, L * 0.4, H * 2);
          break;
        }
        case 'Oval':
          geo = new THREE_LIB.SphereGeometry(1, 64, 40);
          geo.scale(L / 2, H / 2, W / 2);
          break;
        default:
          geo = new THREE_LIB.BoxGeometry(L, H, W);
      }
      return geo;
    };

    if (surfacePattern === 'Molded Chocolate Grid Texture' && (shape === 'Rectangular' || shape === 'Square' || shape === 'Bar')) {
      const baseH = H * 0.4;
      const topH = H * 0.6;
      
      const baseGeo = new THREE_LIB.BoxGeometry(L, baseH, W);
      baseGeo.translate(0, -topH / 2, 0);
      const baseMesh = new THREE_LIB.Mesh(baseGeo, material);
      group.add(baseMesh);

      const rows = shape === 'Square' ? Math.max(2, Math.floor(L / (H * 0.8))) : Math.max(1, Math.floor(W / (H * 1.5)));
      const cols = Math.max(2, Math.floor(L / (H * 1.5)));
      
      const gutter = 0.05;
      const blockL = (L / cols) - gutter;
      const blockW = (W / rows) - gutter;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const posX = (i * (blockL + gutter)) - (L / 2) + (blockL / 2) + (gutter / 2);
          const posZ = (j * (blockW + gutter)) - (W / 2) + (blockW / 2) + (gutter / 2);
          
          let blockGeo: THREE_LIB.BufferGeometry;
          if (segmentType === 'Rounded' || segmentType === 'Premium') {
            const blockShape = new THREE_LIB.Shape();
            const radius = 0.05;
            blockShape.moveTo(-blockL/2 + radius, -blockW/2);
            blockShape.lineTo(blockL/2 - radius, -blockW/2);
            blockShape.quadraticCurveTo(blockL/2, -blockW/2, blockL/2, -blockW/2 + radius);
            blockShape.lineTo(blockL/2, blockW/2 - radius);
            blockShape.quadraticCurveTo(blockL/2, blockW/2, blockL/2 - radius, blockW/2);
            blockShape.lineTo(-blockL/2 + radius, blockW/2);
            blockShape.quadraticCurveTo(-blockL/2, blockW/2, -blockL/2, blockW/2 - radius);
            blockShape.lineTo(-blockL/2, -blockW/2 + radius);
            blockShape.quadraticCurveTo(-blockL/2, -blockW/2, -blockL/2 + radius, -blockW/2);
            
            const extSettings = { depth: topH, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 };
            blockGeo = new THREE_LIB.ExtrudeGeometry(blockShape, extSettings);
            blockGeo.rotateX(Math.PI / 2);
          } else {
            blockGeo = new THREE_LIB.BoxGeometry(blockL, topH, blockW);
          }
          
          blockGeo.translate(posX, topH / 2, posZ);
          const blockMesh = new THREE_LIB.Mesh(blockGeo, material);
          group.add(blockMesh);
        }
      }
    } else {
      const geometry = createShapeGeometry();
      geometry.center();
      const mesh = new THREE_LIB.Mesh(geometry, material);
      group.add(mesh);
    }

    group.traverse((obj) => {
      if (obj instanceof THREE_LIB.Mesh) {
        const wireGeo = new THREE_LIB.WireframeGeometry(obj.geometry);
        const wireMat = new THREE_LIB.LineBasicMaterial({ 
          color: viewMode === 'technical' ? 0xffffff : 0xd4af37, 
          transparent: true, 
          opacity: viewMode === 'material' ? 0.2 : 0.8 
        });
        const line = new THREE_LIB.LineSegments(wireGeo, wireMat);
        obj.add(line);
      }
    });

    scene.add(group);
    meshRef.current = group;

    if (cameraRef.current) {
      const groupBox = new THREE_LIB.Box3().setFromObject(group);
      const boundingSphere = groupBox.getBoundingSphere(new THREE_LIB.Sphere());
      const radius = Math.max(boundingSphere.radius, 0.5);
      const fov = THREE_LIB.MathUtils.degToRad(cameraRef.current.fov);
      const distance = radius / Math.sin(fov / 2);
      cameraRef.current.position.set(0, 0, Math.max(distance * 1.35, 4.5));
      cameraRef.current.lookAt(0, 0, 0);
      cameraRef.current.updateProjectionMatrix();
    }
  }, [shape, dimensions, activeTexture, viewMode, surfacePattern, segmentType]);

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

  return (
    <div className={cn('mt-4 p-4 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center w-full max-w-md mx-auto overflow-hidden relative group shadow-inner', className)}>
      <div className="absolute top-4 left-4 z-20 flex gap-2">
         <Button 
            type="button" 
            variant={viewMode === 'material' ? 'default' : 'secondary'} 
            size="icon" 
            className="h-8 w-8 rounded-full shadow-md"
            onClick={() => setViewMode('material')}
            title="Realistic Material"
         >
            <Cuboid className="h-4 w-4" />
         </Button>
         <Button 
            type="button" 
            variant={viewMode === 'mesh' ? 'default' : 'secondary'} 
            size="icon" 
            className="h-8 w-8 rounded-full shadow-md"
            onClick={() => setViewMode('mesh')}
            title="Artisan Mesh"
         >
            <Layers className="h-4 w-4" />
         </Button>
         <Button 
            type="button" 
            variant={viewMode === 'technical' ? 'default' : 'secondary'} 
            size="icon" 
            className="h-8 w-8 rounded-full shadow-md"
            onClick={() => setViewMode('technical')}
            title="Technical Specs"
         >
            <Component className="h-4 w-4" />
         </Button>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-background/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-md z-10 border border-border/50">
        <Box className="h-3 w-3" /> {shape} {viewMode === 'material' ? 'Mould' : 'Mesh'} Preview
      </div>

      <div ref={mountRef} className="h-[280px] w-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none overflow-hidden relative [&>canvas]:block [&>canvas]:!w-full [&>canvas]:!h-full" />
      
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-none" onClick={() => { controlsRef.current.rotationX = -0.5; controlsRef.current.rotationY = 0.8; controlsRef.current.zoom = 1; }} title="Reset View"><RotateCcw className="h-4 w-4" /></Button>
        <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-none" onClick={() => controlsRef.current.zoom = Math.min(2.5, controlsRef.current.zoom + 0.2)} title="Zoom In"><Maximize2 className="h-4 w-4" /></Button>
        <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-none" onClick={() => controlsRef.current.zoom = Math.max(0.55, controlsRef.current.zoom - 0.2)} title="Zoom Out"><Minimize2 className="h-4 w-4" /></Button>
      </div>
      
      <div className="text-center">
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
          {surfacePattern !== 'None' ? `${surfacePattern} • ` : ''}{activeTexture.name}
        </p>
      </div>
    </div>
  );
}
