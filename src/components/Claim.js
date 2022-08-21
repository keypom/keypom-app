import * as nearAPI from 'near-api-js';
import { useState } from 'react';
const { KeyPair } = nearAPI
import { useEffect } from "react";

import { view, call, getClaimAccount } from '../state/near'

import {
	Link, useParams,
} from "react-router-dom";

import './Claim.scss'

const Claim = ({ state, update, wallet }) => {
	const { secretKey } = useParams()

	const [keyPair, setKeyPair] = useState({})
	const [keyInfo, setKeyInfo] = useState({})
	const [isTicket, setIsTicket] = useState({})
	const [drop, setDrop] = useState({})
	
	const onMount = async () => {
		const _keyPair = KeyPair.fromString(secretKey)
		setKeyPair(_keyPair)
		console.log(_keyPair)
		let _drop, _keyInfo
		try {
			_drop = await view('get_drop_information', { key: _keyPair.publicKey.toString() })
			setDrop(_drop)
			console.log(_drop)
			_keyInfo = await view('get_key_information', { key: _keyPair.publicKey.toString() })
			setKeyInfo(_keyInfo)
			console.log(_keyInfo)
		} catch(e) {
			console.warn(e)
			setDrop(null)
			return
		}
		const { FC } = _drop.drop_type
		setIsTicket(FC?.method_data?.length === 2 && FC?.method_data[0] === null)
		

		if (_keyInfo.key_info.num_uses === 2) {
			update('app.loading', true)
			const account = await getClaimAccount(_keyPair.secretKey)
			const res = await call(wallet, 'claim', { account_id: `testnet` })
			console.log(res)
			update('app.loading', false)
		}
	}
	useEffect(() => {
		onMount()
	}, [])

	if (!drop) return <p>Not a valid drop</p>

	let metadata
	if (drop.metadata) {
		metadata = JSON.parse(drop.metadata)
	}

	console.log(metadata)

	return <>
	{ 
		metadata && <img src={metadata.media} />
	}
	<button onClick={async () => {
		const account = await getClaimAccount(keyPair.secretKey)
		
		const res = await call(account, 'claim', { account_id: `md1.testnet` })
		console.log(res)
	}}>Claim Drop</button>
	</>

}
export default Claim