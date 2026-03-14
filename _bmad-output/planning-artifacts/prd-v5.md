---
version: 5.0
status: draft
createdAt: 2026-03-14
author: Setec
parentPRD: prd-v2.md
inputDocuments:
  - prd-v1.md
  - prd-v2.md
  - prd-v4.md
  - architecture.md
decisionsResolved:
  - input_method: "Purely conversational — no file upload"
  - output_format: "Text-only markdown — no charts"
  - formula: "Standard two-sample formula: n = ceil(((Z + Z_β)² × 2σ²) / Δ²)"
  - test_directionality: "Agent asks user whether planned test is two-sided or one-sided"
  - sensitivity_analysis: "Python computes quantitative alternative scenarios"
  - defaults: "α=0.05, power=80% — agent suggests with explanation if user doesn't know"
  - scope: "Only 2-sample mean comparison — no 1-sample, proportions, or ANOVA"
---

# PRD v5 — Setec AI Hub

**Autor:** Setec
**Fecha:** 2026-03-14
**Alcance:** Nueva funcionalidad — Cálculo de Tamaño de Muestra para Comparación de 2 Medias
**Referencia:** Herramienta de diseño muestral previa al Test de Hipótesis de 2 Muestras (PRD-v4)

---

## Resumen Ejecutivo

Agregar un cuarto tipo de análisis a Setec AI Hub: **Cálculo de Tamaño de Muestra**. Permite a usuarios calcular el tamaño mínimo de muestra necesario **antes** de ejecutar un test de hipótesis de 2 medias. A diferencia de los análisis existentes, este es **puramente conversacional** — no requiere archivo Excel. El agente guía al usuario paso a paso para definir los parámetros clave (delta, sigma, alfa, poder) y retorna el n mínimo por grupo con evaluación y recomendaciones estratégicas. El análisis **nunca** ejecuta el test de hipótesis — es exclusivamente una herramienta de diseño muestral.

---

## Nombre del Análisis

- **Nombre interno (code):** `tamano_muestra`
- **Nombre visible (UI):** "Cálculo de Tamaño de Muestra"
- **Nombre corto:** "Tamaño de Muestra"

---

## User Journey: Carlos — Diseño Muestral Antes de un Experimento

**Quién:** Carlos, Ingeniero de Procesos en una planta automotriz. Quiere comparar un nuevo método de ensamble contra el actual y necesita saber cuántas piezas medir.

**Escena Inicial:** Carlos sabe que el tiempo de ciclo actual promedia 15.2 minutos y espera que el nuevo método lo reduzca. No sabe cuántas muestras tomar.

**Desarrollo:**

1. Carlos abre Setec AI Hub, inicia sesión
2. Hace clic en "Nueva conversación"
3. El agente lo saluda
4. Carlos escribe: "Necesito calcular cuántas muestras tomar para comparar dos procesos"
5. El agente reconoce la intención y responde:

> _"Perfecto, te voy a guiar para calcular el tamaño mínimo de muestra. Antes de empezar, necesitas entender las 4 variables que influyen en este cálculo:_
>
> - **Delta (Δ):** La diferencia mínima que consideras prácticamente significativa. Es decir, ¿qué tan grande debe ser la diferencia para que valga la pena detectarla?
> - **Alfa (α):** La probabilidad de concluir que hay diferencia cuando en realidad no la hay. Es tu tolerancia al 'falso positivo.'
> - **Poder (1-β):** La probabilidad de detectar una diferencia real cuando sí existe. Es tu capacidad de no 'dejar pasar' un efecto real.
> - **Sigma (σ):** La variabilidad natural de tu proceso. A mayor variabilidad, más muestras necesitas."_

6. El agente pregunta: _"¿Cuál es la media actual estimada del proceso?"_
   Carlos: "El tiempo actual de ciclo es de 15.2 minutos"

7. El agente pregunta: _"¿Cuál es la media esperada después de la mejora?"_
   Carlos: "Esperamos reducirlo a 14.8 minutos"

8. El agente pregunta: _"Entonces la diferencia mínima relevante sería 0.4 minutos. ¿Es esa diferencia económicamente significativa para ti, o necesitas detectar una diferencia más pequeña?"_
   Carlos: "Sí, 0.4 minutos es relevante"

