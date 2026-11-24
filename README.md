# Sazón · Plataforma web para negocios gastronómicos

Cada negocio tiene su tienda pública, sus datos aislados y un sistema conectado: cada venta, compra,
pedido o ajuste mueve el inventario, los costos, el panel y el plan de producción, en tiempo real.

Proyecto académico. Los datos de demostración son **simulados**.

## Cómo ejecutarlo

Requiere Node.js 22.13 o superior. La base de datos (SQLite) viene incluida en Node.

```bash
npm install
npm run seed   # reemplaza los datos por dos negocios de demostración (desde HU-12)
npm run dev    # web en http://localhost:5173 y API en http://localhost:3001
```

Cuentas de demostración: `fritos@demo.co` y `jugos@demo.co`, contraseña `demo12345`.

## Verificaciones (las mismas del CI)

```bash
npm run lint
npm test
npm run build
```

## Arquitectura

```text
web (React + Vite) ──apiClient──> server (Express) ──repo.js──> SQLite
      ^                                 |
      └──────── avisos en vivo (SSE) ───┘
```

- `server/modules/`: una carpeta por módulo; se cargan solas.
- `server/modules/inventario/libro.js`: única forma de cambiar el stock.
- `server/modules/persistencia/repo.js`: única capa que conoce la base de datos.
- `web/src/modules/`: una carpeta por pantalla; se cargan solas.
- `docs/`: backlog, plan de pruebas, decisiones y retrospectivas.

## Flujo

`main` (versiones) ← `develop` (integración) ← `feature/…`. Todo entra por pull request, con revisión
y CI en verde. Al subir una etiqueta `vX.Y`, GitHub Actions publica la versión.

## Integrantes

| Integrante | Historias |
|---|---|
| Angie | Base y CI, HU-01, HU-02, HU-07, HU-10, HU-19, HU-28 |
| Edwar | HU-03, HU-09, HU-12, HU-14, HU-21, HU-24, TEC-03 |
| Ireth | HU-04, HU-08, HU-13, HU-20, HU-22, TEC-01, TEC-04 |
| Ivan | HU-05, HU-06, HU-11, HU-18, HU-23, HU-27, TEC-02 |
