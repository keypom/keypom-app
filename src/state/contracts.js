import { networkId, viewMethod, getAccountWithMain } from "../state/near";
import { contractBySpec } from "../state/deploy";
import { insertAppDataArr, removeAppDataArr } from "../state/app";

export const explorerLink = (contractId) => `https://explorer.${networkId}.near.org/accounts/${contractId}`

export const removeContract = (update, contractId) => {
	const confirm = window.confirm(`Really remove reference to ${contractId} from your app data?`)
	if (!confirm) return
	removeAppDataArr(update, 'contracts', contractId)
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