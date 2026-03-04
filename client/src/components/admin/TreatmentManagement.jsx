import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2 } from 'lucide-react'
import { adminGetTreatments, adminCreateTreatment, adminUpdateTreatment, adminDeleteTreatment, adminGetDiseases } from '../../services/api'

const CROPS = [{ key: 'tomato', label: 'Tomato' }, { key: 'potato', label: 'Potato' }, { key: 'maize', label: 'Maize' }]

const arrToText = (v) => (Array.isArray(v) ? v.join('\n') : typeof v === 'string' ? v : '')
const textToArr = (s) => (typeof s !== 'string' ? [] : s.trim().split(/\n/).map((x) => x.trim()).filter(Boolean))

const TreatmentManagement = () => {
  const [treatments, setTreatments] = useState([])
  const [diseases, setDiseases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cropFilter, setCropFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    disease_id: '',
    severity_level_en: '',
    severity_level_ne: '',
    disease_desc_en: '',
    disease_desc_ne: '',
    preventive_measure_en: '',
    preventive_measure_ne: '',
    treatment_en: '',
    treatment_ne: '',
    recommended_medicine_en: '',
    recommended_medicine_ne: '',
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    adminGetDiseases().then((r) => (r?.success && r?.data) && setDiseases(r.data)).catch(() => setDiseases([]))
  }, [])

  const fetchTreatments = async () => {
    try {
      setLoading(true)
      const params = {}
      if (cropFilter) params.crop = cropFilter
      const res = await adminGetTreatments(params)
      if (res?.success && Array.isArray(res.data)) setTreatments(res.data)
      else setTreatments([])
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Failed to load treatments' })
      setTreatments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTreatments() }, [cropFilter])

  const filtered = treatments.filter(
    (t) =>
      !search ||
      (t.class_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.crop_key || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditingId(null)
    setFormData({
      disease_id: '',
      severity_level_en: '',
      severity_level_ne: '',
      disease_desc_en: '',
      disease_desc_ne: '',
      preventive_measure_en: '',
      preventive_measure_ne: '',
      treatment_en: '',
      treatment_ne: '',
      recommended_medicine_en: '',
      recommended_medicine_ne: '',
    })
    setShowForm(true)
    setMessage({ type: '', text: '' })
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setFormData({
      disease_id: row.disease_id ?? '',
      severity_level_en: row.severity_level_en ?? '',
      severity_level_ne: row.severity_level_ne ?? '',
      disease_desc_en: row.disease_desc_en ?? row.disease_desc ?? '',
      disease_desc_ne: row.disease_desc_ne ?? '',
      preventive_measure_en: arrToText(row.preventive_measure_en ?? row.preventive_measure),
      preventive_measure_ne: arrToText(row.preventive_measure_ne),
      treatment_en: arrToText(row.treatment_en ?? row.treatment),
      treatment_ne: arrToText(row.treatment_ne),
      recommended_medicine_en: arrToText(row.recommended_medicine_en ?? row.recommended_medicine),
      recommended_medicine_ne: arrToText(row.recommended_medicine_ne),
    })
    setShowForm(true)
    setMessage({ type: '', text: '' })
  }

  const payloadFromForm = () => {
    const p = { ...formData }
    p.preventive_measure_en = textToArr(p.preventive_measure_en)
    p.preventive_measure_ne = textToArr(p.preventive_measure_ne)
    p.treatment_en = textToArr(p.treatment_en)
    p.treatment_ne = textToArr(p.treatment_ne)
    p.recommended_medicine_en = textToArr(p.recommended_medicine_en)
    p.recommended_medicine_ne = textToArr(p.recommended_medicine_ne)
    return p
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const payload = payloadFromForm()
      if (editingId) {
        await adminUpdateTreatment(editingId, payload)
        setMessage({ type: 'success', text: 'Treatment updated.' })
      } else {
        await adminCreateTreatment(payload)
        setMessage({ type: 'success', text: 'Treatment created.' })
      }
      setShowForm(false)
      fetchTreatments()
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Request failed' })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this treatment?')) return
    try {
      await adminDeleteTreatment(id)
      setMessage({ type: 'success', text: 'Treatment deleted.' })
      fetchTreatments()
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Delete failed' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-800">Disease Treatments (Multilingual)</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          Add Treatment
        </button>
      </div>

      {message.text && (
        <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search class or crop..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={cropFilter}
          onChange={(e) => setCropFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All crops</option>
          {CROPS.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h3 className="font-medium text-slate-800">{editingId ? 'Edit Treatment' : 'New Treatment'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Disease</span>
              <select
                value={formData.disease_id}
                onChange={(e) => setFormData({ ...formData, disease_id: e.target.value })}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                required
                disabled={!!editingId}
              >
                <option value="">Select disease</option>
                {diseases.map((d) => (
                  <option key={d.id} value={d.id}>{d.crop_key} / {d.class_name} {d.general_name ? `(${d.general_name})` : ''}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="block text-xs text-slate-500">Severity (EN)</span>
              <input
                value={formData.severity_level_en}
                onChange={(e) => setFormData({ ...formData, severity_level_en: e.target.value })}
                placeholder="e.g. Moderate"
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-xs text-slate-500">Severity (NE)</span>
              <input
                value={formData.severity_level_ne}
                onChange={(e) => setFormData({ ...formData, severity_level_ne: e.target.value })}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Disease description (EN) – one line</span>
              <input
                value={formData.disease_desc_en}
                onChange={(e) => setFormData({ ...formData, disease_desc_en: e.target.value })}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Preventive measures (EN) – one per line</span>
              <textarea
                value={formData.preventive_measure_en}
                onChange={(e) => setFormData({ ...formData, preventive_measure_en: e.target.value })}
                rows={3}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Treatment (EN) – one per line</span>
              <textarea
                value={formData.treatment_en}
                onChange={(e) => setFormData({ ...formData, treatment_en: e.target.value })}
                rows={3}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Recommended medicine (EN) – one per line</span>
              <textarea
                value={formData.recommended_medicine_en}
                onChange={(e) => setFormData({ ...formData, recommended_medicine_en: e.target.value })}
                rows={2}
                placeholder="e.g. Azoxystrobin"
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Preventive (NE) – one per line</span>
              <textarea
                value={formData.preventive_measure_ne}
                onChange={(e) => setFormData({ ...formData, preventive_measure_ne: e.target.value })}
                rows={2}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Treatment (NE) – one per line</span>
              <textarea
                value={formData.treatment_ne}
                onChange={(e) => setFormData({ ...formData, treatment_ne: e.target.value })}
                rows={2}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Recommended medicine (NE) – one per line</span>
              <textarea
                value={formData.recommended_medicine_ne}
                onChange={(e) => setFormData({ ...formData, recommended_medicine_ne: e.target.value })}
                rows={2}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
            >
              {submitLoading ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-3 py-2">Crop</th>
                <th className="text-left px-3 py-2">Class name</th>
                <th className="text-left px-3 py-2">Severity</th>
                <th className="w-20 px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-3 py-2">{t.crop_key}</td>
                  <td className="px-3 py-2 font-mono">{t.class_name}</td>
                  <td className="px-3 py-2">{t.severity_level || t.severity_level_en || '-'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="p-1.5 text-slate-600 hover:text-emerald-600"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-slate-600 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-6 text-slate-500">No treatments found. Add treatments or link to diseases.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default TreatmentManagement
