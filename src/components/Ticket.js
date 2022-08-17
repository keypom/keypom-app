import { useState } from 'react';
import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { useEffect, useRef } from "react";
import { get, set, del } from '../utils/store'
import anime from 'animejs/lib/anime.es.js';
import Keypom from '../img/keypom-small.png'

import { view, call, getClaimAccount, initNear, networkId } from '../state/near'

import {
	Link, useParams,
} from "react-router-dom";

import './Ticket.scss'
import { functionCallAccessKey } from 'near-api-js/lib/transaction';

const SECRET_KEY = '__SECRET_KEY'
const CLAIMED = '__CLAIMED'

function openInNewTab(href) {
	Object.assign(document.createElement('a'), {
	  target: '_blank',
	  rel: 'noopener noreferrer',
	  href: href,
	}).click();
  }

const poms = () => {
	document.body.querySelector('.poms').style.display = 'block'
	const w = Math.min(500, window.innerWidth)
	const scales = [3, 4, 5, 6, 7, 8, 9, 3, 4, 5, 6, 8, 9].map((v) => v * Math.max(1, w / 100))
	anime({
		targets: '.poms > img',
		scaleX: 0,
		scaleY: 0,
		translateX: 0,
		translateY: 0,
		opacity: 1,
		duration: 0,
		complete: () => {
			anime({
				targets: '.poms > img',
				scaleX: (_, i) => scales[i],
				scaleY: (_, i) => scales[i],
				translateX: () => Math.random() * w * 2 - w * 1,
				translateY: () => Math.random() * w * 2 - w * 1,
				opacity: 0,
				rotate: '1turn',
				easing: 'easeOutQuad',
				duration: 2500,
				delay: anime.stagger(300),
			});
		}
	});
}

const genQR = (qr) => {
	const h = document.getElementById('media').getBoundingClientRect().height + 64

	anime({
		targets: qr.current,
		translateY: -h,
		opacity: 0,
		duration: 0,
		complete: () => {
			anime({
				targets: qr.current,
				translateY: 0,
				opacity: 1,
				easing: 'easeOutQuad',
				duration: 1000,
			});
		}
	});

	const qrEl = document.getElementById('qr')

	if (!qrEl || qrEl.children.length) return

	new QRCode(qr.current, {
		text: window.location.href.split('/ticket/')[1],
		width: 256,
		height: 256,
		colorDark: "#304",
		colorLight: "#FFF",
		correctLevel: QRCode.CorrectLevel.M
	})
}

export const Ticket = ({ dispatch, state, update, wallet }) => {

	const qr = useRef();

	const [keyPair, setKeyPair] = useState({})
	const [keyInfo, setKeyInfo] = useState({})
	const [drop, setDrop] = useState({})
	const [claimed, setClaimed] = useState(!!get(CLAIMED))

	let secretKey = get(SECRET_KEY)
	const hasSecretKey = !!secretKey
	if (!hasSecretKey) {
		secretKey = useParams().secretKey
		// don't visit another secret key if we've already activated one
	} else if (window.location.href.indexOf(secretKey) === -1) {
		window.location.href = window.location.origin + '/ticket/' + secretKey
		return null
	}

	const onMount = async () => {
		// setTimeout(() => document.body.classList.add('dark'), 10)

		update('app.loading', true)
		try {
			const _keyPair = KeyPair.fromString(secretKey)
			setKeyPair(_keyPair)

			const _drop = await view('get_drop_information', { key: _keyPair.publicKey.toString() })
			// console.log(_drop)
			const _keyInfo = await view('get_key_information', { key: _keyPair.publicKey.toString() })
			// console.log(_keyInfo)

			// const { FC } = _drop.drop_type
			// setIsTicket(FC?.method_data?.length === 2 && FC?.method_data[0] === null)
			const uses = _keyInfo.key_info.remaining_uses
			if (uses === 3) {
				try {
					const account = await getClaimAccount(_keyPair.secretKey)
					const res = await call(account, 'claim', { account_id: `testnet` })

					if (res?.status?.SuccessValue !== '') {
						window.location.reload()
						window.location.href = window.location.href
						return
					}

					poms()
					set(SECRET_KEY, secretKey)
				} catch (e) {
					window.location.reload()
					window.location.href = window.location.href
				}
			}

			setKeyInfo(_keyInfo)
			setDrop(_drop)
			setTimeout(() => genQR(qr), uses === 3 ? 1500 : 100)

		} catch (e) {
			console.warn(e)
			setDrop(null)
			return
		} finally {
			update('app.loading', false)
		}
		await dispatch(initNear(false))
	}
	useEffect(() => { onMount() }, [])

	let metadata
	if (drop?.metadata) {
		metadata = JSON.parse(drop.metadata)
	}
	const uses = keyInfo?.key_info?.remaining_uses


	console.log(claimed)

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

		{claimed ? <>
			<h4>NFT Claimed</h4>
			<button onClick={() => {
				openInNewTab(`https://${networkId === 'mainnet' ? 'app' : 'testnet'}.mynearwallet.com/?tab=collectibles`)
			}}>Go to MyNearWallet</button>
		</>
			:
			<>
				{
					(!drop || !keyInfo) && <h4>Not a valid drop</h4>
				}
				{
					metadata && keyInfo && <img id="media" src={metadata.media} />
				}
				{
					uses === 1 && <>
						{
							wallet.isSignedIn() ?
								<button onClick={async () => {
									update('app.loading', true)
									try {
										const account = await getClaimAccount(keyPair.secretKey)
										const res = await call(account, 'claim', { account_id: wallet.accountId })
										if (res?.status?.SuccessValue !== '') {
											window.location.reload()
											window.location.href = window.location.href
											return
										}
										poms()
										set(CLAIMED, true)
										setClaimed(true)
									} catch (e) {
										window.location.reload()
										window.location.href = window.location.href
										return
									} finally {
										update('app.loading', false)
									}
								}}>Claim NFT</button>
								:
								<button onClick={() => wallet.signIn()}>Sign In to Claim NFT</button>
						}
					</>
				}
				{
					uses !== 1 && <div id="qr" ref={qr}></div>
				}
			</>}
	</>

}