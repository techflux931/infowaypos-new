// src/components/DealForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import './styles/DealForm.css';
import axios from '../api/axios';

const DealForm = ({ onAdd }) => {
  const [form, setForm] = useState({ title: '', date: '', description: '', imageUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));

    const data = new FormData();
    data.append('file', file);
    setUploading(true);
    try {
      const res = await axios.post('/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, imageUrl: res.data.url })); // e.g. /files/123.jpg
    } catch (err) {
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.description) return;
    await onAdd(form);
    setForm({ title: '', date: '', description: '', imageUrl: '' });
    setPreview('');
  };

  return (
    <form className="deal-form" onSubmit={handleSubmit}>
      <div className="deal-home-btn" onClick={() => navigate('/dashboard')} title="Go Home"><FaHome /></div>
      <h2>Add New Deal</h2>

      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
      <input type="date" name="date" value={form.date} onChange={handleChange} required />
      <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />

      {/* Image upload */}
      <input type="file" accept="image/*" onChange={handleFile} />
      {uploading && <small>Uploading image...</small>}
      {preview && <div style={{marginTop:8}}><img alt="preview" src={preview} style={{maxWidth:160, borderRadius:6}} /></div>}

      <button type="submit">➕ Add Deal</button>
    </form>
  );
};
export default DealForm;
