---
version: 4.0
status: draft
createdAt: 2026-03-14
author: Setec
parentPRD: prd-v2.md
inputDocuments:
  - prd-v1.md
  - prd-v2.md
  - architecture.md
decisionsResolved:
  - confidence_levels: "90%, 95% (default), 99%"
  - normality_alpha: "Always α=0.05 for Anderson-Darling"
  - test_alpha: "Derived from confidence level (α = 1 - confidence)"
  - n_threshold: "30 (TCL boundary)"
  - box_cox_failure: "Warn and continue with original data"
  - input_format: "Single file, two columns (Muestra A, Muestra B), unequal lengths allowed"
  - configuration_flow: "Conversational (agent asks in chat, not form)"
---

# PRD v4 — Setec AI Hub

**Autor:** Setec
**Fecha:** 2026-03-14
**Alcance:** Nueva funcionalidad — Test de Hipótesis de Varianzas y Medias de 2 Muestras
**Referencia:** Implementa análisis #4 "Hypothesis Testing" del roadmap Post-MVP (PRD-v1), caso de uso Journey 4: David

---

## Resumen Ejecutivo

Agregar un tercer tipo de análisis a Setec AI Hub: **Test de Hipótesis de Varianzas y Medias de 2 Muestras**. Permite a usuarios Green Belt comparar dos poblaciones estadísticamente, determinando si sus varianzas y medias son iguales o diferentes. El análisis sigue un pipeline secuencial: estadísticos descriptivos → normalidad → varianzas (Levene) → medias (t-test de 2 muestras), con interpretación técnica y "terrenal."

---

## Nombre del Análisis

- **Nombre interno (code):** `hipotesis_2_muestras`
- **Nombre visible (UI):** "Test de Hipótesis: 2 Muestras"
- **Nombre corto:** "Hipótesis 2 Muestras"

---

## User Journey: Ana — Comparación de 2 Poblaciones

**Quién:** Ana, Ingeniera de Calidad en una planta farmacéutica. Tiene datos de rendimiento de dos líneas de producción y necesita saber si producen resultados estadísticamente equivalentes.

**Escena Inicial:** Ana tiene 45 mediciones de la Línea A y 40 mediciones de la Línea B en Excel.

**Desarrollo:**

1. Ana abre Setec AI Hub, inicia sesión
2. Hace clic en "Nueva conversación"
3. El agente la saluda
4. Ana escribe: "Necesito comparar dos muestras para saber si son estadísticamente iguales"
5. El agente responde: _"Perfecto. Ve a la sección de Plantillas y descarga la plantilla de Hipótesis 2 Muestras. Coloca los datos de cada muestra en su respectiva columna (Muestra A y Muestra B) y súbela aquí."_
6. Ana va a Plantillas, descarga `plantilla-hipotesis-2-muestras.xlsx`
7. Pega 45 valores en "Muestra A" y 40 valores en "Muestra B"
8. Regresa al chat, sube el archivo
9. El agente pregunta:

> _"¿Con qué nivel de confianza quieres que haga el análisis? Por default es 95%."_
>
> - 90%
> - 95% (default)
> - 99%

10. Ana elige 95%
11. El agente pregunta:

> _"Para el análisis de medias, ¿la hipótesis alternativa es de desigualdad (μA ≠ μB), o quieres probar una dirección específica?"_
>
> - μA ≠ μB (desigualdad) — default
> - μA > μB (mayor)
> - μA < μB (menor)

12. Ana elige desigualdad
13. El sistema ejecuta el análisis completo y retorna resultados

**Flujo alternativo (n < 30):**

8b. Ana sube un archivo con 22 valores en cada muestra
9b-11b. Configuración igual que arriba
12b. El agente detecta que ambas muestras tienen n < 30 y responde:

> _"⚠️ Ambas muestras tienen menos de 30 observaciones (nA=22, nB=22). Con muestras pequeñas, la normalidad es condición crítica para la validez del test. Se recomienda tomar más muestras hasta llegar a 30. ¿Es posible obtener más datos?"_

