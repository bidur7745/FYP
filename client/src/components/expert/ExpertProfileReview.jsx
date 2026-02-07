import React from 'react'
import { Clock } from 'lucide-react'

/**
 * Shown when expert profile is complete but awaiting admin verification.
 * Uses Support-style theme: slate + emerald, red heading only.
 */
const ExpertProfileReview = () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="rounded-2xl border border-emerald-500/20 bg-slate-950 p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-400 mb-1">Your profile is under review</h2>
            <p className="text-slate-300 text-sm">
              Your profile and license have been submitted successfully. An admin will review and verify your expert status soon.
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Once verified, you'll be able to access Chats and My Earning features. Please wait for admin approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpertProfileReview
