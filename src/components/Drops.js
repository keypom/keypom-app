import { formatNearAmount } from "near-api-js/lib/utils/format";
import { useEffect } from "react";
import { file } from '../utils/store'

import {
	Link, useParams,
} from "react-router-dom";
import { contractId } from '../state/near'
import { addKeys, claimDrop, genKeys } from '../state/drops'

export const Drops = ({ state, update, contract, wallet }) => {

	const { seedPhrase } = state.app.data
	const { drops } = contract
	const { which } = useParams()

	const onMount = async () => {

	}
	useEffect(() => {
		onMount()
	}, [which])

	const handleRemoveDrop = async (drop_id) => {
		update('app.loading', true)
		try {
			const res = await wallet.functionCall({
				contractId,
				methodName: 'delete_keys',
				args: {
					drop_id
				},
				gas: '100000000000000',
			})
		} catch (e) {
			update('app.loading', false)
			throw e
		}
		await wallet.update()
		update('app.loading', false)
	}

	if (!drops?.length) return <>
		<p>No drops</p>
		<Link to={'/create'}><button>Create a Drop</button></Link>
	</>

	if (which) {
		const drop = drops.find((d) => d.drop_id === parseInt(which))
		if (!drop) return <p>Can't find drop ID {which}</p>

		return <>
			<h4>Drop ID: {drop.drop_id}</h4>
			<div className="row sm">
				<div className="six columns">
					<button onClick={async () => {
						update('app.loading', true)
						const num = window.prompt(`How many keys would you like to add to the drop?`)
						if (!num) return update('app.loading', false)
						const res = await addKeys(seedPhrase, wallet, drop, parseInt(num))
						console.log(res)
						await wallet.update()
						update('app.loading', false)
					}}>Add Keys</button>
				</div>
				<div className="six columns">
					<button onClick={() => handleRemoveDrop(drop.drop_id)}>Remove Drop</button>
				</div>
			</div>
			{
				drop.keyPairs && <>

					<h4>Keys {drop.keySupply}</h4>
					<button onClick={async () => {
						const keys = await genKeys(seedPhrase, drop.keySupply, drop.drop_id)
						const links = keys.map(({secretKey}) => `https://keypom.xyz/ticket/${secretKey}`)
						file(`Drop ID ${drop.drop_id} Links.csv`, links.join('\r\n'))
					}}>Download All Ticket Links</button>
					{
						drop.keyPairs.map(({ publicKey, secretKey }) => <div key={publicKey}>
							<div className="row sm">
								<div className="twelve columns">
									<p>{secretKey.substring(0, 32)}</p>
								</div>
							</div>
							<div className="row sm">
								<div className="six columns">
									<Link to={`/ticket/${secretKey}`}><button>Preview Drop</button></Link>
								</div>
								<div className="six columns">
									<button onClick={async () => {
										update('app.loading', true)
										await claimDrop(wallet.accountId, secretKey)
										await wallet.update()
										update('app.loading', false)
									}}>Claim Drop</button>
								</div>
							</div>
						</div>)
					}

				</>
			}
		</>
	}

	return <>
		<h4>Your Drops</h4>

		{
			drops.map(({ drop_id, balance, drop_type_label }) => <div key={drop_id}>
				<div className="row sm">
					<div className="six columns">
						<p>Drop ID: {drop_id}</p>
					</div>
					<div className="six columns">
						<p>{drop_type_label}</p>
					</div>
				</div>
				<div className="row sm">
					<div className="six columns">
						<Link to={`/drops/${drop_id}`}>
							<button>Details</button>
						</Link>
					</div>
					<div className="six columns">
						<button onClick={() => handleRemoveDrop(drop_id)}>Remove Drop</button>
					</div>
				</div>
			</div>)
		}
		<br/>
		<Link to={'/create'}><button>Create a Drop</button></Link>
	</>

}