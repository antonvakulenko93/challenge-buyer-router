const URL = require('url')
const http = require('http')
const sendJson = require('send-data/json')

const router = require('http-hash-router')()

const { createBuyers, getByersById, routes } = require('./../src/api')

router.set('/buyers', { POST: createBuyers })
router.set('/buyers/:id', { GET: getByersById })
router.set('/route', { GET: routes })

module.exports = function createServer () {
  return http.createServer(handler)
}

function handler (req, res) {
  router(req, res, { query: getQuery(req.url) }, onError.bind(null, req, res))
}

function onError (req, res, err) {
  if (!err) return

  res.statusCode = err.statusCode || 500

  sendJson(req, res, {
    error: err.message || http.STATUS_CODES[res.statusCode]
  })
}

function getQuery (url) {
  return URL.parse(url, true).query
}