9. El agente pregunta: _"¿Cuál es el desvío estándar histórico del proceso?"_
   Carlos: "Creo que es alrededor de 0.6"
   Agente: _"0.6 es razonable. Si en el futuro tienes datos históricos podemos ser más precisos, pero usemos 0.6."_

10. El agente pregunta: _"¿Qué nivel de significancia (alfa) deseas? Si no estás seguro, te recomiendo 0.05, que significa que aceptas un 5% de probabilidad de detectar una diferencia cuando no la hay."_
    Carlos: "0.05 está bien"

11. El agente pregunta: _"¿Qué poder estadístico deseas? Te recomiendo 80%, que significa que si la diferencia real existe, tienes 80% de probabilidad de detectarla."_
    Carlos: "80%"

12. El agente pregunta: _"¿Tu prueba futura será bilateral (μA ≠ μB) o unilateral (μA > μB o μA < μB)?"_
    Carlos: "Bilateral"

13. El agente invoca el cálculo con todos los parámetros recolectados
14. Python calcula n = 36 por grupo

**Clímax:** Carlos ve:

**Parámetros utilizados:**

| Parámetro | Valor |
|-----------|-------|
| Media actual | 15.2 min |
| Media esperada | 14.8 min |
| Diferencia (Δ) | 0.4 min |
| Desviación estándar (σ) | 0.6 min |
| Nivel de significancia (α) | 0.05 |
| Poder estadístico (1-β) | 80% |
| Tipo de prueba | Bilateral |

**Resultado:** ✅ **Tamaño mínimo de muestra: 36 por grupo**

Necesitas tomar al menos 36 mediciones del proceso actual y 36 del proceso mejorado.

**Evaluación:** El tamaño de 36 es ≥ 30, lo que significa que aplica el Teorema Central del Límite. El test t será robusto ante leves desviaciones de normalidad.

**Análisis de sensibilidad:**

| Escenario | n por grupo |
|-----------|-------------|
| Valores base (Δ=0.4, σ=0.6, poder=80%) | 36 |
| Si Δ = 0.2 (mitad de la diferencia) | 142 |
| Si poder = 90% | 48 |
| Si σ = 1.2 (doble variabilidad) | 142 |

**Recomendaciones:**
- Si necesitas detectar una diferencia más pequeña (Δ menor), el tamaño crece significativamente — pasar de 0.4 a 0.2 cuadruplica la muestra
- Subir el poder a 90% solo requiere 12 muestras más por grupo — considera la inversión
- Si la variabilidad real resulta mayor que 0.6, necesitarás más muestras
- Verifica la estabilidad del proceso antes de comenzar a recolectar datos
- Cuando tengas tus datos recolectados, regresa para ejecutar el Test de Hipótesis de 2 Muestras

**Resolución:** Carlos sabe exactamente cuántas muestras tomar. Diseña su plan de recolección con 40 mediciones por grupo (margen de seguridad) y programa la toma de datos para la semana siguiente.

---

## Requisitos Funcionales

### Explicación Inicial

**FR-TM1:** Cuando el agente detecta intención de cálculo de tamaño de muestra, explica al usuario las 4 variables que influyen en el cálculo:
- **Delta (Δ):** Diferencia mínima prácticamente significativa
- **Alfa (α):** Nivel de significancia (tolerancia al falso positivo)
- **Poder (1-β):** Probabilidad de detectar un efecto real
- **Sigma (σ):** Variabilidad estimada del proceso

Cada variable se explica en lenguaje simple y aplicado a negocio, no en jerga estadística.

### Recolección de Parámetros (Conversacional)

**FR-TM2:** El agente hace las preguntas **una por una**, esperando la respuesta del usuario antes de continuar con la siguiente. No presenta todas las preguntas de golpe.

**FR-TM3:** Secuencia de preguntas:

