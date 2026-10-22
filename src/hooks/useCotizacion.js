import { useState } from "react";
import { SUCURSALES } from "../utils/constantes";
import { diasVigencia } from '../utils/calculos'


const servicioVacio = () => ({
  id: Date.now() + Math.random(),
  servicioId: null,
  nombre: "",
  precioUnitario: 0,
  numContenedores: 1,
  precioDia: 0,
  diasSemana: 1,
});

const opcionVacia = () => ({
  id: Date.now(),
  servicios: [servicioVacio()],
});

export function useCotizacion() {
  const [sucursal, setSucursal] = useState(SUCURSALES[0]);
  const [opciones, setOpciones] = useState([opcionVacia()]);
  const [cliente, setCliente] = useState({
    atencion: "",
    contacto: "",
    vigencia: "30 DÍAS",
    pago: "MES SERVIDO",
    email: "",
    notas: "",
  });
  const [basesExtra, setBasesExtra] = useState([])

  const cargarCotizacion = (cot) => {
  const s = SUCURSALES.find(s => s.id === cot.sucursal.id) || SUCURSALES[0]

  setSucursal(s)
  // Cotizaciones anteriores pueden traer "1 MES", que ya no está en VIGENCIAS
  setCliente({ ...cot.cliente, vigencia: `${diasVigencia(cot.cliente?.vigencia)} DÍAS` })
  setBasesExtra(cot.basesExtra || [])
  setOpciones(cot.opciones.map(op => ({
    id:       Date.now() + Math.random(),
    servicios: op.servicios,
  })))
}

  const agregarOpcion = () => setOpciones((prev) => [...prev, opcionVacia()]);

  const quitarOpcion = (opId) =>
    setOpciones((prev) => prev.filter((o) => o.id !== opId));

  const agregarServicio = (opId) =>
    setOpciones((prev) =>
      prev.map((op) =>
        op.id !== opId
          ? op
          : { ...op, servicios: [...op.servicios, servicioVacio()] },
      ),
    );

  const quitarServicio = (opId, srvId) =>
    setOpciones((prev) =>
      prev.map((op) =>
        op.id !== opId
          ? op
          : { ...op, servicios: op.servicios.filter((s) => s.id !== srvId) },
      ),
    );

  const actualizarServicio = (opId, srvId, campos) =>
    setOpciones((prev) =>
      prev.map((op) => {
        if (op.id !== opId) return op;
        return {
          ...op,
          servicios: op.servicios.map(
            (s) => (s.id !== srvId ? s : { ...s, ...campos }), // ← spread de objeto
          ),
        };
      }),
    );

  return {
    sucursal,
    setSucursal,
    opciones,
    setOpciones,
    agregarOpcion,
    quitarOpcion,
    agregarServicio,
    quitarServicio,
    actualizarServicio,
    cliente,
    setCliente,
    basesExtra, setBasesExtra,
    cargarCotizacion,
  };
}
