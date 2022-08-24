import { useState, useEffect } from "react";

import {
	Link, useParams, useSearchParams
} from "react-router-dom";
import { Form } from "./Form";
import { viewMethod, gas } from '../state/near'
import { explorerLink, addContract, removeContract, updateContract } from "../state/contracts";

import { contractBySpec } from "../state/deploy"
import { parseNearAmount } from "near-api-js/lib/utils/format";

const Contracts = ({ state, update, wallet }) => {

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

			console.log('here')
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
			{
				data.length > 0 && data[0].length > 0 && <>
					<h3>Data</h3>
					{
						data.map((d, i) => <div key={i}>
							<h4>Data {i}</h4>
							{
								d.map((d) => {
									console.log(d)
									return <p key={d.series_id}>{JSON.stringify(d)}</p>
								})
							}
						</div>)
					}
				</>
			}
			<h3>Methods</h3>
			{
				Object.entries(interact).map(([k, { form, valuesMap, deposit, number }]) => {

					return <div key={k}>
						<h4>{k}</h4>
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

		{
			(!contracts || !contracts.length) ? <>
				<p>No contracts deployed</p>
			</>
				:
				<>
					<h4>Your Contracts</h4>

					{
						contracts.map((contractId) => <div key={contractId}>
							<div className="grid sm">
								<div>
									<p>{contractId}</p>
								</div>
								<div>
									<a href={explorerLink(contractId)} target="_blank" rel="noopener noreferrer">
										<button className="outline">Explorer</button>
									</a>
								</div>
								<div>
									<Link to={`/contracts/${contractId}`}><button className="outline">Interact</button></Link>
								</div>
								<div>
									<button className="outline" onClick={() => updateContract(update, contractId)}>Update</button>
								</div>
								<div>
									<button className="outline button-warning" onClick={() => removeContract(wallet, update, contractId)}>Remove</button>
								</div>
							</div>

							<div className="spacer"></div>
						</div>)

					}
				</>
		}


		<h4>Admin</h4>
		<Link to={'/deploy'}><button className="outline">Deploy a New Contract</button></Link>
		<button className="outline" onClick={() => addContract(update)}>Add Existing Contract By Account ID</button>

	</>

}

export default Contracts