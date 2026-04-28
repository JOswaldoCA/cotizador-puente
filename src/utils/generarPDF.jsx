import { pdf } from '@react-pdf/renderer'
import { DocumentoPDF } from '../components/DocumentoPDF'

export async function generarPDFBase64(cot) {
  const blob = await pdf(<DocumentoPDF cot={cot} />).toBlob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(blob)
  })
}