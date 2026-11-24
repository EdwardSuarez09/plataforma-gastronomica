export class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje)
    this.estado = estado
  }
}

export function exigir(condicion, mensaje, estado = 400) {
  if (!condicion) throw new ErrorApi(estado, mensaje)
}