13b. Ana responde: "No, no es posible"
14b. El agente continúa con el análisis, agregando un aviso de condición crítica en los resultados

**Clímax:** Ana ve:

**Estadísticos descriptivos** de cada muestra (n, media, mediana, std dev, skewness, outliers, histogramas)

**Normalidad:**
- ✅ Muestra A: Normal (AD p-value = 0.42)
- ✅ Muestra B: Normal (AD p-value = 0.18)

**Varianzas (Levene):**
- p-value = 0.31 → ✅ Varianzas estadísticamente iguales

**Medias (t-test con varianzas iguales):**
- p-value = 0.003 → ❌ Medias estadísticamente diferentes

**Interpretación terrenal:** _"Las dos líneas de producción tienen una variabilidad similar entre sí, pero producen resultados con promedios diferentes. La Línea A produce en promedio 102.3 y la Línea B 98.7. Esta diferencia NO se debe al azar — hay algo sistemáticamente diferente entre las líneas."_

**Resolución:** Ana identifica que debe investigar qué causa la diferencia de medias entre las líneas.

---

## Requisitos Funcionales

### Entrada de Datos

**FR-H1:** Usuario puede descargar plantilla `plantilla-hipotesis-2-muestras.xlsx` desde la sección Plantillas.

**FR-H2:** La plantilla contiene dos columnas: "Muestra A" y "Muestra B". Las muestras pueden tener longitudes desiguales (celdas vacías donde la muestra más corta termina).

**FR-H3:** El agente, tras detectar intención de análisis de hipótesis y archivo subido, pregunta al usuario en el chat:
- Nivel de confianza (90%, 95%, 99%) — default 95%
- Hipótesis alternativa para medias (≠, >, <) — default ≠

**FR-H4:** El agente espera las respuestas del usuario antes de invocar el análisis.

### Validación de Archivo

**FR-H5:** El sistema valida que el archivo tenga al menos dos columnas numéricas.

**FR-H6:** El sistema detecta y reporta:
- Celdas vacías intercaladas (con ubicación específica) — celdas vacías al final de la columna más corta son normales
- Valores no numéricos (con ubicación específica)

**FR-H7:** Mínimo 2 valores por muestra. Sin máximo.

**FR-H8:** Mensajes de error en español con guía específica para corregir.

### Estadísticos Descriptivos (por cada muestra)

**FR-H9:** El sistema calcula para cada muestra:
- Tamaño muestral (n)
- Media (promedio)
- Mediana
- Desviación estándar
- Coeficiente de asimetría (skewness)

**FR-H10:** El sistema detecta posibles outliers mediante criterio IQR:
- Q1, Q3, IQR = Q3 - Q1
- Outlier si valor < Q1 - 1.5×IQR o valor > Q3 + 1.5×IQR
- Reporta cantidad y valores de outliers detectados

**FR-H11:** El sistema genera un histograma descriptivo por cada muestra.

### Evaluación de Tamaño Muestral

**FR-H12:** Si n ≥ 30 (por muestra): El sistema indica que aplica el Teorema Central del Límite (TCL) y que el test t es robusto ante leves desviaciones de normalidad.

**FR-H13:** Si n < 30 (por muestra): El sistema indica que la normalidad es condición crítica. Las instrucciones indican al agente que debe:
1. Recomendar al usuario tomar más muestras hasta llegar a 30
2. Preguntar si es posible obtener más datos
3. Esperar respuesta del usuario:
   - Si el usuario puede obtener más datos → indicar que regrese con más datos
   - Si el usuario NO puede → continuar con el análisis, agregando aviso de "condición crítica" en todos los resultados

**FR-H14:** La evaluación de tamaño muestral se realiza por muestra independientemente. Si una muestra tiene n ≥ 30 y la otra n < 30, el aviso aplica solo a la muestra con n < 30.

### Análisis de Normalidad

