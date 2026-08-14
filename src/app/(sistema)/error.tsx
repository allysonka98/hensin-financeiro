'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ErrorSistema({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-red-400/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <h2 className="text-white font-semibold text-lg">Algo deu errado</h2>
        <p className="text-gray-400 text-sm mt-1 max-w-md">
          Não foi possível carregar esta página. Tente novamente em instantes.
        </p>
      </div>
      <button
        onClick={() => unstable_retry()}
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
