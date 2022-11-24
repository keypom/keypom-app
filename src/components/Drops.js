import { useEffect } from "react";
import { file } from '../utils/store'

import {
	Link, useParams, useNavigate,
} from "react-router-dom";
import { genKeys } from '../state/drops'
import { networkId, viewMethod } from '../state/near'
import { addKeys, deleteKeys } from "keypom-js";

const Drops = ({ state, update, contract, wallet }) => {

	const { seedPhrase } = state.app.data
	const { drops } = contract
	const { which } = useParams()
	const navigate = useNavigate();

	const onMount = async () => {

	}
	useEffect(() => {
		onMount()
	}, [which])

	const handleAddKeys = async (drop) => {
		update('app.loading', true)
		
		let parsedNum = 1
		/// TODO add warning about sending FTs and prompt for NFT token IDs (complicated)
		let nftTokenIds
		if (drop.nft) {
			const tokens = await viewMethod({
				contractId: drop.nft.contract_id,
				methodName: 'nft_tokens_for_owner',
				args: {
					account_id: wallet.accountId,
					limit: 10,
				}
			})
			const tokenIds = tokens.map(({ token_id }) => token_id)
			const tokenId = window.prompt(`Enter the NFT Token ID you want to add to the drop. ${tokenIds.map((id) => '\n' + id)}`)
			if (!tokenIds.includes(tokenId)) {
				alert('Not a valid Token ID that you own. Please try again.')
				return update('app.loading', false)
			}
			nftTokenIds = [tokenId]
		} else {
			const num = window.prompt(`How many keys would you like to add to the drop?`)
			parsedNum = parseInt(num)
			if (!num || isNaN(parsedNum) || parsedNum > 100 || parsedNum < 1) {
				alert('Please enter a number between 1-100')
				return update('app.loading', false)
			}
		}

		try {
			const keys = await genKeys(seedPhrase, parsedNum, drop.drop_id, drop.next_key_id)

			await addKeys({
				wallet,
				drop,
				nftTokenIds,
				publicKeys: keys.map(({ publicKey }) => publicKey.toString()),
				hasBalance: true,
			})
		} catch(e) {
			console.warn(e)
			throw e
		} finally {
			await wallet.update()
			update('app.loading', false)
		}
	}

	const handleRemoveDrop = async (drop) => {
		if (!window.confirm('Delete this drop and all keys?')) return
		update('app.loading', true)
		try {
			await deleteKeys({
				wallet,
				drop,
			})
		} catch (e) {
			throw e
		} finally {
			await wallet.update()
			navigate('/drops')
			update('app.loading', false)
		}
	}

	if (!drops?.length) return <>
		<p>No drops</p>
		<Link to={'/create'}><button className="outline">Create a Drop</button></Link>
	</>

	if (which) {
		const drop = drops.find((d) => d.drop_id === which)
		if (!drop) return <p>Can't find drop ID {which}</p>

		return <>
			<h4>Drop ID: {drop.drop_id}</h4>
			<div className="grid sm">
				<div>
					<button className="outline" onClick={() => handleAddKeys(drop)}>Add Keys</button>
				</div>
				<div>
					<button className="outline" onClick={() => handleRemoveDrop(drop)}>Remove Drop</button>
				</div>
			</div>
			{
				drop.keyPairs && <>

					<h4>Keys {drop.keySupply}</h4>
					<button className="outline" onClick={async () => {
						update('app.loading', true)
						const keys = await genKeys(seedPhrase, drop.next_key_id, drop.drop_id)
						update('app.loading', false)
						const walletUrl = `https://wallet.${networkId === 'testnet' ? `testnet.` : ``}near.org`
						const links = keys.map(({secretKey}) => `${walletUrl}/linkdrop/${contractId}/${secretKey}`)
						// const links = keys.map(({ secretKey }) => `${window.location.origin}/ticket/${secretKey}`)
						console.log('LINKS', links)
						file(`Drop ID ${drop.drop_id} Links.csv`, links.join('\r\n'))
					}}>Download All Links</button>
					{
						drop.keyPairs.map(({ publicKey, secretKey }) => <div className="key-row" key={publicKey}>
							<div className="grid sm">
								<div className="twelve columns">
									<p>{secretKey.substring(0, 32)}</p>
								</div>
								<div>
									<Link to={`/ticket/${secretKey}`} target="_blank" rel="noopener noreferrer"><button>Preview Drop</button></Link>
								</div>
								{/* <div>
									<button className="outline" onClick={async () => {
										update('app.loading', true)
										await claimDrop(wallet.accountId, secretKey)
										await wallet.update()
										update('app.loading', false)
									}}>Claim Drop</button>
								</div> */}
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
			drops.map((drop) => {
				const { drop_id, balance, drop_type_label } = drop

				return <div key={drop_id}>
					<div className="grid sm">
						<div>
							<p>Drop ID: {drop_id}</p>
						</div>
						<div>
							<p>{drop_type_label}</p>
						</div>
						<div>
							<Link to={`/drops/${drop_id}`}>
								<button className="outline">Details</button>
							</Link>
						</div>
						<div>
							<button className="outline" onClick={() => handleRemoveDrop(drop)}>Remove Drop</button>
						</div>
					</div>
				</div>
			})
		}
		<br />
		<Link to={'/create'}><button>Create a Drop</button></Link>
	</>

}

export default Drops