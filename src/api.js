const sendJson = require('send-data/json')
const promisify = require('util').promisify

const redisClient = require('./redis')('simpleClient')

const body = promisify(require('body/json'))
const asyncGet = promisify(redisClient.get.bind(redisClient))
const getKeysAsync = promisify(redisClient.keys.bind(redisClient))

async function createBuyers (req, res, opt, cbErr) {
  try {
    const data = await body(req, res)
    redisClient.set(`${data.id}`, JSON.stringify(data))
    res.statusCode = 201
    sendJson(req, res, data)
  } catch (e) {
    cbErr(e)
  }
}
async function getByersById (req, res, opt) {
  const data = await asyncGet(`${opt.params.id}`)
  sendJson(req, res, JSON.parse(data))
}

async function routes (req, res, opt, errCb) {
  const keys = await getKeysAsync('*')
  const data = (await Promise.all(keys.map(key => asyncGet(key))))
                  .map(JSON.parse)

  const { state, device } = opt.query

  const timestamp = new Date(Date.parse(opt.query.timestamp))

  let resp = data.filter(({offers}) =>
    offers.filter(({criteria, value}) =>
        criteria.device.includes(device) && criteria.state.includes(state) &&
        criteria.hour.includes(timestamp.getUTCHours()) &&
        criteria.day.includes(timestamp.getUTCDay())
    ).length
  )

  resp.sort((a, b) => {
    a.offers = a.offers.sort((c, m) => {
      if (c.value > m.value) {
        return -1
      } else if (c.value < m.value) {
        return 1
      } else {
        return 0
      }
    })

    b.offers = b.offers.sort((c, m) => {
      if (c.value > m.value) {
        return -1
      } else if (c.value < m.value) {
        return 1
      } else {
        return 0
      }
    })

    if (a.offers[0].value > b.offers[0].value) {
      return -1
    } else if (a.offers[0].value < b.offers[0].value) {
      return 1
    } else {
      return 0
    }
  })
  res.statusCode = 302
  res.setHeader('location', resp[0].offers[0].location)
  sendJson(req, res)
}

module.exports = {
  createBuyers,
  getByersById,
  routes
}