| # | Pregunta | Coaching |
|---|----------|----------|
| a | ¿Cuál es la media actual estimada del proceso? | — |
| b | ¿Cuál es la media esperada después de la mejora? | — |
| c | ¿Cuál es la diferencia mínima relevante (Δ)? | Si el usuario proporcionó a) y b), el agente calcula Δ = \|media_esperada - media_actual\| y pide confirmación. Si el usuario no la define claramente, lo ayuda a definirla. |
| d | ¿Cuál es el desvío estándar histórico del proceso? | Si no lo conoce, el agente pide datos históricos o sugiere una estimación razonable. |
| e | ¿Qué nivel de alfa desea? | Si no sabe, sugiere 0.05 y explica que implica 5% de probabilidad de falso positivo. |
| f | ¿Qué poder estadístico desea? | Si no sabe, sugiere 80% y explica que implica 80% de probabilidad de detectar un efecto real. |
| g | ¿La prueba futura será bilateral o unilateral? | Explica: bilateral = "¿son diferentes?", unilateral = "¿uno es mayor que otro?" Sugiere bilateral como default. |

**FR-TM4:** El agente **no asume valores sin preguntar**. Cada parámetro debe ser confirmado por el usuario.

**FR-TM5:** Para delta (pregunta c), si el usuario ya proporcionó media actual y esperada, el agente calcula la diferencia y pregunta: _"Entonces la diferencia mínima relevante sería X. ¿Es esa diferencia económicamente significativa, o necesitas detectar una diferencia más pequeña?"_

**FR-TM6:** Para sigma (pregunta d), si el usuario no conoce el valor, el agente ofrece ayuda:
- Pide datos históricos del proceso
- Sugiere usar el rango de datos conocidos dividido entre 4 como estimación burda
- Acepta el valor que el usuario provea

**FR-TM7:** Para alfa y poder (preguntas e y f), el agente explica las implicaciones en lenguaje de negocio al sugerir los defaults.

### Cálculo

**FR-TM8:** El sistema calcula el tamaño mínimo de muestra por grupo usando la fórmula estándar para dos medias independientes:

- **Bilateral:** n = ⌈((Z_{α/2} + Z_β)² × 2σ²) / Δ²⌉
- **Unilateral:** n = ⌈((Z_α + Z_β)² × 2σ²) / Δ²⌉

Donde:
- Z_{α/2} o Z_α = cuantil de la distribución normal estándar para el nivel de significancia
- Z_β = cuantil de la distribución normal estándar para el poder
- σ = desviación estándar estimada
- Δ = diferencia mínima prácticamente significativa

**FR-TM9:** El resultado se redondea hacia arriba (ceiling) al siguiente entero.

**FR-TM10:** El agente indica explícitamente que el tamaño calculado es **por grupo** — se necesitan n mediciones del grupo A y n del grupo B.

### Evaluación del Resultado

**FR-TM11:** El sistema clasifica el resultado:
- **n ≥ 30 por grupo:** Indica que el tamaño es adecuado para aplicar el Teorema Central del Límite. El test t será robusto ante leves desviaciones de normalidad.
- **15 ≤ n < 30 por grupo:** Indica que será necesario verificar normalidad al momento de hacer el test de hipótesis.
- **n < 15 por grupo:** Advierte que el tamaño puede ser débil y que el poder real podría ser inestable. Sugiere aumentar la muestra si es posible.

### Análisis de Sensibilidad

**FR-TM12:** El sistema calcula n para al menos 3 escenarios alternativos y los retorna en una tabla:

| Escenario | Cambio | n por grupo |
|-----------|--------|-------------|
| Base | Valores ingresados | n_base |
| Delta reducida | Δ × 0.5 | n_delta |
| Poder aumentado | Poder = 0.90 | n_power |
| Variabilidad aumentada | σ × 2 | n_sigma |

**FR-TM13:** Los escenarios de sensibilidad se calculan en Python y se retornan con valores reales, no estimaciones cualitativas.

### Recomendaciones Estratégicas

**FR-TM14:** Basándose en los resultados y la sensibilidad, el agente proporciona recomendaciones:
- Cómo cambiaría n si la diferencia mínima (Δ) fuera menor
- Cómo cambiaría n si el poder fuera mayor
- Advertencia de que si la variabilidad aumenta, n también aumenta
- Si n es muy bajo (< 15), sugerir aumentar la muestra
- Sugerir verificar la estabilidad del proceso antes de recolectar datos
- Indicar que cuando tenga los datos recolectados, puede regresar para ejecutar el Test de Hipótesis de 2 Muestras

### Resultados y Presentación

**FR-TM15:** El agente presenta los resultados en markdown estructurado con las siguientes secciones:

