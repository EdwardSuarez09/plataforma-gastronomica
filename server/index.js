import app from './app.js'

const puerto = process.env.API_PORT || 3001
app.listen(puerto, () => console.log(`API lista en http://localhost:${puerto}`))
