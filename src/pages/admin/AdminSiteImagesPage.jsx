import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, RotateCcw, UploadCloud } from 'lucide-react';
import { IMAGE_SLOTS } from '../../config/imageSlots';
import { getOwnerAccessToken } from '../../lib/ownerAuth';
import { useEnquiry } from '../../context/EnquiryContext';

export default function AdminSiteImagesPage() {
  const [images, setImages] = useState({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const inputs = useRef({});
  const { showToast } = useEnquiry();

  const groups = useMemo(() => IMAGE_SLOTS.reduce((result, slot) => {
    (result[slot.page] ||= []).push(slot);
    return result;
  }, {}), []);

  const load = async () => {
    const response = await fetch('/api/site-images');
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Images could not be loaded.');
    setImages(data.images || {});
  };

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);

  const upload = async (slot, file) => {
    if (!file) return;
    setBusy(slot.key);
    setError('');
    try {
      const form = new FormData();
      form.append('slot', slot.key);
      form.append('image', file);
      const response = await fetch('/api/site-images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getOwnerAccessToken()}` },
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Image upload failed.');
      setImages((current) => ({ ...current, [slot.key]: data.url }));
      showToast(`${slot.label} updated on the website.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
      if (inputs.current[slot.key]) inputs.current[slot.key].value = '';
    }
  };

  const reset = async (slot) => {
    setBusy(slot.key);
    setError('');
    try {
      const response = await fetch(`/api/site-images?slot=${encodeURIComponent(slot.key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getOwnerAccessToken()}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Image reset failed.');
      setImages((current) => {
        const next = { ...current };
        delete next[slot.key];
        return next;
      });
      showToast(`${slot.label} restored to its default image.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-ultra text-brand-muted">Central image control</span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-widest uppercase font-editorial">Website Images</h2>
          <p className="text-sm text-brand-muted mt-2 max-w-2xl">Replace fixed storefront images from one place. Changes stay saved across devices and future deploys.</p>
        </div>
        <div className="text-xs font-bold uppercase tracking-wider bg-white border border-brand-border rounded-lg px-4 py-3">
          {Object.keys(images).length} customized
        </div>
      </header>

      {error && <div role="alert" className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      {Object.entries(groups).map(([page, slots]) => (
        <section key={page} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em]">{page}</h3>
            <span className="h-px flex-1 bg-brand-border" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {slots.map((slot) => {
              const customized = Boolean(images[slot.key]);
              const src = images[slot.key] || slot.fallback;
              return (
                <article key={slot.key} className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-subtle">
                  <div className="aspect-[16/10] bg-brand-surface relative overflow-hidden">
                    {src ? <img src={src} alt="" className={`w-full h-full ${slot.fit === 'contain' ? 'object-contain p-7' : 'object-cover'}`} /> : <ImagePlus className="absolute inset-0 m-auto w-9 h-9 text-brand-muted" />}
                    <span className={`absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${customized ? 'bg-emerald-700 text-white' : 'bg-white/90 text-brand-muted'}`}>
                      {customized ? 'Custom' : 'Default'}
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider">{slot.label}</h4>
                    <p className="text-[11px] text-brand-muted mt-1">JPG, PNG or WebP · maximum 5MB</p>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button disabled={busy === slot.key} onClick={() => inputs.current[slot.key]?.click()} className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-dark text-white rounded text-[10px] font-bold uppercase tracking-wider disabled:opacity-50">
                        <UploadCloud className="w-3.5 h-3.5" /> {busy === slot.key ? 'Saving…' : 'Replace'}
                      </button>
                      <button disabled={!customized || busy === slot.key} onClick={() => reset(slot)} className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-brand-border rounded text-[10px] font-bold uppercase tracking-wider disabled:opacity-35">
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                      </button>
                    </div>
                    <input ref={(node) => { inputs.current[slot.key] = node; }} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => upload(slot, event.target.files?.[0])} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