**Parte 1: Parámetros Utilizados**
- Tabla resumen con todos los valores ingresados (media actual, media esperada, delta, sigma, alfa, poder, tipo de prueba)

**Parte 2: Resultado del Cálculo**
- n por grupo (redondeado hacia arriba)
- Fórmula utilizada como referencia
- Indicación clara de que es POR GRUPO

**Parte 3: Evaluación**
- Clasificación según umbrales (≥30 / 15-29 / <15)
- Implicaciones para el futuro test de hipótesis

**Parte 4: Tabla de Sensibilidad**
- Escenarios alternativos con n calculados

**Parte 5: Recomendaciones Estratégicas**
- Recomendaciones específicas y accionables basadas en los resultados

**FR-TM16:** El agente puede responder preguntas de seguimiento (ej: "¿y si mi sigma es realmente 0.8?") re-invocando el cálculo con parámetros modificados sin repetir todo el flujo de preguntas.

**FR-TM17:** El análisis **nunca** procede a ejecutar el test de hipótesis. Es exclusivamente una herramienta de diseño muestral. Si el usuario pide ejecutar el test, el agente le indica que primero recolecte los datos y luego use el análisis de "Hipótesis 2 Muestras."

---

## Requisitos No Funcionales

**NFR-TM1:** Los cálculos de Z-scores deben usar `scipy.stats.norm.ppf` para precisión numérica.

**NFR-TM2:** Los resultados de n deben coincidir con software estadístico estándar (Minitab, G*Power) para los mismos parámetros de entrada.

**NFR-TM3:** El cálculo completo (incluyendo sensibilidad) debe ejecutarse en menos de 5 segundos.

**NFR-TM4:** Todos los mensajes de error y resultados están en español.

**NFR-TM5:** No se envían datos del usuario a OpenAI — solo los resultados calculados se incorporan al contexto del agente.

---

## Cambios Técnicos Requeridos

### Nuevos Archivos

| Archivo | Propósito |
|---------|-----------|
| `/api/utils/tamano_muestra_calculator.py` | Cálculo de tamaño de muestra + sensibilidad |
| `/api/tests/test_tamano_muestra_calculator.py` | Tests unitarios contra valores conocidos (Minitab/G*Power) |

### Módulos Python Reutilizados

| Módulo Existente | Qué se reutiliza |
|------------------|------------------|
| `/api/utils/response.py` | Formateo de respuestas |

### No se necesitan

| Elemento | Por qué |
|----------|---------|
| Plantilla Excel | No hay archivo de entrada |
| Validador de archivo | No hay archivo que validar |
| Componentes de gráficos | Salida es solo texto |

### Modificaciones

| Archivo | Cambio |
|---------|--------|
| `/api/analyze.py` | Agregar routing para `analysis_type='tamano_muestra'`. Hacer `file_id` opcional (no requerido para este análisis). Extraer parámetros: `delta`, `sigma`, `alpha`, `power`, `alternative_hypothesis`, `current_mean`, `expected_mean`. |
| `/constants/analysis.ts` | Agregar `TAMANO_MUESTRA: 'tamano_muestra'` a `ANALYSIS_TYPES` |
| `/types/analysis.ts` | Agregar `TamanoMuestraResult` interface. Agregar `'tamano_muestra'` al union type `AnalysisType`. |
| `/lib/openai/tools.ts` | Agregar `'tamano_muestra'` al enum de `analysis_type`. Agregar propiedades para parámetros de tamaño de muestra (`delta`, `sigma`, `alpha`, `power`, `alternative_hypothesis`, `current_mean`, `expected_mean`). Hacer `file_id` condicional (no requerido para `tamano_muestra`). |
| `/lib/api/analyze.ts` | Actualizar `invokeAnalysisTool` para aceptar parámetros de tamaño de muestra. Hacer `fileId` opcional. |

### Base de Datos

No se requieren cambios de esquema. La tabla `analysis_results` ya soporta diferentes `analysis_type` y almacena resultados en JSONB. Para `tamano_muestra`, `file_id` será null.

### Flujo del Análisis

