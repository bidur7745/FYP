import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2 } from 'lucide-react'
import { adminGetDiseases, adminCreateDisease, adminUpdateDisease, adminDeleteDisease } from '../../services/api'

const CROPS = [{ key: 'tomato', label: 'Tomato' }, { key: 'potato', label: 'Potato' }, { key: 'maize', label: 'Maize' }]

const DiseaseManagement = () => {
  const [diseases, setDiseases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cropFilter, setCropFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    crop_key: 'tomato',
    class_name: '',
    general_name_en: '',
    general_name_ne: '',
    category_en: '',
    category_ne: '',
    scientific_name: '',
    symptoms_en: '',
    symptoms_ne: '',
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const fetchDiseases = async () => {
    try {
      setLoading(true)
      const params = {}
      if (cropFilter) params.crop = cropFilter
      const res = await adminGetDiseases(params)
      if (res?.success && Array.isArray(res.data)) setDiseases(res.data)
      else setDiseases([])
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Failed to load diseases' })
      setDiseases([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDiseases() }, [cropFilter])

  const filtered = diseases.filter(
    (d) =>
      !search ||
      (d.class_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.general_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditingId(null)
    setFormData({
      crop_key: 'tomato',
      class_name: '',
      general_name_en: '',
      general_name_ne: '',
      category_en: '',
      category_ne: '',
      scientific_name: '',
      symptoms_en: '',
      symptoms_ne: '',
    })
    setShowForm(true)
    setMessage({ type: '', text: '' })
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setFormData({
      crop_key: row.crop_key || '',
      class_name: row.class_name || '',
      general_name_en: (row.general_name_en ?? row.general_name) || '',
      general_name_ne: row.general_name_ne ?? '',
      category_en: (row.category_en ?? row.category) || '',
      category_ne: row.category_ne ?? '',
      scientific_name: row.scientific_name || '',
      symptoms_en: (row.symptoms_en ?? row.symptoms) || '',
      symptoms_ne: row.symptoms_ne ?? '',
    })
    setShowForm(true)
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitLoading(true)
    setMessage({ type: '', text: '' })
    try {
      if (editingId) {
        await adminUpdateDisease(editingId, formData)
        setMessage({ type: 'success', text: 'Disease updated.' })
      } else {
        await adminCreateDisease(formData)
        setMessage({ type: 'success', text: 'Disease created.' })
      }
      setShowForm(false)
      fetchDiseases()
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Request failed' })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this disease? Linked treatments will have disease_id set to null.')) return
    try {
      await adminDeleteDisease(id)
      setMessage({ type: 'success', text: 'Disease deleted.' })
      fetchDiseases()
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Delete failed' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-800">Disease Catalog (Multilingual)</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          Add Disease
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
          placeholder="Search class or name..."
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
          <h3 className="font-medium text-slate-800">{editingId ? 'Edit Disease' : 'New Disease'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Crop</span>
              <select
                value={formData.crop_key}
                onChange={(e) => setFormData({ ...formData, crop_key: e.target.value })}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                required
              >
                {CROPS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="block text-xs text-slate-500">Class name</span>
              <input
                value={formData.class_name}
                onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                placeholder="e.g. Common_rust"
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                required
                disabled={!!editingId}
              />
            </label>
            <label>
              <span className="block text-xs text-slate-500">Scientific name</span>
              <input
                value={formData.scientific_name}
                onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-xs text-slate-500">General name (EN)</span>
              <input
                value={formData.general_name_en}
                onChange={(e) => setFormData({ ...formData, general_name_en: e.target.value })}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-xs text-slate-500">General name (NE)</span>
              <input
                value={formData.general_name_ne}
                onChange={(e) => setFormData({ ...formData, general_name_ne: e.target.value })}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-xs text-slate-500">Category (EN)</span>
              <input
                value={formData.category_en}
                onChange={(e) => setFormData({ ...formData, category_en: e.target.value })}
                placeholder="e.g. Fungal"
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-xs text-slate-500">Category (NE)</span>
              <input
                value={formData.category_ne}
                onChange={(e) => setFormData({ ...formData, category_ne: e.target.value })}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Symptoms (EN)</span>
              <textarea
                value={formData.symptoms_en}
                onChange={(e) => setFormData({ ...formData, symptoms_en: e.target.value })}
                rows={2}
                className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="block text-xs text-slate-500">Symptoms (NE)</span>
              <textarea
                value={formData.symptoms_ne}
                onChange={(e) => setFormData({ ...formData, symptoms_ne: e.target.value })}
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
                <th className="text-left px-3 py-2">General name</th>
                <th className="text-left px-3 py-2">Category</th>
                <th className="text-left px-3 py-2">Scientific</th>
                <th className="w-20 px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-3 py-2">{d.crop_key}</td>
                  <td className="px-3 py-2 font-mono">{d.class_name}</td>
                  <td className="px-3 py-2">{d.general_name || d.general_name_en || '-'}</td>
                  <td className="px-3 py-2">{d.category || d.category_en || '-'}</td>
                  <td className="px-3 py-2 italic">{d.scientific_name || '-'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openEdit(d)}
                      className="p-1.5 text-slate-600 hover:text-emerald-600"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
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
            <p className="text-center py-6 text-slate-500">No diseases found. Add diseases or run the migration and seed.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default DiseaseManagement
