"use client"
import React, { useRef, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Float, Stars } from "@react-three/drei"
import * as THREE from "three"

function Mountain({
  position,
  scale,
  color,
}: {
  position: [number, number, number]
  scale: [number, number, number]
  color: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(1, 2, 6, 1)
    // Slightly randomize vertices for natural look
    const positions = geo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)
      if (y < 0.8) {
        positions.setXYZ(
          i,
          x + (Math.random() - 0.5) * 0.15,
          y,
          z + (Math.random() - 0.5) * 0.15
        )
      }
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh ref={meshRef} position={position} scale={scale} geometry={geometry}>
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

function Fog() {
  const { scene } = useThree()
  scene.fog = new THREE.FogExp2("#0a1f1a", 0.08)
  return null
}

function MountainRange() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005
    }
  })

  const mountains = useMemo(() => {
    return [
      { pos: [0, -1, -8] as [number,number,number], scale: [3, 4, 3] as [number,number,number], color: "#173D35" },
      { pos: [-4, -1.5, -10] as [number,number,number], scale: [2.5, 3.5, 2.5] as [number,number,number], color: "#1a4a40" },
      { pos: [4, -2, -12] as [number,number,number], scale: [3, 4.5, 3] as [number,number,number], color: "#0f2a24" },
      { pos: [-7, -2.5, -14] as [number,number,number], scale: [2, 3, 2] as [number,number,number], color: "#1e5045" },
      { pos: [7, -2, -14] as [number,number,number], scale: [2.5, 3.5, 2.5] as [number,number,number], color: "#173D35" },
      { pos: [-10, -3, -18] as [number,number,number], scale: [3.5, 5, 3.5] as [number,number,number], color: "#0d201a" },
      { pos: [10, -2.5, -16] as [number,number,number], scale: [3, 4, 3] as [number,number,number], color: "#142e28" },
      { pos: [2, -1, -6] as [number,number,number], scale: [1.5, 2.5, 1.5] as [number,number,number], color: "#1e5045" },
      { pos: [-2, -1.5, -7] as [number,number,number], scale: [1.8, 2.8, 1.8] as [number,number,number], color: "#2d6b5e" },
    ]
  }, [])

  return (
    <group ref={groupRef}>
      {mountains.map((m, i) => (
        <Mountain key={i} position={m.pos} scale={m.scale} color={m.color} />
      ))}
    </group>
  )
}

function CameraRig() {
  const { camera } = useThree()

  useFrame(({ pointer }) => {
    camera.position.x += (pointer.x * 0.5 - camera.position.x) * 0.03
    camera.position.y += (pointer.y * 0.2 - camera.position.y) * 0.03
    camera.lookAt(0, 0, 0)
  })

  return null
}

export default function MountainScene() {
  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 60 }}
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
    >
      <Fog />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#A4AA83" />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#173D35" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#A4AA83" distance={30} />

      <Stars radius={60} depth={50} count={800} factor={3} saturation={0} fade speed={0.5} />

      <Float speed={0.3} rotationIntensity={0.1} floatIntensity={0.1}>
        <MountainRange />
      </Float>

      <CameraRig />
    </Canvas>
  )
}
