# Decisión 1: pasar de archivos JSON a SQLite

**Estado:** aceptada en la iteración 3.

## Problema
Una compra guarda dos cosas: la compra y el cambio de stock. Con un archivo JSON por colección, si algo
falla en medio quedan datos a medias. Con el libro de movimientos (HU-09) el riesgo crece.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| Seguir con JSON | Ya funciona | Sin transacciones; reescribe todo el archivo |
| **SQLite (`node:sqlite`)** | Transacciones, un solo archivo, sin instalar nada | Un solo servidor; aún se marca como experimental en algunas versiones de Node |
| PostgreSQL o MySQL | Muchos usuarios y servidores | Instalar y administrar un servidor; excesivo para una demostración local |
| Nube (Supabase, Firebase) | Publicación inmediata | Cuentas, internet y costos |

## Decisión
SQLite. Solo cambia `repo.js`; los demás módulos no se enteran. Cada registro se guarda como documento
JSON en la tabla `registros`.

## Consecuencias
- Transacciones reales y consultas con parámetros.
- Si el producto crece a varios servidores, se reemplaza `repo.js` por PostgreSQL.
