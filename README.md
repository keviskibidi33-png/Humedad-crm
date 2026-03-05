# Humedad CRM Frontend

Microfrontend del modulo **Contenido de Humedad ASTM D2216-19** para Geofal.

- Dominio productivo: `https://humedad.geofal.com.pe`
- Backend API: `https://api.geofal.com.pe` (rutas `/api/humedad`)
- Integracion shell: `crm-geofal` via iframe modal (`HumedadModule`)

## Objetivo del modulo

- Registrar/editar ensayos de contenido de humedad.
- Guardar estado en BD (`EN PROCESO`/`COMPLETO`).
- Exportar Excel con plantilla oficial.
- Cerrar modal del CRM automaticamente al finalizar guardado.

## Stack tecnico

- Vite + React + TypeScript
- Tailwind CSS
- Axios
- React Hot Toast / Sonner

## Arquitectura funcional

### 1) Control de acceso (`src/App.tsx`)

- Lee `token` desde URL (`?token=...`) y lo persiste en `localStorage`.
- Si no hay token y no esta embebido, bloquea acceso y ofrece ir al login del CRM.
- Renderiza formulario por ruta:
  - default: `HumedadForm`
  - si pathname contiene `/cbr`: `CBRForm` (compatibilidad de interfaz en este repo)

### 2) Guard de sesion (`src/components/SessionGuard.tsx`)

- Escucha evento `session-expired` cuando el backend responde `401`.
- Solicita renovacion al padre con `TOKEN_REFRESH_REQUEST` cada 60 min.
- Recibe `TOKEN_REFRESH` y actualiza token local.

### 3) Capa API (`src/services/api.ts`)

- Inyecta `Authorization: Bearer <token>` por interceptor.
- Soporta operaciones:
  - listar: `GET /api/humedad`
  - detalle: `GET /api/humedad/{id}`
  - guardar/exportar: `POST /api/humedad/excel`
- Flujo guardar vs descargar:
  - `download=false` -> respuesta JSON con metadata
  - `download=true` -> blob Excel + headers (`X-Humedad-Id`, `Content-Disposition`)
- Soporta edicion con query `ensayo_id`.

### 4) Formulario (`src/pages/HumedadForm.tsx`)

- Lee `ensayo_id` de query string para modo edicion.
- Al completar operacion envía:
  - `window.parent.postMessage({ type: 'CLOSE_MODAL' }, '*')`

## Contrato iframe <-> CRM

### Query params de entrada

- `token`: JWT inicial.
- `ensayo_id`: id opcional para editar.

### Eventos `postMessage`

- Hijo -> Padre:
  - `TOKEN_REFRESH_REQUEST`
  - `CLOSE_MODAL`
- Padre -> Hijo:
  - `TOKEN_REFRESH` (payload: `{ token }`)

## Variables de entorno

Ejemplo base en `.env.example`.

Minimas para produccion:

- `VITE_API_URL=https://api.geofal.com.pe`
- `VITE_CRM_LOGIN_URL=https://crm.geofal.com.pe/login`

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy en Coolify

1. Crear servicio desde este repositorio (`humedad-crm`).
2. Build type: `Dockerfile`.
3. Variables:
   - `VITE_API_URL=https://api.geofal.com.pe`
   - `VITE_CRM_LOGIN_URL=https://crm.geofal.com.pe/login`
4. Exponer puerto `80`.
5. Dominio:
   - `humedad.geofal.com.pe`

## Replicar un nuevo modulo iframe (checklist)

1. Implementar `AccessGate` + `SessionGuard`.
2. Consumir backend con `Authorization` por interceptor.
3. Estandarizar contrato de mensajeria:
   - `TOKEN_REFRESH_REQUEST`, `TOKEN_REFRESH`, `CLOSE_MODAL`.
4. Soportar `ensayo_id` para edicion.
5. Mantener respuesta dual guardar/descargar en backend.
