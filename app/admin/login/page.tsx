'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })

      if (!res.ok) {
        setError('Clave incorrecta')
        setLoading(false)
        return
      }

      router.push('/admin')
    } catch {
      setError('Error de conexion')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bone flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5"
      >
        <div className="text-center">
          <h1 className="font-grotesk text-2xl font-bold text-asphalt tracking-tight">
            LORENZO ADMIN
          </h1>
          <p className="font-mono text-xs text-mid-gray mt-1 tracking-wide">
            Ingresa la clave de administrador
          </p>
        </div>

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Clave de acceso"
          className="w-full px-4 py-3 border border-black/10 rounded-brutal bg-white font-mono text-sm text-asphalt placeholder:text-mid-gray focus:outline-none focus:ring-2 focus:ring-rojo/30"
          autoFocus
        />

        {error && (
          <p className="font-mono text-xs text-rojo text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !key}
          className="w-full py-3 bg-asphalt text-bone font-mono text-sm tracking-widest rounded-brutal hover:bg-rojo transition-colors disabled:opacity-50"
        >
          {loading ? 'VERIFICANDO...' : 'ENTRAR'}
        </button>
      </form>
    </div>
  )
}
