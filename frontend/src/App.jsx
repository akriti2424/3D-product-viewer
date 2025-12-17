import React, { useState, useEffect, useCallback } from "react";
import ThreeViewer from "./components/ThreeViewer";
import UploadControls from "./components/uploadControls";

// App.jsx (top)
const API_BASE = (import.meta.env.VITE_API_BASE ?? "https://threed-product-viewer-1.onrender.com").replace(/\/$/, '');

window.API_BASE = API_BASE; 


export default function App() {
  const [localPreview, setLocalPreview] = useState(null);
  const [remoteModelUrl, setRemoteModelUrl] = useState(null);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [wireframe, setWireframe] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // NEW STATES
  const [textureUrl, setTextureUrl] = useState(null);
  const [materialMode, setMaterialMode] = useState("original");

  const modelToLoad = remoteModelUrl || localPreview || null;

  // --------------- Upload .glb/.gltf to backend ----------------
  const uploadFileToServer = useCallback(async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Upload failed");
      }

      const json = await res.json();
      setRemoteModelUrl(json.url);
      return json.url;
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  // --------------- Save Settings to Backend ----------------
  const saveSettings = useCallback(async (modelUrlToSave) => {
    try {
      const payload = {
        backgroundColor: bgColor,
        wireframe,
        materialMode,
        modelUrl: modelUrlToSave || null,
        timestamp: new Date().toISOString(),
      };

      await fetch(`${API_BASE}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("Settings saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    }
  }, [bgColor, wireframe, materialMode]);

  // --------------- Fetch Latest Settings ----------------
  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (!res.ok) return;

        const latest = await res.json();
        if (!latest) return;

        if (latest.backgroundColor) setBgColor(latest.backgroundColor);
        if (typeof latest.wireframe === "boolean") setWireframe(latest.wireframe);
        if (latest.materialMode) setMaterialMode(latest.materialMode);
        if (latest.modelUrl) setRemoteModelUrl(latest.modelUrl);
      } catch (err) {
        console.warn("Could not fetch settings", err);
      }
    }

    fetchLatest();

    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, []);

  // --------------- Handle 3D model upload ----------------
  async function handleFile(file) {
    if (!file) return;

    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }

    const preview = URL.createObjectURL(file);
    file.preview = preview;
    setSelectedFile(file);
    setLocalPreview(preview);

    const uploadedUrl = await uploadFileToServer(file);

    if (uploadedUrl) {
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
      setSelectedFile(null);
      setRemoteModelUrl(uploadedUrl);
    }
  }

  // --------------- NEW: handle texture upload ----------------
  function handleTextureUpload(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setTextureUrl(url);
    setMaterialMode("textured");
  }

  // -----------------------------------------------

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Controls Panel */}
        <div className="col-span-1 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Controls</h2>

          <UploadControls
            onFile={handleFile}
            onTextureFile={handleTextureUpload}
            bgColor={bgColor}
            setBgColor={setBgColor}
            wireframe={wireframe}
            setWireframe={setWireframe}
            materialMode={materialMode}
            setMaterialMode={setMaterialMode}
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => saveSettings(remoteModelUrl)}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Save Settings
            </button>

            <button
              onClick={() => {
                setRemoteModelUrl(null);
                setLocalPreview(null);
                setTextureUrl(null);
                setSelectedFile(null);
                setMaterialMode("original");
              }}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Clear
            </button>
          </div>

          {uploading && (
            <p className="mt-2 text-sm text-gray-600">Uploading…</p>
          )}
        </div>

        {/* Viewer Panel */}
        <div className="col-span-2 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">3D Viewer</h2>

          <ThreeViewer
            modelUrl={modelToLoad}
            bgColor={bgColor}
            wireframe={wireframe}
            materialMode={materialMode}
            textureUrl={textureUrl}
          />

          <div className="mt-3 text-sm text-gray-600">
            Model source:{" "}
            {remoteModelUrl ? "Remote" : localPreview ? "Local Preview" : "None"}

            {remoteModelUrl && (
              <div>
                <a
                  href={remoteModelUrl}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  Open Model URL
                </a>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
