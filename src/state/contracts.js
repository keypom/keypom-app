import { networkId } from "../state/near";
import { insertAppDataArr, removeAppDataArr } from "../state/app";

export const explorerLink = (contractId) => `https://explorer.${networkId}.near.org/accounts/${contractId}`

export const removeContract = (update, contractId) => {
	const confirm = window.confirm(`Really remove reference to ${contractId} from your app data?`)
	if (!confirm) return
	removeAppDataArr(update, 'contracts', contractId)
}

export const addContract = (update) => {
	const contractId = window.prompt(`Enter contract account ID e.g. contract.near`)
	if (!contractId || !contractId.length) return
	insertAppDataArr(update, 'contracts', contractId)
}