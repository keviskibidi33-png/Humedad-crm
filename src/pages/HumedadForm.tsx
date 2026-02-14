import { useState, useMemo, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Download, Loader2, Droplets, FlaskConical } from 'lucide-react'
import TMCalculator from '@/components/TMCalculator'
import { generateHumedadExcel } from '@/services/api'
import type { HumedadPayload } from '@/types'

// ── Initial form state ───────────────────────────────────────────────────────
const INITIAL_STATE: HumedadPayload = {
    muestra: '',
    numero_ot: '',
    fecha_ensayo: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    realizado_por: '',
    condicion_masa_menor: '-',
    condicion_capas: '-',
    condicion_temperatura: '-',
    condicion_excluido: '-',
    tipo_muestra: '',
    condicion_muestra: '',
    tamano_maximo_particula: '',
    metodo_a: false,
    metodo_b: false,
    numero_ensayo: 1,
    recipiente_numero: '',
    masa_recipiente_muestra_humeda: undefined,
    masa_recipiente_muestra_seca: undefined,
    masa_recipiente_muestra_seca_constante: undefined,
    masa_recipiente: undefined,
    equipo_balanza_01: '',
    equipo_balanza_001: '',
    equipo_horno: '',
    observaciones: '',
    revisado_por: '',
    revisado_fecha: '',
    aprobado_por: '',
    aprobado_fecha: '',
}

type CondicionKey = 'condicion_masa_menor' | 'condicion_capas' | 'condicion_temperatura' | 'condicion_excluido'

