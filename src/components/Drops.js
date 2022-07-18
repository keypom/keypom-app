import { formatNearAmount } from "near-api-js/lib/utils/format";
import { useEffect } from "react";

import {
	Link, useParams,
} from "react-router-dom";
import { contractId } from '../state/near'
import { addKeys, claimDrop } from '../state/drops'

export const Drops = ({ state, update, contract, account }) => {

	const { seedPhrase } = state.app.data
	const { drops } = contract
	const { which } = useParams()
	
	const onMount = async () => {

	}

	useEffect(() => {
		onMount()
	}, [])

	const handleRemoveDrop = async () => {
		update('app.loading', true)
		try {
			const res = await account.functionCall({
				contractId,
				methodName: 'delete_keys',
				args: {
					drop_id
				},
				gas: '100000000000000',
			})
				
		} catch(e) {
			update('app.loading', false)
			throw e
		}
		await account.update()
		update('app.loading', false)
	}

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
						const res = await addKeys(seedPhrase, account, drop.drop_id, parseInt(num), drop.keys.length)
						console.log(res)
						await account.update()
						update('app.loading', false)
					}}>Add Keys</button>
				</div>
				<div className="six columns">
					<button onClick={handleRemoveDrop}>Remove Drop</button>
				</div>
			</div>
			<h4>Keys</h4>
			{
				drop.keyPairs.map(({ publicKey, secretKey }) => <div key={publicKey}>
					<div className="row sm">
						<div className="six columns">
						<p>{secretKey.substring(0, 17)}</p>
						</div>
						<div className="six columns">
						<button onClick={async () => {
							update('app.loading', true)
							await claimDrop(account.accountId, secretKey)
							await account.update()
							update('app.loading', false)
						}}>Claim Drop</button>
						</div>
					</div>
				</div>)
			}
		</>
	}

	return <>
	<h4>Your Drops</h4>

	{
		drops.length === 0 && <p>No drops</p>
	}

	{
		drops.map(({ drop_id, balance, drop_type }) => <div key={drop_id}>
			<div className="row sm">
				<div className="six columns">
					<p>Drop ID: {drop_id}</p>
				</div>
				<div className="six columns">
					<p>{drop_type}</p>
				</div>
			</div>
			<div className="row sm">
				<div className="six columns">
					<Link to={`/drops/${drop_id}`}>
						<button>Details</button>
					</Link>
				</div>
				<div className="six columns">
					<button onClick={handleRemoveDrop}>Remove Drop</button>
				</div>
			</div>
		</div>)
	}
	</>

}