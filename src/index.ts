import { API, Message } from './types'
const { 
  stringToBigInt,
  send,
  shareToHexString,
  hexStringToShare,
  logger
} = require('./utilities')
const {where, and, type, author, toPromise} = require('ssb-db2/operators')
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
  sender: string,
  secret: string,
  recipients: Array<string>,
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

  shares = shares.map((share) => {
    return shareToHexString(share)
  })
  const map: Array<Promise<boolean>> = recipients.map(async (key, index): Promise<boolean> => {
    return await send(api, sender, shares[index], key)
  })
  await Promise.all(map)
  return true
}

async function requestShards (api:API, sender:string, recipients:Array<string>):Promise<boolean> {
  await Promise.all(recipients.map(async (recipent:string) => {
    if (!recipent) return

    const request = {type: 'request', text: 'shard requested'}
    await send(api, sender, request, recipent)
  }))
  return true
}


//given a request-message resend the right shard back
//need: the shard-message in reference.
//when returning a Promise<boolean> use a try-catch,
async function resendShards (api:API, sender:string, recipient:string):Promise<boolean> {
  const shards:Array<string> = []
  await api.db.feed.forEach((msg) => {
    if (msg.author === recipient)
      shards.push(api.keys.unbox(msg.content))
  })
  await Promise.all(shards.map(async (shard:string) => {
    const resend = { type:'request', shard}
    await send(api, sender, resend, recipient)
  }))
  return true
}

async function recoverAccount(api: API, recipients:Array<string>): Promise<bigint> {
  const shares:Array<tPoint> = []
  await Promise.all(recipients.map(async (key) => {
    if (!key) return

    const msgs = await api.db.query(
      where(
        and(
          type('request'),
          author(key)
        )
      ),
      toPromise()
    )
  logger(msgs, 'msgs', 111)
    msgs.forEach((msg:Message) => {
      if (!msg.content) return
      shares.push(hexStringToShare(msg.content.text))
    })
  }))
  logger(shares, 'shares', 116)
  return muShamir.recover(shares)
}