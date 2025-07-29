import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../../utils/cropImage";
import { AiOutlineClose } from "react-icons/ai";

export default function CropListImageModal({ file, onClose, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropAreaComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleCropDone = async () => {
    const croppedBlob = await getCroppedImg(URL.createObjectURL(file), croppedAreaPixels);
    onCropComplete(croppedBlob);
    onClose();
  };

  return (
    <div className="crop-modal">
      <div className="crop-container">
        <Cropper
          image={URL.createObjectURL(file)}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9} // ⬅️ RECTANGLE RATIO
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropAreaComplete}
        />
      </div>
      <div className="crop-controls">
        <button className="cancel-btn" onClick={onClose}><AiOutlineClose /> Cancel</button>
        <button className="confirm-btn" onClick={handleCropDone}>Crop & Save</button>
      </div>
    </div>
  );
}
