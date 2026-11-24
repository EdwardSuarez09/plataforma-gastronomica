# Sazón · Plataforma web para negocios gastronómicos

Cada negocio que se registra tiene su propia tienda pública, sus datos aislados y su sistema de
predicción: pronóstico de demanda y plan de producción con programación lineal.

Proyecto académico. Los datos de demostración son **simulados**.

## Cómo ejecutarlo

Requiere Node.js 22 o superior.

```bash
npm install
npm run seed   # dos negocios de demostración (disponible desde HU-12; reemplaza server/data)
npm run dev    # web en http://localhost:5173 y API en http://localhost:3001
```

Cuentas de demostración: `fritos@demo.co` y `jugos@demo.co`, contraseña `demo12345`.

## Verificaciones (las mismas que corre el CI)

```bash
npm run lint
npm test
npm run build
```

## Estructura

```text
server/            API REST con Express
  middleware/      sesión (JWT), aislamiento por negocio y errores
  modules/         una carpeta por módulo; app.js los carga automáticamente
  data/            archivos JSON: global/ y negocios/<id>/ (no se versionan)
web/               React + Vite
  src/modules/     una carpeta por pantalla; App.jsx las carga automáticamente
  src/services/    apiClient: único acceso a la API
docs/BACKLOG.md    product backlog, sprint backlogs y acuerdos
```

## Flujo de ramas

`main` (versiones entregadas) ← `develop` (integración) ← `feature/hu-XX-nombre`.
Todo entra por pull request, con revisión de otro integrante y CI en verde.

## Integrantes

| Integrante | Historias |
|---|---|
| Angie | Base y CI, HU-01, HU-02, HU-07, HU-10 |
| Edwar | HU-14, HU-03, HU-12 |
| Ireth | HU-04, HU-08, HU-13 |
| Ivan | HU-05, HU-06, HU-11 |
