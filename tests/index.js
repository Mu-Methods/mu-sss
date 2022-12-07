const test = require('tape')
const plugin = require('../build')
const util = require('../build/utilities.js')
const keys = require('ssb-keys')
// TODO create and require test module for api stubs project wide
const alice = keys.generate()
const bob = keys.generate()
const charlie = keys.generate()
const dylan = keys.generate()

const {createStubsAndSetup} = require('./stub.js')

test('should have exist and qualify spec', async (t) => {
  t.plan(8)
  console.log('plugin', plugin)
  t.ok(plugin, 'plugin is exported')
  t.ok(plugin.name, 'plugin has a name')
  t.ok(plugin.manifest, 'plugin has a manifest')
  t.ok(plugin.version, 'plugin has a version')
  t.ok(plugin.init, 'plugin has an init function')
  t.deepEqual(Object.keys(plugin.manifest), Object.keys(plugin.init()),'plugins init object functions match whats listed in manifest')
// 'shardAndSend & recoverAccount'
  const recipients = [bob, charlie, dylan]
  const { returnDataStub, api, sss } = createStubsAndSetup()
  const feedMe = () => console.log('feed start', returnDataStub.db.feed, 'feed end')
  returnDataStub.db.feed = []
  await sss.shardAndSend(alice, 'hello world', recipients)
  t.pass('did not fail at shard and send')
  sss.requestShards(alice, recipients)
  recipients.forEach(async (recipient) => {
    await sss.resendShards(recipient, alice)
  })
  const result = await sss.recoverAccount(alice, recipients)
  const returnedSecret = util.bigintToAscii(result)
  t.equal('hello world', returnedSecret, 'should return secret from db')
})