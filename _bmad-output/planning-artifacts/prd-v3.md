---
version: 3.0
status: ready-for-review
createdAt: 2026-02-17
updatedAt: 2026-03-09
author: Setec
inputDocuments:
  - prd.md
  - prd-v2.md
  - architecture.md
  - ux-design-specification.md
decisionsResolved:
  - spec_limits_flow: "Smart parsing from message, form as fallback"
  - minimum_sample: "Warning at <20, no hard limit"
  - distributions: "Weibull, Lognormal, Gamma, Exponential, Logistic, Extreme Value"
  - sigma_differentiation: "Within (MR̄/d2) for Cp/Cpk, Overall (sample std dev) for Pp/Ppk"
  - scope_change_v3: "Stability analysis removed from scope"
---

# PRD v3 — Setec AI Hub

**Autor:** Setec
**Fecha:** 2026-03-09
**Alcance:** Documentar el estado actual + nueva funcionalidad de Análisis de Capacidad de Proceso

---

## Resumen Ejecutivo

Setec AI Hub es una plataforma de análisis estadístico potenciada por IA para practicantes de Lean Six Sigma. Actualmente en producción con análisis MSA (Measurement System Analysis), este PRD-v3 documenta:

1. **Parte 1:** El sistema tal como está construido hoy
2. **Parte 2:** La nueva funcionalidad — Análisis de Capacidad de Proceso (Normalidad y Capacidad)

---

# PARTE 1: LO QUE ESTÁ CONSTRUIDO

## Visión General del Sistema

### Qué Es
Una aplicación web estilo ChatGPT donde usuarios de capacitación Green Belt pueden:
- Subir archivos Excel con datos de medición
- Chatear con un agente de IA especializado en estadística
- Obtener análisis estadísticos calculados con Python
- Recibir interpretaciones pedagógicas de los resultados
- Descargar gráficos interactivos

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| UI Components | shadcn/ui + Tailwind CSS 4 |
| Charts | Recharts |
| Backend API | Next.js Route Handlers (Node.js) |
| Cálculo Estadístico | Python Serverless (Vercel) |
| Base de Datos | Supabase PostgreSQL |
| Almacenamiento | Supabase Storage |
| Autenticación | Supabase Auth |
| LLM | OpenAI (gpt-4o-mini para filtro, gpt-4o para principal) |
| Hosting | Vercel |

### Arquitectura de Agentes

```
Usuario envía mensaje
        ↓
┌─────────────────────────┐
│  AGENTE 1 (Filtro)      │
│  • gpt-4o-mini          │
│  • Structured output    │
│  • Permite/Rechaza      │
└───────────┬─────────────┘
            ↓
      ¿allowed?
     ┌───┴───┐
    NO       SÍ
     ↓        ↓
 Mensaje  ┌─────────────────────────┐
 rechazo  │  AGENTE 2 (Principal)   │
          │  • gpt-4o               │
          │  • Tools disponibles    │
          │  • Streaming SSE        │
          └───────────┬─────────────┘
                      ↓
            ¿Archivo + análisis?
           ┌───────┴───────┐
          NO               SÍ
           ↓                ↓
      Conversa      POST /api/analyze
                    (Python serverless)
                           ↓
                    { results, chartData, instructions }
                           ↓
                    Frontend renderiza
                    charts + texto
```

### Funcionalidad Actual: Análisis MSA

**Propósito:** Evaluar la variación del sistema de medición (Gauge R&R)

**Entrada:**
- Archivo Excel con columnas: Pieza/Parte, Operador, Medición 1, Medición 2, ...
- Mínimo: 2 piezas, 2 operadores, 2 mediciones

**Salida:**
- %GRR (variación total del sistema de medición)
- Desglose: Repetibilidad, Reproducibilidad, Interacción, Parte-a-Parte
- NDC (Número de Categorías Distintas)
- 7 gráficos interactivos (Recharts)
- Interpretación en lenguaje técnico y "terrenal"
- Recomendaciones de mejora

**Archivos clave:**
- `/api/analyze.py` — Endpoint principal
- `/api/utils/msa_calculator.py` — Cálculos MSA (1,710 líneas)
- `/api/utils/msa_validator.py` — Validación de archivo (427 líneas)
- `/components/charts/` — 7 componentes de gráficos Recharts
- `/public/templates/plantilla-msa.xlsx` — Plantilla descargable

