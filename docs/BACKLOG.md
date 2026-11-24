# Backlog y acuerdos

**Metodología:** ciclo de vida iterativo e incremental, gestionado con Kanban.
Cada iteración tiene su sprint backlog, termina con una versión y una retrospectiva.

## Tablero Kanban

Pendiente → Listo → En desarrollo → En revisión → Hecho

| Política | Acuerdo |
|---|---|
| WIP | 1 historia por persona en "En desarrollo" |
| Listo | Criterios claros y dependencias en `develop` |
| Hecho | Pruebas y ESLint en verde, PR revisado e integrado |
| Métrica | Tiempo de ciclo: de "En desarrollo" a "Hecho" |
| Cadencias | Reposición al iniciar; revisión y retrospectiva al cerrar |

**Roles:** Angie, repositorio y panel. Edwar, datos y calidad. Ireth, costos y optimización. Ivan, ventas y cliente.
Los cuatro desarrollan, revisan y rotan el cierre de cada iteración.

## Product backlog y sprint backlogs

| It. | Versión | Historia | Pts | Prioridad | Responsable |
|---|---|---|---|---|---|
| 1 | v0.1 | BASE Proyecto, CI y entrega continua | 3 | Alta | Angie |
| 1 | v0.1 | HU-14 Conservar los registros | 5 | Alta | Edwar |
| 1 | v0.1 | TEC-01 Sistema visual y componentes | 3 | Alta | Ireth |
| 1 | v0.1 | TEC-02 Fechas y plantillas de GitHub | 2 | Media | Ivan |
| 2 | v0.2 | HU-01 Iniciar sesión y registrarse | 3 | Alta | Angie |
| 2 | v0.2 | HU-03 Registrar insumos y precios | 5 | Alta | Edwar |
| 2 | v0.2 | HU-04 Masas, productos y rendimiento | 8 | Alta | Ireth |
| 2 | v0.2 | HU-05 Registrar compras | 5 | Alta | Ivan |
| 3 | v1.0 | HU-02 Configurar el negocio | 3 | Alta | Angie |
| 3 | v1.0 | HU-21 Base de datos SQLite | 5 | Alta | Edwar |
| 3 | v1.0 | HU-08 Costo unitario y margen | 3 | Alta | Ireth |
| 3 | v1.0 | HU-06 Registrar ventas | 5 | Alta | Ivan |
| 4 | v1.1 | HU-10 Tienda pública | 5 | Alta | Angie |
| 4 | v1.1 | HU-12 Pronóstico de demanda | 5 | Alta | Edwar |
| 4 | v1.1 | HU-22 Ficha de producto con costo en vivo | 3 | Media | Ireth |
| 4 | v1.1 | HU-23 Venta rápida en mostrador | 3 | Media | Ivan |
| 5 | v1.2 | HU-07 Historial y exportación | 3 | Media | Angie |
| 5 | v1.2 | HU-09 Inventario con libro de movimientos | 5 | Alta | Edwar |
| 5 | v1.2 | HU-13 Plan de producción óptimo | 5 | Alta | Ireth |
| 5 | v1.2 | HU-11 Pedidos de la tienda | 5 | Alta | Ivan |
| 6 | v2.0 | HU-19 Panel de métricas vivo | 5 | Alta | Angie |
| 6 | v2.0 | HU-24 Actualización en tiempo real | 5 | Alta | Edwar |
| 6 | v2.0 | HU-20 Plan conectado con inventario | 5 | Alta | Ireth |
| 6 | v2.0 | HU-18 Consumo y reservas automáticas | 8 | Alta | Ivan |
| 7 | v2.1 | HU-28 Acceso seguro | 3 | Media | Angie |
| 7 | v2.1 | TEC-03 Pruebas no funcionales y respaldo | 3 | Media | Edwar |
| 7 | v2.1 | TEC-04 Prueba de sistema | 3 | Media | Ireth |
| 7 | v2.1 | HU-27 Seguimiento y experiencia del cliente | 5 | Media | Ivan |
| 8 | v2.2 | HU-29 Vitrina de restaurantes, acceso y panel | 8 | Alta | Angie |
| 8 | v2.2 | HU-30 Inventario y pronóstico fáciles de leer | 5 | Alta | Edwar |
| 8 | v2.2 | HU-31 Marca Sazonexo, menú y guías entendibles | 8 | Alta | Ireth |
| 8 | v2.2 | HU-32 Vender y atender pedidos sin dudas | 5 | Alta | Ivan |
| — | Futura | HU-15 Empleados y permisos por rol | 5 | Media | Sin asignar |
| — | Futura | HU-25 Fotos, horario y tienda abierta o cerrada | 5 | Media | Sin asignar |
| — | Futura | HU-16 Asistente conversacional | 8 | Baja | Sin asignar |
| — | Futura | HU-17 Pagos en línea y domicilios | 13 | Baja | Sin asignar |

