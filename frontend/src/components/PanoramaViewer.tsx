"use client"

import React, {Suspense} from "react"
import {Canvas} from "@react-three/fiber"
import {OrbitControls, useTexture} from "@react-three/drei"
import * as THREE from "three"

export default function PanoramaViewer({src}: {src: string}) {
  const [webglAvailable, setWebglAvailable] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    setWebglAvailable(!!gl)
  }, [])

  if (webglAvailable === false) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-400 text-sm text-center p-4">
        WebGL Unavailable. Please enable hardware acceleration.
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="w-full h-full bg-neutral-900 animate-pulse" />}>
      <Scene src={src} />
    </Suspense>
  )
}

function Scene({src}: {src: string}) {
  const texture = useTexture(src)
  return (
    <Canvas camera={{fov: 75}} className="w-full h-full">
      <ambientLight intensity={0.8} />
      <mesh>
        <sphereGeometry args={[50, 64, 64]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </mesh>
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  )
}
