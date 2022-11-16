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
const FIRST_CLAIM_TIMEOUT = 2000
let claimTimeout = null
let claimFn = null

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

const Ticket = ({ dispatch, state, update, wallet }) => {

	const qr = useRef();
	const paramSecretKey = useParams().secretKey

	const [keyPair, setKeyPair] = useState({})
	const [keyInfo, setKeyInfo] = useState({})
	const [drop, setDrop] = useState({})
	const [dropId, setDropId] = useState({})
	const [claimed, setClaimed] = useState(!!get(CLAIMED))

	const onMount = async () => {
		window.addEventListener('blur', () => clearInterval(claimTimeout));
		window.addEventListener('focus', () => {
			if (claimFn) claimTimeout = setTimeout(claimFn, FIRST_CLAIM_TIMEOUT)
		});

		update('app.loading', true)
		try {

			const _keyPair = KeyPair.fromString(paramSecretKey)
			setKeyPair(_keyPair)

			const _drop = await view('get_drop_information', { key: _keyPair.publicKey.toString() })
			setDrop(_drop)

			// use metadata.id if it exists (catch all for multiple drops per event)
			let { drop_id } = _drop
			try {
				const metadata = JSON.parse(_drop.metadata)
				if (metadata.id) drop_id = metadata.id
			} catch (e) { }

			setDropId(drop_id)

			// console.log(_drop)
			const _keyInfo = await view('get_key_information', { key: _keyPair.publicKey.toString() })
			setKeyInfo(_keyInfo)

			console.log(_drop, _keyInfo)

			// console.log(_keyInfo)
			const remaining_uses = _keyInfo?.remaining_uses
			if (remaining_uses === 3) {

				try {
					claimFn = async () => {
						const keyInfoAgain = await view('get_key_information', { key: _keyPair.publicKey.toString() })
						if (keyInfoAgain.remaining_uses === 3) {
							try {
								const account = await getClaimAccount(_keyPair.secretKey)
								const res = await call(account, 'claim', { account_id: `testnet`, expected_uses: 3 })
								if (res?.status?.SuccessValue !== '') {
									window.location.reload()
									window.location.href = window.location.href
									return
								}
							} catch (e) {
								window.location.reload()
								window.location.href = window.location.href
								return
							}
						}
					}
					claimTimeout = setTimeout(claimFn, FIRST_CLAIM_TIMEOUT)

					poms()

					let id = _drop.drop_id
					// use metadata.id if it exists (catch all for multiple drops per event)
					try {
						console.log(_drop)
						const metadata = JSON.parse(_drop.metadata)
						if (metadata.id) id = metadata.id
					} catch (e) { }

					set(DROP_AND_SECRET_KEY, { ...get(DROP_AND_SECRET_KEY), id: paramSecretKey })
				} catch (e) {
					window.location.reload()
					window.location.href = window.location.href
				}
			}

			await addScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js')
			
			setTimeout(() => {
				const container = document.querySelector('#qr-container')
				if (container) container.style.display = 'block';
				genQR(qr)
				setTimeout(() => document.querySelector('.footer').style.display = 'block', 1000)
			}, remaining_uses === 3 ? FIRST_CLAIM_TIMEOUT : 250)

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
	const remaining_uses = keyInfo?.remaining_uses

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
			<button className="outline" onClick={() => {
				openInNewTab(`https://${networkId === 'mainnet' ? 'app' : 'testnet'}.mynearwallet.com/?tab=collectibles`)
			}}>Go to MyNearWallet</button>
		</>
			:
			<>
				{
					(!drop || !keyInfo) && <h4>Not a valid drop</h4>
				}
				{
					remaining_uses === 2 && dropId === 'nearweek-party' && <div style={{ marginTop: 32, color: 'white' }}>
						<p style={{ color: 'white' }}>Venue @ <a href="https://goo.gl/maps/1bATJSYiMJVfYAQQ8" target="_blank">Bica do Sapato</a> next to the Santa Apolonia Metro Station</p>
						<p style={{ color: 'white' }}>Look for a big light sculpture marking the main entrance.</p>
					</div>
				}
				{
					metadata && keyInfo && <img id="media" src={metadata.media} />
				}
				{
					remaining_uses === 1 && <>
						{
							wallet.isSignedIn() ?
								<button className="outline" onClick={async () => {
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
									<button className="outline" onClick={() => {
										window.open(walletUrl + '/linkdrop/' + contractId + '/' + keyPair.secretKey)
									}}>Claim NFT on MyNearWallet</button>
									<button className="outline" onClick={() => wallet.signIn()}>Sign In With Another Wallet</button>
								</>
						}
					</>
				}
				{
					remaining_uses !== 1 && <div id="qr-container">
						<p>This is a DEMO Keypom ticket!</p>
						<ol>
							<li><s>Claim the ticket by clicking the link (flying Pomeranians)</s></li>
							<li>Open the scanner app on your phone <a href="">{`${window.location.origin}/scanner`}</a></li>
							<li>Scan your QR Code</li>
							<li>RELOAD THIS PAGE to claim your NEAR Wallet and NFT</li>
						</ol>
						<div id="qr" ref={qr}></div>
					</div>
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
		</div>
	</>

}

export default Ticket