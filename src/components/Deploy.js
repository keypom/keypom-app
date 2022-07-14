import { useEffect } from "react";

import {
	Link, useParams, useSearchParams
} from "react-router-dom";

import { parseSeedPhrase } from 'near-seed-phrase'
import { Form } from "./Form";
import { simpleNFT } from "../data/nft";
import { insertAppDataArr } from "../state/app";
import { accountExists, accountSuffix, txStatus, getState, getAccountWithMain } from "../state/near";
import { parseNearAmount } from "near-api-js/lib/utils/format";

export const Deploy = ({ state, update, account }) => {

	const { seedPhrase } = state.app?.data
	const { what } = useParams()
	const [searchParams] = useSearchParams();

	const onMount = async () => {
		const txHashes = searchParams.get('transactionHashes')
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
						try {
							Object.keys(data).forEach((k) => {
								if (values[k] || values[k].length > 0) return
								throw `Missing value ${k}`
							})
						} catch (e) {
							return alert(e)
						}

						const new_account_id = values.contract_id + accountSuffix
						if (await accountExists(new_account_id)) {
							return alert(`Account ${new_account_id} exists. Try again!`)
						}

						const new_public_key = parseSeedPhrase(seedPhrase).publicKey.toString()

						account.functionCall({
							contractId: accountSuffix.substring(1),
							methodName: `create_account`,
							args: {
								new_account_id,
								new_public_key
							},
							gas: '100000000000000',
							attachedDeposit: parseNearAmount('0.1')
						})



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