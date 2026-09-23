import React, { useMemo, useState } from 'react';
import { CheckCircle, MessageCircle, Send } from 'lucide-react';
import { api } from '../services/api';
import { useCms } from '../context/CmsContext';
import { useEnquiry } from '../context/EnquiryContext';

const BUSINESS_TYPES = ['Retail Store', 'Boutique', 'Reseller', 'Online Seller', 'Wholesaler', 'Other'];
const CATEGORIES = ["Men's T-Shirts", "Men's Sweatshirts", "Men's Hoodies", "Men's Jackets", "Women's Jackets", "Kids' Jackets"];

export default function EnquiryForm({ prefilledProduct = null, onSuccess = null }) {
  const { showToast } = useEnquiry();
  const { site } = useCms();
  const prefilledCategories = useMemo(() => {
    const value = prefilledProduct?.subcategory || prefilledProduct?.categoryName || prefilledProduct?.category;
    return value && CATEGORIES.includes(value) ? [value] : [];
  }, [prefilledProduct]);
  const [formData, setFormData] = useState({
    name: '', businessName: '', mobileNumber: '', email: '', city: '',
    businessType: 'Retail Store', categories: prefilledCategories,
    requiredProducts: prefilledProduct?.name || '', quantity: '',
    message: prefilledProduct ? `Enquiring for wholesale availability and pricing for ${prefilledProduct.name}.` : '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };
  const toggleCategory = (category) => {
    setFormData((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }));
  };
  const whatsappLink = () => {
    const lines = [
      '*Wholesale Enquiry - EasyBudgetStore*',
      `Name: ${formData.name || 'Not provided'}`,
      `Business: ${formData.businessName || 'Not provided'}`,
      `Phone: ${formData.mobileNumber || 'Not provided'}`,
      `Email: ${formData.email || 'Not provided'}`,
      `Categories: ${formData.categories.join(', ') || 'Not provided'}`,
      `Products: ${formData.requiredProducts || 'Not provided'}`,
      `Quantity: ${formData.quantity || 'Not provided'} pcs`,
    ];
    if (formData.message) lines.push(`Message: ${formData.message}`);
    return site.getWhatsAppLink(lines.join('\n'));
  };
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.businessName.trim() || !formData.mobileNumber.trim() || !formData.quantity || formData.categories.length === 0) {
      setError('Please complete name, business, phone, categories and quantity.');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitBulkQuote({
        customer_name: formData.name,
        business_name: formData.businessName,
        phone: formData.mobileNumber,
        email: formData.email,
        city: formData.city,
        business_type: formData.businessType,
        categories: formData.categories,
        product_name: formData.requiredProducts || formData.categories.join(', '),
        quantity: Number(formData.quantity),
        notes: formData.message,
      });
      setSubmitted(true);
      showToast('Bulk enquiry submitted successfully.');
      onSuccess?.();
    } catch (submissionError) {
      setError(submissionError.message || 'Something went wrong while submitting your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="bg-white p-7 sm:p-8 border border-brand-border rounded-lg text-center shadow-subtle">
      <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
      <h3 className="text-lg font-bold tracking-wider uppercase text-brand-text font-editorial">Enquiry submitted</h3>
      <p className="text-sm text-brand-muted max-w-md mx-auto mt-2">Thank you! Your bulk inquiry has been submitted successfully. Our team will contact you shortly.</p>
      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-5">
        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-brand-dark text-white text-xs font-bold tracking-wider uppercase rounded inline-flex justify-center items-center gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp us</a>
        <button type="button" onClick={() => setSubmitted(false)} className="px-5 py-2.5 border border-brand-border text-xs font-bold tracking-wider uppercase rounded">Submit another</button>
      </div>
    </div>
  );

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-brand-border rounded focus:border-brand-dark focus:outline-none transition-colors';
  const labelClass = 'block text-[10px] font-bold tracking-wider uppercase text-brand-text mb-1.5';
  return (
    <div className="bg-white border border-brand-border rounded-lg p-5 sm:p-7 shadow-elevated">
      <div className="mb-5">
        <span className="text-[10px] font-bold tracking-ultra uppercase text-brand-muted block mb-1">B2B Partnership</span>
        <h3 className="text-lg sm:text-2xl font-extrabold tracking-[0.08em] uppercase text-brand-text font-editorial">Bulk enquiry</h3>
        <p className="text-xs text-brand-muted mt-1">Share your requirement and our wholesale team will respond shortly.</p>
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={labelClass}>Name *<input className={inputClass} name="name" value={formData.name} onChange={update} autoComplete="name" /></label>
          <label className={labelClass}>Phone *<input className={inputClass} name="mobileNumber" value={formData.mobileNumber} onChange={update} inputMode="tel" autoComplete="tel" /></label>
          <label className={labelClass}>Business / company *<input className={inputClass} name="businessName" value={formData.businessName} onChange={update} autoComplete="organization" /></label>
          <label className={labelClass}>Email<input className={inputClass} name="email" type="email" value={formData.email} onChange={update} autoComplete="email" /></label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={labelClass}>Business type<select className={`${inputClass} bg-white`} name="businessType" value={formData.businessType} onChange={update}>{BUSINESS_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label className={labelClass}>Quantity (pcs) *<input className={inputClass} name="quantity" type="number" min="1" value={formData.quantity} onChange={update} inputMode="numeric" /></label>
        </div>
        <fieldset>
          <legend className={labelClass}>Select categories *</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((category) => <label key={category} className={`flex items-center gap-2 rounded border px-2.5 py-2 text-xs cursor-pointer transition-colors ${formData.categories.includes(category) ? 'border-brand-dark bg-brand-surface font-semibold' : 'border-brand-border text-brand-muted hover:border-neutral-400'}`}>
              <input type="checkbox" checked={formData.categories.includes(category)} onChange={() => toggleCategory(category)} className="accent-brand-dark" />{category}
            </label>)}
          </div>
        </fieldset>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={labelClass}>Required products<input className={inputClass} name="requiredProducts" value={formData.requiredProducts} onChange={update} placeholder="Styles, SKUs or products" /></label>
          <label className={labelClass}>City / state<input className={inputClass} name="city" value={formData.city} onChange={update} /></label>
        </div>
        <label className={labelClass}>Message / requirement<textarea className={inputClass} name="message" rows="3" value={formData.message} onChange={update} placeholder="Sizes, target date, fabric or other requirements" /></label>
        {error && <p role="alert" className="text-xs text-red-600 font-medium">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button type="submit" disabled={submitting} className="flex-1 py-3 bg-brand-dark hover:bg-black disabled:opacity-60 text-white rounded text-xs font-bold tracking-[0.16em] uppercase flex justify-center items-center gap-2"><Send className="w-3.5 h-3.5" />{submitting ? 'Submitting...' : 'Submit inquiry'}</button>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="sm:w-auto px-5 py-3 border border-brand-border text-brand-text rounded text-xs font-bold tracking-wider uppercase inline-flex justify-center items-center gap-2 hover:bg-brand-surface"><MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp</a>
        </div>
      </form>
    </div>
  );
}
