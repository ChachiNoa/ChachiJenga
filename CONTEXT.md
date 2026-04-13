# 📋 CONTEXT.md — ChachiJenga

> **⚠️ LEE ESTE ARCHIVO ANTES DE HACER CUALQUIER CAMBIO.**
> Este documento es la fuente de verdad del proyecto. Actualízalo cuando haya nuevas convenciones, utilidades comunes o cambios de arquitectura.

---

## 🎮 Descripción del Proyecto

**ChachiJenga** es un juego móvil 1v1 basado en Jenga con minijuegos de dibujo. Los jugadores se emparejan aleatoriamente y se turnan para extraer piezas de una torre. Para extraer una pieza, el jugador debe completar 3 fases de dibujo contra reloj. La dificultad depende de la posición de la pieza (pero el jugador no lo sabe de antemano).

### Mecánica Core
- Torre de 54 piezas (18 capas × 3) con vista isométrica 2.5D
- Al seleccionar una pieza → pantalla de dibujo separada
- En cada fase, todas las formas (SVGs) aparecen dispersas aleatoriamente por la pantalla
- El usuario dibuja en cualquier orden y en cualquier parte de la pantalla
- Reconocimiento automático al levantar el dedo → matching contra formas pendientes
- Timer global de 45s, penalización constante de -4s por error
- Dificultad oculta: las piezas NO muestran indicador visual de dificultad
- El rival ve los trazos del oponente en tiempo real (streaming vía Socket.io)

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Vite + React | - |
| UI Components | shadcn/ui | - |
| Estilos | Tailwind CSS (tonos pasteles) | - |
| Game Rendering | HTML5 Canvas | - |
| Backend | Node.js + Express | - |
| Real-time | Socket.io | - |
| Base de Datos | SQLite (better-sqlite3) | - |
| Auth | Google OAuth 2.0 + JWT | - |
| Reconocimiento | $P Point-Cloud Recognizer | - |
| Testing Frontend | Vitest + React Testing Library | - |
| Testing Backend | Jest | - |
| i18n | react-i18next + i18next | - |
| Plataforma | PWA (Progressive Web App) | - |

> **Nota:** Actualiza la columna "Versión" cuando se instalen las dependencias.

---

## 📁 Estructura del Proyecto

```
ChachiJenga/
├── client/               # Frontend (Vite + React PWA)
│   ├── src/
│   │   ├── components/   # Componentes del juego (Tower, DrawingCanvas, etc.)
│   │   ├── components/ui/# Componentes shadcn/ui (auto-generados)
│   │   ├── screens/      # Pantallas (Login, Home, Tower, Drawing, Watch, Summary)
│   │   ├── game/         # Lógica del juego (GameState, PhaseManager, etc.)
│   │   ├── drawing/      # Reconocimiento de formas ($P wrapper, shapes)
│   │   ├── network/      # Socket.io + API REST
│   │   ├── hooks/        # React hooks (useSocket, useGameState, useTimer)
│   │   ├── i18n/         # Configuración i18n + traducciones
│   │   │   ├── index.js  # Config de i18next
│   │   │   └── locales/  # JSON por idioma (es.json, en.json, ...)
│   │   ├── __tests__/    # Tests unitarios (TDD)
│   │   └── utils/        # Audio, animaciones
│   └── public/assets/
│       ├── shapes/       # SVGs de las formas
│       ├── sounds/       # SFX
│       └── icons/        # Iconos PWA
├── server/               # Backend (Node.js + Express)
│   ├── auth/             # Google OAuth + JWT
│   ├── game/             # GameRoom, TowerModel, DrawingValidator
│   ├── matchmaking/      # Cola de matchmaking
│   ├── scoring/          # PointCalculator, EloCalculator
│   ├── ranking/          # API de ranking
│   ├── db/               # SQLite setup, schema, queries
│   └── __tests__/        # Tests del servidor (TDD)
└── shared/               # Código compartido (constantes, tipos de eventos)
```

---

## 🎨 Convenciones de Código

### General
- **Idioma del código**: Inglés (variables, funciones, componentes, comentarios)
- **Idioma de la UI**: Multiidioma via i18n (por defecto español)
- **Extensiones**: `.jsx` para componentes React, `.js` para lógica pura
- **Nombres de archivo**: PascalCase para componentes (`Tower.jsx`), camelCase para utilidades (`strokeUtils.js`)

### React
- Componentes funcionales con hooks (no clases)
- Un componente por archivo
- Props destructuradas en la firma de la función
- Custom hooks en `src/hooks/` con prefijo `use`