**FR-H15:** El sistema realiza test de normalidad Anderson-Darling para cada muestra:
- Calcula estadístico A² ajustado
- Calcula p-value (compatible con Minitab)
- Siempre usa α = 0.05 (independiente del nivel de confianza elegido)
- Si p-value ≥ 0.05 → "Normal"
- Si p-value < 0.05 → "No Normal"

**FR-H16:** Si al menos una muestra NO es normal, el sistema evalúa **robustez**:
- Forma de la distribución (similar a normal visualmente)
- Coeficiente de asimetría: |skewness| < 1.0 se considera aceptable
- Outliers: menos del 5% de datos son outliers se considera aceptable

**FR-H17:** Evaluación de robustez:
- Si la muestra no-normal ES robusta (skewness aceptable + pocos outliers) → continuar con los datos originales, informar que el TCL respalda el análisis (si n ≥ 30)
- Si la muestra no-normal NO es robusta → aplicar transformación Box-Cox a **ambas** muestras

**FR-H18:** Transformación Box-Cox:
- Si los datos contienen ceros o negativos → no se puede aplicar Box-Cox. Advertir al usuario y continuar con datos originales + caveat
- Si Box-Cox se aplica → re-testear normalidad en datos transformados
- Si la normalidad mejora → continuar con datos transformados, reportar λ (lambda)
- Si la normalidad NO mejora → advertir al usuario, continuar con datos originales + caveat: _"Los resultados deben interpretarse con precaución porque los datos no siguen una distribución normal."_

### Análisis de Varianzas

**FR-H19:** El sistema realiza test de Levene para igualdad de varianzas:
- H₀: σ²A = σ²B (varianzas iguales)
- H₁: σ²A ≠ σ²B (varianzas diferentes)
- α = 1 - nivel_de_confianza (ej: 0.05 para 95%)
- Calcula estadístico F de Levene y p-value

**FR-H20:** Interpretación de varianzas:
- p-value ≥ α → Varianzas estadísticamente iguales (no se rechaza H₀)
- p-value < α → Varianzas estadísticamente diferentes (se rechaza H₀)

**FR-H21:** El resultado del test de varianzas determina qué tipo de t-test usar en el paso siguiente.

### Análisis de Medias

**FR-H22:** El sistema realiza test t de 2 muestras:
- H₀: μA - μB = 0 (medias iguales)
- H₁: según elección del usuario:
  - μA ≠ μB (two-sided) — default
  - μA > μB (greater)
  - μA < μB (less)
- Diferencia hipotética δ₀ = 0
- α = 1 - nivel_de_confianza

**FR-H23:** El tipo de t-test depende del resultado del análisis de varianzas:
- Si varianzas iguales → t-test con varianzas agrupadas (pooled)
- Si varianzas diferentes → t-test de Welch (varianzas no agrupadas)

**FR-H24:** Calcular:
- Estadístico t
- Grados de libertad (df)
- p-value
- Intervalo de confianza para la diferencia de medias

**FR-H25:** Interpretación de medias:
- p-value ≥ α → Medias estadísticamente iguales (no se rechaza H₀)
- p-value < α → Medias estadísticamente diferentes (se rechaza H₀)

### Visualizaciones

**FR-H26:** El sistema genera 4 gráficos:

1. **Histograma Muestra A** con:
   - Barras de frecuencia
   - Línea de media (vertical)
   - Indicadores de outliers (si existen)

2. **Histograma Muestra B** con:
   - Barras de frecuencia
   - Línea de media (vertical)
   - Indicadores de outliers (si existen)

3. **Boxplot Comparativo — Varianzas** con:
   - Boxplots lado a lado de Muestra A y Muestra B
   - Muestra la dispersión/spread de cada muestra
   - Mediana, Q1, Q3, whiskers, outliers marcados
   - Título indicando resultado del test de Levene (p-value)

4. **Boxplot Comparativo — Medias** con:
   - Boxplots lado a lado de Muestra A y Muestra B
   - Intervalos de confianza para las medias superpuestos
   - Medias marcadas con símbolo diferenciado (diamante o cruz)
   - Título indicando resultado del t-test (p-value)

