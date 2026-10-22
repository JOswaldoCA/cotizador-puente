import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { supabase } from '../services/supabase'
import PantallaAcceso, { Resultado } from '../components/PantallaAcceso'
import Boton from '../components/ui/Boton'
import { campo, etiqueta } from '../components/ui/estilos'

export default function RecuperarPassword() {
  const [email,    setEmail]    = useState('')
  const [enviado,  setEnviado]  = useState(false)
  const [error,    setError]    = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nueva-password`,
    })
    setCargando(false)
    if (error) return setError('No se pudo enviar el correo. Revisa que la dirección esté bien escrita.')
    setEnviado(true)
  }

  const volver = <Link to="/login" className="font-semibold text-primary-600 hover:underline">Volver a iniciar sesión</Link>

  if (enviado) return (
    <PantallaAcceso pie={volver}>
      <Resultado icono={MailCheck} titulo="Revisa tu correo">
        Si <strong className="text-gray-800">{email}</strong> tiene una cuenta, te llegará un enlace para elegir una
        contraseña nueva. Revisa también la carpeta de spam.
      </Resultado>
    </PantallaAcceso>
  )

  return (
    <PantallaAcceso
      titulo="Recuperar contraseña"
      descripcion="Te mandamos un enlace para elegir una nueva."
      pie={volver}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className={etiqueta}>Correo de tu cuenta</label>
          <input id="email" type="email" required autoComplete="email" className={campo}
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {error && <p className="text-sm text-estado-rechazada" role="alert">{error}</p>}
        <Boton type="submit" disabled={cargando} className="w-full">
          {cargando ? 'Enviando...' : 'Enviar enlace'}
        </Boton>
      </form>
    </PantallaAcceso>
  )
}
