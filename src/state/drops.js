import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { parseSeedPhrase, generateSeedPhrase } from "near-seed-phrase"
import { contractId, getClaimAccount } from './near'

const hashBuf = (str) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))

export const addKeys = async (seedPhrase, account, drop_id, num, nonce = 0) => {
	const keys = await genKeys(seedPhrase, num, drop_id, nonce)
	args = {
		drop_id,
		public_keys: keys.map(({ publicKey }) => publicKey.toString()),
	}
	const res = await account.functionCall({
		contractId,
		methodName: 'add_to_drop',
		args,
		gas: '100000000000000',
	})
	return res
}

export const claimDrop = async (accountId, secretKey) => {
	const claimAccount = getClaimAccount(secretKey)
	const res = await claimAccount.functionCall({
		contractId,
		methodName: 'claim',
		args: {
			account_id: accountId
		},
		gas: '100000000000000',
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

export const matchKeys = async (seedPhrase, drop_id, keys, nonce = 0, limit = 1000) => {
	const { secretKey } = parseSeedPhrase(seedPhrase)
	const keyPairs = []
	for (let i = nonce; i < nonce + limit; i++) {
		const hash = await hashBuf(`${secretKey}_${drop_id}_${i}`)
		const { secretKey: s } = generateSeedPhrase(hash)
		const keyPair = KeyPair.fromString(s)
		if (!keys.includes(keyPair.publicKey.toString())) continue
		keyPairs.push(keyPair)
		if (keyPairs.length === keys.length) break
	}
	return keyPairs
}