```
1. Usuario pide calcular tamaño de muestra en el chat
2. Agente reconoce intención de cálculo de tamaño de muestra
3. Agente explica las 4 variables clave (Delta, Alfa, Poder, Sigma)
4. Agente pregunta una por una (con coaching):
   a) Media actual → espera respuesta
   b) Media esperada → espera respuesta
   c) Delta → calcula desde a) y b), pide confirmación → espera respuesta
   d) Sigma → espera respuesta (ayuda si no sabe)
   e) Alfa → sugiere 0.05 → espera respuesta
   f) Poder → sugiere 80% → espera respuesta
   g) Bilateral/Unilateral → sugiere bilateral → espera respuesta
5. Agente invoca tool: analyze(
     analysis_type='tamano_muestra',
     delta=0.4,
     sigma=0.6,
     alpha=0.05,
     power=0.80,
     alternative_hypothesis='two-sided',
     current_mean=15.2,
     expected_mean=14.8
   )
   Nota: NO se envía file_id
6. Python calcula:
   a. n por grupo (fórmula estándar)
   b. Clasificación (≥30 / 15-29 / <15)
   c. Sensibilidad (delta/2, poder 90%, sigma×2)
7. Python retorna { results, instructions }
   Nota: NO hay chartData
8. Agente presenta resultados estructurados:
   - Parámetros utilizados
   - n por grupo
   - Evaluación/clasificación
   - Tabla de sensibilidad
   - Recomendaciones estratégicas
9. Agente disponible para preguntas de seguimiento ("¿y si sigma es 0.8?")
   → Re-invoca cálculo con parámetros modificados
```

---

## Estructura de Respuesta Python

```python
{
    "results": {
        "input_parameters": {
            "current_mean": 15.2,       # Puede ser null
            "expected_mean": 14.8,      # Puede ser null
            "delta": 0.4,
            "sigma": 0.6,
            "alpha": 0.05,
            "power": 0.80,
            "alternative_hypothesis": "two-sided"
        },
        "sample_size": {
            "n_per_group": 36,
            "z_alpha": 1.96,            # Z_{α/2} para bilateral, Z_α para unilateral
            "z_beta": 0.842,
            "formula_used": "bilateral"  # "bilateral" o "unilateral"
        },
        "classification": {
            "category": "adequate",      # "adequate" | "verify_normality" | "weak"
            "message": "El tamaño de muestra es ≥ 30. Aplica el Teorema Central del Límite."
        },
        "sensitivity": [
            {
                "scenario": "delta_half",
                "label": "Δ reducida a la mitad",
                "params_changed": {"delta": 0.2},
                "n_per_group": 142
            },
            {
                "scenario": "power_90",
                "label": "Poder al 90%",
                "params_changed": {"power": 0.90},
                "n_per_group": 48
            },
            {
                "scenario": "sigma_double",
                "label": "Variabilidad duplicada",
                "params_changed": {"sigma": 1.2},
                "n_per_group": 142
            }
        ]
    },
    "chartData": null,
    "instructions": "..."
}
```

### TypeScript Interface

```typescript
interface TamanoMuestraResult {
  input_parameters: {
    current_mean: number | null
    expected_mean: number | null
    delta: number
    sigma: number
    alpha: number
    power: number
    alternative_hypothesis: 'two-sided' | 'greater' | 'less'
  }
  sample_size: {
    n_per_group: number
    z_alpha: number
    z_beta: number
    formula_used: 'bilateral' | 'unilateral'
  }
  classification: {
    category: 'adequate' | 'verify_normality' | 'weak'
    message: string
  }
  sensitivity: Array<{
    scenario: string
    label: string
    params_changed: Record<string, number>
    n_per_group: number
  }>
}
```

---

## Criterios de Aceptación

### Flujo Conversacional
- [ ] Agente reconoce intención de cálculo de tamaño de muestra
- [ ] Agente explica las 4 variables en lenguaje simple antes de preguntar
- [ ] Agente hace preguntas una por una, esperando respuesta
- [ ] Agente calcula delta desde medias y pide confirmación
- [ ] Agente sugiere defaults para alfa (0.05) y poder (80%) con explicación
- [ ] Agente pregunta bilateral vs unilateral
- [ ] Agente ayuda a estimar sigma si el usuario no lo conoce
- [ ] No se requiere upload de archivo

