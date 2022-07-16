import { useEffect } from "react";

import {
	Link, useParams, useSearchParams
} from "react-router-dom";

import { Form } from "./Form";
import { simpleNFT } from "../data/nft";
import { handleDeploy, checkDeploy } from '../state/deploy'

export const Deploy = ({ state, update, account }) => {

	const { seedPhrase } = state.app?.data
	const { what } = useParams()
	const [searchParams] = useSearchParams();

	const onMount = async () => {

		const { contracts } = state.app.data
		console.log(contracts)
		
		await checkDeploy({ state, update, account })
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
						await handleDeploy({ seedPhrase, values })
						await checkDeploy({ state, update, account })
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