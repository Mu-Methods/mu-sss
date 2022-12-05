// import * as ssbKeysTypes from 'ssb-keys'
// import * as db from 'ssb-db2'
// import * as ebt from 'ssb-ebt'
// import * as friends from 'ssb-friends'
// import * as device from 'ssb-device-address'
// import * as identities from 'ssb-identities'
// import * as peerInvites from 'ssb-peer-invites'
// import * as conn from 'ssb-conn'
// import * as scheduler from 'ssb-replication-scheduler'
// import * as ssbKeysTypes from 'ssb-keys'

export interface DB {
  [key: string]: Promise<boolean>
}

export interface API {
  db: DB;
  keys: any;
}

export interface Message {
  author: string;
  backlink: string;
  hash: string;
  nonce: number | string;
  timestamp: number;
  content: any; // correct me
  signature: string;
}