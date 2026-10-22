import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlarmClock,
  Building2,
  ChartColumn,
  FileDown,
  FileText,
  Inbox,
  Plus,
  Trophy,
} from "lucide-react";
import { obtenerCotizaciones } from "../services/cotizaciones";
import { supabase } from "../services/supabase";
import { useAuth } from "../hooks/useAuth";
import { diasParaVencer, fechaDeCotizacion, textoVencimiento } from "../utils/calculos";
import { SUCURSALES } from "../utils/constantes";
import { esSupervisor } from "../utils/permisos";
import Boton from "../components/ui/Boton";
import Seccion from "../components/ui/Seccion";
import { BarraEstatus, EtiquetaEstatus } from "../components/ui/Estatus";
import { ESTATUS } from "../components/ui/estatusEstilos";

const MESES_LABEL = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const PERIODOS = [
  { key: "dia", label: "Hoy", frase: "hoy" },
  { key: "mes", label: "Este mes", frase: "este mes" },
  { key: "año", label: "Este año", frase: "este año" },
  { key: "todo", label: "Todo", frase: "en total" },
];

const enRevision = (c) => !c.estatus || c.estatus === "En revisión";

// Conteos de un grupo de cotizaciones; la tasa solo considera las ya decididas
function resumir(lista) {
  const aprobadas = lista.filter((c) => c.estatus === "Aprobada").length;
  const rechazadas = lista.filter((c) => c.estatus === "Rechazada").length;
  const decididas = aprobadas + rechazadas;
  return {
    total: lista.length,
    aprobadas,
    rechazadas,
    revision: lista.filter(enRevision).length,
    decididas,
    tasa: decididas ? Math.round((aprobadas / decididas) * 100) : null,
  };
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// ── Contenedor: carga los datos ─────────────────────────────────
export default function Dashboard() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [vendedores, setVendedores] = useState({});
  const [cargando, setCargando] = useState(true);
  const { perfil } = useAuth();
  const supervisor = esSupervisor(perfil);

  useEffect(() => {
    obtenerCotizaciones()
      .then(setCotizaciones)
      .finally(() => setCargando(false));
  }, []);

  // Nombres para el desempeño por vendedor
  useEffect(() => {
    if (!supervisor) return;
    supabase
      .from("perfiles")
      .select("id, nombre")
      .then(({ data }) =>
        setVendedores(Object.fromEntries((data || []).map((p) => [p.id, p.nombre]))),
      );
  }, [supervisor]);

  if (cargando)
    return (
      <div className="flex justify-center items-center py-20 gap-3 text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
        Cargando dashboard...
      </div>
    );

  return <DashboardVista cotizaciones={cotizaciones} vendedores={vendedores} perfil={perfil} />;
}

