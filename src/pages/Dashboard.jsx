import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerCotizaciones } from "../services/cotizaciones";
import { supabase } from "../services/supabase";
import { useAuth } from "../hooks/useAuth";
import { diasParaVencer, fechaDeCotizacion } from "../utils/calculos";
import { SUCURSALES } from "../utils/constantes";
import { esSupervisor } from "../utils/permisos";

const badgeEstatus = (e) => {
  if (e === "Aprobada")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (e === "Rechazada") return "bg-red-50 text-red-600 border border-red-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
};

const MESES_LABEL = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const PERIODOS = [
  { key: "dia", label: "Hoy" },
  { key: "mes", label: "Este mes" },
  { key: "año", label: "Este año" },
  { key: "todo", label: "Todo" },
];

const ICONO_SUCURSAL = { matriz: "🏙️", guaymas: "⚓", obregon: "🌵" };

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
    tasa: decididas ? Math.round((aprobadas / decididas) * 100) : null,
  };
}

const tarjeta = "bg-white rounded-2xl border border-gray-100 overflow-hidden";
const sombra = { boxShadow: "0 1px 3px rgba(27,58,107,0.06)" };
const encabezado = { background: "linear-gradient(135deg, #F8FAFF, #EEF2FF)" };

const Seccion = ({ icono, titulo, accion, children }) => (
  <div className={tarjeta} style={sombra}>
    <div
      className="px-4 lg:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3"
      style={encabezado}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icono}</span>
        <h3 className="text-sm font-bold text-primary-600">{titulo}</h3>
      </div>
      {accion}
    </div>
    {children}
  </div>
);

const StatCard = ({ icon, label, value, detalle, color, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`rounded-2xl p-4 lg:p-5 flex items-center gap-3 lg:gap-4 border bg-white text-left transition-all duration-200 ${
      onClick ? "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95" : "cursor-default"
    }`}
    style={{ borderColor: "rgba(27,58,107,0.08)", ...sombra }}
  >
    <div
      className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{ background: color }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-2xl lg:text-3xl font-bold mt-0.5" style={{ color: "#1B3A6B" }}>
        {value}
      </p>
      {detalle && <p className="text-xs text-gray-400 truncate">{detalle}</p>}
    </div>
  </button>
);

// Barra horizontal con aprobadas / rechazadas / en revisión
const BarraEstatus = ({ r }) =>
  r.total === 0 ? (
    <div className="h-2 rounded-full bg-gray-100" />
  ) : (
    <div className="h-2 rounded-full bg-gray-100 flex overflow-hidden">
      <div className="bg-emerald-500" style={{ width: `${(r.aprobadas / r.total) * 100}%` }} />
      <div className="bg-red-400" style={{ width: `${(r.rechazadas / r.total) * 100}%` }} />
      <div className="bg-amber-300" style={{ width: `${(r.revision / r.total) * 100}%` }} />
    </div>
  );

