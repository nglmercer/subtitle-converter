# Especificación: Librería de Conversión de Subtítulos

## 1\. Título

**subconv-ts**: Una librería de conversión de subtítulos universal, moderna y eficiente, escrita en TypeScript, probada con Bun y diseñada para su publicación en npm.

## 2\. Resumen del Proyecto

El objetivo de este proyecto es desarrollar una librería ligera y sin dependencias externas para convertir archivos de subtítulos entre diferentes formatos. La versión inicial se centrará en los formatos más comunes: SubRip (`.srt`) y WebVTT (`.vtt`). La librería estará escrita en TypeScript para garantizar la seguridad de tipos, utilizará el toolkit de Bun para las pruebas y el empaquetado, y se publicará en el registro de npm para un fácil acceso por parte de la comunidad de desarrolladores.

## 3\. Funcionalidades Principales

  - **Parseo de Subtítulos**: Capacidad de leer una cadena de texto en formato `.srt` o `.vtt` y convertirla en una estructura de datos interna y estandarizada.
  - **Conversión de Formatos**: Convertir la estructura de datos interna a una cadena de texto en el formato de destino (`.srt` o `.vtt`).
  - **Análisis de Subtítulos**: Analizar archivos de subtítulos para obtener información detallada como duración total, número de cues, y estadísticas.
  - **Verificación de Integridad**: Validar la estructura y consistencia de archivos de subtítulos, detectando errores comunes como solapamientos, huecos temporales, o formatos inválidos.
  - **Soporte Inicial**:
      - Entrada: SRT, VTT.
      - Salida: SRT, VTT.
  - **Interfaz Sencilla**: Exponer funciones principales `convert`, `analyze` y `validate` como puntos de entrada para una fácil integración.
  - **Sin Dependencias**: La librería no tendrá dependencias de producción (`dependencies`), solo de desarrollo (`devDependencies`).

## 4\. Estructura de Datos Interna

Para facilitar la conversión, todos los formatos de subtítulos se parsearán a una estructura de datos común.

### `SubtitleCue`

Representa un único bloque o "cue" de subtítulo.

```typescript
// src/types.ts
export interface SubtitleCue {
  /**
   * El tiempo de inicio del subtítulo en formato HH:MM:SS,mmm (para SRT) o HH:MM:SS.mmm (para VTT).
   */
  startTime: string;
  /**
   * El tiempo de fin del subtítulo en formato HH:MM:SS,mmm (para SRT) o HH:MM:SS.mmm (para VTT).
   */
  endTime: string;
  /**
   * El contenido de texto del subtítulo. Puede contener saltos de línea.
   */
  text: string;
}
```

### `SubtitleAnalysis`

Contiene información detallada sobre el análisis de un archivo de subtítulos.

```typescript
// src/types.ts
export interface SubtitleAnalysis {
  /**
   * Número total de subtítulos (cues) en el archivo.
   */
  totalCues: number;
  /**
   * Duración total del subtítulo en milisegundos.
   */
  totalDuration: number;
  /**
   * Tiempo de inicio del primer subtítulo.
   */
  startTime: string;
  /**
   * Tiempo de fin del último subtítulo.
   */
  endTime: string;
  /**
   * Duración promedio de los subtítulos en milisegundos.
   */
  averageDuration: number;
  /**
   * Subtítulo con la duración más corta.
   */
  shortestCue: SubtitleCue & { duration: number };
  /**
   * Subtítulo con la duración más larga.
   */
  longestCue: SubtitleCue & { duration: number };
  /**
   * Número de líneas de texto totales en todos los subtítulos.
   */
  totalLines: number;
  /**
   * Promedio de líneas por subtítulo.
   */
  averageLinesPerCue: number;
}
```

### `ValidationResult`

Resultado de la verificación de integridad de un archivo de subtítulos.

```typescript
// src/types.ts
export interface ValidationResult {
  /**
   * Indica si el archivo es válido o no.
   */
  isValid: boolean;
  /**
   * Lista de errores encontrados durante la validación.
   */
  errors: ValidationError[];
  /**
   * Lista de advertencias encontradas durante la validación.
   */
  warnings: ValidationWarning[];
}

export interface ValidationError {
  /**
   * Tipo de error.
   */
  type: 'INVALID_FORMAT' | 'OVERLAPPING_CUES' | 'INVALID_TIMECODE' | 'MISSING_CUE_NUMBER' | 'EMPTY_CUE';
  /**
   * Mensaje descriptivo del error.
   */
  message: string;
  /**
   * Número de línea donde se encontró el error (si aplica).
   */
  lineNumber?: number;
  /**
   * Índice del cue donde se encontró el error (si aplica).
   */
  cueIndex?: number;
}

export interface ValidationWarning {
  /**
   * Tipo de advertencia.
   */
  type: 'SHORT_DURATION' | 'LONG_DURATION' | 'GAP_BETWEEN_CUES' | 'EXCESSIVE_LINES';
  /**
   * Mensaje descriptivo de la advertencia.
   */
  message: string;
  /**
   * Número de línea donde se encontró la advertencia (si aplica).
   */
  lineNumber?: number;
  /**
   * Índice del cue donde se encontró la advertencia (si aplica).
   */
  cueIndex?: number;
}
```

