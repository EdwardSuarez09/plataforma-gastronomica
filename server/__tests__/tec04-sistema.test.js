// Prueba de sistema: recorre todo el negocio como lo haría un usuario, sin atajos a la base.
import request from 'supertest'
import { expect, test } from 'vitest'
import app from '../app.js'
import { hoy } from '../util/fechas.js'

async function abrirNegocio(correo, nombre) {
  const registro = await request(app).post('/api/auth/registro').send({ nombre: 'Dueño', correo, contrasena: 'clave-segura' })
  const { token, negocio } = (await request(app).post('/api/negocio')
    .set('Authorization', `Bearer ${registro.body.token}`)
    .send({ nombre, tipo: 'Fritos', ciudad: 'Sincelejo', moneda: 'COP' })).body
  const api = (metodo, ruta, datos) => request(app)[metodo](`/api${ruta}`).set('Authorization', `Bearer ${token}`).send(datos)
  return { api, slug: negocio.slug }
}

test('del registro del negocio al panel, todo queda vinculado', async () => {
  const { api, slug } = await abrirNegocio('a@p.co', 'Fritos A')
  const otro = await abrirNegocio('b@p.co', 'Fritos B')

  // 1. Insumo, compra, masa y producto
  const harina = (await api('post', '/insumos', { nombre: 'Harina', unidad: 'kg', precio: 3000, stockMinimo: 9 })).body
  await api('post', '/compras', { insumoId: harina.id, fecha: hoy(), cantidad: 10, valorTotal: 30000 })
  const masa = (await api('post', '/masas', { nombre: 'Base', tipo: 'otro', ingredientes: [{ insumoId: harina.id, cantidad: 10 }] })).body
  const producto = (await api('post', '/productos', { nombre: 'Empanada', precio: 2500, masaId: masa.id, unidadesPorLote: 100 })).body
  expect((await api('get', '/costos')).body[0].costo).toBe(300)

  // 2. Venta en mostrador y pedido en la tienda
  await api('post', '/ventas', { items: [{ productoId: producto.id, cantidad: 10 }] })
  const pedido = await request(app).post(`/api/publico/${slug}/pedidos`)
    .send({ cliente: { nombre: 'Luis', telefono: '3001234567' }, items: [{ productoId: producto.id, cantidad: 10 }] })
  expect(pedido.status).toBe(201)
  const [{ id }] = (await api('get', '/pedidos')).body
  for (const estado of ['confirmado', 'en_preparacion', 'listo', 'entregado']) await api('patch', `/pedidos/${id}/estado`, { estado })

  // 3. El panel refleja cada registro
  const panel = (await api('get', '/panel')).body
  expect(panel).toMatchObject({ ingresos: 50000, costo: 6000, ganancia: 44000, compras: 30000, ventas: 2, sinCosto: 0 })
  expect(panel.canales).toEqual({ presencial: 25000, pedido_digital: 25000 })
  expect(panel.bajos.map((i) => [i.nombre, i.stock])).toEqual([['Harina', 8]])

  // 4. El otro negocio no ve nada
  expect((await otro.api('get', '/panel')).body).toMatchObject({ ingresos: 0, compras: 0, inventario: 0 })
  expect((await otro.api('get', '/pedidos')).body).toEqual([])
})
