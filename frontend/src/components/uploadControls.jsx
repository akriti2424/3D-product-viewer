import React from "react";
import { ChromePicker } from "react-color";

export default function UploadControls({
  onFile,
  onTextureFile,      
  bgColor,
  setBgColor,
  wireframe,
  setWireframe,
  materialMode,       
  setMaterialMode     
}) {

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const allowed = [".glb", ".gltf"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();

    if (!allowed.includes(ext)) {
      alert("Only .glb and .gltf files are allowed");
      return;
    }

    onFile(f);
  };

  const handleTextureChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(f.type)) {
      alert("Only JPG/PNG textures allowed");
      return;
    }

    onTextureFile(f);
  };

  return (
    <div className="space-y-4">

      {/* 3D Model Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload 3D Model (.glb, .gltf)
        </label>
        <input
          type="file"
          accept=".glb,.gltf"
          onChange={handleFileChange}
          className="mt-2 block w-full text-sm text-gray-700"
        />
      </div>

      {/* Texture Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload Texture (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleTextureChange}
          className="mt-2 block w-full text-sm text-gray-700"
        />
      </div>

      {/* Background Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Color
        </label>
        <ChromePicker
          color={bgColor}
          onChangeComplete={(c) => setBgColor(c.hex)}
        />
      </div>

      {/* Wireframe Toggle */}
      <label className="inline-flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          checked={wireframe}
          onChange={(e) => setWireframe(e.target.checked)}
        />
        <span className="text-sm">Wireframe mode</span>
      </label>

      {/* Material Mode Selector */}
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Material Mode
        </label>
        <select
          value={materialMode}
          onChange={(e) => setMaterialMode(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="original">Original (GLTF Material)</option>
          <option value="standard">Standard PBR Material</option>
          <option value="textured">Textured Material</option>
        </select>
      </div>

    </div>
  );
}
