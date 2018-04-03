const sendJson = require('send-data/json')
const body = require('body/json')

const buyer = require('./byers')

module.exports = {
  createBuyers,
  getByersById,
  routes
}

function createBuyers (req, res, opt, cb) {
  body(req, res, function (err, result) {
    if (err) return cb(err)
    if (!result) return cb(new Error('No body found.'))
    buyer.createBuyer(result, function (err, result) {
      if (err) return cb(err)
      res.statusCode = 201
      sendJson(req, res, {})
    })
  })
}

function getByersById (req, res, opt, cb) {
  buyer.getByerById(opt.params.id, function (err, result) {
    if (err) return cb(err)
    if (!result) return cb(new Error('No result found.'))
    sendJson(req, res, JSON.parse(result))
  })
}

function routes (req, res, opt, cb) {
  buyer.getRoute(opt.query, function (err, result) {
    if (err) return cb(err)
    res.statusCode = 302
    res.setHeader('location', result)
    sendJson(req, res)
  })
}
