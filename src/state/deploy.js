import { get, set, del } from '../utils/store'

import { parseSeedPhrase } from 'near-seed-phrase'
import { insertAppDataArr } from "../state/app";
import { contractId, accountExists, accountSuffix, txStatus, getState, getAccountWithMain, viewMethod } from "../state/near";
import { parseNearAmount } from "near-api-js/lib/utils/format";

import { nftSimple } from "../data/nft-simple";
import { nftSeries } from "../data/nft-series";

export const contracts = {
	nftSimple,
	nftSeries,
}

export const contractBySpec = (spec) => Object.values(contracts).find(({ form: { __spec } }) => __spec === spec)

const DEPLOY = `__DEPLOY`

export const checkDeploy = async ({ state, wallet, update }) => {

	const deploy = get(DEPLOY)
	if (!deploy) return update('app.loading', false)

	const { new_account_id, new_public_key, values } = deploy
	const { contracts } = state.app.data

	/// check if contract account was created yet

	if (!contracts || !contracts.includes(deploy.new_account_id)) {

		/// have a proxy key to create account?

		let keyInfo
		try {
			keyInfo = await viewMethod({
				methodName: 'get_key_information',
				args: {
					key: new_public_key
				}
			})
		} catch (e) {
			console.warn(e)
			throw e
		}

		if (!keyInfo) {
			try {
				await wallet.functionCall({
					contractId,
					methodName: `create_drop`,
					gas: '100000000000000',
					args: {
						public_keys: [new_public_key],
						deposit_per_use: parseNearAmount(values.NEAR.toString() || '5'),
						drop_config: {
							max_claims_per_key: 1,
						}
					}
				})
			} catch (e) {
				if (/No user balance|Not enough attached/.test(e.toString())) {
					del(DEPLOY)
					return alert('Not enough NEAR in account')
				}
				throw e
			}
		}

		/// NOTE could have been front run on account_id if it was attempted before

		if (!(await accountExists(deploy.new_account_id))) {
			const claimAccount = getAccountWithMain(contractId)

			/// could have called but page reloaded and key doesn't have enough balance, just swallow exception

			try {
				await claimAccount.functionCall({
					contractId,
					methodName: `create_account_and_claim`,
					gas: '100000000000000',
					args: {
						new_public_key,
						new_account_id
					}
				})
			} catch (e) {
				console.warn(e)
			}
		}

		if (await accountExists(deploy.new_account_id)) {
			insertAppDataArr(update, 'contracts', new_account_id)
		} else {
			alert('Could not deploy your account. Please try again!')
		}
	}

	/// check contract state

	const contractState = await getState(new_account_id)
	if (!contractState.code_hash) {
		const whichContract = contractBySpec(values.spec)
		const bytes = await fetch(whichContract.wasm).then((res) => res.arrayBuffer())
		const contractAccount = getAccountWithMain(new_account_id)
		await contractAccount.deployContract(new Uint8Array(bytes))
	}

	/// check contract initialized

	try {
		await viewMethod({ contractId: new_account_id, methodName: 'nft_tokens' })
	} catch (e) {
		if (!/The contract is not initialized/gi.test(e.toString())) {
			throw e
		}

		const contractAccount = getAccountWithMain(new_account_id)
		const res = await contractAccount.functionCall({
			contractId: new_account_id,
			methodName: 'new',
			gas: '100000000000000',
			args: {
				owner_id: wallet.accountId,
				metadata: {
					spec: values.spec,
					name: values.name,
					symbol: values.symbol,
					base_uri: 'https://cloudflare-ipfs.com/ipfs/'
				}
			}
		})
		console.log(res)

		del(DEPLOY)
	}

	update('app.loading', false)
}

export const handleDeploy = async ({ seedPhrase, values }) => {

	/// validation

	// try {
	// 	Object.keys(data).forEach((k) => {
	// 		if (values[k] || values[k].length > 0) return
	// 		throw `Missing value ${k}`
	// 	})
	// } catch (e) {
	// 	return alert(e)
	// }

	// __spec was a hidden field in values
	values.spec = values.__spec

	const new_account_id = values.contract_id + accountSuffix
	if (await accountExists(new_account_id)) {
		update('app.loading', false)
		return alert(`Account ${new_account_id} exists. Try again!`)
	}
	const new_public_key = parseSeedPhrase(seedPhrase).publicKey.toString()

	set(DEPLOY, { new_account_id, new_public_key, values })
}