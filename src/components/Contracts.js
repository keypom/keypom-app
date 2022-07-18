import { useEffect } from "react";
import { explorerLink, addContract, removeContract } from "../state/contracts";

export const Contracts = ({ state, update, account }) => {

	const { contracts } = state.app?.data

	const onMount = async () => {

	}
	useEffect(() => {
		onMount()
	}, [])

	return <>
	<h4>Your Contracts</h4>
	
	{
		contracts.map((contractId) => <div key={contractId}>
		<div className="row sm">
			<div className="six columns">
				<p>{contractId}</p>
			</div>
			<div className="six columns">
				<a href={ explorerLink(contractId) } target="_blank" rel="noopener noreferrer">
					<button>Explorer</button>
				</a>
			</div>
		</div>

		<div className="row sm">
			<div className="six columns">
				<button onClick={() => console.log('remove')}>Interact</button>
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