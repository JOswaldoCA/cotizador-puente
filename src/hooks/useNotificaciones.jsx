import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from './useAuth'

export function useNotificaciones() {
  const { usuario } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [noLeidas,       setNoLeidas]       = useState(0)

  useEffect(() => {
    if (!usuario) return

    // Cargar notificaciones iniciales
    const cargar = async () => {
      const { data } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) {
        setNotificaciones(data)
        setNoLeidas(data.filter(n => !n.leida).length)
      }
    }
    cargar()

    // Suscripción en tiempo real
    const canal = supabase
      .channel('notificaciones')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notificaciones',
        filter: `usuario_id=eq.${usuario.id}`,
      }, (payload) => {
        setNotificaciones(prev => [payload.new, ...prev])
        setNoLeidas(prev => prev + 1)
      })
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [usuario])

  const marcarLeida = async (id) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    setNoLeidas(prev => Math.max(0, prev - 1))
  }

  const marcarTodasLeidas = async () => {
    if (!usuario) return
    await supabase.from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', usuario.id)
      .eq('leida', false)
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    setNoLeidas(0)
  }

  return { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas }
}