
async function send(api:API, msg:any, key:string):Promise<boolean> {
	await api.keys.box(msg, key).then(value => {
		api.db.create({content: value}, (err, msg) => {
			if (msg) return true
		})
	}).catch(err => console.error(err))
}

async function shardAndSend(
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

	await Promise.all(recipients.map((key, index) => {
		send(shares[index], key)
	})).then(values => {
		return true
	})
}