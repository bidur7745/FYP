import React, { useState } from 'react'
import { Leaf, Stethoscope } from 'lucide-react'
import DiseaseManagement from './DiseaseManagement'
import TreatmentManagement from './TreatmentManagement'

const DiseaseAndTreatmentManagement = () => {
  const [activeSection, setActiveSection] = useState('diseases')

  return (
    <div className="space-y-4">
      {/* Section tabs: Diseases | Treatments */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveSection('diseases')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'diseases'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Leaf className="w-4 h-4" />
            Diseases
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('treatments')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'treatments'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Treatments
          </button>
        </div>
      </div>

      {activeSection === 'diseases' ? <DiseaseManagement /> : <TreatmentManagement />}
    </div>
  )
}

export default DiseaseAndTreatmentManagement
