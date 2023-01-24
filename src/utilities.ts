import { API, SendOpts } from './types'

module.exports = {
  stringToBigInt,
  bigintToAscii,
  shareToHexString,
  hexStringToShare,
  bigintToHexString,
  send,
  logger
}

function logger(x:any, name:string, line:number) {
  console.log(name + ' at line ' + line + ':')
  console.log(x)
}

async function send(api:API, opts:SendOpts):Promise<boolean> {
  await api.db.create(opts, (err: any) => {
    if (err) throw err
  })
  return true
}

function stringToBigInt (str: string):bigint {
  return BigInt(`0x${Buffer.from(str).toString('hex')}`)
}

function bigintToHexString (b: bigint):string {
  let str = b.toString(16)
  if (str.length % 2 !== 0) {
    str = '0' + str
  }
  return '0x' + str
}

function bigintToAscii (b: bigint):string {
  return Buffer.from(b.toString(16), 'hex').toString('utf8')
}

type tPoint = [bigint, bigint]

function shareToHexString(share:tPoint):string {
  let x = share[0].toString(16)
  let y = share[1].toString(16)
  let str = x + ',' + y
  return str
}

function hexStringToShare(str: string):tPoint  {
  const i = str.indexOf(',')
  const x = BigInt('0x' + str.slice(0, i))
  const y = BigInt('0x' + str.slice(i + 1))
  return [x, y]
}
