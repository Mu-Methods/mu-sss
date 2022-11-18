const muShamir = require('mu-shamir')
/*
import * as db from 'ssb-db2'
import * as ebt from 'ssb-ebt'
import * as friends from 'ssb-friends'
import * as device from 'ssb-device-address'
import * as identities from 'ssb-identities'
import * as peerInvites from 'ssb-peer-invites'
import * as conn from 'ssb-conn'
import * as scheduler from 'ssb-replication-scheduler'
*/

export const name = 'mu-sss'
export const version = '0.0.1'

export const manifest = {
  helloWorld: 'sync',
  share: 'sync',
  randomShare: 'sync',
  recover: 'sync',
  recoverFull: 'sync' 
}

type tPoint = [bigint, bigint]

export const init = (api) => {  
  return {
    helloWorld: () => console.log('Hello World'),
    share,
    randomShare,
    recover,
    recoverFull
  }
}