**FR-H27:** Cada gráfico es:
- Interactivo (hover muestra valores)
- Exportable como imagen PNG
- Responsive (desktop-first)

### Resultados y Presentación

**FR-H28:** El sistema retorna instrucciones en markdown para el agente con:

**Parte 1: Estadísticos Descriptivos**
- Tabla comparativa: n, media, mediana, std dev, skewness por muestra
- Outliers detectados (si existen)
- Nota sobre tamaño muestral y TCL

**Parte 2: Normalidad**
- Resultado Anderson-Darling por muestra (A², p-value, conclusión)
- Si se evaluó robustez: resultado y criterios
- Si se aplicó Box-Cox: lambda, resultado de re-test

**Parte 3: Test de Varianzas**
- Método: Levene
- H₀ y H₁ explícitas
- Estadístico F, p-value
- Conclusión: varianzas iguales o diferentes
- α utilizado

**Parte 4: Test de Medias**
- Método: t-test (pooled o Welch, indicando cuál y por qué)
- H₀ y H₁ explícitas
- Estadístico t, grados de libertad, p-value
- Intervalo de confianza para la diferencia
- Conclusión: medias iguales o diferentes
- α utilizado

**Parte 5: Conclusión "Terrenal"**
- Explicación en lenguaje simple de qué significan los resultados
- Analogías y contexto práctico
- Qué debería hacer el usuario basado en los resultados

**FR-H29:** El agente puede responder preguntas de seguimiento sobre los resultados sin re-ejecutar el análisis.

**FR-H30:** Si se aplicaron caveats (n < 30, normalidad no lograda, Box-Cox fallido), estos se reflejan tanto en la explicación técnica como en la terrenal.

---

## Requisitos No Funcionales

**NFR-H1:** Los cálculos de Anderson-Darling deben producir p-values comparables a Minitab (±0.01).

**NFR-H2:** El test de Levene debe usar la variante basada en medianas (más robusta) y producir resultados comparables a Minitab.

**NFR-H3:** El t-test de 2 muestras debe producir resultados comparables a Minitab para ambas variantes (pooled y Welch).

**NFR-H4:** El análisis completo debe ejecutarse en menos de 30 segundos para archivos de hasta 1000 filas por muestra.

**NFR-H5:** Todos los mensajes de error y resultados están en español.

**NFR-H6:** Los datos crudos del archivo nunca se envían a OpenAI (solo resultados agregados).

---

## Cambios Técnicos Requeridos

### Nuevos Archivos

| Archivo | Propósito |
|---------|-----------|
| `/api/utils/hipotesis_2m_calculator.py` | Cálculos estadísticos (descriptivos, Levene, t-test) |
| `/api/utils/hipotesis_2m_validator.py` | Validación de archivo (2 columnas numéricas) |
| `/public/templates/plantilla-hipotesis-2-muestras.xlsx` | Plantilla descargable |
| `/components/charts/BoxplotChart.tsx` | Componente boxplot comparativo (nuevo) |
| `/components/charts/Hipotesis2MCharts.tsx` | Contenedor de los 4 gráficos del análisis |

### Módulos Python Reutilizados

| Módulo Existente | Qué se reutiliza |
|------------------|------------------|
| `/api/utils/normality_tests.py` | Test Anderson-Darling (ya implementado) |
| `/api/utils/file_loader.py` | Carga de archivo Excel |
| `/api/utils/response.py` | Formateo de respuestas |
| `/api/utils/supabase_client.py` | Integración con Supabase |

### Modificaciones

| Archivo | Cambio |
|---------|--------|
| `/api/analyze.py` | Agregar routing para `analysis_type='hipotesis_2_muestras'` |
| `/constants/analysis.ts` | Agregar `'hipotesis_2_muestras'` a `ANALYSIS_TYPES` |
| `/types/analysis.ts` | Agregar `Hipotesis2MResult` interface y `'hipotesis_2_muestras'` al union type |
| `/constants/templates.ts` | Agregar template de hipótesis 2 muestras |
| `/lib/openai/tools.ts` | Agregar `confidence_level` y `alternative_hypothesis` a parámetros del tool |
| `/lib/api/analyze.ts` | Actualizar `invokeAnalysisTool` para pasar nuevos parámetros |
| `/components/charts/index.ts` | Exportar nuevos componentes |