### Flujo de Datos (MSA)

```
1. Usuario va a /plantillas
2. Descarga plantilla-msa.xlsx
3. Llena con sus datos
4. Regresa al chat, sube archivo
5. Agente detecta intención de análisis MSA
6. Agente invoca tool: analyze(analysis_type='msa', file_id)
7. Python descarga archivo de Supabase Storage
8. Python valida estructura → Si error, retorna mensaje específico
9. Python calcula métricas ANOVA
10. Python genera chartData + instructions
11. Agente presenta resultados siguiendo instructions
12. Frontend renderiza gráficos con Recharts
13. Usuario puede hacer preguntas de seguimiento
```

### Esquema de Base de Datos (Actual)

```sql
-- Conversaciones
conversations (id, user_id, title, created_at, updated_at)

-- Mensajes
messages (id, conversation_id, role, content, metadata, created_at)

-- Archivos subidos
files (id, conversation_id, message_id, storage_path, original_name,
       mime_type, size_bytes, status, validation_errors, created_at)

-- Resultados de análisis
analysis_results (id, message_id, file_id, analysis_type, results,
                  chart_data, instructions, computed_at)
```

### Plantillas Section

- Página `/plantillas` lista plantillas disponibles
- Cada plantilla tiene: título, descripción, archivo descargable
- Actualmente solo 1 plantilla: MSA

---

# PARTE 2: LO QUE ESTAMOS AGREGANDO

## Nueva Funcionalidad: Análisis de Capacidad de Proceso

### Propósito

Evaluar si un proceso es **capaz** de cumplir con las especificaciones del cliente, combinando dos análisis:

1. **Normalidad** — ¿Los datos siguen una distribución normal?
2. **Capacidad** — ¿El proceso cumple con las especificaciones?

### Nombre del Análisis

- **Nombre interno (code):** `capacidad_proceso`
- **Nombre visible (UI):** "Análisis de Capacidad de Proceso"
- **Nombre corto:** "Capacidad de Proceso" o "CPK"

---

## User Journey: Carlos — Análisis de Capacidad

**Quién:** Carlos, Ingeniero de Procesos en una planta manufacturera. Tiene datos de mediciones de diámetro de piezas y necesita saber si su proceso cumple especificaciones.

**Escena Inicial:** Carlos tiene 50 mediciones en Excel y conoce los límites de especificación del cliente (LEI: 95mm, LES: 105mm).

**Desarrollo:**

1. Carlos abre Setec AI Hub, inicia sesión
2. Hace clic en "Nueva conversación"
3. El agente lo saluda
4. Carlos escribe: "Necesito hacer un análisis de capacidad de proceso"
5. El agente responde: _"Perfecto. Ve a la sección de Plantillas y descarga la plantilla de Capacidad de Proceso. Llénala con tus datos (una columna con los valores de la variable que quieres analizar) y súbela aquí. También necesitaré los límites de especificación (LEI y LES)."_
6. Carlos va a Plantillas, descarga `plantilla-capacidad-proceso.xlsx`
7. Pega sus 50 mediciones en la columna "Valores"
8. Regresa al chat, sube el archivo y escribe: "Aquí están mis datos, LEI=95 y LES=105"
9. El agente extrae los límites del mensaje y ejecuta el análisis directamente
10. El sistema procesa y retorna resultados completos

**Flujo alternativo (sin límites en mensaje):**