## 5\. Estructura del Proyecto

El proyecto se organizará de la siguiente manera para mantener la claridad y la modularidad.

```
/
├── dist/                     # Directorio de salida del código compilado (para npm)
├── src/                      # Código fuente de la librería
│   ├── formats/              # Módulos específicos para cada formato
│   │   ├── srt.ts            # Lógica para parsear, generar y validar SRT
│   │   └── vtt.ts            # Lógica para parsear, generar y validar VTT
│   ├── utils/                # Utilidades y funciones auxiliares
│   │   ├── analyzer.ts       # Funciones de análisis de subtítulos
│   │   └── time.ts           # Utilidades para manejo de tiempo
│   ├── types.ts              # Definiciones de tipos e interfaces
│   └── index.ts              # Punto de entrada principal y funciones exportadas
├── tests/                    # Archivos de prueba
│   ├── conversion.test.ts    # Pruebas de conversión entre formatos
│   ├── analysis.test.ts      # Pruebas de análisis de subtítulos
│   └── validation.test.ts    # Pruebas de validación de integridad
├── .gitignore                # Archivos y carpetas a ignorar por Git
├── package.json              # Metadatos del proyecto y dependencias
└── tsconfig.json             # Configuración del compilador de TypeScript
```

## 6\. API Pública

La librería expondrá una API completa y clara con funcionalidades de conversión, análisis y validación.

### Funciones Principales

#### `convert(content: string, from: SubtitleFormat, to: SubtitleFormat): string`

  - **Descripción**: Función principal que convierte una cadena de subtítulos de un formato a otro.
  - **Parámetros**:
      - `content` (string): El contenido completo del archivo de subtítulos como una cadena de texto.
      - `from` (SubtitleFormat): El formato de origen. `SubtitleFormat` es un alias de tipo para `'srt' | 'vtt'`.
      - `to` (SubtitleFormat): El formato de destino.
  - **Retorno**: Una `string` con el contenido del subtítulo en el formato de destino.
  - **Errores**: Lanzará un `Error` si el formato de entrada o salida no es soportado.

#### `analyze(content: string, format: SubtitleFormat): SubtitleAnalysis`

  - **Descripción**: Analiza un archivo de subtítulos y proporciona información detallada sobre su contenido.
  - **Parámetros**:
      - `content` (string): El contenido completo del archivo de subtítulos como una cadena de texto.
      - `format` (SubtitleFormat): El formato del archivo. `'srt' | 'vtt'`.
  - **Retorno**: Un objeto `SubtitleAnalysis` con información detallada sobre el archivo.
  - **Errores**: Lanzará un `Error` si el formato no es soportado o el contenido es inválido.

#### `validate(content: string, format: SubtitleFormat): ValidationResult`

  - **Descripción**: Valida la integridad y consistencia de un archivo de subtítulos.
  - **Parámetros**:
      - `content` (string): El contenido completo del archivo de subtítulos como una cadena de texto.
      - `format` (SubtitleFormat): El formato del archivo. `'srt' | 'vtt'`.
  - **Retorno**: Un objeto `ValidationResult` con el estado de validez, errores y advertencias.
  - **Errores**: No lanza errores, todos los problemas se reportan en el resultado.

### Tipos Exportados

#### `SubtitleFormat`

```typescript
// src/index.ts
export type SubtitleFormat = 'srt' | 'vtt';
```

#### `SubtitleCue`

```typescript
// src/index.ts
export interface SubtitleCue {
  startTime: string;
  endTime: string;
  text: string;
}
```

#### `SubtitleAnalysis`

```typescript
// src/index.ts
export interface SubtitleAnalysis {
  totalCues: number;
  totalDuration: number;
  startTime: string;
  endTime: string;
  averageDuration: number;
  shortestCue: SubtitleCue & { duration: number };
  longestCue: SubtitleCue & { duration: number };
  totalLines: number;
  averageLinesPerCue: number;
}
```

#### `ValidationResult`

```typescript
// src/index.ts
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```
## 7\. Especificaciones de los Módulos

### `src/formats/srt.ts`

  - **`parseSrt(srtContent: string): SubtitleCue[]`**:
      - Debe procesar una cadena SRT completa.
      - Separará los bloques por dobles saltos de línea (`\n\n`).
      - Para cada bloque, extraerá el índice, el rango de tiempo y el texto.
      - Convertirá las marcas de tiempo con comas (`00:00:01,234`) al formato estándar definido en `SubtitleCue`.
      - Retornará un array de `SubtitleCue`.
  - **`toSrt(cues: SubtitleCue[]): string`**:
      - Recibirá un array de `SubtitleCue`.
      - Generará una cadena de texto en formato SRT.
      - Cada bloque estará numerado secuencialmente, comenzando en 1.
      - Las marcas de tiempo deben usar comas como separador de milisegundos.
  - **`validateSrtStructure(srtContent: string): ValidationResult`**:
      - Validará la estructura general del archivo SRT.
      - Verificará que cada bloque tenga un número de secuencia válido.
      - Comprobará que los rangos de tiempo estén en formato correcto.
      - Detectará solapamientos entre subtítulos consecutivos.
      - Retornará un objeto `ValidationResult` con errores y advertencias.

