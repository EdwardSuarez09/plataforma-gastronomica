# Backlog y acuerdos

**Metodología:** ciclo de vida iterativo e incremental, gestionado con Kanban.
Cada iteración toma un conjunto de historias (sprint backlog) y termina con una versión funcional.

## Tablero Kanban

Pendiente → Listo → En desarrollo → En revisión → Hecho

| Política | Acuerdo |
|---|---|
| Límite WIP | 1 historia por persona en "En desarrollo"; 4 en "En revisión" |
| Listo | Tiene criterios de aceptación y sus dependencias están en `develop` |
| Hecho | Pruebas en verde, ESLint sin errores, PR revisado por otro integrante e integrado |
| Métrica | Tiempo de ciclo: desde "En desarrollo" hasta "Hecho" |
| Cadencias | Reposición al iniciar la iteración; revisión y retrospectiva al cerrarla |

**Roles:** responsable del repositorio y del flujo (Angie), calidad y datos (Edwar),
modelo de costos y optimización (Ireth), experiencia de ventas y pedidos (Ivan). Los cuatro desarrollan y revisan.

## Product backlog priorizado

| # | Historia | Prioridad | Puntos | Responsable | Iteración |
|---|---|---|---|---|---|
| 1 | HU-14 Conservar los registros (API y JSON) | Alta | 5 | Edwar | 1 |
| 2 | HU-01 Iniciar sesión y registrarse | Alta | 3 | Angie | 1 |
| 3 | HU-02 Configurar el negocio | Alta | 3 | Angie | 1 |
| 4 | HU-03 Registrar insumos y precios | Alta | 5 | Edwar | 1 |
| 5 | HU-04 Crear masas y productos con rendimiento | Alta | 8 | Ireth | 1 |
| 6 | HU-05 Registrar compras | Alta | 5 | Ivan | 1 |
| 7 | HU-06 Registrar ventas | Alta | 5 | Ivan | 1 |
| 8 | HU-07 Consultar ventas por fecha y producto | Media | 3 | Angie | 1 |
| 9 | HU-10 Tienda pública del negocio | Alta | 5 | Angie | 2 |
| 10 | HU-11 Pedidos de la tienda | Alta | 5 | Ivan | 2 |
| 11 | HU-08 Costo unitario y margen | Alta | 3 | Ireth | 2 |
| 12 | HU-12 Pronóstico de demanda | Alta | 5 | Edwar | 2 |
| 13 | HU-13 Plan de producción óptimo | Alta | 5 | Ireth | 2 |
| 14 | HU-09 Consumo y sobrantes de insumos | Media | 5 | Sin asignar | Futura |
| 15 | HU-15 Empleados y permisos por rol | Media | 5 | Sin asignar | Futura |
| 16 | HU-16 Asistente conversacional | Baja | 8 | Sin asignar | Futura |
| 17 | HU-17 Pagos en línea y domicilios | Baja | 13 | Sin asignar | Futura |

**Sprint backlog 1 (versión v1.0, gestión del negocio):** base, HU-14, HU-01, HU-02, HU-03, HU-04, HU-05, HU-06 y HU-07 (37 puntos).

**Sprint backlog 2 (versión v2.0, tienda y predicciones):** HU-10, HU-11, HU-08, HU-12 y HU-13 (23 puntos).

## Historias de la iteración 2

### HU-08 · Costo unitario y margen
**Como** propietario, **quiero** conocer cuánto me cuesta cada producto, **para** saber cuánto gano.
- **CA-1.** El costo del lote se reparte entre todas las unidades que rinde la masa.
- **CA-2.** Costo unitario = masa por unidad + insumos extra.
- **CA-3.** Veo ganancia y margen de cada producto activo.
- **CA-4.** Si cambia el precio de un insumo, el costo se recalcula.
- **CA-5.** Si falta el rendimiento de un producto, el sistema avisa.

### HU-10 · Tienda pública del negocio
**Como** cliente, **quiero** ver el menú de un negocio en su propia dirección, **para** decidir qué comprar.
- **CA-1.** Veo la lista de tiendas sin iniciar sesión.
- **CA-2.** Cada tienda (`/tienda/nombre`) muestra solo sus productos activos con precio.
- **CA-3.** El menú no expone costos, insumos ni datos del propietario.
- **CA-4.** Si la tienda no existe, se informa.

### HU-11 · Pedidos de la tienda
**Como** cliente, **quiero** hacer un pedido sin crear cuenta, **para** recogerlo en el negocio.
- **CA-1.** Armo un carrito y hago el pedido.
- **CA-2.** Debo dar nombre y teléfono válidos.
- **CA-3.** El servidor calcula precios y total; no confía en el navegador.
- **CA-4.** El negocio solo aplica transiciones válidas: recibido → confirmado → en preparación → listo → entregado.
- **CA-5.** Rechazar o cancelar exige un motivo.
- **CA-6.** Consulto el estado con mi código.
- **CA-7.** Al entregar, el pedido se convierte en una sola venta.
- **CA-8.** Otro negocio no puede ver ni cambiar mis pedidos.

### HU-12 · Pronóstico de demanda
**Como** propietario, **quiero** saber cuánto venderé los próximos 7 días, **para** prepararme.
- **CA-1.** Usa las ventas registradas e ignora las anuladas.
- **CA-2.** Lo más reciente pesa más (promedio ponderado de hasta 4 semanas).
- **CA-3.** Distingue el día de la semana.
- **CA-4.** Muestra 7 días por producto.
- **CA-5.** Con menos de 14 días de ventas no pronostica y explica cuánto falta.
- **CA-6.** Muestra el error medido contra la última semana real.
- **CA-7.** Cada negocio usa solo sus ventas.

### HU-13 · Plan de producción óptimo
**Como** propietario, **quiero** saber cuánto producir cada día, **para** ganar más con mi presupuesto.
- **CA-1.** Maximiza la ganancia sin superar el presupuesto diario.
- **CA-2.** Ningún producto supera su demanda máxima.
- **CA-3.** Si el presupuesto no alcanza para lo mínimo, indica el día y cuánto falta.
- **CA-4.** Arma el plan de 7 días a partir del pronóstico.
- **CA-5.** Compara escenarios optimista, realista y pesimista.
- **CA-6.** Sin ventas suficientes, explica por qué no se puede calcular.

## Acuerdos técnicos

| Tema | Acuerdo |
|---|---|
| Aislamiento | El `negocioId` sale siempre del token; una carpeta JSON por negocio |
| Dinero | Pesos colombianos; cifras mostradas sin decimales |
| Composición | Producto = masa + insumos extra (como el proyecto Python) |
| Venta errónea | Se anula, no se borra; sale del historial y del pronóstico |
| Stock | La compra lo aumenta; la venta aún no lo descuenta (HU-09) |
| Unidades | Se agrega `lb` a las de HU-03 porque así están los datos de referencia |