### Base de Datos

No se requieren cambios de esquema. La tabla `analysis_results` ya soporta diferentes `analysis_type` y almacena resultados en JSONB.

### Flujo del Análisis

```
1. Usuario sube archivo con 2 columnas
2. Agente detecta intención de análisis de hipótesis 2 muestras
3. Agente pregunta nivel de confianza (90/95/99%) → espera respuesta
4. Agente pregunta hipótesis alternativa (≠/>/< ) → espera respuesta
5. Agente invoca tool: analyze(
     analysis_type='hipotesis_2_muestras',
     file_id,
     confidence_level=0.95,
     alternative_hypothesis='two-sided'
   )
6. Python descarga archivo de Supabase Storage
7. Python valida estructura (2 columnas numéricas)
8. Python ejecuta pipeline completo:
   a. Estadísticos descriptivos por muestra
   b. Detección de outliers IQR
   c. Evaluación de tamaño muestral
   d. Test Anderson-Darling por muestra
   e. Evaluación de robustez (si aplica)
   f. Box-Cox (si aplica)
   g. Test de Levene
   h. t-test de 2 muestras (pooled o Welch según Levene)
9. Python retorna { results, chartData, instructions }
10. Agente revisa results:
    │
    ├─ Si alguna muestra tiene n < 30:
    │   → Agente muestra advertencia
    │   → Agente pregunta: "¿Es posible obtener más datos?"
    │   → Espera respuesta:
    │     ├─ SÍ → "Regresa cuando tengas al menos 30 observaciones por muestra"
    │     └─ NO → Presenta resultados completos con caveat de condición crítica
    │
    └─ Si ambas muestras n ≥ 30:
        → Presenta resultados completos directamente
```

---

## Estructura de chartData

```typescript
interface Hipotesis2MChartData {
  charts: [
    {
      type: 'histogram_a',
      data: {
        bins: { start: number, end: number, count: number }[],
        mean: number,
        sampleName: string,
        outliers?: number[]
      }
    },
    {
      type: 'histogram_b',
      data: {
        bins: { start: number, end: number, count: number }[],
        mean: number,
        sampleName: string,
        outliers?: number[]
      }
    },
    {
      type: 'boxplot_variance',
      data: {
        samples: [
          {
            name: string,
            min: number,
            q1: number,
            median: number,
            q3: number,
            max: number,
            outliers: number[],
            mean: number
          },
          {
            name: string,
            min: number,
            q1: number,
            median: number,
            q3: number,
            max: number,
            outliers: number[],
            mean: number
          }
        ],
        leveneTestPValue: number,
        leveneConclusion: string
      }
    },
    {
      type: 'boxplot_means',
      data: {
        samples: [
          {
            name: string,
            min: number,
            q1: number,
            median: number,
            q3: number,
            max: number,
            outliers: number[],
            mean: number,
            ciLower: number,
            ciUpper: number
          },
          {
            name: string,
            min: number,
            q1: number,
            median: number,
            q3: number,
            max: number,
            outliers: number[],
            mean: number,
            ciLower: number,
            ciUpper: number
          }
        ],
        tTestPValue: number,
        tTestConclusion: string
      }
    }
  ]
}
```

---

## Plantilla: plantilla-hipotesis-2-muestras.xlsx

**Estructura:**

| Muestra A | Muestra B |
|-----------|-----------|
| 102.3 | 98.7 |
| 101.8 | 99.1 |
| 103.1 | 97.5 |
| ... | ... |
| 100.9 | |

**Notas en la plantilla:**
- Fila 1: Headers "Muestra A" y "Muestra B"
- Filas 2+: Datos numéricos
- Las muestras pueden tener longitudes diferentes (celdas vacías al final son normales)

---

## Criterios de Aceptación

