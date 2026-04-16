'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
// OrbitControls from three examples (Esm)
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { Card, CardContent } from './ui/card';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Loader2 } from 'lucide-react';

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
        <p className="text-white text-lg font-medium">Loading Tour...</p>
      </div>
    </div>
  );
}

function WebGLFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 px-6 text-center">
      <div className="max-w-md">
        <h3 className="text-xl font-bold text-white mb-2">WebGL Unavailable</h3>
        <p className="text-neutral-400 mb-4">
          Your browser or device doesn't seem to support WebGL, which is required for the 3D tour.
        </p>
        <p className="text-sm text-neutral-500">
          Try enabling "Hardware Acceleration" in your browser settings or try a different browser.
        </p>
      </div>
    </div>
  );
}

type Tour3DProps = {
  height?: string;
};

export default function Tour3D({ height = '80vh' }: Tour3DProps) {
  const imageUrls: Record<string, string> = {
    '1': '/images/virtual-tour/vt1.jpg',
    '2': '/images/virtual-tour/vt2.jpg',
    '3': '/images/virtual-tour/vt3.jpg',
    '4': '/images/virtual-tour/vt4.jpg',
    '5': '/images/virtual-tour/vt5.jpg',
    '6': '/images/virtual-tour/vt6.jpg',
    '7': '/images/virtual-tour/vt7.jpg',
    '7.1': '/images/virtual-tour/vt7.1.jpg',
    '7.2': '/images/virtual-tour/vt7.2.jpg',
    '7.3': '/images/virtual-tour/vt7.3.jpg',
    '7.4': '/images/virtual-tour/vt7.4.jpg',
    '8': '/images/virtual-tour/vt8.jpg',
    '8.1': '/images/virtual-tour/vt8.1.jpg',
    '8.2': '/images/virtual-tour/vt8.2.jpg',
    '8.3': '/images/virtual-tour/vt8.3.jpg',
    '8.4': '/images/virtual-tour/vt8.4.jpg',
    '9': '/images/virtual-tour/vt9.jpg',
    '9.1': '/images/virtual-tour/vt9.1.jpg',
    '9.2': '/images/virtual-tour/vt9.2.jpg',
    '10': '/images/virtual-tour/vt10.jpg',
    '10.1': '/images/virtual-tour/vt10.1.jpg',
    // add more if needed
  };

  const panoramaTitles: Record<string, string> = {
    '1': 'Main Entrance',
    '2': 'Entrance',
    '3': 'Entance',
    '4': 'Entrance',
    '5': 'Entrance',
    '6': 'Entrance',
    '7': 'Pool Area',
    '7.1': 'Pool Area',
    '7.2': 'Pool Area',
    '7.3': 'Pool Area',
    '7.4': 'CR Area',
    '8': 'Cottages Area',
    '8.1': 'Cottage Area',
    '8.2': 'Cottage Area',
    '8.3': 'Castle House Area',
    '9': 'Kids Pool Area',
    '9.1': 'Kids Pool Area',
    '9.2': 'Castle House Area',
    '10': 'Extended Accommodations Area',
    '10.1': 'Extended Accommodations Area',
  };

  const hotspotsData: Record<
    string,
    { title?: string; position: THREE.Vector3; targetIndex: string; rotation?:  number; direction?: number; direction1?: number;direction2?: number;   }[]
  > = {
    '1': [{ title: "Entrance", position: new THREE.Vector3(-500, -50, 30), targetIndex: '2', direction: 0  }],
    '2': [
      { position: new THREE.Vector3(450, -30, 50), targetIndex: '3', direction: -90 },
      { position: new THREE.Vector3(-400, -100, -20), targetIndex: '1' },
    ],
    '3': [
      { position: new THREE.Vector3(-400, -40, 150), targetIndex: '2', direction: -60  },
      { position: new THREE.Vector3(240, -140, -400), targetIndex: '4', direction: -20
       },
    ],
    '4': [
      { position: new THREE.Vector3(50, -30, 400), targetIndex: '5', direction: 0 },
      { position: new THREE.Vector3(-80, -100, -300), targetIndex: '3', direction: -50 },
    ],
    '5': [
      { position: new THREE.Vector3(450, -100, -80), targetIndex: '4' },
      { position: new THREE.Vector3(-450, 10, 80), targetIndex: '6', direction: -90 },
    ],
    '6': [
      { position: new THREE.Vector3(-30, -20, -400), targetIndex: '7', direction: 0, direction1: 0, direction2:-90, },
      { position: new THREE.Vector3(-70, -20, -400), targetIndex: '8', direction: 0, direction1: 0, direction2:90, },
      { position: new THREE.Vector3(240, -100, 400), targetIndex: '5' },
    ],
    '7': [
      { position: new THREE.Vector3(-300, -50, -300), targetIndex: '6', direction2: 90 },
      { position: new THREE.Vector3(-100, -120, 300), targetIndex: '7.1', direction2: 50 },
      { position: new THREE.Vector3(10, -80, 300), targetIndex: '7.2', direction2: -60 },
      { position: new THREE.Vector3(150, -80, -300), targetIndex: '8', direction2: -60 },
    ],
    '7.1':[
      { position: new THREE.Vector3(-300, -130, -30), targetIndex: '7', direction: 10 },
      { position: new THREE.Vector3(240, -100, 350), targetIndex: '7.3', direction: -40 },
      { position: new THREE.Vector3(300, -150, -350), targetIndex: '7.2' },
    ],
    '7.2':[
      { position: new THREE.Vector3(-400, -150, 100), targetIndex: '7.1', direction: -30 },
      { position: new THREE.Vector3(400, 10, -250), targetIndex: '9' },
    ],
    '7.3':[
      { position: new THREE.Vector3(-390, -100, 60), targetIndex: '7.1', direction: -20 },
      { position: new THREE.Vector3(100, -100, -300), targetIndex: '7.4', direction: -20 },
    ],
    '7.4':[
      { position: new THREE.Vector3(-300, -130, -30), targetIndex: '7.3', direction:-60 },
      { position: new THREE.Vector3(200, -30, 130), targetIndex: '9.1'},
    ],
    '8': [
      { position: new THREE.Vector3(200, -20, 350), targetIndex: '7' },
      { position: new THREE.Vector3(-70, -80, -350), targetIndex: '8.1' },
    ],
    '8.1':[
      { position: new THREE.Vector3(200, -30, -350), targetIndex: '8' },
      { position: new THREE.Vector3(200, -40, 250), targetIndex: '8.2', direction:-30 },
      { position: new THREE.Vector3(-290, 10, -150), targetIndex: '8.3', direction: -30 },
    ],
    '8.2':[
      { position: new THREE.Vector3(400, -30, 140), targetIndex: '8.1' },
      { position: new THREE.Vector3(-100, -50, -400), targetIndex: '10', direction: -30 },
    ],
    '8.3':[
      { position: new THREE.Vector3(-300, -30, -50), targetIndex: '9.2' },
    ],
    '9':[
      { position: new THREE.Vector3(-250, -150, 1), targetIndex: '7.2', direction:30 },
      { position: new THREE.Vector3(10, -50, -350), targetIndex: '9.2', direction2: 30 },
      { position: new THREE.Vector3(100, -100, 150), targetIndex: '9.1', direction1: 30 },
    ],
    '9.1':[
      { position: new THREE.Vector3(150, -200, 400), targetIndex: '7.4' },
      { position: new THREE.Vector3(-250, -50, -20), targetIndex: '9' },
    ],
    '9.2':[
      { position: new THREE.Vector3(200, -150, -50), targetIndex: '9' },
    ],
    '10':[
      { position: new THREE.Vector3(300, -50, 10), targetIndex: '9', direction: -10 },
      { position: new THREE.Vector3(-200, -50, 60), targetIndex: '10.1', direction: -90 },
    ],
    '10.1':[
      { position: new THREE.Vector3(100, -100, 300), targetIndex: '10', direction2: -20 },
    ],
  };

  const [currentIndex, setCurrentIndex] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(true);
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControls>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const currentTextureRef = useRef<THREE.Texture>(null);

  // Initialize Three.js
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    // Check for WebGL availability
    const canvasCheck = document.createElement('canvas');
    const gl = canvasCheck.getContext('webgl') || canvasCheck.getContext('experimental-webgl');
    
    if (!gl) {
      setWebglAvailable(false);
      setIsLoading(false);
      return;
    }
    setWebglAvailable(true);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 0, 0.1);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = -0.4;
    controlsRef.current = controls;

    // Raycaster for hotspot clicks
    // Click handler — make sure recursive check is enabled
    const handleClick = (event: MouseEvent) => {
      if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2();

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      // Recursive: check all children of groups
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

      if (intersects.length > 0) {
        const obj = intersects[0].object as any;
        if (obj.userData.isHotspot) {
          setCurrentIndex(obj.userData.targetIndex);
        }
      }
    };


    container.addEventListener('click', handleClick);

    // Animate loop
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      controls.dispose();
      renderer.dispose();
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);

      if (renderer.domElement.parentElement === container)
        container.removeChild(renderer.domElement);
    };
  }, []);

  // Load panorama texture
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsLoading(true);

    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrls[currentIndex],
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        // Safe color-space handling
        // Safe color-space handling for all Three.js versions
        if ('colorSpace' in texture) {
          // New Three.js (r152+)
          // @ts-ignore
          texture.colorSpace = (THREE as any).SRGBColorSpace;
        } else if ('encoding' in texture) {
          // Old Three.js
          // @ts-ignore
          texture.encoding = THREE.sRGBEncoding;
        }


        if (currentTextureRef.current) currentTextureRef.current.dispose();
        currentTextureRef.current = texture;

        if (!sphereRef.current) {
          const geometry = new THREE.SphereGeometry(500, 60, 40);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
          });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.scale.set(-1, 1, 1);
          scene.add(sphere);
          sphereRef.current = sphere;
        } else {
          const mat = sphereRef.current.material as THREE.MeshBasicMaterial;
          mat.map = texture;
          mat.needsUpdate = true;
        }

        // Add hotspots
        addHotspots(scene, currentIndex);

        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.error('Texture load error', err);
        setIsLoading(false);
      }
    );

    // Preload next panorama (optional)
    const nextIndex = Object.keys(imageUrls)[
      (Object.keys(imageUrls).indexOf(currentIndex) + 1) % Object.keys(imageUrls).length
    ];
    loader.load(imageUrls[nextIndex]);
  }, [currentIndex]);

  // Function to add clickable hotspots
  // Updated addHotspots function
  const addHotspots = (scene: THREE.Scene, index: string) => {
    // Remove previous hotspots
    scene.children
      .filter(
        (obj: THREE.Object3D) =>
          obj.userData.isHotspot ||
          (obj.type === 'Group' &&
            obj.children.some((c: THREE.Object3D) => c.userData?.isHotspot))
      )
      .forEach((obj) => scene.remove(obj));
  
    const data = hotspotsData[index] || [];
  
    data.forEach((hotspot) => {
      const {
        position,
        targetIndex,
        rotation = 0,
        direction = 0,
        direction1 = 0,
        direction2 = 0,
      } = hotspot;
      
      const hotspotMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8, // 👈 adjust (0.3 = more transparent, 0.8 = more solid)
        depthWrite: false, // 👈 helps avoid weird depth issues in panoramas
      });
      
      // Shaft
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 5, 30, 16),
        hotspotMaterial
      );
      shaft.position.set(0, 40, 0);
      
      // Head
      const head = new THREE.Mesh(
        new THREE.ConeGeometry(12, 25, 16),
        hotspotMaterial
      );
      head.position.set(0, 62.5, 0);

      // Group
      const arrow = new THREE.Group();
      arrow.add(shaft, head);
      arrow.position.copy(position);
  
      // ✅ Always apply rotation (defaults = 0)
      arrow.rotation.set(
        THREE.MathUtils.degToRad(direction),
        THREE.MathUtils.degToRad(direction1),
        THREE.MathUtils.degToRad(direction2)
      );
  
      // Optional extra rotation
      if (rotation !== 0) {
        arrow.rotateY(THREE.MathUtils.degToRad(rotation));
      }
  
      // Click detection
      [shaft, head].forEach((mesh) => {
        mesh.userData.isHotspot = true;
        mesh.userData.targetIndex = targetIndex;
      });
  
      scene.add(arrow);
    });
  };
  
  
  
  
  

  
  

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-bold">Interactive 3D Tours</h2>
        <p className="mt-2 text-muted-foreground italic">
          Explore our resort in 360°. Drag to look around, scroll to zoom.
        </p>
      </div>

      <Card className="overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <div
            ref={canvasRef}
            className="relative w-full bg-neutral-900"
            style={{ height }}
            role="img"
            aria-label={`Panoramic view ${currentIndex}`}
          >
             {/* Panorama Header */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 z-10 p-4">
              <div className="mx-auto w-fit rounded-lg bg-black/60 px-4 py-2 backdrop-blur-md">
                <h3 className="text-lg md:text-xl font-semibold text-white">
                  {panoramaTitles[currentIndex] ?? `Panorama ${currentIndex}`}
                </h3>
              </div>
            </div>

            {webglAvailable === false && <WebGLFallback />}
            {isLoading && webglAvailable !== false && <LoadingFallback />}
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 border-t">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 justify-center">
              
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground italic">
        <strong>Tips:</strong> Click and drag to explore • Click hotspots to
        navigate
      </div>
    </div>
  );
}
