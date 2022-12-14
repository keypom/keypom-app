import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { parseSeedPhrase, generateSeedPhrase } from "near-seed-phrase"
import { gas, contractId, getClaimAccount } from './near'

const hashBuf = (str) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))

export const claimDrop = async (accountId, secretKey) => {
	const claimAccount = getClaimAccount(secretKey)
	const res = await claimAccount.functionCall({
		contractId,
		methodName: 'claim',
		args: {
			account_id: accountId
		},
		gas,
	})
	return res
}

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

export const matchKeys = async (seedPhrase, drop_id, keys) => {
	const { secretKey } = parseSeedPhrase(seedPhrase)
	const keyPairs = []
	if (keys.length === 0) return keyPairs
	await Promise.all(keys.map(async (key) => {
		const hash = await hashBuf(`${secretKey}_${drop_id}_${key.key_id}`)
		const { secretKey: s } = generateSeedPhrase(hash)
		const keyPair = KeyPair.fromString(s)
		keyPairs.push(keyPair)
	}))
	return keyPairs
}