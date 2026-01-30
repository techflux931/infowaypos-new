// src/components/ImageUpload.js
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const MAX_MB = 3;
const ACCEPT = ['image/png','image/jpeg','image/jpg','image/webp'];

export default function ImageUpload({ value, onChange }) {
  const [preview, setPreview] = useState(value || '');

  useEffect(() => setPreview(value || ''), [value]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPT.includes(f.type)) {
      alert('Please choose a PNG, JPG, or WEBP image.');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      alert(`Image must be ≤ ${MAX_MB} MB.`);
      return;
    }
    onChange({ file: f, url: preview }); // keep url until uploaded
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const clear = () => {
    setPreview('');
    onChange(null);
  };

  return (
    <div className="img-upload">
      <div className="img-upload__row">
        <input type="file" accept="image/*" onChange={handleFile} />
        {preview && (
          <button type="button" className="btn btn-light" onClick={clear}>
            Remove
          </button>
        )}
      </div>
      {preview && (
        <div className="img-upload__preview">
          <img src={preview} alt="preview" />
        </div>
      )}
    </div>
  );
}

ImageUpload.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
