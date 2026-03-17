'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const generateNodes = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    ),
    active: Math.random() > 0.5 
  }));
};

const SwarmGraph = () => {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = useMemo(() => generateNodes(15), []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node) => (
        <Sphere key={node.id} position={node.position} args={[0.2, 16, 16]}>
          <meshStandardMaterial 
            color={node.active ? '#22d3ee' : '#6366f1'} 
            emissive={node.active ? '#22d3ee' : '#6366f1'} 
            emissiveIntensity={node.active ? 2 : 0.5} 
            toneMapped={false}
          />
        </Sphere>
      ))}

      {nodes.slice(0, -1).map((node, i) => (
        <Line 
          key={`line-${i}`}
          points={[node.position, nodes[i + 1].position]}
          color={node.active ? '#22d3ee' : '#ffffff'}
          opacity={0.15}
          transparent
          lineWidth={1}
        />
      ))}
      <Line 
          points={[nodes[nodes.length-1].position, nodes[0].position]}
          color="#ffffff"
          opacity={0.15}
          transparent
          lineWidth={1}
        />
    </group>
  );
};

export default function SwarmVisualizer() {
  return (
    <div className="w-full h-full min-h-[400px] relative rounded-3xl overflow-hidden glass-panel">
      
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-white/90 font-mono text-sm">LIVE TELEMETRY</h3>
        <p className="text-cyan-400 text-xs mt-1 animate-pulse">● 15 Active Nodes</p>
      </div>

      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#22d3ee" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#6366f1" />
        
        <SwarmGraph />
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5} 
          maxDistance={25}
          minDistance={5}
        />
      </Canvas>
    </div>
  );
}
