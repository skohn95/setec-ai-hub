# Política de Privacidad y Manejo de Datos

**Setec AI Hub — Plataforma de Análisis Estadístico**

*Documento para clientes empresariales*
*Última actualización: 2026-02-02*

---

## Resumen Ejecutivo

Setec AI Hub es una plataforma de análisis estadístico que ayuda a profesionales de Lean Six Sigma a realizar análisis de datos sin necesidad de software especializado como Minitab.

**Compromiso principal:** Los datos operacionales que subes a la plataforma (archivos Excel con mediciones, parámetros de proceso, etc.) **nunca se envían a proveedores externos de inteligencia artificial**. Tus datos crudos permanecen en nuestros servidores.

---

## ¿Cómo Funciona la Plataforma?

1. Subes un archivo Excel con tus datos de medición
2. Nuestro servidor procesa los datos y calcula los resultados estadísticos
3. Solo los **resultados agregados** (porcentajes, métricas, clasificaciones) se envían a la IA para generar explicaciones
4. Recibes los resultados con interpretación y recomendaciones

**Punto clave:** La inteligencia artificial nunca ve tus datos originales — solo ve los resultados ya calculados.

---

## ¿Qué Datos se Recopilan?

| Tipo de Dato | Ejemplo | ¿Se almacena? |
|--------------|---------|---------------|
| Credenciales de acceso | Email, contraseña | ✅ Sí (cifrado) |
| Archivos Excel subidos | Datos de medición MSA | ✅ Sí (cifrado) |
| Historial de conversaciones | Preguntas y respuestas | ✅ Sí |
| Resultados de análisis | Métricas calculadas | ✅ Sí |

---

## ¿Dónde se Almacenan los Datos?

Utilizamos **Supabase** como proveedor de infraestructura:

- **Base de datos:** PostgreSQL gestionado por Supabase
- **Archivos:** Supabase Storage
- **Ubicación física:** Centro de datos en Estados Unidos (configurable a Europa si se requiere)
- **Certificaciones de Supabase:** SOC 2 Type II, HIPAA eligible

### Medidas de Seguridad

| Medida | Detalle |
|--------|---------|
| Cifrado en tránsito | TLS 1.2+ (HTTPS) |
| Cifrado en reposo | AES-256 para todos los datos almacenados |
| Autenticación | Supabase Auth con hash seguro de contraseñas |
| Aislamiento | Cada usuario solo puede acceder a sus propios datos |

---

## ¿Qué Ve la Inteligencia Artificial?

Utilizamos la API de OpenAI para generar interpretaciones y explicaciones. Es importante entender qué información se comparte:

### ❌ Lo que OpenAI NO recibe:

- Archivos Excel originales
- Datos crudos de mediciones
- Valores individuales de tu proceso
- Información identificable de tu empresa o productos

### ✅ Lo que OpenAI SÍ recibe:

- Resultados estadísticos agregados (ej: "variación del sistema: 18.2%")
- Clasificaciones (ej: "categoría marginal")
- Tu conversación con el asistente (preguntas de seguimiento)

### Política de Datos de OpenAI

- OpenAI **no utiliza datos de la API para entrenar sus modelos** (política vigente desde marzo 2023)
- Los datos se retienen por 30 días únicamente para monitoreo de abuso
- Referencia oficial: [openai.com/enterprise-privacy](https://openai.com/enterprise-privacy)

---

## Ejemplo Práctico

Imagina que subes un archivo con 500 mediciones de tu proceso de manufactura:

```
Lo que tú subes:
┌─────────────────────────────────────┐
│ Parte  │ Operador │ Rep1  │ Rep2   │
│ P001   │ Juan     │ 10.23 │ 10.25  │
│ P002   │ María    │ 10.18 │ 10.21  │
│ ...    │ ...      │ ...   │ ...    │
│ (500 filas de datos)               │
└─────────────────────────────────────┘

Lo que procesa nuestro servidor:
→ Cálculos estadísticos (Python)
→ Genera: "Variación total: 18.2%, Repetibilidad: 12%, Reproducibilidad: 6%"

Lo que ve OpenAI:
→ "Variación total: 18.2%, categoría marginal"
→ Tu pregunta: "¿Cómo puedo mejorar?"

Lo que OpenAI NO ve:
→ Ninguna de las 500 filas de datos originales
→ Ningún nombre de operador o identificador de parte
```

---

## Retención de Datos

| Dato | Período de Retención |
|------|---------------------|
| Conversaciones | Indefinido (hasta eliminación por usuario) |
| Archivos subidos | Indefinido (hasta eliminación por usuario) |
| Credenciales | Mientras la cuenta esté activa |

**Eliminación de datos:** Puedes solicitar la eliminación completa de tu cuenta y todos los datos asociados contactando a Setec.

---

## Aislamiento Entre Usuarios

- Cada usuario tiene acceso únicamente a sus propias conversaciones y archivos
- Los administradores de Setec pueden ver la lista de usuarios pero **no pueden acceder** al contenido de conversaciones ni archivos
- La base de datos utiliza Row Level Security (RLS) para garantizar el aislamiento a nivel técnico

---

## Preguntas Frecuentes

### ¿Mis competidores podrían ver mis datos?
No. Cada usuario está completamente aislado. No hay forma de que un usuario acceda a datos de otro.

### ¿OpenAI podría usar mis datos para entrenar su IA?
No. La API empresarial de OpenAI no utiliza datos de clientes para entrenamiento. Esta es su política desde marzo 2023.

### ¿Dónde están físicamente mis datos?
En centros de datos de Amazon Web Services (AWS) en Estados Unidos, gestionados por Supabase. Si tu organización requiere datos en Europa, podemos configurarlo.

### ¿Qué pasa si hay una brecha de seguridad?
Supabase mantiene certificación SOC 2 Type II, lo que significa auditorías regulares de seguridad. En caso de cualquier incidente, notificaríamos a los usuarios afectados de acuerdo con las regulaciones aplicables.

### ¿Puedo obtener una copia de mis datos?
Sí. Puedes solicitar una exportación completa de tus conversaciones y archivos contactando a Setec.

### ¿Cumplen con GDPR?
La arquitectura de la plataforma está diseñada para facilitar el cumplimiento con GDPR (datos en Europa disponible bajo solicitud, derecho a eliminación, portabilidad de datos). Contacta a Setec para discutir requisitos específicos de tu organización.

---

## Contacto

Para preguntas sobre privacidad y manejo de datos:

**Setec**
- Email: [contacto@setec.com]
- Teléfono: [número de contacto]

---

*Este documento describe las prácticas de manejo de datos de Setec AI Hub. Para la política de privacidad legal completa, consulta [enlace a política legal cuando esté disponible].*