export default function Dashboard() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [vendedores, setVendedores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const { perfil } = useAuth();
  const navigate = useNavigate();
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

  const hoy = useMemo(() => new Date(), []);

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

  // Cotizaciones en revisión que ya vencieron o vencen en los próximos 7 días
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

  const etiquetaPeriodo = PERIODOS.find((p) => p.key === periodo).label.toLowerCase();

  if (cargando)
    return (
      <div className="flex justify-center items-center py-20 gap-3 text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
        Cargando dashboard...
      </div>
    );

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      {/* Saludo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight" style={{ color: "#1B3A6B" }}>
            Hola, {perfil?.nombre?.split(" ")[0] || "Usuario"} 👋
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {supervisor
              ? "👁️ Vista global — todas las sucursales"
              : "Aquí está el resumen de tu actividad"}
            {" · "}
            {hoy.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <button
          onClick={() => navigate("/nueva")}
          className="text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 w-full sm:w-auto"
          style={{
            background: "linear-gradient(135deg, #1B3A6B, #0F2347)",
            boxShadow: "0 4px 16px rgba(27,58,107,0.3)",
          }}
        >
          ＋ Nueva cotización
        </button>
      </div>

      {/* Selector período: aplica a tarjetas, sucursales y vendedores */}
      <div
        className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 w-full sm:w-fit"
        style={sombra}
      >
        {PERIODOS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriodo(key)}
            className="flex-1 sm:flex-none text-xs font-semibold px-3 lg:px-5 py-2 rounded-xl transition-all duration-200"
            style={
              periodo === key
                ? {
                    background: "linear-gradient(135deg, #1B3A6B, #0F2347)",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(27,58,107,0.3)",
                  }
                : { color: "#6B7280" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tarjetas del período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          icon="📋"
          label="Cotizaciones"
          value={resumen.total}
          detalle={etiquetaPeriodo}
          color="rgba(27,58,107,0.08)"
          onClick={() => navigate("/cotizaciones")}
        />
        <StatCard
          icon="✅"
          label="Aprobadas"
          value={resumen.aprobadas}
          detalle={resumen.tasa === null ? "sin decisiones aún" : `${resumen.tasa}% de las decididas`}
          color="rgba(16,185,129,0.12)"
        />
        <StatCard
          icon="🔍"
          label="En revisión"
          value={resumen.revision}
          detalle={vencidas ? `${vencidas} vencida${vencidas > 1 ? "s" : ""}` : "ninguna vencida"}
          color="rgba(245,158,11,0.15)"
        />
        <StatCard
          icon="❌"
          label="Rechazadas"
          value={resumen.rechazadas}
          color="rgba(239,68,68,0.1)"
        />
      </div>

      {/* Requieren atención */}
      {pendientes.length > 0 && (
        <Seccion
          icono="⏰"
          titulo={`Requieren atención (${pendientes.length})`}
          accion={<span className="text-xs text-gray-400 hidden sm:inline">En revisión, vencidas o por vencer en 7 días</span>}
        >
          <div className="divide-y divide-gray-50">
            {pendientes.slice(0, 6).map(({ cot, dias }) => (
              <div key={cot.folio} className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {cot.cliente?.contacto || cot.cliente?.atencion || "—"}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{cot.folio}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      dias <= 0
                        ? "bg-red-50 text-red-600 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {dias <= 0 ? "Vencida" : `Vence en ${dias}d`}
                  </span>
                  <button
                    onClick={() => navigate(`/cotizaciones/${cot.folio}/editar`)}
                    className="text-xs font-semibold text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 border border-primary-100 transition-colors"
                  >
                    {dias <= 0 ? "Renovar" : "Abrir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pendientes.length > 6 && (
            <button
              onClick={() => navigate("/cotizaciones")}
              className="w-full text-xs font-semibold text-primary-600 py-3 border-t border-gray-100 hover:bg-primary-50/40"
            >
              Ver las {pendientes.length - 6} restantes →
            </button>
          )}
        </Seccion>
      )}

      <div className={`grid gap-5 lg:gap-6 ${supervisor ? "lg:grid-cols-2" : ""}`}>
        {/* Gráfica — últimos 6 meses */}
        <Seccion
          icono="📈"
          titulo="Últimos 6 meses"
          accion={
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#1B3A6B" }}></span>
                Total
              </span>
              <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                Aprobadas
              </span>
            </div>
          }
        >
          <div className="px-4 lg:px-6 pt-8 pb-5">
            <div className="flex items-end gap-3 lg:gap-4 h-36">
              {datosMeses.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                  <div className="w-full flex items-end gap-1 flex-1">
                    {[
                      { valor: d.total, color: "linear-gradient(180deg, #1B3A6B, #0F2347)" },
                      { valor: d.aprobadas, color: "linear-gradient(180deg, #10B981, #059669)" },
                    ].map((barra, j) => (
                      <div key={j} className="flex-1 h-full flex flex-col justify-end items-center">
                        {barra.valor > 0 && (
                          <span className="text-[10px] font-bold text-gray-500 mb-0.5">{barra.valor}</span>
                        )}
                        <div
                          className="w-full rounded-t-md transition-all duration-500"
                          style={{
                            height: `${(barra.valor / maxValor) * 100}%`,
                            minHeight: barra.valor > 0 ? "4px" : "0",
                            background: barra.color,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-gray-400">{d.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Seccion>

        {/* Por sucursal */}
        {supervisor && (
          <Seccion icono="🏢" titulo={`Por sucursal · ${etiquetaPeriodo}`}>
            <div className="divide-y divide-gray-50">
              {porSucursal.map(({ id, tipo, r }) => (
                <div key={id} className="px-4 lg:px-6 py-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-700">
                      {ICONO_SUCURSAL[id]} {tipo}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-bold text-gray-700">{r.total}</span> cotizaciones
                      {r.tasa !== null && <> · <span className="font-bold text-emerald-600">{r.tasa}%</span> aprobación</>}
                    </p>
                  </div>
                  <BarraEstatus r={r} />
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>✅ {r.aprobadas}</span>
                    <span>❌ {r.rechazadas}</span>
                    <span>🔍 {r.revision}</span>
                  </div>
                </div>
              ))}
            </div>
          </Seccion>
        )}
      </div>

      {/* Por vendedor */}
      {supervisor && (
        <Seccion icono="🧑‍💼" titulo={`Por vendedor · ${etiquetaPeriodo}`}>
          {porVendedor.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-400">Sin cotizaciones en este período</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {porVendedor.map(({ id, nombre, r }, i) => (
                <div key={id} className="px-4 lg:px-6 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={i === 0 ? { background: "#FFD700", color: "#1B3A6B" } : { background: "#F3F4F6", color: "#6B7280" }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-gray-800 truncate">{nombre}</p>
                    <BarraEstatus r={r} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">{r.total}</p>
                    <p className="text-xs text-gray-400">
                      {r.tasa === null ? "—" : `${r.tasa}% aprob.`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Seccion>
      )}

      {/* Últimas cotizaciones */}
      <Seccion
        icono="📋"
        titulo="Últimas cotizaciones"
        accion={
          <button
            onClick={() => navigate("/cotizaciones")}
            className="text-xs font-semibold text-primary-600 hover:text-primary-800 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-all duration-200 border border-primary-100"
          >
            Ver todas →
          </button>
        }
      >
        {cotizaciones.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-medium text-gray-500">No hay cotizaciones aún</p>
            <button
              onClick={() => navigate("/nueva")}
              className="mt-4 text-xs font-semibold text-primary-600 hover:underline"
            >
              Crear primera cotización →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cotizaciones.slice(0, 8).map((cot) => (
              <div key={cot.folio} className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {cot.cliente?.contacto || "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    <span className="font-mono">{cot.folio}</span>
                    <span className="hidden sm:inline"> · {cot.fecha}</span>
                    {supervisor && <span className="hidden md:inline"> · {cot.sucursal?.tipo}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${badgeEstatus(cot.estatus)}`}>
                    {cot.estatus || "En revisión"}
                  </span>
                  <button
                    onClick={() => window.open(`/preview/${cot.folio}`, "_blank")}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-800 px-3 py-1.5 rounded-lg hover:bg-primary-50 border border-primary-100 transition-colors"
                  >
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Seccion>
    </div>
  );
}
