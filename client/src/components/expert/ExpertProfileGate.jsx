import React from 'react'
import { Link } from 'react-router-dom'
import { FileCheck } from 'lucide-react'


const ExpertProfileGate = ({ title, description, isRejected = false }) => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className={`rounded-2xl border p-6 shadow-xl ${isRejected ? 'border-red-500/30 bg-slate-950' : 'border-emerald-500/20 bg-slate-950'}`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isRejected ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-300'}`}>
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-400 mb-1">{title}</h2>
            <p className="text-slate-300 text-sm">
              {description}
            </p>
            {!isRejected && (
              <p className="text-slate-400 text-sm mt-2">
                Add your license and expert details on the dashboard so an admin can verify you. Then you can access this section.
              </p>
            )}
          </div>
        </div>
        <Link
          to="/dashboard/expert/profile"
          className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2.5 text-slate-900 font-semibold hover:bg-emerald-400 transition"
        >
          {isRejected ? 'Update profile' : 'Complete profile'}
        </Link>
      </div>
    </div>
  )
}

export default ExpertProfileGate
