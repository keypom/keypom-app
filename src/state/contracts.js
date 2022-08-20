import { networkId, viewMethod, getAccountWithMain } from "../state/near";
import { contractBySpec } from "../state/deploy";
import { insertAppDataArr, removeAppDataArr } from "../state/app";

export const explorerLink = (contractId) => `https://explorer.${networkId}.near.org/accounts/${contractId}`

export const removeContract = async (wallet, update, contractId) => {
	const confirm = window.confirm(`Really delete ${contractId} contract? This will remove all NFTs and any data!!!`)
	if (!confirm) return
	update('app.loading', true)
	try {
		const contractAccount = getAccountWithMain(contractId)
		await contractAccount.deleteAccount(wallet.accountId)
		removeAppDataArr(update, 'contracts', contractId)
	} catch(e) {
		if (/Can not sign transactions for account/.test(e.toString())) {
			removeAppDataArr(update, 'contracts', contractId)
		}
		console.warn(e)
	} finally {
		update('app.loading', false)
	}
}

export const updateContract = async (update, contractId) => {
	const metadata = await viewMethod({ contractId, methodName: 'nft_metadata' })
	if (!metadata) return
	update('app.loading', true)
	const confirm = window.confirm(`Push latest wasm to ${contractId}? This may have unintended consequences and you might have to remove your contract.`)
	if (!confirm) return update('app.loading', false)
	try {
		const whichContract = contractBySpec(metadata.spec)
		const bytes = await fetch(whichContract.wasm).then((res) => res.arrayBuffer())
		const contractAccount = getAccountWithMain(contractId)
		await contractAccount.deployContract(new Uint8Array(bytes))
	} catch(e) {
		throw e
	} finally {
		update('app.loading', false)
	}
}

export const addContract = (update) => {
	const contractId = window.prompt(`Enter contract account ID e.g. contract.near`)
	if (!contractId || !contractId.length) return
	insertAppDataArr(update, 'contracts', contractId)
}