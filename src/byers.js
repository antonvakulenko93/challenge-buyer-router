const redisClient = require('./redis')('simpleClient')
const multi = redisClient.multi()

module.exports = {
  createBuyer,
  getByerById,
  getRoute
}

function createBuyer ({id, offers}, cb) {
  multi.set(`buyer:${id}`, JSON.stringify({id, offers}))
  offers.forEach(function (offer, i) {
    multi.set(`buyer:${id}${i}`, JSON.stringify(offer))
    Object.keys(offer.criteria).forEach(function (key) {
      offer.criteria[key].forEach(function (criteria) {
        multi.sadd(`${key}:${criteria}`, `buyer:${id}${i}`)
      })
    })
  })
  multi.exec()
  cb(null, true)
}

function getByerById (id, cb) {
  redisClient.get(`buyer:${id}`, cb)
}

function getRoute ({ state, device, timestamp }, cb) {
  const parsedDate = new Date(Date.parse(timestamp))

  const matchKeys = {
    device: `device:${device}`,
    state: `state:${state}`,
    hour: `hour:${parsedDate.getUTCHours()}`,
    day: `day:${parsedDate.getUTCDay()}`
  }

  redisClient.sinter(Object.values(matchKeys), function (err, result) {
    if (err) return cb(err)
    if (!result) return cb(new Error('No result found.'))
    redisClient.mget(result, function (err, result) {
      if (err) return cb(err)
      if (!result) return cb(new Error('No result found.'))
      const offer = result
        .map(JSON.parse)
        .sort((a, b) => {
          if (a.value > b.value) {
            return -1
          } else if (a.value < b.value) {
            return 1
          } else {
            return 0
          }
        }).shift()
      cb(null, offer.location)
    })
  })
}
