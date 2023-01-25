import { API, ID, Message, ShardOpts, RequestOpts, ResendOpts} from './types'
const { 
  stringToBigInt,
  send,
  shareToHexString,
  hexStringToShare
  //logger
} = require('./utilities')
//const {api.where, and, type, author, toPromise} = require('ssb-db2/operators')
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

async function shardAndSend(api: API, opts: ShardOpts):Promise<boolean> {
  const num = stringToBigInt(opts.secret)
  let shares:Array<tPoint>
  if (opts.random) {
    shares = muShamir.randomShare(num, opts.threshold, opts.recps.length)
  } else {
    shares = muShamir.share(num, opts.threshold, opts.recps.length)
  }

  const shards = shares.map((share, index) => {
    return {type: 'account#shard', text: shareToHexString(share), keeper: opts.recps[index].public}
  })

  const map: Array<Promise<boolean>> = opts.recps.map(async (recp, index): Promise<boolean> => {
    return await send(api, {
      content: shards[index],
      feedFormat: opts.feedFormat,
      keys: opts.keys,
      encryptionFormat: opts.encryptionFormat,
      recps: [recp, opts.keys],
      encoding: opts.encoding
    })
  })
  await Promise.all(map)
  return true
}

async function getKeepers (api:API, sender:ID):Promise<Array<string> | boolean> {
  let msgs = api.db.query(api.where(api.and(api.type('account#shard'), api.author(sender.public))))
  if (msgs) {
    return await msgs.map((msg: Message) => {
      return msg.value.content.keeper
    })  
  }
  return false
}

async function requestShards (api:API, opts:RequestOpts):Promise<boolean> {
  await Promise.all(opts.recps.map(async (recp:ID) => {
    if (!recp) return
    const request = { type: 'account#request', text: opts.public }
    await send(api, {
      content: request,
      feedFormat: opts.feedFormat,
      keys: opts.keys,
      encryptionFormat: opts.encryptionFormat,
      recps: [recp, opts.keys],
      encoding: opts.encoding
    })
  }))
  return true
}


async function resendShards (api:API, opts:ResendOpts):Promise<boolean> {
  let request = api.db.query(api.where(api.and(api.type('account#request')))).map((req: Message) => {
    return req.value
  })[0]
  let shards = api.db.query(api.where(api.and(api.type('account#shard'), api.author(request.author))))

  await Promise.all(shards.map(async (shard:Message) => {
    const resend = shard.value.content
    resend.kept = request.content.text
    resend.type = 'account#recovery'
    await send(api, {
      content: resend,
      feedFormat: opts.feedFormat,
      keys: opts.keys,
      encryptionFormat: opts.encryptionFormat,
      recps: [opts.recp, opts.keys],
      encoding: opts.encoding
    })
  }))
  return true
}

async function recoverAccount(api: API, publicKey:string): Promise<bigint> {
  let shares:Array<Message> = await api.db.query(api.where(api.and(api.type('account#recovery')))).map((msg:Message) => {
    if (msg.value.content.kept === publicKey) return hexStringToShare(msg.value.content.text)
  })
  return muShamir.recover(shares)
}