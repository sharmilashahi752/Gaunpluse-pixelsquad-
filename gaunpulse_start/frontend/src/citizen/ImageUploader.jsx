import React, { useState } from 'react';
import { UploadCloud, X, AlertCircle } from 'lucide-react';

export default function ImageUploader({ images, onChange }) {
  const [error, setError] = useState('');

  function addFiles(event) {
    const selected = Array.from(event.target.files || []);
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidType = selected.find((file) => !allowed.includes(file.type));
    const invalidSize = selected.find((file) => file.size > 5 * 1024 * 1024);

    if (invalidType) {
      setError(`${invalidType.name} is not a supported JPG, PNG or WebP image.`);
      event.target.value = '';
      return;
    }
    if (invalidSize) {
      setError(`${invalidSize.name} is larger than 5 MB.`);
      event.target.value = '';
      return;
    }

    setError('');
    const valid = selected.filter((file) => allowed.includes(file.type) && file.size <= 5 * 1024 * 1024);
    const combined = [...images, ...valid].slice(0, 5);
    onChange(combined);
    event.target.value = '';
  }

  function removeImage(index) {
    onChange(images.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <section className="citizen-uploader">
      <div className="citizen-field-heading">
        <div>
          <strong>Problem Photos</strong>
          <span>Up to 5 images (JPG, PNG, WebP), max 5 MB each.</span>
        </div>
      </div>

      <label className="image-upload-box">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          onChange={addFiles}
        />
        <div className="image-upload-inner">
          <UploadCloud size={24} className="upload-icon" />
          <span>Click to choose or drag images</span>
        </div>
      </label>

      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((image, index) => (
            <article key={`${image.name}-${index}`}>
              <img src={URL.createObjectURL(image)} alt={`Problem preview ${index + 1}`} />
              <div className="preview-meta">
                <strong>{image.name}</strong>
                <span>{Math.max(1, Math.round(image.size / 1024))} KB</span>
                <button type="button" onClick={() => removeImage(index)} title="Remove photo">
                  <X size={14} /> Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {error && (
        <p className="citizen-message error">
          <AlertCircle size={16} /> {error}
        </p>
      )}
    </section>
  );
}
