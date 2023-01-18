import { API, ID, Shard } from './types'
const { 
  stringToBigInt,
  send,
  shareToHexString,
  hexStringToShare
  //logger
} = require('./utilities')
//const {where, and, type, author, toPromise} = require('ssb-db2/operators')
const muShamir = require('mu-shamir')


export const name = 'mu-sss'
export const version = '0.0.1'

export const manifest = {
  shardAndSend: 'async',
  requestShards: 'async',
  resendShards: 'async',
  recoverAccount: 'async',
}

/**
 * shardAndSend(secret, threshold, recipients)
 * */

type tPoint = [bigint, bigint]

export const init = (api:API) => {  
  return {
    shardAndSend: shardAndSend.bind(null, api),
    requestShards: requestShards.bind(null, api),
    resendShards: resendShards.bind(null, api),
    recoverAccount: recoverAccount.bind(null, api)
  }
}

//default behavior: shares secret with given threshold and sends ith share to ith recipient.
//default threshold is the number of recipients.

async function shardAndSend(
  api: API,
  sender: ID,
  secret: string,
  recipients: Array<ID>,
  threshold: number = recipients.length,
  dontRandomize?:boolean
  ): Promise<boolean> {
  const num = stringToBigInt(secret)
  let shares:Array<tPoint>
  if (!dontRandomize) {
    shares = muShamir.randomShare(num, threshold, recipients.length)
  } else {
    shares = muShamir.share(num, threshold, recipients.length)
  }
  const shards = shares.map((share) => {
    return {type: 'shard', text: shareToHexString(share)}
  })
  const map: Array<Promise<boolean>> = recipients.map(async (recipient, index): Promise<boolean> => {
    return await send(api, sender, shards[index], [recipient])
  })
  await Promise.all(map)
  return true
}

async function requestShards (api:API, sender:ID, recipients:Array<ID>):Promise<boolean> {
  await Promise.all(recipients.map(async (recipent:ID) => {
    if (!recipent) return

    const request = {type: 'request', text: 'shard requested'}
    await send(api, sender, request, [recipent])
  }))
  return true
}


//given a request-message resend the right shard back
//need: the shard-message in reference.
//when returning a Promise<boolean> use a try-catch,
async function resendShards (api:API, sender:ID, recipient:ID):Promise<boolean> {
  let shards = api.db.query(sender, 'shard')
  await Promise.all(shards.map(async (shard:Shard) => {
    const resend = shard.content
    resend.type = 'recovery'
    await send(api, sender, resend, [recipient])
  }))
  return true
}

async function recoverAccount(api: API, sender:ID): Promise<bigint> {
  let shares:Array<Shard> = await api.db.query(sender, 'recovery')
  shares = shares.map((msg:Shard) => {
    return hexStringToShare(msg.content.text)
  })
  return muShamir.recover(shares)
}