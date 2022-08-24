import { useEffect } from "react";

import {
	Link, useParams, useSearchParams
} from "react-router-dom";

import { Form } from "./Form";
import { handleDeploy, checkDeploy } from '../state/deploy'

import { contracts } from "../state/deploy"
const { nftSimple, nftSeries } = contracts

const Deploy = ({ state, update, wallet }) => {

	const { seedPhrase } = state.app?.data
	const { what } = useParams()
	const [searchParams] = useSearchParams();

	const onMount = async () => {
		const { contracts } = state.app.data
		await checkDeploy({ state, update, wallet })
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
		case 'nft-simple':
			return <div>
				<Form {...{
					data: {
						...nftSimple.form,
						...nftSimple.args,
						owner_id: wallet.accountId,
					},
					submit: async (values) => {
						update('app.loading', true)
						await handleDeploy({ seedPhrase, values })
						await checkDeploy({ state, update, wallet })
						update('app.loading', false)
					},
					submitLabel: 'Deploy',
				}} />
			</div>
			break;
		case 'nft-series':
			return <div>
				<Form {...{
					data: {
						...nftSeries.form,
						...nftSeries.args,
						owner_id: wallet.accountId,
					},
					submit: async (values) => {
						update('app.loading', true)
						await handleDeploy({ seedPhrase, values })
						await checkDeploy({ state, update, wallet })
						update('app.loading', false)
					},
					submitLabel: 'Deploy',
				}} />
			</div>
			break;
		default:
			return <div>
				<Link to="/deploy/nft-simple"><button className="outline">Deploy NFT Simple</button></Link>
				<Link to="/deploy/nft-series"><button className="outline">Deploy NFT Series</button></Link>
			</div>
	}
}

export default Deploy