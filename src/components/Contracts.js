import { useState, useEffect } from "react";

import {
	Link, useParams, useSearchParams
} from "react-router-dom";
import { Form } from "./Form";
import { viewMethod } from '../state/near'
import { explorerLink, addContract, removeContract } from "../state/contracts";

import { contracts, contractBySpec } from "../state/deploy"

export const Contracts = ({ state, update, account }) => {

	const [interact, setInteract] = useState()
	const { contracts } = state.app?.data
	const { which } = useParams()


	const onMount = async () => {
		if (!which) return
		let contract
		try {
			const metadata = await viewMethod({ contractId: which, methodName: 'nft_metadata' })
			if (!metadata) return
			contract = contractBySpec(metadata.spec)
			if (!contract) return
		} catch (e) {
			console.warn(e)
			return
		}
		setInteract(contract.interact)
	}
	useEffect(() => {
		onMount()
	}, [])

	if (which) {
		if (!interact) return <p>Cannot find contract by spec or interaction data</p>
		return <>
			<h4>{which} methods:</h4>
			{
				Object.entries(interact).map(([k, v]) => {

					return <>
						<p>{k}</p>
						<Form {...{
							data: v.form,
							submit: (values) => {
								console.log(values)
							},
							submitLabel: `Call ${k} Method`
						}} />
					</>
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