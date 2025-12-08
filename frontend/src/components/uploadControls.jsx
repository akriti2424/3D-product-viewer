import React from "react";
import { ChromePicker } from "react-color";

export default function UploadControls({ onFile, bgColor, setBgColor, wireframe, setWireframe }) {
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // basic validation
    const allowed = [".glb", ".gltf"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      alert("Only .glb and .gltf files are allowed");
      return;
    }
    onFile(f);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Upload 3D Model (.glb, .gltf)</label>
        <input
          type="file"
          accept=".glb,.gltf"
          onChange={handleFileChange}
          className="mt-2 block w-full text-sm text-gray-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
        <div className="rounded overflow-hidden">
          <ChromePicker color={bgColor} onChangeComplete={(c) => setBgColor(c.hex)} />
        </div>
      </div>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} />
        <span className="text-sm">Wireframe mode</span>
      </label>
    </div>
  );
}
