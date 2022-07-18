import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { parseSeedPhrase, generateSeedPhrase } from "near-seed-phrase"

const hashBuf = (str) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))

export const genKeys = async (seedPhrase, num, drop_id, nonce = 0) => {
	const { secretKey } = parseSeedPhrase(seedPhrase)
	const keys = []
	for (let i = nonce; i < nonce + num; i++) {
		const hash = await hashBuf(`${secretKey}_${drop_id}_${i}`)
		const { secretKey: s } = generateSeedPhrase(hash)
		keys.push(KeyPair.fromString(s))
	}
	return keys
}