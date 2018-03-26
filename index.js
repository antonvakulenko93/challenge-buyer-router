const server = require('./lib/server')
const port = process.env.PORT || 5000

server().listen(port)