// ── Vista: solo dibuja (se puede mostrar con datos de prueba) ───
export function DashboardVista({ cotizaciones, vendedores, perfil, hoy: hoyProp }) {
  const [periodo, setPeriodo] = useState("mes");
  const navigate = useNavigate();
  const supervisor = esSupervisor(perfil);
  const hoy = useMemo(() => hoyProp || new Date(), [hoyProp]);

  const delPeriodo = useMemo(
    () =>
      cotizaciones.filter((c) => {
        if (periodo === "todo") return true;
        const f = fechaDeCotizacion(c);
        if (!f) return false;
        if (periodo === "dia") return f.toDateString() === hoy.toDateString();
        if (periodo === "mes")
          return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
        return f.getFullYear() === hoy.getFullYear();
      }),
    [cotizaciones, periodo, hoy],
  );

  const resumen = resumir(delPeriodo);
  const frasePeriodo = PERIODOS.find((p) => p.key === periodo).frase;

  // En revisión que ya vencieron o vencen en los próximos 7 días
  const pendientes = useMemo(
    () =>
      cotizaciones
        .filter(enRevision)
        .map((c) => ({ cot: c, dias: diasParaVencer(fechaDeCotizacion(c), c.cliente?.vigencia) }))
        .filter(({ dias }) => dias !== null && dias <= 7)
        .sort((a, b) => a.dias - b.dias),
    [cotizaciones],
  );
  const vencidas = pendientes.filter((p) => p.dias <= 0).length;

  // Últimos 6 meses (independiente del período seleccionado)
  const datosMeses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
    const delMes = cotizaciones.filter((c) => {
      const f = fechaDeCotizacion(c);
      return f && f.getMonth() === d.getMonth() && f.getFullYear() === d.getFullYear();
    });
    return {
      label: MESES_LABEL[d.getMonth()],
      total: delMes.length,
      aprobadas: delMes.filter((c) => c.estatus === "Aprobada").length,
    };
  });
  const maxValor = Math.max(...datosMeses.map((d) => d.total), 1);

  const porSucursal = SUCURSALES.map((s) => ({
    ...s,
    r: resumir(delPeriodo.filter((c) => c.sucursal?.id === s.id)),
  }));

  const porVendedor = Object.values(
    delPeriodo.reduce((acc, c) => {
      (acc[c.usuario_id] ||= { id: c.usuario_id, lista: [] }).lista.push(c);
      return acc;
    }, {}),
  )
    .map(({ id, lista }) => ({ id, nombre: vendedores[id] || "Usuario", r: resumir(lista) }))
    .sort((a, b) => b.r.total - a.r.total);

  return (
    <div className="flex flex-col gap-5 lg:gap-6 tabular-nums">
      {/* Saludo */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-primary-800">
          Hola, {perfil?.nombre?.split(" ")[0] || "Usuario"}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {supervisor ? "Cotizaciones de todas las sucursales" : "Tus cotizaciones"}
        </p>
      </div>

      {/* Resumen del período */}
      <section className="rounded-2xl bg-primary-600 text-white p-5 lg:p-7 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <p className="text-lg lg:text-xl text-white/90 leading-tight">
            <span className="block text-5xl lg:text-6xl font-semibold text-accent-400 tracking-tight mb-1">
              {resumen.total}
            </span>
            {resumen.total === 1 ? "cotización" : "cotizaciones"} {frasePeriodo}
          </p>
          <div
            className="flex gap-1 bg-white/10 rounded-xl p-1 self-start"
            role="group"
            aria-label="Período"
          >
            {PERIODOS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriodo(key)}
                aria-pressed={periodo === key}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
                  periodo === key ? "bg-white text-primary-800" : "text-white/75 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <BarraEstatus r={resumen} alto="h-2.5" fondo="bg-white/15" />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {[
            { n: resumen.aprobadas, texto: "aprobadas", clase: ESTATUS.Aprobada.barra },
            { n: resumen.rechazadas, texto: "rechazadas", clase: ESTATUS.Rechazada.barra },
            { n: resumen.revision, texto: "en revisión", clase: ESTATUS["En revisión"].barra },
          ].map(({ n, texto, clase }) => (
            <span key={texto} className="flex items-center gap-2 text-white/80">
              <span className={`w-2.5 h-2.5 rounded-full ${clase} ring-2 ring-white/20`} aria-hidden="true" />
              <b className="text-white font-semibold">{n}</b> {texto}
            </span>
          ))}
          <span className="lg:ml-auto text-white/80">
            {resumen.tasa === null ? (
              "Aún no hay cotizaciones aprobadas o rechazadas"
            ) : (
              <>
                <b className="text-white font-semibold">{resumen.tasa}%</b> de aprobación entre{" "}
                {plural(resumen.decididas, "decidida", "decididas")}
              </>
            )}
          </span>
        </div>
      </section>

      {/* Requieren atención */}
      {pendientes.length > 0 && (
        <Seccion
          icono={AlarmClock}
          titulo={`Requieren atención (${pendientes.length})`}
          descripcion={
            vencidas
              ? `${plural(vencidas, "vencida", "vencidas")} y ${pendientes.length - vencidas} por vencer en 7 días`
              : "En revisión, por vencer en los próximos 7 días"
          }
        >
          <ul className="divide-y divide-linea">
            {pendientes.slice(0, 6).map(({ cot, dias }) => (
              <li key={cot.folio} className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {cot.cliente?.contacto || cot.cliente?.atencion || "Sin cliente"}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-mono">{cot.folio}</span>
                  </p>
                  <p
                    className={`text-xs font-semibold sm:hidden ${
                      dias <= 0 ? "text-estado-rechazada" : "text-estado-revision"
                    }`}
                  >
                    {textoVencimiento(dias)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-xs font-semibold hidden sm:inline ${
                      dias <= 0 ? "text-estado-rechazada" : "text-estado-revision"
                    }`}
                  >
                    {textoVencimiento(dias)}
                  </span>
                  <Boton
                    variante="secundario"
                    tamaño="sm"
                    onClick={() => navigate(`/cotizaciones/${cot.folio}/editar`)}
                  >
                    {dias <= 0 ? "Renovar" : "Abrir"}
                  </Boton>
                </div>
              </li>
            ))}
          </ul>
          {pendientes.length > 6 && (
            <button
              type="button"
              onClick={() => navigate("/cotizaciones")}
              className="w-full text-xs font-semibold text-primary-600 py-3 border-t border-linea hover:bg-primary-50/50"
            >
              Ver las {pendientes.length - 6} restantes en Cotizaciones
            </button>
          )}
        </Seccion>
      )}

      <div className={`grid gap-5 lg:gap-6 ${supervisor ? "lg:grid-cols-2" : ""}`}>
        {/* Gráfica — últimos 6 meses */}
        <Seccion
          icono={ChartColumn}
          titulo="Últimos 6 meses"
          accion={
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary-600" aria-hidden="true" />
                Total
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm ${ESTATUS.Aprobada.barra}`} aria-hidden="true" />
                Aprobadas
              </span>
            </div>
          }
        >
          <div className="px-4 lg:px-6 pt-6 pb-4">
            <div className="flex items-end gap-3 lg:gap-5 h-40 border-b border-linea">
              {datosMeses.map((d) => (
                <div key={d.label} className="flex-1 h-full flex items-end gap-1">
                  {[
                    { valor: d.total, clase: "bg-primary-600" },
                    { valor: d.aprobadas, clase: ESTATUS.Aprobada.barra },
                  ].map((barra, j) => (
                    <div key={j} className="flex-1 h-full flex flex-col justify-end items-center">
                      {barra.valor > 0 && (
                        <span className="text-[11px] font-semibold text-gray-600 mb-1">{barra.valor}</span>
                      )}
                      <div
                        className={`w-full rounded-t ${barra.clase}`}
                        style={{
                          height: `${(barra.valor / maxValor) * 85}%`,
                          minHeight: barra.valor > 0 ? "3px" : "0",
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex gap-3 lg:gap-5 mt-2">
              {datosMeses.map((d) => (
                <p key={d.label} className="flex-1 text-center text-xs text-gray-500">
                  {d.label}
                </p>
              ))}
            </div>
          </div>
        </Seccion>

        {/* Por sucursal */}
        {supervisor && (
          <Seccion icono={Building2} titulo="Por sucursal" descripcion={`Cotizaciones ${frasePeriodo}`}>
            <ul className="divide-y divide-linea">
              {porSucursal.map(({ id, tipo, r }) => (
                <li key={id} className="px-4 lg:px-6 py-4 flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800">{tipo}</p>
                    <p className="text-sm text-gray-500">
                      <b className="font-semibold text-gray-800">{r.total}</b>
                      {r.tasa !== null && <span className="ml-3">{r.tasa}% aprobación</span>}
                    </p>
                  </div>
                  <BarraEstatus r={r} />
                </li>
              ))}
            </ul>
          </Seccion>
        )}
      </div>

      {/* Por vendedor */}
      {supervisor && (
        <Seccion icono={Trophy} titulo="Por vendedor" descripcion={`Ordenado por cotizaciones ${frasePeriodo}`}>
          {porVendedor.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">
              Nadie ha cotizado {frasePeriodo}.
            </p>
          ) : (
            <ol className="divide-y divide-linea">
              {porVendedor.map(({ id, nombre, r }, i) => (
                <li key={id} className="px-4 lg:px-6 py-3 grid grid-cols-[1.75rem_1fr_auto] items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                      i === 0 ? "bg-accent-400 text-primary-800" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-gray-800 truncate">{nombre}</p>
                    <BarraEstatus r={r} />
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className="text-sm font-semibold text-gray-800">{r.total}</p>
                    <p className="text-xs text-gray-500">
                      {r.tasa === null ? "sin decisiones" : `${r.tasa}% aprobación`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Seccion>
      )}

      {/* Últimas cotizaciones */}
      <Seccion
        icono={FileText}
        titulo="Últimas cotizaciones"
        accion={
          <Boton variante="fantasma" tamaño="sm" onClick={() => navigate("/cotizaciones")}>
            Ver todas
          </Boton>
        }
      >
        {cotizaciones.length === 0 ? (
          <div className="px-6 py-14 text-center flex flex-col items-center gap-3">
            <Inbox size={32} strokeWidth={1.5} className="text-gray-300" aria-hidden="true" />
            <p className="text-sm text-gray-500">Todavía no hay cotizaciones.</p>
            <Boton variante="secundario" tamaño="sm" icono={Plus} onClick={() => navigate("/nueva")}>
              Crear la primera
            </Boton>
          </div>
        ) : (
          <ul className="divide-y divide-linea">
            {cotizaciones.slice(0, 8).map((cot) => (
              <li key={cot.folio} className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {cot.cliente?.contacto || "Sin cliente"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    <span className="font-mono">{cot.folio}</span>
                    <span className="hidden sm:inline ml-3">{cot.fecha}</span>
                    {supervisor && <span className="hidden md:inline ml-3">{cot.sucursal?.tipo}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <EtiquetaEstatus estatus={cot.estatus} />
                  <Boton
                    variante="fantasma"
                    tamaño="sm"
                    icono={FileDown}
                    onClick={() => window.open(`/preview/${cot.folio}`, "_blank")}
                    aria-label={`Ver PDF de ${cot.folio}`}
                  >
                    <span className="hidden sm:inline">PDF</span>
                  </Boton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  );
}
