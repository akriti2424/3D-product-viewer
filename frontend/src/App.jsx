import React, { useState, useEffect, useCallback } from "react";
import ThreeViewer from "./components/ThreeViewer";
import UploadControls from "./components/uploadControls";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";


export default function App() {
  const [localPreview, setLocalPreview] = useState(null); 
  const [remoteModelUrl, setRemoteModelUrl] = useState(null); 
  const [bgColor, setBgColor] = useState("#ffffff");
  const [wireframe, setWireframe] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);


  const modelToLoad = remoteModelUrl || localPreview || null;

  // Upload file to backend
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
      const json = await res.json(); // { url, filename, originalName }
      // set remote url returned by backend
      setRemoteModelUrl(json.url);
      return json.url;
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + (err.message || ""));
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  // Save settings (background, wireframe, modelUrl) to backend
  const saveSettings = useCallback(async (modelUrlToSave) => {
    try {
      const payload = {
        backgroundColor: bgColor,
        wireframe,
        modelUrl: modelUrlToSave || null,
        timestamp: new Date().toISOString(),
      };
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      alert("Settings saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    }
  }, [bgColor, wireframe]);

  // Fetch latest settings on mount
  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (!res.ok) return;
        const latest = await res.json();
        if (!latest) return;
        if (latest.backgroundColor) setBgColor(latest.backgroundColor);
        if (typeof latest.wireframe === "boolean") setWireframe(latest.wireframe);
        if (latest.modelUrl) setRemoteModelUrl(latest.modelUrl);
      } catch (err) {
        console.warn("Could not fetch settings", err);
      }
    }
    fetchLatest();

    // cleanup on unmount
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, []);

  // Called by UploadControls when a file is picked
  async function handleFile(file) {
    if (!file) return;
   
    if (selectedFile && selectedFile.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }

    // create preview and set selectedFile
    const preview = URL.createObjectURL(file);
    file.preview = preview;
    setSelectedFile(file);
    setLocalPreview(preview);

    // Upload to backend and switch to remote URL if succeeded
    const uploadedUrl = await uploadFileToServer(file);
    if (uploadedUrl) {
      
      if (preview) URL.revokeObjectURL(preview);
      setLocalPreview(null);
      setSelectedFile(null);
      setRemoteModelUrl(uploadedUrl);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Controls</h2>
          <UploadControls
            onFile={handleFile}
            bgColor={bgColor}
            setBgColor={setBgColor}
            wireframe={wireframe}
            setWireframe={setWireframe}
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => saveSettings(remoteModelUrl || null)}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Save Settings
            </button>

            <button
              onClick={() => {
                setRemoteModelUrl(null);
                if (localPreview) {
                  URL.revokeObjectURL(localPreview);
                  setLocalPreview(null);
                }
                setSelectedFile(null);
              }}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Clear
            </button>
          </div>

          {uploading && <p className="mt-2 text-sm text-gray-600">Uploading…</p>}
        </div>

        <div className="col-span-2 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">3D Viewer</h2>
          <ThreeViewer modelUrl={modelToLoad} bgColor={bgColor} wireframe={wireframe} />

          <div className="mt-3">
            <p className="text-sm text-gray-600">
              Model source: {remoteModelUrl ? "Remote" : localPreview ? "Local preview" : "None"}
            </p>
            {remoteModelUrl && (
              <a href={remoteModelUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                Open model URL
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
