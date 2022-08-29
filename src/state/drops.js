import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { parseSeedPhrase, generateSeedPhrase } from "near-seed-phrase"
import { gas, contractId, getClaimAccount } from './near'

const hashBuf = (str) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))

export const addKeys = async (seedPhrase, account, drop, num) => {
	const { drop_id } = drop

	const keys = await genKeys(seedPhrase, num, drop_id, drop.next_key_id)
	const args = {
		drop_id,
		public_keys: keys.map(({ publicKey }) => publicKey.toString()),
	}
	const res = await account.functionCall({
		contractId,
		methodName: 'add_keys',
		args,
		gas: '300000000000000',
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

export const matchKeys = async (seedPhrase, drop_id, keys, nonce = 0, limit = 50) => {
	const { secretKey } = parseSeedPhrase(seedPhrase)
	const keyPairs = []
	if (keys.length === 0) return keyPairs
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