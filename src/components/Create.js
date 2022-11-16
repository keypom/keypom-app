import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useEffect, useState } from "react";
import { genKeys } from '../state/drops'
import { call, view } from '../state/near'
import { Form } from "./Form";
import { hash } from "../utils/crypto"

import dJSON from 'dirty-json';
 
// output: {"test":"this is a test"}

const types = ['Simple', 'FT Drop', 'NFT Drop', 'Custom Call']
const params = ['receiver_id', 'method_name', 'args', 'attached_deposit', 'account_id_field', 'drop_id_field']
// const functionCall = {
// 	None: false,
// 	receiver_id: '',
// 	method_name: '',
// 	args: '',
// 	attached_deposit: 0,
// 	account_id_field: '',
// 	drop_id_field: '',
// }
const functionCall = {
	None: false,
	receiver_id: 'keypom-beta-nfts.testnet',
	method_name: 'nft_mint',
	args: '',
	attached_deposit: '0.015',
	account_id_field: 'receiver_id',
	drop_id_field: 'mint_id',
}

const Create = ({ state, update, wallet }) => {

	const { seedPhrase } = state.app?.data
	const [type, setType] = useState('Simple')
	const [customData, setCustomData] = useState([{
		Keys: 0,
		metadata: JSON.stringify({
			media: 'https://cloudflare-ipfs.com/ipfs/bafybeicxyjkc6feovbz63ssr46yzbq4i3pifauhr32dwenmzhis5fopwny', id: 'keypom-beta',
		}),
		password: '',
		...functionCall,
	}])

	const onMount = async () => {

	}

	useEffect(() => {
		onMount()
	}, [])

	return <>
		<h4>Create Drop</h4>

		{
			types.map((t) => <button key={t}
				className={type === t ? 'button-primary' : ''}
				onClick={() => setType(t)}>
				{t}
			</button>)
		}

		{
			type === 'Simple' && <>
				<Form {...{
					data: {
						Keys: 0,
						NEAR: 0,
					},
					submit: async (values) => {
						update('app.loading', true)
						let args = {
							public_keys: [],
							balance: parseNearAmount(values.NEAR) || '1',
						}
						try {
							const res = await call(wallet, 'create_drop', args)
							console.log(res)

							const drop_id = parseInt(Buffer.from(res?.status?.SuccessValue, 'base64').toString(), 10)
							const keys = await genKeys(seedPhrase, parseInt(values.Keys), drop_id)
							args = {
								drop_id,
								public_keys: keys.map(({ publicKey }) => publicKey.toString()),
							}

							const res2 = await call(wallet, 'add_keys', args)
							console.log(res2)

						} catch (e) {
							update('app.loading', false)
							throw e
						}
						await wallet.update()
						update('app.loading', false)
					}
				}} />
			</>
		}

		{
			type === 'Custom Call' && <>
				{
					customData.map((data, i) => {
						return <div key={i}>
							<Form {...{
								data,
								onChange: (k, values) => {
									let newData = [...customData]
									newData[i][k] = values[k]
									if (k === 'None') {
										if (values[k]) {
											const newData = [...customData]
											params.forEach((p) => {
												newData[i]['__' + p] = newData[i][p]
												delete newData[i][p]
											})
										} else {
											const newData = [...customData]
											params.forEach((p) => {
												newData[i][p] = newData[i]['__' + p]
												delete newData[i]['__' + p]
											})
										}
									}
									setCustomData(newData)
								},
							}} />

							{
								i > 0 && <button className="outline" onClick={() => {
									const newData = [...customData]
									newData.splice(i, 1)
									setCustomData(newData)
								}}>Remove Call 👆</button>
							}

							<button className="outline" onClick={() => {
								const newData = [...customData]
								newData.splice(i + 1, 0, {...functionCall})
								setCustomData(newData)
							}}>Add Call 👇</button>

						</div>
					})
				}

				<button className="button-primary" onClick={async () => {
					console.log(customData)

					const first = customData[0]
					const numKeys = parseInt(first.Keys)
					const metadata = first.metadata.length ? JSON.stringify(dJSON.parse(first.metadata)) : undefined
					const { password } = first
					delete first.Keys

					update('app.loading', true)

					let args = {
						public_keys: [],
						deposit_per_use: parseNearAmount('0.2'),
						metadata,
						config: {
							uses_per_key: customData.length,
							usage: {
								refund_deposit: true,
							}
						},
						fc: {
							methods: customData.map((data) => data.None ? null : [{
								account_id_field: data.account_id_field,
								drop_id_field: data.drop_id_field,
								receiver_id: data.receiver_id,
								method_name: data.method_name,
								args: data.args.length ? JSON.stringify(dJSON.parse(data.args)) : '',
								attached_deposit: parseNearAmount(data.attached_deposit) || '0'
							}])
						}
					}
					
					try {
						const res = await call(wallet, 'create_drop', args)
						
						const drops = await view('get_drops_for_owner', { account_id: wallet.accountId })
						drops.sort((a, b) => b.drop_id - a.drop_id)
						const { drop_id } = drops[0]

						const keys = await genKeys(seedPhrase, numKeys, drop_id)
						args = {
							drop_id,
							public_keys: keys.map(({ publicKey }) => publicKey.toString()),

							// making tickets
							passwords_per_use: password.length > 0
							? await Promise.all(keys.map(async ({ publicKey }) => ([{
								pw: await hash(await hash(password + publicKey.toString() + 1), 'hex'),
								key_use: 1
							}]))) : undefined
						}

						const res2 = await call(wallet, 'add_keys', args, '300000000000000')
						console.log(res2)

					} catch (e) {
						update('app.loading', false)
						throw e
					}
					await wallet.update()
					update('app.loading', false)


				}}>Submit</button>
			</>
		}

		{(type === 'FT Drop' || type === 'NFT Drop') && <p>Coming Soon!</p>}

	</>

}

export default Create