import React from 'react'
import { Link } from 'react-router-dom'
import MyQueriesCard from './MyQueriesCard'

const QueriesTab = () => {
  return (
    <div className="space-y-6 pt-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">My Support Queries</h2>
        <Link
          to="/support"
          className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Contact Support
        </Link>
      </div>
      <MyQueriesCard />
    </div>
  )
}

export default QueriesTab
