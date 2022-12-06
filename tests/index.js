const test = require('tape')
const plugin = require('../build')
const util = require('../build/utilities.js')
const keys = require('ssb-keys')
// TODO create and require test module for api stubs project wide
const recipientsPkey = [
    'fKNo1cswvjnn4VD1WoPeMDR0aFLD0HZo/8ERa9NswEau32Ovxhg60fIRMKg/3Tkc1Ag1usc+5ebnd6v1d1nZLg==.ed25519',
    'KTu6Nl7+QzyzFNfUKMEy/KgGh1ROLOvuff1TFNK1Nr+TTOlz0363HzCecPYwVOcjPOOxfiZ6faLWIuaLGZLguQ==.ed25519',
    'tf02MHX54/g1lZNZpM55vc1X6RfkrbOdw5KQnVvIYvxiGlTXhsh/nJv49vLxNgUYaDaPC1nlOkN/Nc+OECBoJQ==.ed25519',
]
function createStubsAndSetup () {
 const returnDataStub = {db: { feed:[] }}
 const db = {
   create: (msg, cb) => {
     recipientsPkey.forEach((key) => {
       const dmsg = keys.unbox(msg, key)
       if (dmsg) returnDataStub.db.feed.push(msg)
     })
     cb(undefined, msg)
   },
   query: (...params) => {
     console.log('!!!!!', params)
     return returnDataStub.query
   }
 }
 const api = {
   keys,
   db,
 }
 return { returnDataStub, api, sss: plugin.init(api) }
}

test('should have exist and qualify spec', async (t) => {
  t.plan(7)
  console.log('plugin', plugin)
  t.ok(plugin, 'plugin is exported')
  t.ok(plugin.name, 'plugin has a name')
  t.ok(plugin.manifest, 'plugin has a manifest')
  t.ok(plugin.version, 'plugin has a version')
  t.ok(plugin.init, 'plugin has an init function')
  t.deepEqual(Object.keys(plugin.manifest), Object.keys(plugin.init()),'plugins init object functions match whats listed in manifest')
// 'shardAndSend & recoverAccount'
  const recipents = [
    'rt9jr8YYOtHyETCoP905HNQINbrHPuXm53er9XdZ2S4=.ed25519',
    'k0zpc9N+tx8wnnD2MFTnIzzjsX4men2i1iLmixmS4Lk=.ed25519',
    'YhpU14bIf5yb+Pby8TYFGGg2jwtZ5TpDfzXPjhAgaCU=.ed25519',
  ]
  const { returnDataStub, api, sss } = createStubsAndSetup()
  returnDataStub.db.feed = []
  await sss.shardAndSend('hello world', recipents, 2)
  t.pass('did not fail at shard and send')
  returnDataStub.query = []
  const result = await sss.recoverAccount(api, recipents)
  t.equal('hello world', util.bigintToAscii(result), 'should return secret from db')
})