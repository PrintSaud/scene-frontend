import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Modal from "react-modal";
import getCroppedImg from "../utils/cropImage";
import { FaTimes } from "react-icons/fa";

Modal.setAppElement("#root");

export default function CropperModal({
  file,
  onClose,
  onCropComplete,
  shape = "rect",       // "circle" or "rect"
  aspectRatio = 1       // 1 for avatar, 16 / 9 for list
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteInternal = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDone = async () => {
    const croppedImage = await getCroppedImg(URL.createObjectURL(file), croppedAreaPixels);
    onCropComplete(croppedImage);
    onClose();
  };

  return (
    <Modal
      isOpen={!!file}
      onRequestClose={onClose}
      contentLabel="Crop Image"
      className="cropper-modal"
      overlayClassName="cropper-overlay"
    >
      <div className="cropper-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #333", background: "#111", color: "#fff" }}>
        <h2 style={{ fontSize: "16px" }}>Crop Photo</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: "16px" }}>
          <FaTimes />
        </button>
      </div>

      <div className="cropper-container" style={{ position: "relative", flex: 1, height: "60vh" }}>
        <Cropper
          image={file ? URL.createObjectURL(file) : null}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          cropShape={shape}
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropCompleteInternal}
        />
      </div>

      <div className="cropper-footer" style={{ padding: "16px", background: "#111", borderTop: "1px solid #333", display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(e.target.value)}
          style={{ width: "100%" }}
        />
        <button
          onClick={handleDone}
          style={{
            background: "linear-gradient(to right, #A21CF0, #6610f2)",
            color: "#fff",
            padding: "10px",
            fontWeight: "600",
            fontSize: "14px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>
    </Modal>
  );
}
