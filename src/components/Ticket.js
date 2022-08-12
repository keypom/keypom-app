import * as nearAPI from 'near-api-js';
import { useState } from 'react';
const { KeyPair } = nearAPI
import { useEffect, useRef } from "react";
import { get, set, del } from '../utils/store'
import anime from 'animejs/lib/anime.es.js';
import Keypom from '../img/keypom-small.png'

import { view, call, getClaimAccount } from '../state/near'

import {
	Link, useParams,
} from "react-router-dom";

import './Ticket.scss'

const poms = () => {
	const w = window.innerWidth
	const scales = [3, 4, 5, 6, 7, 8, 3, 4, 5, 6, 7, 8].map((v) => v * Math.max(1, w / 100))
	anime({
		targets: '.poms > img',
		scaleX: 0,
		scaleY: 0,
		opacity: 1,
		duration: 0,
		complete: () => {
			anime({
				targets: '.poms > img',
				scaleX: (_, i) => scales[i],
				scaleY: (_, i) => scales[i],
				translateX: () => Math.random()*w*8 - w*4,
				translateY: () => Math.random()*w*8 - w*4,
				opacity: 0,
				rotate: '1turn',
				easing: 'easeInOutExpo',
				duration: 3000,
				delay: anime.stagger(150) // increase delay by 100ms for each elements.
			  });
		}
	});
}

export const Ticket = ({ state, update, wallet }) => {
	const { secretKey } = useParams()
	const qr = useRef();

	const [keyPair, setKeyPair] = useState({})
	const [keyInfo, setKeyInfo] = useState({})
	const [drop, setDrop] = useState({})
	
	
	const onMount = async () => {
		update('app.loading', true)
		const _keyPair = KeyPair.fromString(secretKey)
		setKeyPair(_keyPair)
		let _drop, _keyInfo
		try {
			_drop = await view('get_drop_information', { key: _keyPair.publicKey.toString() })
			setDrop(_drop)
			// console.log(_drop)
			_keyInfo = await view('get_key_information', { key: _keyPair.publicKey.toString() })
			setKeyInfo(_keyInfo)
			// console.log(_keyInfo)

			// const { FC } = _drop.drop_type
			// setIsTicket(FC?.method_data?.length === 2 && FC?.method_data[0] === null)
			
			if (_keyInfo.key_info.remaining_uses === 3) {
				console.log('here')
				poms()
				// update('app.loading', true)
				// const account = await getClaimAccount(_keyPair.secretKey)
				// const res = await call(account, 'claim', { account_id: `testnet` })
			}

			new QRCode(qr.current, {
				text: window.location.href,
				width: 256,
				height: 256,
				colorDark: "#204",
				colorLight: "#FFF",
				correctLevel: QRCode.CorrectLevel.M
			});
			
		} catch(e) {
			console.warn(e)
			setDrop(null)
			return
		} finally {
			update('app.loading', false)
		}
	}
	useEffect(() => { onMount() }, [])

	if (!drop || !keyInfo) return <p>Not a valid drop</p>

	let metadata
	if (drop.metadata) {
		metadata = JSON.parse(drop.metadata)
	}

	return <>

	<div className="poms">
		<img src={Keypom} />
		<img src={Keypom} />
		<img src={Keypom} />
		<img src={Keypom} />
		<img src={Keypom} />
		<img src={Keypom} />
		<img src={Keypom} />
		<img src={Keypom} />
		<img src={Keypom} />
		<img src={Keypom} />
	</div>
	{ 
		metadata && <img src={metadata.media} />
	}
	{
		keyInfo?.key_info?.remaining_uses === 1 && <button onClick={async () => {
			const account = await getClaimAccount(keyPair.secretKey)
			
			const res = await call(account, 'claim', { account_id: `md1.testnet` })
			console.log(res)
			}}>Claim NFT</button>
	}
			<div ref={qr}></div>

			
	</>

}