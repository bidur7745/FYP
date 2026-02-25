import React, { useState, useEffect } from 'react'
import { getExperts, getAllUsers, verifyExpert, rejectExpert } from '../../services/api'
import { Loader2, CheckCircle, XCircle, FileCheck, Users, GraduationCap, Filter, Eye, User, X } from 'lucide-react'

const UserManagement = () => {
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // 'all', 'farmer', 'expert'
  const [verifyingId, setVerifyingId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [viewDetailsUser, setViewDetailsUser] = useState(null)
  const [licenseImageUrl, setLicenseImageUrl] = useState(null)

  const loadUsers = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError('')
      
      // Try to get all users (uses cache unless forceRefresh), fallback to experts only
      let experts = []
      let farmers = []
      
      try {
        const allRes = await getAllUsers(forceRefresh)
        if (allRes.success && Array.isArray(allRes.data)) {
          experts = allRes.data.filter(u => u.role === 'expert')
          farmers = allRes.data.filter(u => u.role === 'user')
        }
      } catch (_) {
        const expertsRes = await getExperts(forceRefresh)
        if (expertsRes.success && Array.isArray(expertsRes.data)) {
          experts = expertsRes.data
        }
      }
      
      setAllUsers([...farmers, ...experts])
    } catch (err) {
      setError(err.message || 'Failed to load users')
      setAllUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleVerify = async (userId) => {
    try {
      setVerifyingId(userId)
      const res = await verifyExpert(userId)
      if (res.success) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u.id === userId && u.userDetails
              ? { ...u, userDetails: { ...u.userDetails, isVerifiedExpert: 'approved' } }
              : u
          )
        )
        await loadUsers(true) // refresh cache so next load is fresh
      }
    } catch (err) {
      setError(err.message || 'Failed to verify expert')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleReject = async (userId) => {
    try {
      setRejectingId(userId)
      const res = await rejectExpert(userId)
      if (res.success) {
        setAllUsers((prev) =>
          prev.map((u) =>
            u.id === userId && u.userDetails
              ? { ...u, userDetails: { ...u.userDetails, isVerifiedExpert: 'rejected' } }
              : u
          )
        )
        await loadUsers(true)
      }
    } catch (err) {
      setError(err.message || 'Failed to reject expert')
    } finally {
      setRejectingId(null)
    }
  }

  const filteredUsers = allUsers.filter((user) => {
    if (filter === 'all') return true
    if (filter === 'farmer') return user.role === 'user'
    if (filter === 'expert') return user.role === 'expert'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    )
  }

  return (
    <div className="p-2">
      <div className="mb-2 text-center">
        <h2 className="text-2xl font-semibold text-slate-800">User Management</h2>
      </div>

      {/* Filter buttons */}
      <div className="mb-6 flex items-center gap-3">
        <Filter className="w-5 h-5 text-slate-600" />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setFilter('farmer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              filter === 'farmer'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users size={16} /> Farmers
          </button>
          <button
            onClick={() => setFilter('expert')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              filter === 'expert'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GraduationCap size={16} /> Experts
          </button>
        </div>
        <div className="ml-auto text-sm text-slate-600">
          Showing {filteredUsers.length} of {allUsers.length} users
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          {filter === 'all' ? 'No users found.' : `No ${filter === 'farmer' ? 'farmers' : 'experts'} found.`}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">User</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Role</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Details</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">License</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const details = user.userDetails || {}
                  const isExpert = user.role === 'expert'
                  const verificationStatus = details.isVerifiedExpert // 'pending' | 'approved' | 'rejected'
                  const isVerified = verificationStatus === 'approved'
                  const isPending = verificationStatus === 'pending'
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {details.profileImage ? (
                            <img
                              src={details.profileImage}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-800">{user.name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                            {details.phone && (
                              <div className="text-xs text-slate-400">{details.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isExpert 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isExpert ? <GraduationCap size={12} /> : <Users size={12} />}
                          {isExpert ? 'Expert' : 'Farmer'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {isExpert ? (
                          <>
                            {details.skills && <div><span className="font-medium">Skills:</span> {details.skills}</div>}
                            {details.education && <div><span className="font-medium">Education:</span> {details.education}</div>}
                            {details.yearsOfExperience != null && <div><span className="font-medium">Experience:</span> {details.yearsOfExperience} years</div>}
                            {!details.skills && !details.education && details.yearsOfExperience == null && (
                              <span className="text-slate-400">—</span>
                            )}
                          </>
                        ) : (
                          <div>
                            {details.address && <div><span className="font-medium">Address:</span> {details.address}</div>}
                            {!details.address && <span className="text-slate-400">—</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isExpert && details.licenseImage ? (
                          <button
                            type="button"
                            onClick={() => setLicenseImageUrl(details.licenseImage)}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                          >
                            <FileCheck size={16} /> View license
                          </button>
                        ) : isExpert ? (
                          <span className="text-slate-400 text-sm">No license</span>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isExpert ? (
                          isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              <CheckCircle size={14} /> Verified
                            </span>
                          ) : verificationStatus === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle size={14} /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <XCircle size={14} /> Pending
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setViewDetailsUser(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium"
                          >
                            <Eye size={14} /> View details
                          </button>
                          {isExpert && isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleVerify(user.id)}
                                disabled={verifyingId === user.id || rejectingId === user.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50"
                              >
                                {verifyingId === user.id ? 'Verifying…' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(user.id)}
                                disabled={verifyingId === user.id || rejectingId === user.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium disabled:opacity-50"
                              >
                                {rejectingId === user.id ? 'Rejecting…' : 'Reject'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* License image popup */}
      {licenseImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setLicenseImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setLicenseImageUrl(null)}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
            >
              <X size={20} />
            </button>
            <img
              src={licenseImageUrl}
              alt="License / Certificate"
              className="w-full h-auto max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* View details popup */}
      {viewDetailsUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setViewDetailsUser(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">User details</h3>
              <button
                type="button"
                onClick={() => setViewDetailsUser(null)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            {(() => {
              const u = viewDetailsUser
              const d = u.userDetails || {}
              const isExpert = u.role === 'expert'
              return (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    {d.profileImage ? (
                      <img src={d.profileImage} alt={u.name} className="w-16 h-16 rounded-full object-cover border" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{u.name}</p>
                      <p className="text-slate-500">{u.email}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isExpert ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {isExpert ? 'Expert' : 'Farmer'}
                      </span>
                    </div>
                  </div>
                  {d.phone && <p><span className="font-medium text-slate-600">Phone:</span> {d.phone}</p>}
                  {d.address && <p><span className="font-medium text-slate-600">Address:</span> {d.address}</p>}
                  {d.bio && <p><span className="font-medium text-slate-600">Bio:</span> {d.bio}</p>}
                  {isExpert && (
                    <>
                      {d.skills && <p><span className="font-medium text-slate-600">Skills:</span> {d.skills}</p>}
                      {d.education && <p><span className="font-medium text-slate-600">Education:</span> {d.education}</p>}
                      {d.yearsOfExperience != null && <p><span className="font-medium text-slate-600">Experience:</span> {d.yearsOfExperience} years</p>}
                      {d.licenseImage && (
                        <p>
                          <span className="font-medium text-slate-600">License:</span>{' '}
                          <button type="button" onClick={() => { setViewDetailsUser(null); setLicenseImageUrl(d.licenseImage) }} className="text-emerald-600 hover:underline">View license</button>
                        </p>
                      )}
                      <p><span className="font-medium text-slate-600">Status:</span> {d.isVerifiedExpert === 'approved' ? 'Verified' : d.isVerifiedExpert === 'rejected' ? 'Rejected' : 'Pending'}</p>
                    </>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
