import { API } from './types'
const { 
  stringToBigInt,
  bigintToAscii,
  shareToHexString,
  hexStringToShare,
  send,
} = require('./utilities')
const {where, and, type, toPromise} = require('ssb-db2/operators')
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
  num = stringToBigInt(secret)
  if (randomize) {
    const shares = muShamir.randomShare(num, threshold, recipients.length)
  } else {
    const shares = muShamir.share(num, threshold, recipients.length)
  }

  await Promise.all(recipients.map(async (key, index) => {
    await send(api, shares[index], key)
  }).map((f) => { return f() }))
  return true
}

async function requestShards (api:API, recipients:Array<string>):Promise<boolean> {
  await Promise.all(recipients.map(async (recipent:string) => {
    if (!recipent) return

    const request = {type: 'request', text: 'shard requested'}
    await send(request, recipent)
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

  await Promise.all(shards.map(async (shard) => {
    const resend = { type:'unshard', shard}
    await send(api, resend, recipent)
  }).map((f) => { return f() }))
  return true
}

async function recoverAccount(api: API, shareHolders:Array<string>, recipient) {
  const shares:Array<tPoint> = []
  await Promise.all(shareHolders.map(async (key) => {
    if (!key) return

    const msgs = await api.db.query(
      where(
        and(
          type('unshard'),
          author(key)
        )
      ),
      toPromise(),
    )
    msgs.forEach((msg) => {
      if (!msg.content) return
      shares.push(msg.content.text)
    })
  }).map((f) => { return f() }))
  const recovered = muShamir.recover(shares)

}