### Estilos
- **Tailwind CSS** con paleta de tonos pasteles definida en `tailwind.config.js`
- Usar clases de Tailwind directamente, no CSS custom salvo excepciones justificadas
- Componentes shadcn/ui para UI estándar (botones, cards, dialogs, tables, etc.)
- Canvas HTML5 para el juego (torre isométrica y dibujo)

### Internacionalización (i18n)
- Usar **react-i18next** con `useTranslation()` hook
- **NUNCA** escribir texto hardcodeado en la UI. Siempre usar claves de traducción: `t('home.findMatch')`
- Archivos de traducción en `src/i18n/locales/{lang}.json`
- Claves agrupadas por pantalla/feature: `login.*`, `home.*`, `game.*`, `drawing.*`, `summary.*`, `settings.*`, `common.*`
- Idioma por defecto: `es` (español)
- Selector de idioma disponible en: **LoginScreen** y **Settings**
- El idioma seleccionado se persiste en `localStorage`

### Backend
- Express con async/await (no callbacks)
- Validación de inputs en los endpoints
- Queries SQL preparadas (no interpolación de strings)
- Errores con códigos HTTP apropiados

### Testing (TDD)
- **Escribir tests ANTES del código de producción**
- Archivos de test junto al código: `__tests__/NombreModulo.test.js`
- Naming: `describe('NombreModulo')` → `it('should ...')`
- Frontend: Vitest + React Testing Library
- Backend: Jest

---

## ⚙️ Workflow Obligatorio

### Antes de cada commit
1. ✅ Comprobar que **no hay errores de compilación**: `npm run build` (client) o verificar que el server arranca
2. ✅ Comprobar que **no hay errores de ESLint**: `npm run lint` (cuando esté configurado)
3. ✅ Comprobar que **todos los tests pasan**: `npm test`
4. ✅ Verificar que no hay `console.log` de debug olvidados

### Commits — UNA TASK = UN COMMIT
- **Cada checkbox individual `- [ ]` del TODO es un commit separado a `main`**
- **NUNCA agrupar varias tasks en un solo commit** — aunque parezcan relacionadas
- Hacer commit **inmediatamente después** de completar cada task, no al final de una sección o fase
- Ejemplo: si el TODO tiene 3 checkboxes en "Setup del Proyecto", son 3 commits separados, no 1
- Formato del mensaje de commit: `tipo(scope): descripción breve`
  - Tipos: `feat`, `fix`, `test`, `refactor`, `style`, `docs`, `chore`
  - Scope: área del proyecto (`auth`, `tower`, `drawing`, `matchmaking`, `scoring`, `ui`, `i18n`, etc.)
  - Ejemplo: `feat(setup): initialize Vite + React client project`
  - Ejemplo: `feat(i18n): add Spanish and English translation files`
  - Ejemplo: `test(scoring): add PointCalculator unit tests`

### Al actualizar CONTEXT.md
Actualizar este archivo cuando:
- Se añadan nuevas convenciones o patrones
- Se creen utilidades comunes reutilizables
- Haya cambios de arquitectura
- Se instalen nuevas dependencias (actualizar tabla de versiones)
- Se descubran gotchas o problemas conocidos

---

## 🔧 Utilidades Comunes

> Esta sección se irá llenando a medida que se desarrollen utilidades reutilizables.

| Utilidad | Ubicación | Descripción |
|----------|-----------|-------------|
| `useTranslation()` | react-i18next | Hook para traducir textos. `const { t } = useTranslation()` → `t('key')` |

_Añadir aquí más funciones helper, hooks, o patrones que se reutilicen en múltiples partes del proyecto._

---

## 🐛 Gotchas y Problemas Conocidos

> Esta sección documenta problemas conocidos y sus soluciones.

_Añadir aquí cualquier bug, workaround, o comportamiento inesperado que se descubra durante el desarrollo._

---

## 📊 Sistema de Puntuación (Referencia Rápida)

| Resultado | Fórmula |
|-----------|---------|
| **Victoria** | Σ puntos_pieza + 100 |
| **Derrota** | max(Σ puntos_pieza - 50, -50) |
| **Forfeit** | -75 |
| **Empate** | Σ puntos_pieza × 0.6 + bonus_dificultad |

| Pieza | Puntos | Bonus empate |
|-------|--------|-------------|
| Fácil | 10 | +0 |
| Media | 25 | +3 |
| Difícil | 50 | +8 |

### ELO
- K = 32 (<30 partidas) | 24 (30-100) | 16 (>100)
- ELO mínimo: 100
- Forfeit: penalización ×1.2

---

## 🔗 Documentos Relacionados

- [Plan de Implementación](./implementation_plan.md) — en el directorio de artefactos
- [TODO / Task List](./task.md) — en el directorio de artefactos
