/** Tabla de Tamaños Máximos y Masa Mínima — ASTM D2216 */
export interface TamanoMasaEntry {
    tm: string       // "3", "2 1/2", "1/2", "N°4", etc.
    masa_g: number   // masa mínima en gramos
}

/** Payload completo para generar el Excel de Humedad */
export interface HumedadPayload {
    // Encabezado
    muestra: string
    numero_ot: string
    fecha_ensayo: string
    realizado_por: string

    // Condiciones
    condicion_masa_menor: "-" | "SI" | "NO"
    condicion_capas: "-" | "SI" | "NO"
    condicion_temperatura: "-" | "SI" | "NO"
    condicion_excluido: "-" | "SI" | "NO"
    descripcion_material_excluido?: string

    // Descripción muestra
    tipo_muestra?: string
    condicion_muestra?: string
    tamano_maximo_particula?: string

    // Método
    metodo_a: boolean
    metodo_b: boolean

    // Datos ensayo
    numero_ensayo?: number
    recipiente_numero?: string
    masa_recipiente_muestra_humeda?: number
    masa_recipiente_muestra_seca?: number
    masa_recipiente_muestra_seca_constante?: number
    masa_recipiente?: number

    // Fórmulas (override)
    masa_agua?: number
    masa_muestra_seca?: number
    contenido_humedad?: number

    // Método A tamaños
    metodo_a_tamano_1?: string
    metodo_a_tamano_2?: string
    metodo_a_tamano_3?: string
    metodo_a_masa_1?: string
    metodo_a_masa_2?: string
    metodo_a_masa_3?: string
    metodo_a_legibilidad_1?: string
    metodo_a_legibilidad_2?: string
    metodo_a_legibilidad_3?: string

    // Método B tamaños
    metodo_b_tamano_1?: string
    metodo_b_tamano_2?: string
    metodo_b_tamano_3?: string
    metodo_b_masa_1?: string
    metodo_b_masa_2?: string
    metodo_b_masa_3?: string
    metodo_b_legibilidad_1?: string
    metodo_b_legibilidad_2?: string
    metodo_b_legibilidad_3?: string

    // Equipo
    equipo_balanza_01?: string
    equipo_balanza_001?: string
    equipo_horno?: string

    // Observaciones
    observaciones?: string

    // Footer
    revisado_por?: string
    revisado_fecha?: string
    aprobado_por?: string
    aprobado_fecha?: string
}

export interface HumedadEnsayoSummary {
    id: number
    numero_ensayo: string
    numero_ot: string
    cliente?: string | null
    muestra?: string | null
    fecha_documento?: string | null
    estado: string
    contenido_humedad?: number | null
    bucket?: string | null
    object_key?: string | null
    fecha_creacion?: string | null
    fecha_actualizacion?: string | null
}

export interface HumedadEnsayoDetail extends HumedadEnsayoSummary {
    payload?: HumedadPayload | null
}

export interface HumedadSaveResponse {
    id: number
    numero_ensayo: string
    numero_ot: string
    estado: string
    contenido_humedad?: number | null
    bucket?: string | null
    object_key?: string | null
    fecha_creacion?: string | null
    fecha_actualizacion?: string | null
}
