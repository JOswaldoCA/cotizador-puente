import { useState } from "react";
import { SUCURSALES } from "../utils/constantes";
import { generarFolio, estaVencida } from '../utils/calculos'


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
  const [folio, setFolio] = useState(() => generarFolio(SUCURSALES[0].id));
  const [sucursal, setSucursal] = useState(SUCURSALES[0]);
  const [opciones, setOpciones] = useState([opcionVacia()]);
  const [cliente, setCliente] = useState({
    atencion: "",
    contacto: "",
    vigencia: "1 MES",
    pago: "MES SERVIDO",
    email: "",
    notas: "",
  });
  const [basesExtra, setBasesExtra] = useState([])

  const cargarCotizacion = (cot) => {
  const vencida = estaVencida(cot.fecha, cot.cliente?.vigencia)
  const s = SUCURSALES.find(s => s.id === cot.sucursal.id) || SUCURSALES[0]
  
  setFolio(vencida ? generarFolio(s.id) : cot.folio)  // ← nuevo folio si vencida
  setSucursal(s)
  setCliente(cot.cliente)
  setBasesExtra(cot.basesExtra || [])
  setOpciones(cot.opciones.map(op => ({
    id:       Date.now() + Math.random(),
    servicios: op.servicios,
  })))
}

  const cambiarSucursal = (s) => {
    setSucursal(s);
    setFolio(generarFolio(s.id));
  };

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
    folio,
    setFolio,
    sucursal,
    setSucursal: cambiarSucursal,
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