8b. Carlos sube el archivo y escribe solo: "Analiza esto"
9b. El agente detecta que faltan los límites y muestra formulario:

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Configurar Límites de Especificación                        │
│                                                                 │
│  Se detectó 1 variable numérica con 50 valores.                 │
│                                                                 │
│  LEI (Límite de Especificación Inferior): [________]            │
│                                                                 │
│  LES (Límite de Especificación Superior): [________]            │
│                                                                 │
│                              [ Iniciar Análisis ]               │
└─────────────────────────────────────────────────────────────────┘
```

10b. Carlos ingresa LEI=95, LES=105, hace clic en "Iniciar Análisis"
11b. El sistema procesa y retorna resultados completos

**Clímax:** Carlos ve:
- ⚠️ Los datos **no son normales** (p-value < 0.05)
- Sistema ajustó distribución Weibull
- Cpk = 0.89, Ppk = 0.85 → Proceso **NO CAPAZ**
- Recomendación: "El proceso tiene demasiada variación para cumplir especificaciones. Considere reducir la variabilidad o revisar los límites de especificación."

**Resolución:** Carlos entiende que necesita mejorar el proceso antes de que pueda cumplir consistentemente con las especificaciones del cliente.

---

## Requisitos Funcionales — Capacidad de Proceso

### Entrada de Datos

**FR-CP1:** Usuario puede descargar plantilla `plantilla-capacidad-proceso.xlsx` desde la sección Plantillas.

**FR-CP2:** La plantilla contiene una sola columna: "Valores" (numéricos).

**FR-CP3:** El agente intenta extraer LEI y LES del mensaje del usuario (ej: "analiza con LEI=95 y LES=105").

**FR-CP4:** Si el usuario NO proporcionó LEI/LES en el mensaje, el sistema muestra un formulario interactivo para solicitarlos.

**FR-CP5:** El formulario (cuando se muestra) valida que:
- Ambos campos (LEI y LES) estén completos
- LEI < LES
- Ambos sean valores numéricos

**FR-CP6:** Usuario puede cancelar el formulario y subir otro archivo.

### Validación de Archivo

**FR-CP7:** El sistema valida que el archivo tenga al menos una columna numérica.

**FR-CP8:** El sistema detecta y reporta:
- Celdas vacías (con ubicación específica)
- Valores no numéricos (con ubicación específica)

**FR-CP9:** Si el archivo tiene menos de 20 valores, el sistema muestra advertencia: *"Se recomienda un mínimo de 20 valores para obtener estimaciones confiables de capacidad."* pero continúa con el análisis.

**FR-CP10:** Mensajes de error en español con guía específica para corregir.

### Análisis Estadístico

**FR-CP11:** El sistema calcula estadísticos básicos:
- Media (promedio)
- Mediana
- Moda
- Desviación estándar
- Mínimo, Máximo, Rango

**FR-CP12:** El sistema realiza test de normalidad Anderson-Darling:
- Calcula estadístico A² ajustado
- Calcula p-value usando algoritmo compatible con Minitab
- Compara con α = 0.05
- Concluye: "Normal" o "No Normal"

**FR-CP13:** Si los datos NO son normales:
- Aplicar transformación Box-Cox o Johnson (preferencia Box-Cox)
- Re-testear normalidad
- Si sigue sin ser normal: ajustar mejor distribución alternativa

**FR-CP14:** El sistema calcula índices de capacidad diferenciando sigma Within y sigma Overall:

- **σ_within** = MR̄ / d2 (desviación estándar Within, corto plazo)
- **σ_overall** = desviación estándar muestral (Overall, largo plazo)

Índices con σ_within (Within / Corto plazo):
- **Cp** = (LES - LEI) / (6 × σ_within) — Capacidad potencial
- **Cpk** = min[(LES - μ) / (3 × σ_within), (μ - LEI) / (3 × σ_within)] — Capacidad real

Índices con σ_overall (Overall / Largo plazo):
- **Pp** = (LES - LEI) / (6 × σ_overall) — Performance potencial
- **Ppk** = min[(LES - μ) / (3 × σ_overall), (μ - LEI) / (3 × σ_overall)] — Performance real

**FR-CP15:** Si los datos no son normales y la transformación no funciona:
- Ajustar mejor distribución automáticamente (Weibull, Lognormal, Gamma, Exponential, Logistic, Extreme Value)
- Seleccionar la distribución con mejor ajuste
- Calcular probabilidad de no conformidad usando distribución ajustada
- Reportar PPM (partes por millón) fuera de especificación
- Reportar nombre de distribución ajustada y sus parámetros

**FR-CP16:** Clasificación de capacidad:
- Cpk ≥ 1.33 → **Capaz** (verde)
- 1.00 ≤ Cpk < 1.33 → **Marginalmente Capaz** (amarillo)
- Cpk < 1.00 → **No Capaz** (rojo)

### Visualizaciones

**FR-CP17:** El sistema genera 2 gráficos:

1. **Histograma** con:
   - Barras de frecuencia
   - Línea LEI (roja, vertical)
   - Línea LES (roja, vertical)
   - Línea Media (azul, vertical)
   - Curva de distribución ajustada superpuesta
   - Valores numéricos de LEI, LES, Media visibles

2. **Gráfica de Probabilidad Normal** con:
   - Puntos de datos vs. distribución teórica
   - Línea de ajuste
   - Bandas de confianza (95%)
   - p-value de Anderson-Darling visible

**FR-CP18:** Cada gráfico es:
- Interactivo (hover muestra valores)
- Exportable como imagen PNG
- Responsive (desktop-first)

### Resultados y Presentación

**FR-CP19:** El sistema retorna instrucciones en markdown para el agente con:

**Parte 1: Análisis Técnico**
- Tabla de estadísticos básicos
- Resultado de normalidad (A², p-value, conclusión)
- Si transformado: tipo de transformación y parámetros
- Desviaciones estándar: σ Within y σ Overall
- Tabla de índices de capacidad (Cp, Cpk, Pp, Ppk)
- Si distribución alternativa: nombre, parámetros, PPM calculado

**Parte 2: Conclusión Ejecutiva**
- Los datos SON/NO SON normales
- El proceso ES/NO ES capaz (con Cpk y clasificación)

**Parte 3: Conclusión "Terrenal"**
- Explicación en lenguaje simple de qué significa todo
- Recomendaciones específicas basadas en los resultados
- Nota: los resúmenes no deben mencionar estabilidad

**FR-CP20:** El agente puede responder preguntas de seguimiento sobre los resultados sin re-ejecutar el análisis.

---

## Requisitos No Funcionales — Capacidad de Proceso

**NFR-CP1:** Los cálculos de Anderson-Darling deben producir p-values comparables a Minitab (±0.01).

**NFR-CP2:** El análisis completo debe ejecutarse en menos de 30 segundos para archivos de hasta 1000 filas.

**NFR-CP3:** Todos los mensajes de error y resultados están en español.

**NFR-CP4:** Los datos crudos del archivo nunca se envían a OpenAI (solo resultados agregados).

---

## Cambios Técnicos Requeridos

### Nuevos Archivos

| Archivo | Propósito |
|---------|-----------|
| `/api/utils/capacidad_proceso_calculator.py` | Cálculos estadísticos |
| `/api/utils/capacidad_proceso_validator.py` | Validación de archivo |
| `/api/utils/sigma_estimation.py` | Estimación de σ Within (MR̄/d2) y σ Overall |
| `/public/templates/plantilla-capacidad-proceso.xlsx` | Plantilla descargable |
| `/components/charts/HistogramChart.tsx` | Histograma con LEI/LES |
| `/components/charts/NormalityPlot.tsx` | Gráfica de probabilidad normal |
| `/components/SpecLimitsForm.tsx` | Formulario LEI/LES interactivo |

### Modificaciones

| Archivo | Cambio |
|---------|--------|
| `/api/analyze.py` | Agregar routing para `analysis_type='capacidad_proceso'` |
| `/constants/analysis.ts` | Agregar `'capacidad_proceso'` a `ANALYSIS_TYPES` |
| `/types/analysis.ts` | Agregar `CapacidadProcesoResult` interface |
| `/app/(dashboard)/plantillas/page.tsx` | Agregar card para nueva plantilla |
| `/lib/openai/tools.ts` | Actualizar tool definition con nuevo analysis_type |
| `/app/api/chat/route.ts` | Manejar formulario de spec limits |

### Base de Datos

No se requieren cambios de esquema. La tabla `analysis_results` ya soporta diferentes `analysis_type` y almacena resultados en JSONB.

### Flujo de Límites de Especificación (Smart Parsing)

```
1. Usuario sube archivo + mensaje (ej: "analiza capacidad de proceso, LEI=95, LES=105")
2. Agente detecta intención de análisis de capacidad
3. Agente intenta extraer LEI/LES del mensaje del usuario
   │
   ├─ SI encontró LEI y LES en el mensaje:
   │   → Agente invoca tool: analyze(analysis_type='capacidad_proceso',
   │                                  file_id, spec_limits={lei:95, les:105})
   │   → Python ejecuta análisis completo
   │   → Agente presenta resultados
   │
   └─ NO encontró LEI/LES:
       → Agente responde: "Necesito los límites de especificación para continuar."
       → Frontend renderiza SpecLimitsForm
       → Usuario ingresa LEI=95, LES=105, submit
       → Frontend envía valores al chat como mensaje estructurado
       → Agente invoca tool con spec_limits
       → Python ejecuta análisis completo
       → Agente presenta resultados
