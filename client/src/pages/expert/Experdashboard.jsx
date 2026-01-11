import React, { useEffect, useState } from 'react'
import { getDashboard } from '../../services/api'

const Experdashboard = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getDashboard('expert')
        setData(response.data)
      } catch (err) {
        setError(err.message)
      }
    }
    fetchDashboard()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Expert Dashboard</h1>
      {error && <div className="text-red-600">{error}</div>}
      {data ? (
        <div className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-emerald-700 font-medium">{data.message}</p>
          <pre className="mt-2 bg-slate-50 p-3 rounded text-sm overflow-auto">{JSON.stringify(data.user, null, 2)}</pre>
        </div>
      ) : (
        !error && <p className="text-gray-600">Loading dashboard…</p>
      )}
    </div>
  )
}

export default Experdashboard