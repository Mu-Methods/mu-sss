import * as ssbKeysTypes from '@types/ssb-keys'

export interface DB {
  [key: string]: Promise
}

export interface API {
  db: DB;
  Keys: ssbKeysTypes;
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