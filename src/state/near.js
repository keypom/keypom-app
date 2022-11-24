import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { formatNearAmount } from "near-api-js/lib/utils/format";
import { near, connection, networkId, keyStore, accountSuffix, contractId } from '../../utils/near-utils';
export { accountSuffix, networkId, contractId, walletUrl } from '../../utils/near-utils';
import { matchKeys } from './drops'
import { parseSeedPhrase } from 'near-seed-phrase'
import { getAppData } from './app';
import { getSelector, getAccount, viewFunction, functionCall as _functionCall } from '../utils/wallet-selector-compat'

import { initKeypom } from "keypom-js";

export const gas = '100000000000000';

export const initNear = (hasUpdate = true) => async ({ update, getState }) => {

	initKeypom({
		near,
		keypomContractId: contractId
	})

	let updateAccount
	if (hasUpdate) {
		updateAccount = async () => {
			const account = await getAccount()
	
			if (!account.accountId) return update('app.loading', false)
			
			const balance = await view('get_user_balance', { account_id: account.accountId })
	
			const drops = await view('get_drops_for_owner', { account_id: account.accountId })

			console.log('DROPS', drops)
			console.log('REGISTERED USES', drops.map(({registered_uses}) => registered_uses))
			/// TODO this has been updated with the drop nonce
			// TODO make this a key matching algo that ensures 1-1 keyPair generation for the drop keys
			// should work even when you paginate, drop.keyPairs stays synced with drop.keys
			const { seedPhrase } = getState().app.data

			if (!seedPhrase) {
				alert('Please go to Account and load your app data again.')
				return update('app.loading', false)
			}

			/// going to mutate the drop directly, wait for all updates then execute after
			await Promise.all(drops.map(async (drop) => {
				
				await Promise.all([
					(async() => {
						try {
							drop.keySupply = await view('get_key_supply_for_drop', { drop_id: drop.drop_id })
						} catch (e) {
							drop.keySupply = 0
							console.log(e)
						}
					})(),
					(async() => {
						/// TODO fix this so it's checking the keys are valid before showing them to user
						if (drop.next_key_id === 0) {
							drop.keys = []
							drop.keyPairs = []
							return
						}
						const keys = await view('get_keys_for_drop', { drop_id: drop.drop_id, from_index: '0', limit: 5 })
						drop.keys = keys.map(({ pk }) => pk)
						drop.keyPairs = await matchKeys(seedPhrase, drop.drop_id, keys)
					})()
				])
			}))
			
			const contract = {
				drops,
				balance,
				balanceFormatted: formatNearAmount(balance, 4)
			}
	
			update('', { contract })
			update('wallet.accountId', account.accountId)
			update('app.loading', false)
		}
	}

	const selector = await getSelector({
		networkId,
		contractId,
		onAccountChange: async (accountId) => {
			if (!accountId) {
				return update('app.loading', false)
			}
			console.log('Current Account:', accountId)
			if (hasUpdate) {
				updateAccount()
			}
		}
	})
	
	const account = await getAccount()
	selector.accountId = account.accountId
	selector.functionCall = _functionCall
	selector.viewFunction = viewFunction
	try {
		selector.wallet = await selector.wallet()
	} catch(e) {}
	selector.signAndSendTransaction = selector.wallet.signAndSendTransaction
	selector.signAndSendTransactions = selector.wallet.signAndSendTransactions
	/// updates the account re: the app contract
	if (hasUpdate) {
		selector.update = updateAccount
	}

	await update('', { near, wallet: selector });
};

export const accountExists = async (accountId) => {
	try {
		const account = new nearAPI.Account(connection, accountId);
		await account.state();
		return true;
	} catch(e) {
		if (!/no such file|does not exist/.test(e.toString())) {
			throw e;
		}
		return false;
	}
};

export const txStatus = (txHash) => connection.provider.txStatus(txHash, networkId);

export const getState = async (accountId) => {
	const account = new nearAPI.Account(connection, accountId);
	const state = await account.state();
	if (state.code_hash === `11111111111111111111111111111111`) state.code_hash = null
	return state
}

export const getAccountWithMain = (accountId) => {
	const account = new nearAPI.Account(connection, accountId);
	keyStore.setKey(networkId, accountId, KeyPair.fromString(parseSeedPhrase(getAppData().seedPhrase).secretKey))
	return account
}

export const getClaimAccount = (secretKey) => {
	const account = new nearAPI.Account(connection, contractId);
	keyStore.setKey(networkId, contractId, KeyPair.fromString(secretKey))
	return account
}

export const functionCall = ({ contractId, methodName, args = {} }) => {
	const account = getAccountWithMain(contractId)
	return account.functionCall({
		contractId,
		methodName,
		args,
		gas,
	})
}

export const viewMethod = ({ contractId: _contractId, methodName, args = {} }) => {
	const account = new nearAPI.Account(connection, accountSuffix.substring(1));
	return account.viewFunction(_contractId || contractId, methodName, args)
}

export const view = (methodName, args) => {
	const account = new nearAPI.Account(connection, accountSuffix.substring(1));
	return account.viewFunction(contractId, methodName, args)
}

export const call = (account, methodName, args, _gas = gas) => {
	return account.functionCall({
		contractId,
		methodName,
		args,
		gas: _gas,
	})
}