### Cálculo
- [ ] n calculado correctamente para caso bilateral (verificado contra Minitab/G*Power)
- [ ] n calculado correctamente para caso unilateral (verificado contra Minitab/G*Power)
- [ ] n redondeado hacia arriba (ceiling)
- [ ] n indicado claramente como POR GRUPO
- [ ] Z-scores calculados con scipy.stats.norm.ppf

### Evaluación
- [ ] n ≥ 30 → mensaje de TCL adecuado
- [ ] 15 ≤ n < 30 → mensaje de verificar normalidad
- [ ] n < 15 → advertencia de muestra débil

### Sensibilidad
- [ ] Se calculan al menos 3 escenarios alternativos
- [ ] Escenarios incluyen delta reducida, poder aumentado, sigma aumentada
- [ ] Valores de n son correctos para cada escenario
- [ ] Se presenta tabla con números reales, no estimaciones cualitativas

### Recomendaciones
- [ ] Explica impacto de cambiar delta
- [ ] Explica impacto de cambiar poder
- [ ] Advierte sobre variabilidad
- [ ] Sugiere aumentar muestra si n es bajo
- [ ] Sugiere verificar estabilidad del proceso
- [ ] Referencia al Test de Hipótesis 2 Muestras para cuando tenga datos

### Seguimiento
- [ ] Agente responde preguntas "¿y si...?" re-invocando cálculo
- [ ] Agente nunca ejecuta el test de hipótesis desde este flujo

### Edge Cases
- [ ] Delta = 0 → error claro ("la diferencia no puede ser cero")
- [ ] Sigma = 0 → error claro ("la variabilidad no puede ser cero")
- [ ] Sigma negativo → error claro
- [ ] Delta negativo → tomar valor absoluto
- [ ] Alpha fuera de rango (≤0 o ≥1) → error claro
- [ ] Poder fuera de rango (≤0 o ≥1) → error claro
- [ ] Delta muy pequeño / sigma muy grande → n muy grande → advertir que puede no ser práctico
- [ ] Parámetros que dan n = 1 o n = 2 → advertir que es insuficiente
- [ ] Usuario no conoce sigma → agente guía la estimación
- [ ] Usuario quiere cambiar un parámetro después de ver resultados → re-cálculo sin repetir todo

---

## Decisiones Tomadas

1. **Solo 2 muestras:** Este cálculo es exclusivamente para comparación de dos medias independientes. No cubre 1 muestra, proporciones, ni ANOVA.

2. **Entrada conversacional:** No hay archivo ni plantilla. Todos los parámetros se recolectan vía chat, uno por uno, con coaching del agente.

3. **Salida texto:** No hay gráficos ni visualizaciones. Los resultados se presentan en markdown (tablas y texto). `chartData` retorna null.

4. **Bilateral y unilateral:** El agente pregunta al usuario si la prueba futura será bilateral o unilateral, ya que afecta la fórmula y el n resultante. Default: bilateral.

5. **Sensibilidad cuantitativa:** Python calcula n real para escenarios alternativos (delta/2, poder 90%, sigma×2) y retorna números concretos, no explicaciones cualitativas.

6. **Defaults sugeridos:** α = 0.05 y poder = 80% se sugieren si el usuario no sabe, con explicación en lenguaje de negocio. El agente no los asume sin preguntar.

7. **file_id opcional:** Para mantener consistencia con el endpoint existente `/api/analyze`, se hace `file_id` opcional. Para `tamano_muestra`, se envía sin `file_id`.

8. **No ejecuta test:** El análisis nunca procede a ejecutar el test de hipótesis. Si el usuario lo pide, se le redirige al análisis de "Hipótesis 2 Muestras."

9. **Sin plantilla en /plantillas:** No se agrega entrada a la sección de Plantillas ya que no hay archivo descargable. El análisis se lista en las capacidades del agente.

---

## Próximos Pasos

1. **Revisar y aprobar este PRD** con Setec
2. **Actualizar architecture decisions** para el patrón de análisis sin archivo
3. **Crear epics y stories** para implementación
4. **Implementar calculadora Python** con tests contra valores conocidos de Minitab/G*Power
5. **Integrar con flujo de chat** existente (routing, tool definition, agente)

---

*Documento generado como PRD para Cálculo de Tamaño de Muestra — Setec AI Hub*
