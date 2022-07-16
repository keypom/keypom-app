import * as nearAPI from 'near-api-js';
const { WalletAccount, KeyPair } = nearAPI
import { parseNearAmount, formatNearAmount } from "near-api-js/lib/utils/format";
import { near, connection, networkId, keyStore, accountSuffix } from '../../utils/near-utils';
export { accountSuffix, networkId } from '../../utils/near-utils';
import getConfig from '../../utils/config';
const { contractId: _contractId } = getConfig();
export const contractId = _contractId

import { parseSeedPhrase } from 'near-seed-phrase'
import { getAppData } from './app';

export const initNear = () => async ({ update }) => {

	const wallet = new WalletAccount(near)

	wallet.signIn = () => {
		wallet.requestSignIn(contractId, 'Blah Blah');
	};
	const signOut = wallet.signOut;
	wallet.signOut = () => {
		signOut.call(wallet);
		update('', { account: null });
	};

	wallet.signedIn = wallet.isSignedIn();
    
	let account;
	if (wallet.signedIn) {
		account = wallet.account();
		account.wallet = wallet

		const balance = await viewMethod({
			methodName: 'get_user_balance',
			args: { account_id: account.accountId }
		})
		
		account.contract = {
			balance,
			balanceFormatted: formatNearAmount(balance, 4)
		}
	}

	await update('', { near, wallet, account });
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

export const viewMethod = ({ contractId: _contractId, methodName, args = {} }) => {
	const account = new nearAPI.Account(connection, accountSuffix.substring(1));
	return account.viewFunction(_contractId || contractId, methodName, args)
}