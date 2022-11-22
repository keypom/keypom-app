import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { genKeys } from '../state/drops'
import { call, contractId, view, viewMethod } from '../state/near'
import { Form } from "./Form";
import { hash } from "../utils/crypto"
import { createDrop } from "keypom-js";

import dJSON from 'dirty-json';

import './Create.scss'

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

// https://testnet-api.kitwallet.app/account/md1.testnet/likelyNFTsFromBlock

const tokenMap = {
	'USDC (testnet.ref.finance)': 'usdc.fakes.testnet',
	'USDT.e (testnet.ref.finance': 'usdt.fakes.testnet',
	'DAI (testnet.ref.finance)': 'dai.fakes.testnet'
}

const Create = ({ state, update, wallet }) => {

	const { seedPhrase } = state.app?.data

	const navigate = useNavigate()

	const [type, setType] = useState('Simple')
	const [curNFT, setCurNFT] = useState()
	const [dataNFT, setDataNFT] = useState()
	const [customData, setCustomData] = useState([{
		Keys: 0,
		metadata: JSON.stringify({
			media: 'https://cloudflare-ipfs.com/ipfs/bafybeicxyjkc6feovbz63ssr46yzbq4i3pifauhr32dwenmzhis5fopwny', id: 'keypom-beta',
		}),
		password: '',
		...functionCall,
	}])

	const onMount = async () => {
		if (type !== 'NFT Drop' && !state.nfts) return
		const likelyNFTs = await fetch('https://testnet-api.kitwallet.app/account/md1.testnet/likelyNFTsFromBlock').then((r) => r.json())
		state.nfts = likelyNFTs.list
		setCurNFT(state.nfts[0])
	}

	useEffect(() => {
		onMount()
	}, [type])

	const onNFT = async () => {
		if (!curNFT) return
		try {
			const nftMetadata = await viewMethod({
				contractId: curNFT,
				methodName: 'nft_metadata'
			})
			const tokens = await viewMethod({
				contractId: curNFT,
				methodName: 'nft_tokens_for_owner',
				args: {
					account_id: wallet.accountId,
					limit: 10,
				}
			})
			setDataNFT({
				...nftMetadata,
				tokens,
				curToken: tokens[0] || null
			})
		} catch (e) {
			alert('Something wrong with the NFT contract you selected. Please try another contract.')
			console.warn(e)
		}
	}
	useEffect(() => {
		onNFT()
	}, [curNFT])

	return <>
		<h4>Create Drop</h4>

		{
			types.map((t) => <button key={t}
				className={type === t ? 'button-primary' : 'outline'}
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
						try {
							const dropId = Date.now().toString()
							const keys = await genKeys(seedPhrase, parseInt(values.Keys), dropId)

							await createDrop({
								wallet,
								dropId,
								publicKeys: keys.map(({ publicKey }) => publicKey.toString()),
								depositPerUseYocto: parseNearAmount(values.NEAR) || '1',
								hasBalance: true,
							})
						} catch (e) {
							console.warn(e)
							throw e
						} finally {
							await wallet.update()
							navigate('/drops')
							update('app.loading', false)
						}
					}
				}} />
			</>
		}

		{
			type === 'FT Drop' && <>
				<Form {...{
					data: {
						Keys: 0,
						NEAR: 0,
						'FT Contract ID': [
							'USDC (testnet.ref.finance)',
							'USDT.e (testnet.ref.finance',
							'DAI (testnet.ref.finance)'
						],
						'FT Amount': 0
					},
					submit: async (values) => {

						try {
							const dropId = Date.now().toString()
							const keys = await genKeys(seedPhrase, parseInt(values.Keys), dropId)
							const ftData = {
								contractId: tokenMap[values['FT Contract ID']],
								senderId: wallet.accountId,
								balancePerUse: values['FT Amount']
							}
							createDrop({
								wallet,
								dropId,
								publicKeys: keys.map(({ publicKey }) => publicKey.toString()),
								depositPerUseYocto: parseNearAmount(values.NEAR) || '1',
								hasBalance: true,
								ftData,
							})

						} catch (e) {
							console.warn(e)
							throw e
						} finally {
							await wallet.update()
							update('app.loading', false)
						}
					}
				}} />
			</>
		}

		{
			type === 'NFT Drop' && <>
				{
					state.nfts?.length > 0
						?
						<>
							<Form {...{
								data: {
									NEAR: 0,
									'NFT Contract ID': state.nfts,
									'NFT Token ID': dataNFT ? dataNFT.tokens.map(({ token_id }) => token_id) : ['No Tokens']
								},
								onChange: (k, newValues) => {
									switch (k) {
										case 'NFT Contract ID': setCurNFT(newValues[k]); break;
										case 'NFT Token ID': setDataNFT({
											...dataNFT,
											curToken: dataNFT.tokens.find(({ token_id }) => token_id === newValues[k])
										}); break;
									}
								},
								BeforeSubmit: () => <>
									{
										dataNFT?.curToken
											?
											<>
												<p>NFT Preview</p>
												<img className="nft-preview" src={
													/http/.test(dataNFT?.curToken.metadata.media)
														? dataNFT?.curToken.metadata.media
														: `https://cloudflare-ipfs.com/ipfs/${dataNFT?.curToken.metadata.media}`
												}
												/>
											</>
											:
											<p>You don't own any NFTs for this contract</p>
									}
								</>,
								submit: async (values) => {
									try {
										const dropId = Date.now().toString()
										const keys = await genKeys(seedPhrase, 1, dropId)
										
										const nftData = {
											contractId: values['NFT Contract ID'],
											tokenIds: [values['NFT Token ID']],
											senderId: wallet.accountId,
										}
										if (nftData.tokenIds[0] === 'No Tokens') nftData.tokenIds = [dataNFT?.curToken.token_id]

										createDrop({
											wallet,
											dropId,
											publicKeys: keys.map(({ publicKey }) => publicKey.toString()),
											depositPerUseYocto: parseNearAmount(values.NEAR) || '1',
											hasBalance: true,
											nftData,
										})
			
									} catch (e) {
										console.warn(e)
										throw e
									} finally {
										await wallet.update()
										update('app.loading', false)
									}
								}
							}} />
						</>
						:
						<>
							<p>Your account doesn't own any likely NFTs</p>
							<button>Manually Add NFT</button>
						</>
				}

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
								newData.splice(i + 1, 0, { ...functionCall })
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

	</>

}

export default Create