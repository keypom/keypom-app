import * as nearAPI from 'near-api-js';
const { WalletAccount, KeyPair } = nearAPI
import { parseNearAmount, formatNearAmount } from "near-api-js/lib/utils/format";
import { near, connection, networkId, keyStore, accountSuffix } from '../../utils/near-utils';
export { accountSuffix, networkId } from '../../utils/near-utils';
import getConfig from '../../utils/config';
import { matchKeys } from './drops'
const { contractId: _contractId } = getConfig();
import { parseSeedPhrase } from 'near-seed-phrase'
import { getAppData } from './app';
import { getSelector, getAccount, viewFunction, functionCall as _functionCall } from '../utils/wallet-selector-compat'

export const contractId = _contractId
export const gas = '100000000000000';

const dropTypeMap = {
	FC: 'Function Call Drop'
}

export const initNear = (hasUpdate = true) => async ({ update, getState }) => {
	
	let updateAccount
	if (hasUpdate) {
		updateAccount = async () => {
			const account = await getAccount()
	
			if (!account.accountId) return update('app.loading', false)
			
			const balance = await view('get_user_balance', { account_id: account.accountId })
	
			const drops = await view('get_drops_for_owner', { account_id: account.accountId })
			
			for (drop of drops) {
				drop.drop_type_label = typeof drop.drop_type === 'object' ? dropTypeMap[Object.keys(drop.drop_type)] : drop.drop_type
				
				try {
					drop.keySupply = await view('get_key_supply_for_drop', { drop_id: drop.drop_id })
				} catch (e) {
					console.log(e)
				}
				if (drop.keySupply > 0) {
					const keys = await view('get_keys_for_drop', { drop_id: drop.drop_id })
					drop.keys = keys.map(({ pk }) => pk)
				} else {
					drop.keys = []
				}
				/// TODO this has been updated with the drop nonce
	
				// TODO make this a key matching algo that ensures 1-1 keyPair generation for the drop keys
				// should work even when you paginate, drop.keyPairs stays synced with drop.keys
				
				const { seedPhrase } = getState().app.data
				if (!seedPhrase) {
					alert('Please go to Account and load your app data again.')
					return update('app.loading', false)
				}
				drop.keyPairs = await matchKeys(seedPhrase, drop.drop_id, drop.keys)
			}
			
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

export const call = (account, methodName, args) => {
	return account.functionCall({
		contractId,
		methodName,
		args,
		gas,
	})
}