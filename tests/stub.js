const plugin = require('../build')
const util = require('../build/utilities.js')
const keys = require('ssb-keys')

module.exports = {createStubsAndSetup}

function createStubsAndSetup () {
 const returnDataStub = {db: { feed:[] }, self: {}}

 const db = {
   create: (opts, cb) => {
    const message = {
      author: opts.keys.public,
      content: opts.content
    }

    let msg = message
    if (opts.recps) {
      msg = keys.box(message, opts.recps.concat([opts.keys]))
    }
    returnDataStub.db.feed.push({
      key: opts.keys.public,
      value: msg
    })
    return cb(undefined, msg)
   },

   query: (...params) => {
    let check = {}
    for (let i = 0; i < params.length; i++) {
      Object.assign(check, params[i])
    }
    msgs = []
    returnDataStub.db.feed.forEach((msg, index) => {
      const answer = keys.unbox(msg.value, returnDataStub.self)
      if (answer && answer.content.type === check.type) {
        msgs.push({
          key: msg.key,
          value: answer
        })
      }
    })
    return msgs
   }
 }

 const where = (...params) => {
    let ans = {}
    for (let i = 0; i < params.length; i++) {
      Object.assign(ans, params[i])
    }
    return ans
   }

 const and = (...params) => { 
    let ans = {}
    for (let i = 0; i < params.length; i++) {
      Object.assign(ans, params[i])
    }
    return ans
   } 

  const type = (str) => { return { type: str } }

  const author = (str) => { return { author: str } }

 const api = {
   keys,
   db,
   where,
   and,
   type,
   author
 }
 return { returnDataStub, api, sss: plugin.init(api) }
}