const sendJson = require('send-data/json')
const { promisify } = require('util')

const redisClient = require('./redis')('simpleClient')

const body = promisify(require('body/json'))
const asyncGet = promisify(redisClient.get.bind(redisClient))
const sinterAsync = promisify(redisClient.sinter.bind(redisClient))
const mgetAsync = promisify(redisClient.mget.bind(redisClient))

const multi = redisClient.multi()

async function createBuyers (req, res, opt, cbErr) {
  try {
    const { id, offers } = await body(req, res)

    multi.set(`buyer:${id}`, JSON.stringify({id, offers}))

    offers.forEach((offer, i) => {
      multi.set(`buyer:${id}${i}`, JSON.stringify(offer))

      Object.keys(offer.criteria).forEach((key) =>
        offer.criteria[key].forEach(criteria =>
          multi.sadd(`${key}:${criteria}`, `buyer:${id}${i}`)))
    })
    res.statusCode = 201
    await multi.exec()
    sendJson(req, res, {})
  } catch (e) {
    cbErr(e)
  }
}
async function getByersById (req, res, opt) {
  const data = await asyncGet(`buyer:${opt.params.id}`)
  sendJson(req, res, JSON.parse(data))
}

async function routes (req, res, opt, errCb) {
  const { state, device } = opt.query

  const timestamp = new Date(Date.parse(opt.query.timestamp))

  const matchKeys = {
    device: `device:${device}`,
    state: `state:${state}`,
    hour: `hour:${timestamp.getUTCHours()}`,
    day: `day:${timestamp.getUTCDay()}`
  }

  const keys = await sinterAsync(Object.values(matchKeys))
  const records = (await mgetAsync(keys))
    .map(JSON.parse)
    .sort((a, b) => {
      if (a.value > b.value) {
        return -1
      } else if (a.value < b.value) {
        return 1
      } else {
        return 0
      }
    })

  res.statusCode = 302
  res.setHeader('location', records[0].location)
  sendJson(req, res)
}

module.exports = {
  createBuyers,
  getByersById,
  routes
}
