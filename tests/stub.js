const plugin = require('../build')
const util = require('../build/utilities.js')
const keys = require('ssb-keys')

module.exports = {createStubsAndSetup}

function createStubsAndSetup () {
 const returnDataStub = {db: { feed:[] }}
 const db = {
   create: (msg, cb) => {
    if (msg) returnDataStub.db.feed.push(msg)
    return cb(undefined, msg)
   },
   query: (requestee, msgType) => {
    let msgs = returnDataStub.db.feed.map((msg) => {
      const answer = keys.unbox(msg.value.content, requestee)
      if (answer && answer.type === msgType) {
        message = {
          author: msg.value.author,
          content: answer
        }
        return message
      }
    }).filter(msg => msg)
    return msgs
   }
 }
 const api = {
   keyring,
   db,
 }
 return { returnDataStub, api, sss: plugin.init(api) }
}