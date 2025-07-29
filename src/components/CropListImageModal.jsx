import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
import { createImage } from "../utils/createImage";

export default function CropListImageModal({ file, onClose, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const imageURL = URL.createObjectURL(file);

  const handleCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    const croppedBlob = await getCroppedImg(imageURL, croppedAreaPixels);
    onCropComplete(croppedBlob);
    onClose(); // ✅ Close modal after upload
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.9)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
      }}
    >
      {/* Cropper */}
      <div style={{ flex: 1, position: "relative" }}>
        <Cropper
          image={imageURL}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9} // ✅ RECTANGULAR CROP
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px" }}>
        <button
          onClick={onClose}
          style={{
            background: "#333",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            border: "1px solid #555",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>

        <button
          onClick={handleDone}
          style={{
            background: "linear-gradient(to right, #A21CF0, #6610f2)",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
