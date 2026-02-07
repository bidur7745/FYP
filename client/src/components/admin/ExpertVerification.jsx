import React, { useState, useEffect } from 'react'
import { getExperts, verifyExpert } from '../../services/api'
import { Loader2, CheckCircle, XCircle, FileCheck } from 'lucide-react'

const ExpertVerification = () => {
  const [experts, setExperts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifyingId, setVerifyingId] = useState(null)

  const loadExperts = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getExperts()
      if (res.success && Array.isArray(res.data)) {
        setExperts(res.data)
      } else {
        setExperts([])
      }
    } catch (err) {
      setError(err.message || 'Failed to load experts')
      setExperts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExperts()
  }, [])

  const handleVerify = async (userId) => {
    try {
      setVerifyingId(userId)
      const res = await verifyExpert(userId)
      if (res.success) {
        setExperts((prev) =>
          prev.map((e) =>
            e.id === userId && e.userDetails
              ? { ...e, userDetails: { ...e.userDetails, isVerifiedExpert: true } }
              : e
          )
        )
      }
    } catch (err) {
      setError(err.message || 'Failed to verify expert')
    } finally {
      setVerifyingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Expert verification</h2>
        <p className="text-slate-600 text-sm mt-1">
          Review expert profiles and license, then approve so they can help farmers.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {experts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          No experts registered yet.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Expert</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Details</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">License</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {experts.map((expert) => {
                  const details = expert.userDetails || {}
                  const isVerified = details.isVerifiedExpert === true
                  return (
                    <tr key={expert.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{expert.name}</div>
                        <div className="text-sm text-slate-500">{expert.email}</div>
                        {details.phone && (
                          <div className="text-xs text-slate-400">{details.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {details.skills && <div><span className="font-medium">Skills:</span> {details.skills}</div>}
                        {details.education && <div><span className="font-medium">Education:</span> {details.education}</div>}
                        {details.yearsOfExperience != null && <div><span className="font-medium">Experience:</span> {details.yearsOfExperience} years</div>}
                        {!details.skills && !details.education && details.yearsOfExperience == null && (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {details.licenseImage ? (
                          <a
                            href={details.licenseImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                          >
                            <FileCheck size={16} /> View license
                          </a>
                        ) : (
                          <span className="text-slate-400 text-sm">No license</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle size={14} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <XCircle size={14} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isVerified ? (
                          <button
                            type="button"
                            onClick={() => handleVerify(expert.id)}
                            disabled={verifyingId === expert.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50"
                          >
                            {verifyingId === expert.id ? 'Verifying…' : 'Approve'}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpertVerification
