import * as nearAPI from 'near-api-js';
const { WalletAccount, KeyPair } = nearAPI
import { near, connection, networkId, keyStore } from '../../utils/near-utils';
export { accountSuffix, networkId } from '../../utils/near-utils';
import getConfig from '../../utils/config';
const { contractId } = getConfig();

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