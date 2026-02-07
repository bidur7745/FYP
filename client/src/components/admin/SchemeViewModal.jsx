import React from 'react'
import { X, Calendar, FileText, MapPin, Building, Globe, ExternalLink } from 'lucide-react'

const SchemeViewModal = ({ scheme, isOpen, onClose }) => {
  if (!isOpen || !scheme) return null

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{scheme.title}</h2>
            {scheme.schemeType && (
              <p className="text-sm text-gray-600 mt-1">{scheme.schemeType}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Badge */}
          {scheme.status && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-semibold rounded ${getStatusBadgeClass(scheme.status)}`}>
                {scheme.status.toUpperCase()}
              </span>
            </div>
          )}

          {/* Description */}
          {scheme.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {scheme.description}
              </p>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheme.level && (
              <div>
                <span className="text-gray-600 text-sm">Level:</span>
                <p className="text-gray-900 font-medium">{scheme.level}</p>
              </div>
            )}
            {scheme.sector && (
              <div>
                <span className="text-gray-600 text-sm">Sector:</span>
                <p className="text-gray-900 font-medium">{scheme.sector}</p>
              </div>
            )}
            {scheme.provinceName && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                <div>
                  <span className="text-gray-600 text-sm">Province:</span>
                  <p className="text-gray-900 font-medium">{scheme.provinceName}</p>
                </div>
              </div>
            )}
            {scheme.districtName && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                <div>
                  <span className="text-gray-600 text-sm">District:</span>
                  <p className="text-gray-900 font-medium">{scheme.districtName}</p>
                </div>
              </div>
            )}
            {scheme.localBodyType && (
              <div className="flex items-center gap-2">
                <Building size={16} className="text-emerald-600" />
                <div>
                  <span className="text-gray-600 text-sm">Local Body Type:</span>
                  <p className="text-gray-900 font-medium">{scheme.localBodyType}</p>
                </div>
              </div>
            )}
            {scheme.localBodyName && (
              <div>
                <span className="text-gray-600 text-sm">Local Body Name:</span>
                <p className="text-gray-900 font-medium">{scheme.localBodyName}</p>
              </div>
            )}
            {scheme.regionScope && (
              <div>
                <span className="text-gray-600 text-sm">Region Scope:</span>
                <p className="text-gray-900 font-medium">{scheme.regionScope}</p>
              </div>
            )}
            {scheme.publishedDate && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-600" />
                <div>
                  <span className="text-gray-600 text-sm">Published Date:</span>
                  <p className="text-gray-900 font-medium">
                    {new Date(scheme.publishedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {scheme.expiryDate && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-600" />
                <div>
                  <span className="text-gray-600 text-sm">Expiry Date:</span>
                  <p className="text-gray-900 font-medium">
                    {new Date(scheme.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Links */}
          {(scheme.sourceUrl || scheme.documentUrl) && (
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Links</h3>
              {scheme.sourceUrl && (
                <a
                  href={scheme.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm"
                >
                  <Globe size={16} />
                  Source URL
                  <ExternalLink size={14} />
                </a>
              )}
              {scheme.documentUrl && (
                <a
                  href={scheme.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm"
                >
                  <FileText size={16} />
                  Document URL
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}

          {/* Scheme Details */}
          {scheme.details && (
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Scheme Details</h3>
              {scheme.details.eligibility && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Eligibility</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {scheme.details.eligibility}
                  </p>
                </div>
              )}
              {scheme.details.benefits && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Benefits</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {scheme.details.benefits}
                  </p>
                </div>
              )}
              {scheme.details.applicationProcess && scheme.details.applicationProcess.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Application Process</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    {scheme.details.applicationProcess.map((step, index) => (
                      <li key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-200">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {scheme.details.requiredDocuments && scheme.details.requiredDocuments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Required Documents</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {scheme.details.requiredDocuments.map((doc, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {scheme.details.usageConditions && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Usage Conditions</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {scheme.details.usageConditions}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default SchemeViewModal