### Análisis Completo
- [ ] Usuario puede descargar plantilla desde /plantillas
- [ ] Usuario puede subir archivo con 2 columnas
- [ ] Agente pregunta nivel de confianza antes de analizar
- [ ] Agente pregunta hipótesis alternativa antes de analizar
- [ ] Estadísticos descriptivos calculados correctamente para ambas muestras
- [ ] Outliers detectados correctamente con criterio IQR
- [ ] Histogramas descriptivos generados para cada muestra
- [ ] Evaluación de tamaño muestral funciona (n ≥ 30 vs n < 30)
- [ ] Agente pregunta por más datos si n < 30 y espera respuesta
- [ ] Test Anderson-Darling produce p-values comparables a Minitab
- [ ] Evaluación de robustez funciona (skewness + outliers)
- [ ] Box-Cox se aplica cuando corresponde
- [ ] Test de Levene calcula correctamente
- [ ] t-test usa variante correcta (pooled vs Welch) según resultado de Levene
- [ ] t-test respeta dirección de hipótesis alternativa elegida
- [ ] Los 4 gráficos se renderizan correctamente
- [ ] Gráficos son interactivos y exportables
- [ ] Interpretación técnica es correcta y completa
- [ ] Interpretación terrenal es clara y pedagógica
- [ ] Usuario puede hacer preguntas de seguimiento

### Edge Cases
- [ ] Archivo con una sola columna → error claro
- [ ] Archivo con valores no numéricos → error con ubicación
- [ ] Muestras con longitudes muy diferentes (ej: 50 vs 10) → funciona correctamente
- [ ] Ambas muestras n < 30 → advertencia para ambas
- [ ] Una muestra n ≥ 30, otra n < 30 → advertencia solo para la pequeña
- [ ] Datos con outliers extremos → detectados y reportados
- [ ] Datos perfectamente normales → reporta "Normal" correctamente
- [ ] Datos muy no-normales + no robustos → aplica Box-Cox
- [ ] Box-Cox falla (datos con ceros) → aviso, continúa con originales
- [ ] Varianzas claramente diferentes → Levene detecta, t-test usa Welch
- [ ] Medias idénticas → p-value alto, conclusión correcta
- [ ] Hipótesis unilateral (> o <) → p-value y conclusión correctos
- [ ] Nivel de confianza 90% → α=0.10 aplicado correctamente
- [ ] Nivel de confianza 99% → α=0.01 aplicado correctamente

---

## Decisiones Tomadas

1. **Niveles de confianza:** 90%, 95% (default), 99%. El α para tests de varianza y medias se deriva como 1 - confianza. El test de normalidad siempre usa α = 0.05.

2. **n < 30:** El agente pregunta al usuario si puede obtener más datos y espera respuesta. Si no puede, continúa con aviso de condición crítica.

3. **Box-Cox cuando falla:** Si Box-Cox no puede aplicarse (datos ≤ 0) o no mejora la normalidad, se continúa con datos originales agregando caveat en la interpretación. El análisis nunca se detiene.

4. **Configuración vía chat:** El nivel de confianza y la hipótesis alternativa se configuran conversacionalmente (el agente pregunta en el chat), no mediante un formulario. Esto mantiene el flujo natural.

5. **Formato de entrada:** Un solo archivo con dos columnas. Muestras de longitud desigual permitidas.

6. **Robustez:** Se evalúa con dos criterios: |skewness| < 1.0 y menos del 5% de outliers. Ambos deben cumplirse para considerar la muestra robusta.

---

## Próximos Pasos

1. **Revisar y aprobar este PRD** con Setec
2. **Crear UX design** para los nuevos componentes (boxplots, histogramas)
3. **Crear architecture decisions** para integración del nuevo análisis
4. **Crear epics y stories** para implementación
5. **Implementar calculadora Python** con tests contra valores conocidos de Minitab
6. **Implementar componente BoxplotChart** en Recharts
7. **Integrar con flujo de chat** existente

---

*Documento generado como PRD para Test de Hipótesis 2 Muestras — Setec AI Hub*
