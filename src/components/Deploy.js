import { useEffect } from "react";

import {
	Link, useParams, useSearchParams
} from "react-router-dom";

import { parseSeedPhrase } from 'near-seed-phrase'
import { Form } from "./Form";
import { simpleNFT } from "../data/nft";
import { insertAppDataArr } from "../state/app";
import { contractId, accountExists, accountSuffix, txStatus, getState, getAccountWithMain, viewMethod } from "../state/near";
import { parseNearAmount } from "near-api-js/lib/utils/format";

import wasm from 'url:../data/main.wasm'

export const Deploy = ({ state, update, account }) => {

	const { seedPhrase } = state.app?.data
	const { what } = useParams()
	const [searchParams] = useSearchParams();

	const onMount = async () => {

		const txHashes = searchParams.get('transactionHashes')
		if (!txHashes) return
		const res = await txStatus(txHashes)
		const args = res?.transaction?.actions[0]?.FunctionCall?.args
		if (!args) return
		const { new_account_id } = JSON.parse(Buffer.from(args, 'base64').toString())
		if (!new_account_id) return
		insertAppDataArr(update, 'contracts', new_account_id)

		const state = await getState(new_account_id)
		if (!state.code) {
			switch (what) {
				case 'nft':
				console.log('deploying simple NFT')
				const account = getAccountWithMain(new_account_id)
				// const bytes =

				// console.log(bytes)

				// account.deployContract()
				break;
			}
		}
	}
	useEffect(() => {
		onMount()
	}, [])
	
	if (!seedPhrase) {
		return <>
			<p>Please set up your app data first</p>
			<Link to="/account"><button>Account</button></Link>
		</>
	}


	switch (what) {
		case 'nft':
			const data = {
				...simpleNFT.form,
				...simpleNFT.args,
				owner_id: account.accountId,
			}
			return <div>
				<Form {...{
					data,
					submit: async (values) => {
						// try {
						// 	Object.keys(data).forEach((k) => {
						// 		if (values[k] || values[k].length > 0) return
						// 		throw `Missing value ${k}`
						// 	})
						// } catch (e) {
						// 	return alert(e)
						// }

						const new_account_id = values.contract_id + accountSuffix
						if (await accountExists(new_account_id)) {
							return alert(`Account ${new_account_id} exists. Try again!`)
						}

						const drops = await viewMethod({
							methodName: 'drops_for_funder',
							args: {
								account_id: account.accountId,
							}
						})

						// for (drop of drops) {
						// 	const keys = await viewMethod({
						// 		methodName: 'get_keys_for_drop',
						// 		args: {
						// 			drop_id: drop.drop_id,
						// 		}
						// 	})
						// 	console.log(keys)
						// }

						for (drop of drops) {
							const res = await account.functionCall({
								contractId,
								methodName: `delete_keys`,
								gas: '100000000000000',
								args: {
									drop_id: drop.drop_id
								}
							})
						}
						
						const new_public_key = parseSeedPhrase(seedPhrase).publicKey.toString()
						await account.functionCall({
							contractId,
							methodName: `create_drop`,
							gas: '100000000000000',
							args: {
								public_keys: [new_public_key],
								balance: parseNearAmount('3.5'),
								drop_config: {
									max_claims_per_key: 1,
								}
							}
						})

						const claimAccount = getAccountWithMain(contractId)
						const claim = await claimAccount.functionCall({
							contractId,
							methodName: `create_account_and_claim`,
							gas: '100000000000000',
							args: {
								new_public_key,
								new_account_id
							}
						})
						console.log(claim)

						insertAppDataArr(update, 'contracts', new_account_id)

						const bytes = await fetch(wasm).then((res) => res.arrayBuffer())
						const contractAccount = getAccountWithMain(new_account_id)
						await contractAccount.deployContract(new Uint8Array(bytes))

						const res = await contractAccount.functionCall({
							contractId: new_account_id,
							methodName: 'new',
							gas: '100000000000000',
							args: {
								owner_id: account.accountId,
								metadata: {
									spec: values.spec,
									name: values.name,
									symbol: values.symbol,
								}
							}
						})

						console.log(res)
						
					}
				}} />
			</div>
			break;
		default:
			return <div>
				<Link to="/deploy/nft"><button>Deploy NFT</button></Link>
			</div>
	}
}