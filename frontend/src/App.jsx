import React, { useState, useEffect } from "react";
import ThreeViewer from "./components/ThreeViewer";
import UploadControls from "./components/UploadControls";

export default function App() {
  const [modelUrl, setModelUrl] = useState(null);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [wireframe, setWireframe] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFile = (file) => {
    // revoke old object URL
    if (selectedFile && typeof selectedFile === "object" && selectedFile.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    const preview = URL.createObjectURL(file);
    file.preview = preview;
    setSelectedFile(file);
    setModelUrl(preview);
  };

  // cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (selectedFile && selectedFile.preview) URL.revokeObjectURL(selectedFile.preview);
    };
  }, [selectedFile]);

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
        </div>

        <div className="col-span-2 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">3D Viewer</h2>
          <ThreeViewer modelUrl={modelUrl} bgColor={bgColor} wireframe={wireframe} />
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => {
                const demo = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
                setModelUrl(demo);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Load Demo Model
            </button>
            <button
              onClick={() => {
                setModelUrl(null);
                if (selectedFile && selectedFile.preview) {
                  URL.revokeObjectURL(selectedFile.preview);
                  setSelectedFile(null);
                }
              }}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
