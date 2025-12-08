import React, { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Html } from "@react-three/drei";

function Model({ url, wireframe }) {
  const gltf = useGLTF(url, true);

  // toggle wireframe safely whenever `wireframe` or scene changes
  useEffect(() => {
    if (!gltf?.scene) return;
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Some models use an array of materials
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => (m.wireframe = !!wireframe));
        } else {
          child.material.wireframe = !!wireframe;
          // ensure normal map / env map still show up on toggling
          child.material.needsUpdate = true;
        }
      }
    });
  }, [gltf, wireframe]);

  return <primitive object={gltf.scene} dispose={null} />;
}

function Loader() {
  return (
    <Html center>
      <div className="bg-white/90 p-3 rounded shadow text-sm">Loading model…</div>
    </Html>
  );
}

export default function ThreeViewer({ modelUrl, bgColor = "#ffffff", wireframe = false }) {
  const canvasStyle = useMemo(() => ({ width: "100%", height: "60vh", background: bgColor }), [bgColor]);

  return (
    <div className="w-full rounded overflow-hidden" style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
      <Canvas style={canvasStyle} camera={{ position: [0, 1.5, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 7]} intensity={0.8} />
        <OrbitControls enablePan enableZoom enableRotate />
        <React.Suspense fallback={<Loader />}>
          {modelUrl ? (
            <Center>
              <Model url={modelUrl} wireframe={wireframe} />
            </Center>
          ) : null}
        </React.Suspense>
      </Canvas>
      {!modelUrl && (
        <div className="p-3 text-sm text-gray-600 bg-gray-50 border-t">No model loaded — upload a .glb / .gltf file.</div>
      )}
    </div>
  );
}
