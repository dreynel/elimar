'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Accommodation3DProps {
  imageUrl: string;
  height?: string | number;
  autoPlay?: boolean;
  visible?: boolean;
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export default function Accommodation3D({
  imageUrl,
  height = '600px',
  autoPlay = false,
  visible = true,
  className = '',
  onReady,
  onError,
}: Accommodation3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const animationFrameRef = useRef<number>(null);
  const resizeObserverRef = useRef<ResizeObserver>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);

  // Cleanup function
  const cleanup = () => {
    // Cancel animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disconnect ResizeObserver
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // Dispose controls
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }

    // Dispose texture
    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }

    // Dispose sphere geometry and material
    if (sphereRef.current) {
      sphereRef.current.geometry.dispose();
      if (sphereRef.current.material instanceof THREE.Material) {
        sphereRef.current.material.dispose();
      }
      sphereRef.current = null;
    }

    // Dispose renderer
    if (rendererRef.current) {
      const container = containerRef.current;
      if (container && rendererRef.current.domElement.parentElement === container) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    // Clear scene
    if (sceneRef.current) {
      sceneRef.current.clear();
      sceneRef.current = null;
    }

    cameraRef.current = null;
  };

  // Initialize Three.js scene
  const initializeScene = () => {
    const container = containerRef.current;
    if (!container) {
      console.warn('[Accommodation3D] Container not available');
      return false;
    }

    // Check if container has dimensions
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn('[Accommodation3D] Container has zero dimensions, retrying...');
      return false;
    }

    // Clean up any existing canvas
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    console.log('[Accommodation3D] Initializing scene with dimensions:', {
      width: container.clientWidth,
      height: container.clientHeight,
    });

    // Check for WebGL availability
    const canvasCheck = document.createElement('canvas');
    const gl = canvasCheck.getContext('webgl') || canvasCheck.getContext('experimental-webgl');
    
    if (!gl) {
      console.error('[Accommodation3D] WebGL not supported');
      setWebglAvailable(false);
      setIsLoading(false);
      return false;
    }
    setWebglAvailable(true);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 0, 0.1); // Position at center, slight offset
    cameraRef.current = camera;

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = -0.4;
    controls.minDistance = 0.1;
    controls.maxDistance = 100;
    controls.enableZoom = true;
    controls.autoRotate = autoPlay;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // Setup resize observer
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;

    return true;
  };

  // Handle window and container resize
  const handleResize = () => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    console.log('[Accommodation3D] Resized to:', { width, height });
  };

  // Load texture
  const loadTexture = (url: string) => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;

    if (!scene || !renderer) {
      console.warn('[Accommodation3D] Scene or renderer not ready for texture load');
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    // Use URL as-is if it's an absolute URL, otherwise ensure it starts with / for Next.js public directory
    const imagePath = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') 
      ? url 
      : `/${url}`;

    console.log('[Accommodation3D] Loading texture:', imagePath);

    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      imagePath,
      (texture) => {
        console.log('[Accommodation3D] Texture loaded successfully:', {
          width: texture.image?.width,
          height: texture.image?.height,
          path: imagePath,
        });

        // Configure texture for equirectangular panorama
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;

        // Dispose old texture
        if (textureRef.current) {
          textureRef.current.dispose();
        }
        textureRef.current = texture;

        // Create or update sphere
        if (sphereRef.current) {
          // Update existing sphere's material
          const material = sphereRef.current.material as THREE.MeshBasicMaterial;
          if (material.map) {
            material.map.dispose();
          }
          material.map = texture;
          material.needsUpdate = true;
        } else {
          // Create new sphere
          const geometry = new THREE.SphereGeometry(500, 60, 40);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
          });

          const sphere = new THREE.Mesh(geometry, material);
          sphere.scale.set(-1, 1, 1); // Invert sphere to see from inside
          scene.add(sphere);
          sphereRef.current = sphere;
        }

        // Force initial render
        if (cameraRef.current) {
          renderer.render(scene, cameraRef.current);
        }

        setIsLoading(false);
        
        // Call onReady callback
        if (onReady) {
          onReady();
        }

        console.log('[Accommodation3D] Texture applied successfully');
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = (progress.loaded / progress.total * 100).toFixed(2);
          console.log('[Accommodation3D] Loading progress:', `${percent}%`);
        }
      },
      (error) => {
        console.error('[Accommodation3D] Error loading texture:', error);
        console.error('[Accommodation3D] Failed path:', imagePath);
        
        const errorMsg = `Failed to load panoramic image: ${imagePath}`;
        setLoadError(errorMsg);
        setIsLoading(false);
        
        if (onError) {
          onError(new Error(errorMsg));
        }
      }
    );
  };

  // Animation loop
  const animate = () => {
    if (!visible) {
      // Don't animate when not visible
      animationFrameRef.current = null;
      return;
    }

    const controls = controlsRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (controls && renderer && scene && camera) {
      controls.update();
      renderer.render(scene, camera);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Initialize on mount or when visibility changes
  useEffect(() => {
    if (!visible) {
      // Pause animation when not visible
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Try to initialize if not already done
    if (!rendererRef.current) {
      // Delay initialization to ensure modal/container is rendered
      const timeoutId = setTimeout(() => {
        const initialized = initializeScene();
        if (initialized && imageUrl) {
          loadTexture(imageUrl);
          // Start animation loop
          if (animationFrameRef.current === null) {
            animate();
          }
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      // Already initialized, just restart animation
      if (animationFrameRef.current === null) {
        animate();
      }
    }
  }, [visible]);

  // Handle imageUrl changes
  useEffect(() => {
    if (imageUrl && rendererRef.current && visible) {
      loadTexture(imageUrl);
    }
  }, [imageUrl]);

  // Update autoPlay setting
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoPlay;
    }
  }, [autoPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Normalize height prop to a CSS class
  const getHeightClass = () => {
    if (typeof height === 'number') return '';
    if (height === '100%') return 'h-full';
    if (height === '600px') return 'h-[600px]';
    if (height === '80vh') return 'h-[80vh]';
    return '';
  };

  // Apply inline height only when needed for dynamic values
  useEffect(() => {
    if (containerRef.current && typeof height === 'number') {
      containerRef.current.style.height = `${height}px`;
    } else if (containerRef.current && typeof height === 'string' && !['100%', '600px', '80vh'].includes(height)) {
      containerRef.current.style.height = height;
    }
  }, [height]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${getHeightClass()} ${className}`}
    >
      {/* Hold and Drag hint */}
      {!isLoading && !loadError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-2 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
          Hold and Drag to explore
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm font-medium">Loading 360° View...</p>
          </div>
        </div>
      )}

      {/* Error fallback */}
      {(loadError || webglAvailable === false) && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 px-6 text-center">
          <div className="flex flex-col items-center gap-4 p-8 text-center max-w-md">
            <div className="text-6xl">⚠️</div>
            <p className="text-white text-lg font-semibold">
              {webglAvailable === false ? 'WebGL Unavailable' : 'Failed to Load Panorama'}
            </p>
            <p className="text-neutral-400 text-sm">
              {webglAvailable === false 
                ? "Your browser doesn't support WebGL, which is required for the 3D view. Try enabling hardware acceleration."
                : loadError}
            </p>
          </div>
        </div>
      )}

      {/* Three.js canvas will be appended here */}
    </div>
  );
}
