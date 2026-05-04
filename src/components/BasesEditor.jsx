import { useState } from 'react'
import { BASES } from '../utils/constantes'

export default function BasesEditor({ basesExtra, setBasesExtra }) {
  const [nueva, setNueva] = useState('')

  const agregar = () => {
    const texto = nueva.trim()
    if (!texto) return
    setBasesExtra(prev => [...prev, texto])
    setNueva('')
  }

  const quitar = (i) =>
    setBasesExtra(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-col gap-3">
      {/* Bases default */}
      <div>
        <p className="text-xs font-medium text-gray-400 mb-2">Bases por defecto (no editables)</p>
        <div className="flex flex-col gap-1">
          {BASES.map((b, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bases personalizadas */}
      {basesExtra.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">Bases personalizadas</p>
          <div className="flex flex-col gap-1">
            {basesExtra.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
                <span className="text-primary-400 mt-0.5">•</span>
                <span className="flex-1">{b}</span>
                <button type="button" onClick={() => quitar(i)}
                  className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agregar nueva */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Agregar base personalizada..."
          value={nueva}
          onChange={e => setNueva(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && agregar()}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" />
        <button type="button" onClick={agregar}
          className="bg-primary-600 hover:bg-primary-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Agregar
        </button>
      </div>
    </div>
  )
}