## Historias y criterios de aceptación

HU-01 a HU-07 y HU-14 conservan los criterios de la guía del equipo, con los ajustes de "Acuerdos".

### HU-08 · Costo unitario y margen
**Como** propietario, **quiero** conocer cuánto me cuesta cada producto, **para** saber cuánto gano.
- CA-1 El lote se reparte entre todas las unidades que rinde. CA-2 Costo = masa por unidad + extras.
- CA-3 Veo ganancia y margen. CA-4 Si cambia un precio, se recalcula. CA-5 Avisa si falta el rendimiento.

### HU-09 · Inventario con libro de movimientos
**Como** encargado, **quiero** que cada cambio de stock deje rastro, **para** confiar en el inventario.
- CA-1 Stock inicial y compras quedan en el libro. CA-2 Un conteo físico registra la diferencia.
- CA-3 El desperdicio resta. CA-4 Todo ajuste exige motivo y guarda usuario y fecha.
- CA-5 Anular una compra crea el movimiento inverso, una vez. CA-6 El stock no se edita a mano.
- CA-7 El stock es la suma de los movimientos. CA-8 Alerta bajo mínimo y valora el inventario.

### HU-10 · Tienda pública
**Como** cliente, **quiero** ver el menú en su dirección, **para** decidir qué comprar.
- CA-1 Lista de tiendas sin iniciar sesión. CA-2 Solo productos activos con precio.
- CA-3 No expone costos ni datos internos. CA-4 Informa si la tienda no existe.

### HU-11 · Pedidos de la tienda
**Como** cliente, **quiero** pedir sin crear cuenta, **para** recoger en el negocio.
- CA-1 Armo un carrito y pido. CA-2 Nombre y teléfono válidos. CA-3 El servidor calcula el total.
- CA-4 Solo transiciones válidas. CA-5 Rechazar o cancelar exige motivo. CA-6 Consulto con mi código.
- CA-7 Al entregar se crea una sola venta. CA-8 Otro negocio no lo ve.

### HU-12 · Pronóstico de demanda
**Como** propietario, **quiero** saber cuánto venderé los próximos 7 días, **para** prepararme.
- CA-1 Ignora anuladas. CA-2 Lo reciente pesa más. CA-3 Distingue el día de la semana. CA-4 7 días por producto.
- CA-5 Con menos de 14 días explica cuánto falta. CA-6 Mide su error. CA-7 Solo datos del negocio.
- CA-8 El día de hoy, incompleto, no cuenta. CA-9 Un producto nuevo no baja por días en que no existía.

### HU-13 · Plan de producción óptimo
**Como** propietario, **quiero** saber cuánto producir, **para** ganar más con mi presupuesto.
- CA-1 Maximiza la ganancia sin superar el presupuesto. CA-2 Respeta la demanda máxima.
- CA-3 Si no alcanza, dice el día y cuánto falta. CA-4 Parte del pronóstico. CA-5 Tres escenarios.
- CA-6 Explica si faltan ventas.