export default function HumedadForm() {
    const [form, setForm] = useState<HumedadPayload>({ ...INITIAL_STATE })
    const [loading, setLoading] = useState(false)

    // ── Helpers ───────────────────────────────────────────────────────
    const set = useCallback(<K extends keyof HumedadPayload>(key: K, value: HumedadPayload[K]) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }, [])

    const setNum = useCallback((key: keyof HumedadPayload, raw: string) => {
        const val = raw === '' ? undefined : parseFloat(raw)
        setForm(prev => ({ ...prev, [key]: val }))
    }, [])

    // ── Computed formulas ─────────────────────────────────────────────
    const masaAgua = useMemo(() => {
        const h = form.masa_recipiente_muestra_humeda
        const sc = form.masa_recipiente_muestra_seca_constante
        if (h != null && sc != null) return Math.round((h - sc) * 100) / 100
        return null
    }, [form.masa_recipiente_muestra_humeda, form.masa_recipiente_muestra_seca_constante])

    const masaMuestraSeca = useMemo(() => {
        const sc = form.masa_recipiente_muestra_seca_constante
        const r = form.masa_recipiente
        if (sc != null && r != null) return Math.round((sc - r) * 100) / 100
        return null
    }, [form.masa_recipiente_muestra_seca_constante, form.masa_recipiente])

    const contenidoHumedad = useMemo(() => {
        if (masaAgua != null && masaMuestraSeca != null && masaMuestraSeca !== 0) {
            return Math.round((masaAgua / masaMuestraSeca) * 10000) / 100
        }
        return null
    }, [masaAgua, masaMuestraSeca])

    // masa muestra neta (húmeda - recipiente) para la calculadora TM
    const masaMuestraNeta = useMemo(() => {
        const h = form.masa_recipiente_muestra_humeda
        const r = form.masa_recipiente
        if (h != null && r != null) return Math.round((h - r) * 100) / 100
        return undefined
    }, [form.masa_recipiente_muestra_humeda, form.masa_recipiente])

    // ── TM callback ───────────────────────────────────────────────────
    const handleTMSelect = useCallback((tm: string) => {
        set('tamano_maximo_particula', tm)
    }, [set])

    // ── Submit ────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.muestra || !form.numero_ot || !form.realizado_por) {
            toast.error('Complete los campos obligatorios: Muestra, N° OT, Realizado por')
            return
        }

        setLoading(true)
        try {
            const payload: HumedadPayload = { ...form }
            // Inject calculated values if user didn't override
            if (masaAgua !== null) payload.masa_agua = masaAgua
            if (masaMuestraSeca !== null) payload.masa_muestra_seca = masaMuestraSeca
            if (contenidoHumedad !== null) payload.contenido_humedad = contenidoHumedad

            const blob = await generateHumedadExcel(payload)

            // Download
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Humedad_${form.numero_ot}_${new Date().toISOString().slice(0, 10)}.xlsx`
            a.click()
            URL.revokeObjectURL(url)

            toast.success('Excel generado correctamente')

            // Notify parent iframe shell
            window.parent.postMessage({ type: 'CLOSE_MODAL' }, '*')
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error desconocido'
            toast.error(`Error generando Excel: ${msg}`)
        } finally {
            setLoading(false)
        }
    }

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            {/* Title */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Droplets className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-foreground">
                        Contenido de Humedad — ASTM D2216-19
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Generador de informe de laboratorio
                    </p>
                </div>
            </div>

            {/* ═══ SPLIT LAYOUT: Form | Calculator ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT: Formulario (2/3) ─────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Encabezado */}
                    <Section title="Encabezado" icon={<FlaskConical className="h-4 w-4" />}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Input label="Muestra *" value={form.muestra}
                                   onChange={v => set('muestra', v)} />
                            <Input label="N° OT *" value={form.numero_ot}
                                   onChange={v => set('numero_ot', v)} />
                            <Input label="Fecha Ensayo" value={form.fecha_ensayo}
                                   onChange={v => set('fecha_ensayo', v)} />
                            <Input label="Realizado por *" value={form.realizado_por}
                                   onChange={v => set('realizado_por', v)} />
                        </div>
                    </Section>

                    {/* Condiciones del ensayo */}
                    <Section title="Condiciones del Ensayo">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {([
                                ['condicion_masa_menor', '¿Masa menor?'],
                                ['condicion_capas', '¿Más de un tipo (capas)?'],
                                ['condicion_temperatura', '¿Temp. ≠ 110±5°C?'],
                                ['condicion_excluido', '¿Material excluido?'],
                            ] as [CondicionKey, string][]).map(([key, label]) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {label}
                                    </label>
                                    <select
                                        value={form[key]}
                                        onChange={e => set(key, e.target.value as "-" | "SI" | "NO")}
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm
                                                   focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="-">-</option>
                                        <option value="SI">SI</option>
                                        <option value="NO">NO</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Descripción de la muestra + Método */}
                    <Section title="Descripción de la Muestra">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input label="Tipo de muestra" value={form.tipo_muestra || ''}
                                   onChange={v => set('tipo_muestra', v)} />
                            <Input label="Condición de la muestra" value={form.condicion_muestra || ''}
                                   onChange={v => set('condicion_muestra', v)} />
                            <Input label="Tamaño máx. partícula (in)" value={form.tamano_maximo_particula || ''}
                                   onChange={v => set('tamano_maximo_particula', v)} />
                        </div>
                        <div className="flex items-center gap-6 mt-3">
                            <Checkbox label="Método A" checked={form.metodo_a}
                                      onChange={v => set('metodo_a', v)} />
                            <Checkbox label="Método B" checked={form.metodo_b}
                                      onChange={v => set('metodo_b', v)} />
                        </div>
                    </Section>

                    {/* Datos de ensayo */}
                    <Section title="Datos del Ensayo">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <NumInput label="N° Ensayo" value={form.numero_ensayo}
                                      onChange={v => setNum('numero_ensayo', v)} />
                            <Input label="Recipiente N°" value={form.recipiente_numero || ''}
                                   onChange={v => set('recipiente_numero', v)} />
                            <NumInput label="Masa recip. + muestra húmeda (g)"
                                      value={form.masa_recipiente_muestra_humeda}
                                      onChange={v => setNum('masa_recipiente_muestra_humeda', v)} />
                            <NumInput label="Masa recip. + muestra seca horno (g)"
                                      value={form.masa_recipiente_muestra_seca}
                                      onChange={v => setNum('masa_recipiente_muestra_seca', v)} />
                            <NumInput label="Masa recip. + muestra seca constante (g)"
                                      value={form.masa_recipiente_muestra_seca_constante}
                                      onChange={v => setNum('masa_recipiente_muestra_seca_constante', v)} />
                            <NumInput label="Masa del recipiente (g)"
                                      value={form.masa_recipiente}
                                      onChange={v => setNum('masa_recipiente', v)} />
                        </div>

                        {/* Computed results */}
                        <div className="grid grid-cols-3 gap-3 mt-3 p-3 bg-muted/30 rounded-lg border border-dashed border-border">
                            <ComputedField label="Masa del agua (g)" value={masaAgua} />
                            <ComputedField label="Masa muestra seca (g)" value={masaMuestraSeca} />
                            <ComputedField label="Contenido de humedad (%)"
                                           value={contenidoHumedad}
                                           highlight />
                        </div>
                    </Section>

                    {/* Equipo */}
                    <Section title="Equipo Utilizado">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input label="Balanza 0.1 g" value={form.equipo_balanza_01 || ''}
                                   onChange={v => set('equipo_balanza_01', v)} />
                            <Input label="Balanza 0.01 g" value={form.equipo_balanza_001 || ''}
                                   onChange={v => set('equipo_balanza_001', v)} />
                            <Input label="Horno 110°C" value={form.equipo_horno || ''}
                                   onChange={v => set('equipo_horno', v)} />
                        </div>
                    </Section>

                    {/* Observaciones */}
                    <Section title="Observaciones">
                        <textarea
                            value={form.observaciones || ''}
                            onChange={e => set('observaciones', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm
                                       resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Observaciones del ensayo..."
                        />
                    </Section>

                    {/* Footer - Revisado / Aprobado */}
                    <Section title="Revisado / Aprobado">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Input label="Revisado por" value={form.revisado_por || ''}
                                   onChange={v => set('revisado_por', v)} />
                            <Input label="Fecha revisión" value={form.revisado_fecha || ''}
                                   onChange={v => set('revisado_fecha', v)}
                                   placeholder="DD/MM/YYYY" />
                            <Input label="Aprobado por" value={form.aprobado_por || ''}
                                   onChange={v => set('aprobado_por', v)} />
                            <Input label="Fecha aprobación" value={form.aprobado_fecha || ''}
                                   onChange={v => set('aprobado_fecha', v)}
                                   placeholder="DD/MM/YYYY" />
                        </div>
                    </Section>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium
                                   hover:bg-primary/90 transition-colors disabled:opacity-50
                                   flex items-center justify-center gap-2"
                    >
                        {loading
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
                            : <><Download className="h-4 w-4" /> Generar y Descargar Excel</>
                        }
                    </button>
                </div>

                {/* ── RIGHT: Calculator (1/3) ────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4">
                        <TMCalculator
                            onSelect={handleTMSelect}
                            masaMuestra={masaMuestraNeta}
                        />
                        {/* Quick info card */}
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border text-xs text-muted-foreground space-y-1">
                            <p className="font-semibold text-foreground text-sm mb-2">Resumen en vivo</p>
                            <p><strong>Muestra:</strong> {form.muestra || '—'}</p>
                            <p><strong>OT:</strong> {form.numero_ot || '—'}</p>
                            <p><strong>TM:</strong> {form.tamano_maximo_particula || '—'}</p>
                            <p><strong>Masa muestra neta:</strong> {masaMuestraNeta != null ? `${masaMuestraNeta} g` : '—'}</p>
                            <p><strong>Humedad:</strong>{' '}
                                {contenidoHumedad != null
                                    ? <span className="text-primary font-bold">{contenidoHumedad}%</span>
                                    : '—'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Reusable sub-components ─────────────────────────────────────────────────

function Section({ title, icon, children }: {
    title: string
    icon?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="px-4 py-2.5 border-b border-border bg-muted/50 rounded-t-lg flex items-center gap-2">
                {icon}
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            </div>
            <div className="p-4">{children}</div>
        </div>
    )
}

function Input({ label, value, onChange, placeholder }: {
    label: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                data-lpignore="true"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-ring"
            />
        </div>
    )
}

function NumInput({ label, value, onChange }: {
    label: string
    value: number | undefined | null
    onChange: (raw: string) => void
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
            <input
                type="number"
                step="any"
                value={value ?? ''}
                onChange={e => onChange(e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm
                           focus:outline-none focus:ring-2 focus:ring-ring"
            />
        </div>
    )
}

function Checkbox({ label, checked, onChange }: {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">{label}</span>
        </label>
    )
}

function ComputedField({ label, value, highlight }: {
    label: string
    value: number | null
    highlight?: boolean
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
            <div className={`h-9 px-3 rounded-md border flex items-center text-sm font-medium
                ${highlight && value != null
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-input bg-muted/30 text-foreground'
                }`}>
                {value != null ? value : '—'}
            </div>
        </div>
    )
}