```

**Ejemplos de mensajes que el agente debe parsear:**
- "Analiza con LEI 95 y LES 105" → lei=95, les=105
- "LEI=95, LES=105, analiza capacidad" → lei=95, les=105
- "Límite inferior 95, superior 105" → lei=95, les=105
- "Hazme un análisis de capacidad" → (no encontró límites, mostrar form)

---

## Estructura de chartData (Capacidad de Proceso)

```typescript
interface CapacidadProcesoChartData {
  charts: [
    {
      type: 'histogram',
      data: {
        bins: { start: number, end: number, count: number }[],
        lei: number,
        les: number,
        mean: number,
        distributionCurve?: { x: number, y: number }[]
      }
    },
    {
      type: 'normalityPlot',
      data: {
        points: { theoretical: number, actual: number }[],
        fitLine: { slope: number, intercept: number },
        confidenceBands: { upper: number[], lower: number[] },
        andersonDarling: number,
        pValue: number
      }
    }
  ]
}
```

---

## Plantilla: plantilla-capacidad-proceso.xlsx

**Estructura:**

| Valores |
|---------|
| 97.52 |
| 111.20 |
| 83.97 |
| 103.58 |
| ... |

**Notas en la plantilla:**
- Fila 1: Header "Valores"
- Filas 2+: Datos numéricos
- Sin límites de especificación en el archivo (se piden vía formulario)

---

## Criterios de Aceptación

### Análisis Completo
- [ ] Usuario puede descargar plantilla desde /plantillas
- [ ] Usuario puede subir archivo y ver formulario de LEI/LES
- [ ] Formulario valida inputs correctamente
- [ ] Análisis calcula todos los estadísticos correctamente
- [ ] Test de normalidad produce p-values comparables a Minitab
- [ ] Índices Cp/Cpk usan σ Within (MR̄/d2), Pp/Ppk usan σ Overall (desv. estándar muestral)
- [ ] Los 2 gráficos se renderizan correctamente
- [ ] Gráficos son interactivos y exportables
- [ ] Interpretación en español es clara y pedagógica
- [ ] Usuario puede hacer preguntas de seguimiento

### Edge Cases
- [ ] Archivo con valores no numéricos → error claro
- [ ] Archivo con menos de 20 valores → warning pero continúa
- [ ] LEI >= LES → error de validación
- [ ] Datos perfectamente normales → muestra "Normal" correctamente
- [ ] Datos muy no-normales → ajusta distribución alternativa

---

## Decisiones Tomadas

1. **Tamaño mínimo de muestra:** No hay mínimo estricto. Si < 20 valores, mostrar advertencia: *"Se recomienda un mínimo de 20 valores para obtener estimaciones confiables de capacidad."* El análisis continúa.

2. **Distribuciones alternativas:** Soportar Weibull, Lognormal, Gamma, Exponential, Logistic, Extreme Value. El sistema selecciona automáticamente la de mejor ajuste.

3. **Diferenciación Within/Overall:** σ Within se calcula como MR̄/d2 (corto plazo) y se usa para Cp/Cpk. σ Overall se calcula como desviación estándar muestral (largo plazo) y se usa para Pp/Ppk.

---

## Próximos Pasos

1. **Revisar y aprobar este PRD-v3** con Setec
2. **Crear Epic 9 y stories** para implementación de cambios v3
3. **Implementar sigma_estimation.py** con cálculo diferenciado Within/Overall
4. **Actualizar componentes de gráficos** (remover I-Chart y MR-Chart)
5. **Actualizar calculadora Python** para usar sigma diferenciado
6. **Integrar con flujo de chat** existente

---

*Documento generado como PRD-v3 para Setec AI Hub*
