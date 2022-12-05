import { API, Message } from './types'
const { 
  stringToBigInt,
  send,
  shareToHexString,
  hexStringToShare
} = require('./utilities')
const {where, and, type, author, toPromise} = require('ssb-db2/operators')
const muShamir = require('mu-shamir')


export const name = 'mu-sss'
export const version = '0.0.1'

export const manifest = {
  shardAndSend,
  requestShards,
  resendShards,
  recoverAccount
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
  secret: string,
  recipients: Array<string>,
  threshold: number = recipients.length,
  randomize?:boolean
  ): Promise<boolean> {
  const num = stringToBigInt(secret)
  let shares:Array<tPoint>
  if (randomize) {
    shares = muShamir.randomShare(num, threshold, recipients.length)
  } else {
    shares = muShamir.share(num, threshold, recipients.length)
  }

  shares = shares.map((share) => {
    return shareToHexString(share)
  })
  const map: Array<Promise<boolean>> = recipients.map(async (key, index): Promise<boolean> => {
    return await send(api, shares[index], key)
  })

  await Promise.all(map)
  return true
}

async function requestShards (api:API, recipients:Array<string>):Promise<boolean> {
  await Promise.all(recipients.map(async (recipent:string) => {
    if (!recipent) return

    const request = {type: 'request', text: 'shard requested'}
    await send(api, request, recipent)
  }))
  return true
}


//given a request-message resend the right shard back
//need: the shard-message in reference.
//when returning a Promise<boolean> use a try-catch,
async function resendShards (api:API, recipient:string):Promise<boolean> {
  const shards = await api.db.query(
    where(
      and(
        type('shard'),
        author(recipient)
      )
    ),
    toPromise()
  )
  await Promise.all(shards.map(async (shard:string) => {
    const resend = { type:'request', shard}
    await send(api, resend, recipient)
  }))
  return true
}

async function recoverAccount(api: API, shareHolders:Array<string>) {
  const shares:Array<tPoint> = []
  await Promise.all(shareHolders.map(async (key) => {
    if (!key) return

    const msgs = await api.db.query(
      where(
        and(
          type('request'),
          author(key)
        )
      ),
      toPromise(),
    )
    msgs.forEach((msg:Message) => {
      if (!msg.content) return
      shares.push(hexStringToShare(msg.content.text))
    })
  }))
  return muShamir.recover(shares)
}