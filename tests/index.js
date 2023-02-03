const test = require('tape')
const plugin = require('../build')
const util = require('../build/utilities.js')
const keys = require('ssb-keys')
// TODO create and require test module for api stubs project wide
const alice = keys.generate()
const alice2 = keys.generate()
const bob = keys.generate()
const charlie = keys.generate()
const dylan = keys.generate()
alice.name = 'alice'
alice2.name = 'alice2'
bob.name = 'bob'
charlie.name = 'charlie'
dylan.name = 'dylan'

console.log('introductions!!!\n', alice, alice2, bob, charlie, dylan, '\nmoving on')

const { createStubsAndSetup } = require('./stub.js')

test('should have exist and qualify spec', async (t) => {
  t.plan(11)
  console.log('plugin', plugin)
  t.ok(plugin, 'plugin is exported')
  t.ok(plugin.name, 'plugin has a name')
  t.ok(plugin.manifest, 'plugin has a manifest')
  t.ok(plugin.version, 'plugin has a version')
  t.ok(plugin.init, 'plugin has an init function')
  t.deepEqual(Object.keys(plugin.manifest), Object.keys(plugin.init()),'plugins init object functions match whats listed in manifest')
// 'shardAndSend & recoverAccount'
  const keepers = [bob, charlie, dylan]
  const { returnDataStub, api, sss } = createStubsAndSetup()
  returnDataStub.self = alice
  const feedMe = () => console.log('feed start!!', returnDataStub.db.feed, 'feed end!!')
  returnDataStub.db.feed = []
  
  await sss.shardAndSend({
    threshold: keepers.length,
    random: true,
    secret: 'hello world',
    recps: keepers,
    keys: alice
  })
  t.pass('did not fail at shard and send')

  sss.getKeepers(alice).then(value => {
    value.forEach((val) => {
       if ([bob.public, charlie.public, dylan.public].indexOf(val) === -1) {
        throw new Error('wrong keeper')
       }
    })
  })
  t.pass('did not fail at getKeepers')

  returnDataStub.self = alice2

  sss.requestShards({
    keys: alice2,
    recps: keepers,
    public: alice.public 
  })
  t.pass('did not fail at requestShards')

  keepers.forEach(async (keeper) => {
    returnDataStub.self = keeper
    await sss.resendShards({
      keys: keeper,
      recp: alice2
    })
  })
  t.pass('did not fail at resending shards')

  returnDataStub.self = alice2
  const result = await sss.recoverSecret(alice.public)
  t.equal('hello world', result, 'should return secret from db')
})