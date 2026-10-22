import { useNavigate } from "react-router-dom";
import { FileDown, Files, Plus } from "lucide-react";
import Modal from "./ui/Modal";
import Boton from "./ui/Boton";
import EnvioCorreo from "./EnvioCorreo";

// Se muestra al guardar una cotización: ver PDF, enviarla o seguir trabajando
export default function ModalCotizacion({ folio, emailCliente }) {
  const navigate = useNavigate();

  return (
    <Modal
      titulo="Cotización guardada"
      subtitulo={folio}
      pie={
        <>
          <Boton variante="secundario" icono={Files} onClick={() => navigate("/cotizaciones")} className="flex-1">
            Ir a cotizaciones
          </Boton>
          <Boton icono={Plus} onClick={() => (window.location.href = "/nueva")} className="flex-1">
            Nueva cotización
          </Boton>
        </>
      }
    >
      <Boton
        variante="secundario"
        icono={FileDown}
        onClick={() => window.open(`/preview/${folio}`, "_blank")}
        className="w-full"
      >
        Ver e imprimir PDF
      </Boton>
      <EnvioCorreo folio={folio} emailInicial={emailCliente} />
    </Modal>
  );
}