### HU-18 · Consumo y reservas automáticas
**Como** propietario, **quiero** que vender descuente insumos, **para** no llevar la cuenta aparte.
- CA-1 Consumo = masa por unidad + extras. CA-2 La venta descuenta y congela el costo. CA-3 Anular devuelve una vez.
- CA-4 El insumo más escaso limita. CA-5 La tienda no deja pedir de más. CA-6 Confirmar reserva; cancelar libera.
- CA-7 Entregar descuenta; anular esa venta marca el pedido. CA-8 El mostrador avisa, pero permite vender.
- CA-9 Muestra agotados. CA-10 El stock sigue siendo la suma del libro.

### HU-19 · Panel de métricas vivo
**Como** propietario, **quiero** ver cómo va mi negocio, **para** decidir con datos.
- CA-1 Ingresos, costo y ganancia real. CA-2 Un valor por día. CA-3 Compara con el periodo anterior.
- CA-4 Compras, desperdicio e inventario. CA-5 Mejores productos y canales. CA-6 Pedidos pendientes.
- CA-7 Advierte ventas sin costo. CA-8 Pronóstico contra lo real. CA-9 Solo datos del negocio. CA-10 Cambia de periodo.

### HU-20 · Plan conectado con inventario
**Como** propietario, **quiero** que el plan conozca mi despensa, **para** saber qué comprar.
- CA-1 Lista qué comprar, cuánto y su costo. CA-2 Un stock negativo cuenta como cero.
- CA-3 Puede producir solo con lo que hay. CA-4 Sugiere el presupuesto.

### HU-21 · Base de datos SQLite
**Como** propietario, **quiero** que mis datos no queden a medias, **para** no perder información.
- CA-1 Siguen al reiniciar. CA-2 Transacciones todo o nada. CA-3 Las simultáneas no se mezclan.
- CA-4 Una base dañada da un error claro y deja copia.

### HU-22 · Ficha de producto con costo en vivo
**Como** encargado, **quiero** ver el costo mientras creo el producto, **para** ponerle buen precio.
- CA-1 El rendimiento se guarda con el producto. CA-2 Debe ser entero mayor que 0.
- CA-3 Se mueve si cambio de masa. CA-4 Muestra costo, margen y precio sugerido.

### HU-23 · Venta rápida en mostrador
**Como** cajero, **quiero** vender tocando productos, **para** atender más rápido.
- CA-1 Tocar suma y muestra el total. CA-2 Puedo quitar. CA-3 Guarda el medio de pago. CA-4 Calcula las vueltas.

### HU-24 · Actualización en tiempo real
**Como** propietario, **quiero** que las pantallas cambien solas, **para** ver lo que pasa ahora.
- CA-1 Avisa cada cambio. CA-2 No cruza negocios. CA-3 No avisa si la transacción falló.
- CA-4 Exige sesión. CA-5 La pantalla se actualiza sola. CA-6 Sin sesión no se conecta.

### HU-27 · Seguimiento y experiencia del cliente
**Como** cliente, **quiero** saber en qué va mi pedido, **para** llegar a tiempo.
- CA-1 Enlace con los pasos. CA-2 Se ofrece al pedir. CA-3 Busca y filtra. CA-4 Barra con el resumen.
- CA-5 El negocio ve columnas y oculta terminados.

### HU-28 · Acceso seguro
**Como** usuario, **quiero** que protejan mi cuenta, **para** estar tranquilo.
- CA-1 Bloquea tras 5 fallos. CA-2 No afecta a otros. CA-3 Entrar bien reinicia el conteo.
- CA-4 Explica la sesión vencida. CA-5 Muestra la contraseña. CA-6 Lleva a las tiendas.

