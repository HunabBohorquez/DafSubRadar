# SubRadar — Radar Inteligente de Suscripciones y Gastos Hormiga

> **Enlaces del proyecto**

**Link:** ` `

**Repositorio en GitHub:** ` `

> 📝 **Nota:** este proyecto tiene los **mismos archivos** que el repositorio de GitLab
> (`index.html`, `styles.css`, `app.js`, `README.md`). Solo cambia la plataforma de alojamiento.

---

## Descripción del Proyecto

**SubRadar** es una aplicación web frontend desarrollada íntegramente con **HTML5, CSS3 y JavaScript ES6+ Vanilla** (cero frameworks y cero librerías externas). Su objetivo es visibilizar el impacto real de las suscripciones digitales y gastos recurrentes normalizándolos en métricas diarias, mensuales y anuales, además de ofrecer un simulador de cancelación y un motor de auditoría local sobre archivos CSV bancarios.

### Características Principales
- **Gestor CRUD Completo:** Alta, edición y eliminación de suscripciones con persistencia automática en `localStorage` y exportación a `.json`.
- **Normalizador de Impacto Financiero:** Conversión en tiempo real utilizando factores anuales exactos (`Semanal × 52`, `Mensual × 12`, `Bimestral × 6`, `Anual × 1`).
- **Simulador "¿Cuánto ahorro si cancelo?":** Permite marcar múltiples servicios mediante el interruptor *"Simular baja"* para calcular el flujo mensual y anual liberado antes de cancelar definitivamente.
- **Visualización Nativa en `<canvas>`:** Gráfico de dona con soporte HiDPI (`devicePixelRatio`) que desglosa porcentualmente el gasto anual por categoría.
- **Detector Local de Recurrencias en CSV:** Procesamiento 100% client-side en memoria del navegador para garantizar privacidad financiera total.

---

## Explicación del Algoritmo de Detección en CSV (`CsvPatternDetector`)

El módulo `CsvPatternDetector` opera en cuatro fases sin realizar peticiones de red:

1. **Normalización y Parsing (`parseCsv`):** Lee el texto del archivo CSV con columnas `fecha,comercio,monto`, descarta encabezados, normaliza el nombre del comercio en minúsculas como clave de agrupación y extrae el identificador `AAAA-MM` de cada fecha (compatible con formatos `YYYY-MM-DD` y `DD/MM/YYYY`).
2. **Filtrado de Recurrencia Intermensual (`detectRecurrences`):** Agrupa todos los cargos por comercio, los ordena cronológicamente y construye un conjunto (`Set`) de meses distintos. Solo los comercios presentes en **2 o más meses calendario diferentes** se consideran recurrentes (descartando compras únicas o múltiples compras aisladas dentro de un mismo mes).
3. **Cálculo de Promedio y Detección de Inflación Silenciosa:** Calcula el promedio mensual (`suma de cargos ÷ cantidad de meses distintos`) y compara el primer cargo cronológico contra el último (`lastCharge > firstCharge`). Si detecta un incremento, calcula el porcentaje exacto de aumento y emite una alerta visual.
4. **Inferencia de Categoría e Importación:** Asigna automáticamente una categoría sugerida mediante expresiones regulares sobre el nombre del comercio y permite importarlo al catálogo principal con un clic.

---

## Instrucciones de Ejecución

1. Descarga o guarda los 4 archivos (`index.html`, `styles.css`, `app.js`, `README.md`) dentro de una misma carpeta.
2. Haz doble clic sobre `index.html` para abrirlo directamente en cualquier navegador moderno (Chrome, Firefox, Edge, Safari) o sírvelo mediante cualquier servidor estático local (por ejemplo, `npx serve .` o Live Server).
3. No requiere instalación de dependencias ni compilación.

---

## Pruebas Verificables

### Prueba 1: Carga de Datos Demo (`Cargar Datos Demo`)
Al presionar **Cargar Datos Demo**, se cargan 8 suscripciones con las siguientes proyecciones anuales exactas:

| Servicio | Categoría | Monto | Periodicidad | Factor | Proyección Anual |
| :--- | :--- | ---: | :--- | :---: | ---: |
| Netflix Premium | Streaming | $299.00 | Mensual | ×12 | $3,588.00 |
| Spotify Duo | Streaming | $169.00 | Mensual | ×12 | $2,028.00 |
| Google AI Pro / Cloud | Software/Nube | $399.00 | Mensual | ×12 | $4,788.00 |
| Microsoft 365 Personal | Software/Nube | $1,749.00 | Anual | ×1 | $1,749.00 |
| Smart Fit Black | Salud/Gimnasio | $599.00 | Mensual | ×12 | $7,188.00 |
| Agua Purificada Semanal | Servicios | $110.00 | Semanal | ×52 | $5,720.00 |
| Recibo de Luz CFE | Servicios | $650.00 | Bimestral | ×6 | $3,900.00 |
| Club Café de Especialidad | Otro | $420.00 | Bimestral | ×6 | $2,520.00 |

- **Proyección de Gasto Anual Total esperado:** `$31,481.00`
- **Gasto Mensual Equivalente esperado (`$31,481.00 ÷ 12`):** `$2,623.42`
- **Gasto Diario Equivalente esperado (`$31,481.00 ÷ 365`):** `$86.25`
- **Desglose por categoría en el gráfico `<canvas>`:**
  - Servicios: `$9,620.00` (`30.6%`)
  - Salud/Gimnasio: `$7,188.00` (`22.8%`)
  - Software/Nube: `$6,537.00` (`20.8%`)
  - Streaming: `$5,616.00` (`17.8%`)
  - Otro: `$2,520.00` (`8.0%`)

### Prueba 2: Detector Local con CSV Sintético (`Cargar CSV Sintético de Prueba`)
Al ejecutar el análisis sobre el CSV sintético integrado (13 movimientos), el algoritmo descarta `Cafeteria El Grano` (2 cargos en el mismo mes `2026-09`) y `Ferreteria Central` (1 solo mes `2026-10`), detectando exactamente **4 comercios recurrentes**:

1. **Totalplay Fibra:** 2 meses distintos (`2026-08`, `2026-09`) · Promedio mensual: `$679.00` (`$8,148.00/año`) · **Alerta de subida (+6.1%)**: de `$659.00` a `$699.00`.
2. **Amazon Prime:** 3 meses distintos (`2026-08`, `2026-09`, `2026-10`) · Promedio mensual: `$105.67` (`$1,268.00/año`) · **Alerta de subida (+20.2%)**: de `$99.00` a `$119.00`.
3. **Uber One:** 2 meses distintos (`2026-09`, `2026-10`) · Promedio mensual: `$70.00` (`$840.00/año`) · Tarifa estable.
4. **iCloud+ 200GB:** 3 meses distintos (`2026-08`, `2026-09`, `2026-10`) · Promedio mensual: `$49.00` (`$588.00/año`) · Tarifa estable.

- **Suma anual de los 4 hallazgos si se importan al catálogo:** `$10,844.00`
- **Proyección Anual Total combinada (Datos Demo + 4 hallazgos CSV):** `$42,325.00` (`$3,527.08/mes` · `$115.96/día`).
