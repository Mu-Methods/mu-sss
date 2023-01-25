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
  create: Function;
  query: Function;
  feed: Array<Message>
}

export interface API {
  db: DB;
  keyring: any;
  where: Function;
  and: Function;
  type: Function;
  author: Function;
}

export interface Content {
  type: string;
  text: string;
  keeper?: string;
  kept?: string;
}

export interface ID {
  curve: string;
  public: string;
  private?: string;
  id: string;
}

interface Opts {
  feedFormat?: string;
  keys?: ID;
  encryptionFormat?: string;
  encoding?: string;
}

export interface SendOpts extends Opts {
  content: Content;
  recps?: Array<ID>
}

export interface ShardOpts extends Opts {
  threshold: number;
  random: boolean;
  secret: string;
  recps: Array<ID>
}

export interface RequestOpts extends Opts{
  recps: Array<ID>;
  public: string; //public key
}

export interface ResendOpts extends Opts {
  recp: ID;
}

export interface Message {
  key: string;
  value: {
    author: string;
    backlink: string;
    hash: string;
    nonce: number | string;
    timestamp: number;
    content: Content;
    signature: string;
  };
  timestamp: number;
}

export interface Shard {
  content: Content;
  recipient: string;
}