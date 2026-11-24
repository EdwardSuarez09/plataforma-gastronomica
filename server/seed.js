// Reemplaza los datos: crea dos negocios de demostración con ventas SIMULADAS de las últimas 4 semanas.
// Los insumos, masas y precios salen del proyecto Python de referencia.
import bcrypt from 'bcryptjs'
import * as repo from './modules/persistencia/repo.js'
import { armarDetalle } from './modules/ventas/armar.js'
import { diaSemana, hoy, sumarDias } from './util/fechas.js'

const CLAVE_DEMO = 'demo12345'

const FRITOS = {
  correo: 'fritos@demo.co',
  negocio: {
    nombre: 'Fritos Doña Ana', slug: 'fritos-dona-ana', tipo: 'Fritos', ciudad: 'Sincelejo', moneda: 'COP',
    telefono: '3000000001', descripcion: 'Fritos costeños recién hechos todos los días.',
  },
  insumos: {
    maíz: ['lb', 2000, 50], 'harina de trigo': ['kg', 3000, 30], aceite: ['L', 8000, 20], huevo: ['unidad', 300, 60],
    papa: ['lb', 2000, 40], carne: ['lb', 12000, 15], pollo: ['lb', 8000, 10], queso: ['lb', 10000, 8],
    yuca: ['lb', 2500, 25], cebolla: ['lb', 1500, 20], sal: ['kg', 2000, 5], empaque: ['unidad', 50, 500],
  },
  masas: {
    'Masa tradicional': ['tradicional', { 'harina de trigo': 10, aceite: 2, huevo: 12, sal: 0.5 }],
    'Masa de yuca': ['yuca', { yuca: 12, aceite: 1.5, huevo: 6, sal: 0.3 }],
    'Masa para arepas': ['otro', { maíz: 20, aceite: 1, sal: 0.5 }],
  },
  // nombre: [precio, masa, rendimiento del lote, extras, demanda base, descripción]
  productos: {
    'Papa rellena': [3500, 'Masa tradicional', 50, { papa: 0.1, carne: 0.05 }, 20, 'Rellena de carne sazonada'],
    'Empanada de carne': [2500, 'Masa tradicional', 80, { carne: 0.02, cebolla: 0.01 }, 30, 'Crocante y bien rellena'],
    'Empanada de pollo': [2300, 'Masa tradicional', 80, { pollo: 0.02, cebolla: 0.01 }, 25, 'Pollo desmechado'],
    'Empanada de queso': [2000, 'Masa tradicional', 70, { queso: 0.015 }, 35, 'Queso costeño fundido'],
    'Pastel de yuca': [4000, 'Masa de yuca', 40, { carne: 0.03, cebolla: 0.01 }, 15, 'Yuca con carne molida'],
    Carimañola: [3800, 'Masa de yuca', 45, { carne: 0.035, cebolla: 0.015 }, 12, 'La tradicional de la costa'],
    'Arepa con queso': [1800, 'Masa para arepas', 100, { queso: 0.01 }, 40, 'Maíz y queso costeño'],
    'Arepa con huevo': [2500, 'Masa para arepas', 100, { huevo: 1, queso: 0.005 }, 35, 'El clásico de la región'],
  },
  extrasComunes: { aceite: 0.1, empaque: 1 },
}

const JUGOS = {
  correo: 'jugos@demo.co',
  negocio: {
    nombre: 'Jugos Tropical', slug: 'jugos-tropical', tipo: 'Jugos', ciudad: 'Corozal', moneda: 'COP',
    telefono: '3000000002', descripcion: 'Jugos naturales y batidos.',
  },
  insumos: {
    mango: ['lb', 1800, 20], mora: ['lb', 3500, 15], leche: ['L', 3800, 12], azúcar: ['kg', 4200, 8],
    agua: ['L', 500, 40], vaso: ['unidad', 150, 300],
  },
  masas: { 'Base dulce': ['otro', { agua: 10, azúcar: 2 }] },
  productos: {
    'Jugo de mango': [4000, 'Base dulce', 20, { mango: 0.5, vaso: 1 }, 18, 'Mango de temporada'],
    'Jugo de mora': [4500, 'Base dulce', 20, { mora: 0.4, vaso: 1 }, 14, 'Mora fresca'],
    'Batido de mango': [6000, 'Base dulce', 15, { mango: 0.5, leche: 0.3, vaso: 1 }, 9, 'Con leche entera'],
  },
  extrasComunes: {},
}

// Generador con semilla fija: los datos simulados salen iguales en todos los equipos.
let semilla = 2026
const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647
const FACTOR_DIA = [1.4, 0.8, 0.85, 0.9, 1, 1.25, 1.5] // domingo a sábado

async function sembrar({ correo, negocio, insumos, masas, productos, extrasComunes }) {
  const usuario = await repo.crear('global', 'usuarios', {
    nombre: `Propietario ${negocio.nombre}`, correo, hash: await bcrypt.hash(CLAVE_DEMO, 10), rol: 'propietario',
  })
  const { id } = await repo.crear('global', 'negocios', { ...negocio, propietarioId: usuario.id })
  await repo.transformar('global', 'usuarios', (l) => {
    l.find((u) => u.id === usuario.id).negocioId = id
  })

  const idInsumo = {}
  for (const [nombre, [unidad, precio, stock]] of Object.entries(insumos)) {
    idInsumo[nombre] = (await repo.crear(id, 'insumos', { nombre, unidad, precio, stock })).id
  }
  const lineas = (o) => Object.entries(o).map(([n, cantidad]) => ({ insumoId: idInsumo[n], cantidad }))

  const idMasa = {}
  for (const [nombre, [tipo, ingredientes]] of Object.entries(masas)) {
    const datos = { nombre, tipo, ingredientes: lineas(ingredientes), rendimiento: [] }
    idMasa[nombre] = (await repo.crear(id, 'masas', datos)).id
  }

  const creados = []
  for (const [nombre, [precio, masa, unidades, extras, demanda, descripcion]] of Object.entries(productos)) {
    const p = await repo.crear(id, 'productos', {
      nombre, precio, descripcion, activo: true, masaId: idMasa[masa], extras: lineas({ ...extras, ...extrasComunes }), categoria: nombre.split(' ')[0],
    })
    await repo.transformar(id, 'masas', (l) => {
      l.find((m) => m.id === p.masaId).rendimiento.push({ productoId: p.id, unidades })
    })
    creados.push({ ...p, demanda })
  }

  for (let d = 28; d >= 1; d--) {
    const fecha = sumarDias(hoy(), -d)
    const items = creados.map((p) => ({
      productoId: p.id,
      cantidad: Math.max(1, Math.round(p.demanda * FACTOR_DIA[diaSemana(fecha)] * (0.85 + azar() * 0.3))),
    }))
    await repo.crear(id, 'ventas', { ...armarDetalle(items, creados), fecha, origen: 'presencial', estado: 'registrada' })
  }
  console.log(`${negocio.nombre}: ${correo} / ${CLAVE_DEMO}`)
}

await repo.vaciar()
await sembrar(FRITOS)
await sembrar(JUGOS)
