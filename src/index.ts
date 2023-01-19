import { API, ID, Message } from './types'
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
  getKeepers: 'async',
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
    getKeepers: getKeepers.bind(null, api),
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
  const shards = shares.map((share, index) => {
    return {type: 'shard', text: shareToHexString(share), keeper: recipients[index].public}
  })
  const map: Array<Promise<boolean>> = recipients.map(async (recipient, index): Promise<boolean> => {
    return await send(api, sender, shards[index], [recipient, sender])
  })
  await Promise.all(map)
  return true
}

async function getKeepers (api:API, sender:ID):Promise<Array<string> | boolean> {
  let msgs = api.db.query(sender, 'shard')
  console.log('msgs: ', msgs)
  if (msgs) {
    return await msgs.map((msg: Message) => {
      return msg.value.content.keeper
    })  
  }
  return false
}

async function requestShards (api:API, sender:ID, recipients:Array<ID>):Promise<boolean> {
  await Promise.all(recipients.map(async (recipent:ID) => {
    if (!recipent) return

    const request = {type: 'request', text: 'shard requested'}
    await send(api, sender, request, [recipent])
  }))
  return true
}


async function resendShards (api:API, sender:ID, recipient:ID):Promise<boolean> {
  let shards = api.db.query(sender, 'shard')
  await Promise.all(shards.map(async (shard:Message) => {
    const resend = shard.value.content
    resend.type = 'recovery'
    await send(api, sender, resend, [recipient])
  }))
  return true
}

async function recoverAccount(api: API, sender:ID): Promise<bigint> {
  let shares:Array<Message> = await api.db.query(sender, 'recovery')
  shares = shares.map((msg: Message) => {
    return hexStringToShare(msg.value.content.text)
  })
  return muShamir.recover(shares)
}