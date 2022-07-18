import { formatNearAmount } from "near-api-js/lib/utils/format";
import { useEffect } from "react";
import { contractId } from '../state/near'

export const Drops = ({ update, contract, account }) => {

	const { drops } = contract

	console.log(drops)
	
	const onMount = async () => {

	}

	useEffect(() => {
		onMount()
	}, [])

	return <>
	<h4>Your Drops</h4>

	{
		drops.length === 0 && <p>No drops</p>
	}

	{
		drops.map(({ drop_id, balance, drop_type }, i) => <div key={i}>
			<div className="row sm">
				<div className="six columns">
					<p>Drop # {i}</p>
				</div>
				<div className="six columns">
					<p>Balance: {formatNearAmount(balance, 4)}</p>
				</div>
			</div>
			<div className="row sm">
				<div className="six columns">
					<p>{drop_type}</p>
				</div>
				<div className="six columns">
					<button onClick={async () => {
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
					}}>Remove Drop</button>
				</div>
			</div>
		</div>)
	}
	</>

}