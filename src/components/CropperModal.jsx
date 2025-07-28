import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import Modal from "react-modal";
import getCroppedImg from "../utils/cropImage";
import { FaTimes } from "react-icons/fa";

Modal.setAppElement("#root");

export default function CropperModal({ file, onClose, onCropComplete, shape = "circle" }) {
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
      <div className="cropper-header">
        <h2>Crop Photo</h2>
        <button onClick={onClose}><FaTimes /></button>
      </div>

      <div className="cropper-container">
        <Cropper
          image={file ? URL.createObjectURL(file) : null}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape={shape}
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropCompleteInternal}
        />
      </div>

      <div className="cropper-footer">
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(e.target.value)}
        />
        <button onClick={handleDone} className="crop-done-btn">Done</button>
      </div>
    </Modal>
  );
}
