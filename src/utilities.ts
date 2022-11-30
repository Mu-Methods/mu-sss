module.exports = {
  stringToBigInt,
  bigintToAscii,
  shareToHexString,
  hexStringToShare
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
  if (x.length % 2 !== 0) {
    x = '0' + x
  }
  let y = share[1].toString(16)
  if (y.length % 2 !== 0) {
    y = '0' + y
  }
  return '0x' + x + y
}

function hexStringToShare(str: string):tPoint  {
  if (str[0] !== '0' || str[1]!== 'x') {
    throw new Error('bad hex string')
  }
  const x = BigInt(str.slice(0, 5))
  const y = stringToBigInt('0x' + str.slice(5))
  return [x, y]
}