### `src/formats/vtt.ts`

  - **`parseVtt(vttContent: string): SubtitleCue[]`**:
      - Validará que la cadena comience con `WEBVTT`.
      - Procesará los bloques de "cue" separados por saltos de línea.
      - Ignorará metadatos o comentarios de VTT (por ahora).
      - Convertirá las marcas de tiempo con puntos (`00:00:01.234`) al formato estándar definido en `SubtitleCue`.
      - Retornará un array de `SubtitleCue`.
  - **`toVtt(cues: SubtitleCue[]): string`**:
      - Recibirá un array de `SubtitleCue`.
      - Generará una cadena de texto que comience con `WEBVTT` seguido de un salto de línea.
      - Las marcas de tiempo deben usar puntos como separador de milisegundos.
  - **`validateVttStructure(vttContent: string): ValidationResult`**:
      - Validará que el archivo comience con la cabecera `WEBVTT`.
      - Verificará que los rangos de tiempo estén en formato correcto con puntos.
      - Detectará solapamientos entre subtítulos consecutivos.
      - Comprobará la validez de los identificadores de cue si están presentes.
      - Retornará un objeto `ValidationResult` con errores y advertencias.

### `src/utils/analyzer.ts`

  - **`analyzeCues(cues: SubtitleCue[]): SubtitleAnalysis`**:
      - Recibirá un array de `SubtitleCue`.
      - Calculará la duración total del subtítulo (desde el inicio del primer cue hasta el fin del último).
      - Determinará la duración de cada cue individual.
      - Encontrará el cue con duración más corta y más larga.
      - Contará el número total de líneas de texto.
      - Calculará promedios de duración y líneas por cue.
      - Retornará un objeto `SubtitleAnalysis` con toda la información calculada.
  - **`calculateDuration(timeString: string): number`**:
      - Convertirá una cadena de tiempo (`HH:MM:SS,mmm` o `HH:MM:SS.mmm`) a milisegundos.
      - Retornará el tiempo en milisegundos como número.
  - **`formatDuration(milliseconds: number): string`**:
      - Convertirá milisegundos a formato legible (`HH:MM:SS.mmm`).
      - Útil para mostrar duraciones en formatos humanos.

## 8\. Pruebas (Testing)

  - Se utilizará el `test runner` nativo de Bun (`bun:test`).
  - Las pruebas deben cubrir los siguientes escenarios:
      - **Conversión**:
          - Conversión exitosa de SRT a VTT.
          - Conversión exitosa de VTT a SRT.
          - Manejo correcto de subtítulos con múltiples líneas de texto.
          - Parseo correcto de marcas de tiempo en ambos formatos.
          - Lanzamiento de error para formatos no soportados.
      - **Análisis**:
          - Cálculo correcto de duración total.
          - Detección correcta de subtítulos más cortos y más largos.
          - Cálculo preciso de promedios de duración y líneas.
          - Manejo de archivos con un solo subtítulo.
          - Manejo de archivos vacíos.
      - **Validación**:
          - Detección de solapamientos entre subtítulos.
          - Identificación de formatos inválidos.
          - Detección de huecos temporales entre subtítulos.
          - Validación de marcas de tiempo mal formateadas.
          - Detección de subtítulos con duración excesivamente corta o larga.
          - Identificación de subtítulos con demasiadas líneas de texto.
  - Las pruebas se ubicarán en el directorio `tests/`.
  - Se crearán archivos de prueba separados para cada módulo:
      - `conversion.test.ts`: Pruebas de conversión entre formatos.
      - `analysis.test.ts`: Pruebas de análisis de subtítulos.
      - `validation.test.ts`: Pruebas de validación de integridad.

## 9\. Empaquetado y Publicación

### `package.json`

El archivo debe estar configurado para la publicación en npm.

  - `"name"`: Nombre único del paquete (ej. `subconv-ts`).
  - `"version"`: Versión semántica (ej. `1.0.0`).
  - `"main"`: `"dist/index.js"` (punto de entrada para CommonJS).
  - `"types"`: `"dist/index.d.ts"` (archivo de definiciones de TypeScript).
  - `"files"`: `["dist"]` (directorio a incluir en la publicación).
  - **Scripts**:
      - `"test"`: `"bun test"`
      - `"build"`: `"bun build ./src/index.ts --outdir ./dist"`
      - `"prepublishOnly"`: `"bun run build"` (asegura que el código siempre se compile antes de publicar).

### Proceso de Publicación

1.  Ejecutar `bun test` para asegurar que todas las pruebas pasen.
2.  Ejecutar `npm version <patch|minor|major>` para actualizar la versión.
3.  Ejecutar `npm publish`. El script `prepublishOnly` se encargará de compilar el proyecto automáticamente.

-----