import { useState } from 'react';
import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { useEffect, useRef } from "react";
import { get, set, del } from '../utils/store'
import anime from 'animejs/lib/anime.es.js';
import Keypom from '../img/keypom-small.png'

import { view, call, getClaimAccount, initNear, networkId, walletUrl, contractId } from '../state/near'

import {
	useParams,
} from "react-router-dom";

import './Ticket.scss'

const DROP_AND_SECRET_KEY = '__DROP_AND_SECRET_KEY'
const CLAIMED = '__CLAIMED'

function openInNewTab(href) {
	Object.assign(document.createElement('a'), {
		target: '_blank',
		rel: 'noopener noreferrer',
		href: href,
	}).click();
}

function addScript(src) {
	return new Promise((resolve, reject) => {
	  const s = document.createElement('script');
  
	  s.setAttribute('src', src);
	  s.addEventListener('load', resolve);
	  s.addEventListener('error', reject);
  
	  document.body.appendChild(s);
	});
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
				complete: () => {
					document.querySelectorAll('.poms > img').forEach((p) => p.style.display = 'none')
				}
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

/** 
 * 
 * TODO check the new metadata.id enforcement
 * 
 */

export default Ticket = ({ dispatch, state, update, wallet }) => {

	const qr = useRef();
	const paramSecretKey = useParams().secretKey

	const [keyPair, setKeyPair] = useState({})
	const [keyInfo, setKeyInfo] = useState({})
	const [drop, setDrop] = useState({})
	const [claimed, setClaimed] = useState(!!get(CLAIMED))

	const onMount = async () => {
		setTimeout(() => document.body.classList.add('dark'), 10)

		update('app.loading', true)
		try {
			let { id, secretKey } = get(DROP_AND_SECRET_KEY) || {}
			const hasSecretKey = !!secretKey
			if (!hasSecretKey) {
				secretKey = paramSecretKey
				// don't visit another secret key if we've already activated one
			} else if (window.location.href.indexOf(secretKey) === -1) {
				const _keyPair = KeyPair.fromString(paramSecretKey)
				const _drop = await view('get_drop_information', { key: _keyPair.publicKey.toString() })

				let { drop_id } = _drop
				// use metadata.id if it exists (catch all for multiple drops per event)
				try {
					const metadata = JSON.parse(_drop.metadata)
					if (metadata.id) drop_id = metadata.id
				} catch (e) { }
				if (drop_id === id) {
					window.location.href = window.location.origin + '/ticket/' + secretKey
					return null
				}
			}

			const _keyPair = KeyPair.fromString(secretKey)
			const _drop = await view('get_drop_information', { key: _keyPair.publicKey.toString() })

			setKeyPair(_keyPair)
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

					let id = _drop.drop_id
					// use metadata.id if it exists (catch all for multiple drops per event)
					try {
						const metadata = JSON.parse(_drop.metadata)
						console.log(metadata)
						if (metadata.id) id = metadata.id
					} catch (e) { }

					set(DROP_AND_SECRET_KEY, {
						id,
						secretKey,
					})
				} catch (e) {
					window.location.reload()
					window.location.href = window.location.href
				}
			}

			setKeyInfo(_keyInfo)
			setDrop(_drop)

			await addScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js')
			
			setTimeout(() => {
				genQR(qr)
				setTimeout(() => document.querySelector('.footer').style.display = 'block', 1000)
			}, uses === 3 ? 1500 : 500)

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
								<>
									<button onClick={() => {
										window.open(walletUrl + '/linkdrop/' + contractId + '/' + keyPair.secretKey)
									}}>Claim NFT on MyNearWallet</button>
									<button onClick={() => wallet.signIn()}>Sign In With Another Wallet</button>
								</>
						}
					</>
				}
				{
					uses !== 1 && <div id="qr" ref={qr}></div>
				}
			</>}

		<div className="footer" style={{ display: 'none' }}>
			<img onClick={({ target }) => {
				anime({
					targets: target,
					duration: 0,
					scale: 1,
					complete: () => {
						anime({
							targets: target,
							scale: 4,
							easing: 'easeOutCubic',
							duration: 150,
							complete: () => {
								anime({
									targets: target,
									scale: 1,
									easing: 'easeInCubic',
									duration: 150,
								});
							}
						});
					}
				});
			}} src={Keypom} />
			<p>
				😍 Keypom Launch Talk at <a href="https://nearcon.org" target="_blank">NEARCON</a> 👀
			</p>
		</div>
	</>

}