const { 
  stringToBigInt,
  bigintToAscii,
  shareToHexString,
  hexStringToShare
} = require('./utilities.js')
const muShamir = require('mu-shamir')

export const name = 'mu-sss'
export const version = '0.0.1'

export const manifest = {
  shardAndSend,
  requestShards,
  resendShards
}

/**
 * shardAndSend(secret, threshold, recipients)
 * */

type tPoint = [bigint, bigint]

export const init = (api:object) => {  
  return {
    shardAndSend: shardAndSend.bind(null, api),
    requestShards: requestShards.bind(null, api),
    resendShards: resendShards.bind(null, api),
  }
}

//default behavior: shares secret with given threshold and sends ith share to ith recipient.
//default threshold is the number of recipients.
async function shardAndSend (api:object, secret: string, recipients: Array<string>, threshold: number = recipients.length, ordered:boolean=false): Promise<boolean> {
  // Assumes secret is a string
  // convert secret to hex string to bigint 
  // shard secret hex
  let shares:Array<tPoint> = []
  if (ordered === false) {
    shares = muShamir.share(stringToBigInt(secret), threshold)
  } else {
    shares = muShamir.randomShare(stringToBigInt(secret), threshold)
  }
  // "send" shards to recipients
  await Promise.all(recipients.map((key, index) => {
    if (!key) return
    let shard = {type: 'shard', text: shareToHexString(shares[index])}
    // encrypt message
    const cipher = api.keys.box(shard, key)
    // publish message
    return new Promise((res, rej) => {
      api.db.create({content: cipher}, (err, result) => {
        if (err) {
          rej(err)
        } else {
          res(result)
        }
      })

    })
  }))
  return true
}

async function requestShards (api:object, recipients:Array<string>):Promise<boolean> {
  await Promise.all(recipients.map((key:string) => {
    if (!key) return

    request = {type: 'request', text: 'shard requested'}
    const cipher = api.keys(request, key)
    return new Promise((res, rej) => {
      api.db.create({content: cipher}, (err, result) => {
        if (err) {
          rej(err)
        } else {
          res(result)
        }
      })
    })

  }))
}


//given a request-message resend the right shard back
//need: the shard-message in reference.
async function resendShards (api:object, recipient:string):Promise<boolean> {
  const shards = api.db.query(
    where(
      and(
        type('shard'),
        author(recipient)
      )
    ),
    toCallback((err, msgs) => {
      return msgs
    })
  )

  await Promise.all(shards.map((shard) => {
    const resend = { type:'unshard', shard}
    const cipher = api.keys(resend, recipient)
    return new Promise((res, rej) => {
      api.db.create({content: cipher}, (err, result) => {
        if (err) {
          rej(err)
        } else {
          res(result)
        }
      })
    })

  }))
}

async function recoverAccount(shareHolders:Array<string>, recipient) {
  const shares:Array<tPoint> = []
  await Promise.all(shareHolders.map(key => {
    if (!key) return

    const shards = api.db.query(
      where(
        and(
          type('unshard'),
          author(key)
        )
      ),
      toCallback((err, msgs) => {
        return msgs
      })
    )

    shards.forEach(shard => {
      shares.push(hexStringToShare(shard.content.text))
    })
    const recovered = muShamir.recover(shares)
    //encrypt to self?
    const cipher = api.keys(bigintToAscii(muShamir.recover(shares), recipient))
    return new Promise((res, rej) => {
      api.db.create({content: cipher}, (err, result) => {
        if (err) {
          rej(err)
        } else {
          res(result)
        }
      })
    })

  })) 
}