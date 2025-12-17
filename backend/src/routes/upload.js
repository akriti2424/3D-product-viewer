const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require("multer-storage-cloudinary");
 const cloudinary = require("../config/cloudinary");

const router = express.Router();
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "3d-models",
    resource_type: "raw", // REQUIRED for .glb
    allowed_formats: ["glb", "gltf"],
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
  
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

   return res.json({
      url: req.file.path,          
      publicId: req.file.filename, 
    });
  } catch (err) {
    console.error('Upload error', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
