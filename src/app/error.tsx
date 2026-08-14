'use client'

import { useEffect } from 'react'

export default function RootError({
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-center px-6">
      <div>
        <h1 className="text-white text-xl font-semibold mb-2">Algo deu errado</h1>
        <p className="text-gray-400 text-sm mb-4">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
