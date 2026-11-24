# Plan de pruebas

Pruebas ágiles: se escriben antes que el código (TDD) y corren en cada cambio (CI).

| Nivel | Qué verifica | Herramienta | Dónde |
|---|---|---|---|
| Unitarias | Reglas puras: costos, pronóstico, optimización, consumo, panel | Vitest | `server/__tests__`, `web/src/__tests__` |
| Integración (API) | Rutas, sesión, transacciones y aislamiento | Vitest + Supertest | `server/__tests__/hu*.test.js` |
| Funcionales | Criterios de aceptación en pantalla | React Testing Library | `web/src/__tests__/hu*.test.jsx` |
| Sistema | Del registro del negocio al panel | Supertest | `tec04-sistema.test.js` |
| No funcionales | Rendimiento, recuperación y seguridad | Vitest | `tec03-no-funcionales.test.js` |
| Aceptación | Demostración con la propietaria o el grupo | Manual | Acta en `docs/retro` |

**Reglas:** cada prueba cita su criterio (CA-n); cada archivo usa una base temporal; nada se integra en rojo;
un error encontrado se reproduce primero con una prueba.

**Ciclos TDD con refactorización:** HU-03, HU-04, HU-06 y HU-07 (uno por integrante).

**Riesgos cubiertos:** datos cruzados entre negocios, precios alterados desde el navegador, ventas sin
descuento de insumos, doble anulación, pedidos por encima del inventario y archivos dañados.
