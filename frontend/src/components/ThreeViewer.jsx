// src/components/ThreeViewer.jsx
import React, { Suspense, useEffect , useState} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center, useGLTF, Html, Environment } from "@react-three/drei";
import * as THREE from "three";
useGLTF.setCrossOrigin("anonymous");



function Model({ url, wireframe, materialMode, textureUrl }) {
  const { scene } = useGLTF(url,true);
  const [texture, setTexture] = useState(null);

  
  useEffect(() => {
    if (!textureUrl) {
      setTexture((t) => {
        if (t && typeof t.dispose === "function") t.dispose();
        return null;
      });
      return;
    }

    let cancelled = false;
    const loader = new THREE.TextureLoader();

    loader.load(
      textureUrl,
      (tex) => {
        if (cancelled) {
          if (tex && typeof tex.dispose === "function") tex.dispose();
          return;
        }
        tex.encoding = THREE.sRGBEncoding;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.warn("Texture load error:", err);
        if (!cancelled) setTexture(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [textureUrl]);

 
useEffect(() => {
  if (!scene) return;

  scene.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    
    child.castShadow = true;
    child.receiveShadow = true;

    
    if (!child.userData.__origMaterial) {
      try {
        child.userData.__origMaterial = Array.isArray(child.material)
          ? child.material.map((m) => m.clone())
          : child.material.clone();
      } catch {
        child.userData.__origMaterial = child.material;
      }
    }

    
    const disposeIfTemp = (mat) => {
      const orig = child.userData.__origMaterial;
      const isOrig = (m) => {
        if (!m || !orig) return false;
        if (Array.isArray(orig)) return orig.includes(m);
        return orig === m;
      };
      if (Array.isArray(mat)) {
        mat.forEach((m) => { if (!isOrig(m) && m?.dispose) m.dispose(); });
      } else {
        if (!isOrig(mat) && mat?.dispose) mat.dispose();
      }
    };

    // ---------- MATERIAL MODE SWITCH ----------
    try {
      if (materialMode === "standard") {
        const mat = new THREE.MeshStandardMaterial({
          color: child.material?.color ? child.material.color.clone() : new THREE.Color(0xffffff),
          metalness: 0.05,
          roughness: 0.6,
          envMapIntensity: 1.0,
        });
        if (child.material?.map) {
          mat.map = child.material.map;
          if (mat.map) mat.map.encoding = THREE.sRGBEncoding;
        }
        disposeIfTemp(child.userData.__currentMaterial);
        child.material = mat;
        child.userData.__currentMaterial = mat;

      } else if (materialMode === "textured" && texture) {
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.05,
          roughness: 0.5,
        });
        if (mat.map) {
          mat.map.encoding = THREE.sRGBEncoding;
          mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
          mat.map.repeat.set(1, 1);
          mat.map.needsUpdate = true;
        }
        disposeIfTemp(child.userData.__currentMaterial);
        child.material = mat;
        child.userData.__currentMaterial = mat;

      } else if (materialMode === "original") {
        const orig = child.userData.__origMaterial;
        disposeIfTemp(child.userData.__currentMaterial);
        if (orig) {
          child.material = Array.isArray(orig) ? orig.map((m) => m.clone()) : (orig.clone ? orig.clone() : orig);
        }
        child.userData.__currentMaterial = null;
      }
    } catch (e) {
      console.warn("Material apply warning:", e);
    }

    
    try {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => {
          if (m) {
            m.wireframe = !!wireframe;
            m.needsUpdate = true;
          }
        });
      } else if (child.material) {
        child.material.wireframe = !!wireframe;
        child.material.needsUpdate = true;
      }
    } catch (e) {
      console.warn("Wireframe apply warning:", e);
    }

   
    if (child.userData.__wireframeHelper) {
      if (!wireframe) {
       
        try {
          child.remove(child.userData.__wireframeHelper);
          const w = child.userData.__wireframeHelper;
          if (w.geometry && typeof w.geometry.dispose === "function") w.geometry.dispose();
          if (w.material && typeof w.material.dispose === "function") w.material.dispose();
        } catch (err) { /* ignore */ }
        child.userData.__wireframeHelper = null;
      } else {
        try {
          child.userData.__wireframeHelper.visible = true;
        } catch {}
      }
    } else {
      if (wireframe) {
        try {
          const geo = new THREE.WireframeGeometry(child.geometry);
          const mat = new THREE.LineBasicMaterial({ color: 0x000000 });
          const wire = new THREE.LineSegments(geo, mat);
          wire.renderOrder = 999;
          wire.frustumCulled = false;
          child.add(wire);
          child.userData.__wireframeHelper = wire;
        } catch (err) {
          
        }
      }
    }
  });
}, [scene, wireframe, materialMode, texture]);



  return <primitive object={scene} dispose={null} />;
}



function ThreeViewer({ modelUrl, bgColor, wireframe, materialMode = "original", textureUrl }) {
  return (
    <div style={{ width: "100%", height: "500px" }}>
      <Canvas
        shadows
        camera={{ position: [2, 2, 2], fov: 55 }}
        style={{ background: bgColor }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

        {/* Environment (HDRI-like tone) — BONUS FEATURE */}
        <Environment preset="sunset" />

        <Suspense
          fallback={
            <Html center>
              <div style={{
                padding: 10,
                background: "rgba(255,255,255,0.9)",
                borderRadius: 6,
                fontSize: "14px"
              }}>
                Loading 3D Model…
              </div>
            </Html>
          }
        >
          {modelUrl && (
            <Center>
              <Model
                url={modelUrl}
                wireframe={wireframe}
                materialMode={materialMode}
                textureUrl={textureUrl}
              />
            </Center>
          )}
        </Suspense>

        <OrbitControls enableZoom enablePan enableRotate />
      </Canvas>
    </div>
  );
}

export default ThreeViewer;
