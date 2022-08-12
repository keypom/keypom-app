import { useState, useEffect } from "react";

import {
	Link, useParams, useSearchParams
} from "react-router-dom";
import { Form } from "./Form";
import { viewMethod, gas } from '../state/near'
import { explorerLink, addContract, removeContract, updateContract } from "../state/contracts";

import { contractBySpec } from "../state/deploy"
import { parseNearAmount } from "near-api-js/lib/utils/format";

export const Contracts = ({ state, update, wallet }) => {

	const [interact, setInteract] = useState()
	const [data, setData] = useState([])
	const { contracts } = state.app?.data
	const { which } = useParams()

	const onMount = async () => {
		if (!which) return
		let contract
		try {
			const metadata = await viewMethod({ contractId: which, methodName: 'nft_metadata' })
			if (!metadata) return
			contract = contractBySpec(metadata.spec)

			if (contract.data) {
				const res = await Promise.all(Object.entries(contract.data).map(([methodName, args]) => 
					viewMethod({ contractId: which, methodName, args })
				))
				setData(res)
				console.log(res)
			}

			const series = await viewMethod({ contractId: which, methodName: 'nft_metadata' })
			if (!contract) return
		} catch (e) {
			console.warn(e)
			return
		}
		setInteract(contract.interact)
	}
	useEffect(() => {
		onMount()
	}, [which])

	if (which) {
		if (!interact) return <p>Cannot find contract by spec or interaction data</p>
		return <>
			<h4>{which} methods:</h4>
			{
				Object.entries(interact).map(([k, { form, valuesMap, deposit, number }]) => {

					return <div key={k}>
						<p>{k}</p>
						<Form {...{
							data: form,
							submit: async (values) => {

								const args = {}
								Object.entries(values).forEach(([k, v]) => {
									if (number) {
										if (number.includes(k)) v = parseInt(v)
									}

									const map = valuesMap || {}
									if (map[k]) {
										const nested = map[k].split('.')
										let obj = args[map[k]]
										while (nested.length > 1) {
											const inner = nested.shift()
											obj = args[inner] = args[inner] || {}
										}
										obj[nested[0]] = v
										return
									}
									args[k] = v
								})
								
								const res = await wallet.functionCall({
									contractId: which,
									methodName: k,
									args,
									attachedDeposit: deposit ? parseNearAmount(deposit) : undefined,
									gas
								})
							},
							submitLabel: `Call ${k} Method`
						}} />
					</div>
				})
			}
		</>
	}

	return <>
		<h4>Your Contracts</h4>

		{
			contracts.map((contractId) => <div key={contractId}>
				<div className="row sm">
					<div className="six columns">
						<p>{contractId}</p>
					</div>
					<div className="six columns">
						<a href={explorerLink(contractId)} target="_blank" rel="noopener noreferrer">
							<button>Explorer</button>
						</a>
					</div>
				</div>

				<div className="row sm">
					<div className="six columns">
						<Link to={`/contracts/${contractId}`}><button>Interact</button></Link>
					</div>
					<div className="six columns">
						<button onClick={() => updateContract(update, contractId)}>Update</button>
					</div>
				</div>
				<div className="row sm">
					<div className="six columns">
						<button className="button-warning" onClick={() => removeContract(update, contractId)}>Remove</button>
					</div>
				</div>

				<div className="spacer"></div>
			</div>)

		}

		<h4>Manual Options</h4>
		<button onClick={() => addContract(update)}>Add Contract</button>

	</>

}