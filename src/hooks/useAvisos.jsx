import { useContext } from 'react'
import { AvisosContext } from './AvisosContext'

// avisar(mensaje, tipo?) muestra un aviso temporal; tipo: 'error' | 'exito' | 'info'
// confirmar(mensaje, opciones?) abre un diálogo y resuelve true/false
export const useAvisos = () => useContext(AvisosContext)