### HU-29 · Vitrina de restaurantes, acceso y panel
**Como** cliente, **quiero** una vitrina atractiva donde comparar los negocios, **para** elegir rápido dónde pedir.
- CA-1 Cada negocio muestra cuántos productos tiene y desde qué precio. CA-2 Busco por negocio o plato, sin importar tildes.
- CA-3 Filtro por tipo y ciudad, y ordeno. CA-4 Si nada coincide, lo dice y deja quitar los filtros.
- CA-5 Sumo y resto desde la tarjeta del producto. CA-6 La vitrina no expone datos internos.
- CA-7 El panel muestra lo que necesita atención; si el negocio es nuevo, sus 4 primeros pasos. CA-8 Mi negocio muestra cómo lo verán los clientes.
- CA-9 El historial tiene periodos rápidos. CA-10 Cada módulo trae su guía.
- CA-11 El acceso presenta Sazonexo con escenas que cambian solas, se eligen al tocar y se pueden pausar. CA-12 El formulario orienta: correo, fuerza de la contraseña y aviso mientras entra.

### HU-30 · Inventario y pronóstico fáciles de leer
**Como** encargado, **quiero** entender de un vistazo qué se acaba y qué tan seguro es el pronóstico, **para** decidir sin hacer cuentas.
- CA-1 El stock se traduce a un estado y una barra. CA-2 La lista de insumos muestra el nivel, con máximo dos decimales.
- CA-3 Puedo ver solo lo que debo comprar. CA-4 Ajusto desde la fila y veo cuánto dice el sistema.
- CA-5 El pronóstico resume la semana y explica qué tan seguro es. CA-6 Sin datos suficientes muestra el avance.
- CA-7 Cada módulo trae su guía. CA-8 Insumos resume cuántos hay, cuántos reponer y cuánto valen.

### HU-31 · Marca Sazonexo, menú y guías entendibles
**Como** usuario nuevo, **quiero** que cada módulo me explique para qué sirve y cómo se usa, **para** trabajar sin que nadie me enseñe.
- CA-1 La guía del módulo se abre la primera vez y no vuelve a molestar. CA-2 El botón "¿Cómo funciona?" la muestra de nuevo.
- CA-3 Un módulo sin guía no muestra nada. CA-4 La ayuda describe el campo sin cambiar su nombre; los números se leen fácil.
- CA-5 En el celular el menú se abre y se cierra. CA-6 Las páginas públicas tienen barra y el dueño puede volver a su panel.
- CA-7 La masa muestra el costo del lote mientras se escribe. CA-8 Cada margen tiene un estado que se entiende.
- CA-9 Cada módulo trae su guía. CA-10 El logo y el nombre Sazonexo están en todas las interfaces.
- CA-11 La interfaz llena la pantalla en computador y celular.

### HU-32 · Vender y atender pedidos sin dudas
**Como** cajero, **quiero** cobrar y atender pedidos con menos pasos, **para** no hacer esperar al cliente.
- CA-1 Sugiere billetes y calcula las vueltas. CA-2 La tecla cuenta las unidades y la cuenta se puede vaciar.
- CA-3 Rechazar o cancelar pide el motivo en la misma tarjeta. CA-4 Cada pedido dice cuánto lleva esperando.
- CA-5 El cliente puede sumar desde su pedido. CA-6 El seguimiento explica qué sigue.
- CA-7 La compra avisa si salió más cara o más barata. CA-8 Cada módulo trae su guía.

## Acuerdos

| Tema | Acuerdo |
|---|---|
| Aislamiento | El `negocioId` sale siempre del token |
| Datos | JSON en HU-14; SQLite desde HU-21 (CA-1 y CA-3 de HU-14 pasan a HU-21) |
| Composición | Producto = masa + insumos extra |
| Venta o compra errónea | Se anula con movimiento inverso; no se borra |
| Insumos | Mostrador: se descuentan al vender. Tienda: se reservan al confirmar y se descuentan al entregar |
| Costo | Precio vigente del insumo; cada venta congela el suyo |
| Ganancia | Es sobre insumos: no incluye arriendo, gas ni salarios |
| Control | Un insumo sin movimientos no limita la tienda |
| Dinero y fechas | Pesos sin decimales en pantalla; hora de Bogotá |
