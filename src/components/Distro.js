import { useEffect, useState } from "react";
import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { get, set, del } from '../utils/store'
import { popMessage } from '../state/app'
import { view } from '../state/near'
import { share } from '../utils/mobile'

const LINKS = '__DISTRO_LINKS'

import './Distro.scss'

const statusLabel = [
	'unclaimed',
	'claimed',
	'attended',
]

const BATCH_SIZE = 25

const checkLinks = async (update, links, cur = 0) => {
	console.log('updating links', cur, BATCH_SIZE)

	const keys = links.slice(cur, cur + BATCH_SIZE).map(({ link }) => KeyPair.fromString(link.split('/ticket/')[1]).publicKey.toString())
	let keyInfo
	try {
		keyInfo = await view('get_key_information_batch', { keys })
	} catch (e) {
		console.warn(e)
		return alert('error updating keys')
	}

	// console.log(keyInfo.map(({ key_info }) => key_info.remaining_uses))

	keyInfo.forEach(({ key_info }, i) => {
		links[cur + i].uses = key_info.remaining_uses
	})

	set(LINKS, links)
	update([...links])

	// more?
	cur += BATCH_SIZE
	if (cur < links.length) {
		return await checkLinks(update, links, cur)
	}
}

const ImportLinks = ({ update }) => <button onClick={() => {
	const confirm = window.confirm(`Do you want to remove all current keys and replace them with the ones in the file?!`)
	if (!confirm) return
	const fileBtn = document.querySelector('#file-btn')
	fileBtn.onchange = ({ target }) => {
		const reader = new FileReader()
		reader.onload = ({ target: { result } }) => {
			result = result.split('\r\n').map((link) => ({
				uses: 3,
				link
			}))
			// TODO recursive loop to check uses
			checkLinks(update, result)
		}
		reader.readAsText(target.files[0]);
		target.value = []
	}
	fileBtn.click()
}}>Import Keys</button>

export const Distro = ({ update, dispatch }) => {

	const [links, setLinks] = useState(get(LINKS) || [])
	
	const onMount = async () => {
		checkLinks(setLinks, links)
		setInterval(() => checkLinks(setLinks, get(LINKS)), 30000)
		update('app.loading', false)
	}
	useEffect(() => {
		onMount()
	}, [])

	return <>
		<ImportLinks {...{update: setLinks}} />
		<h4>Links</h4>

		<button className="fixed-bottom" onClick={() => window.scrollTo(0, 0)}>Top</button>

	{
		links.map(({ uses, link, shared }, i) => {
			const status = statusLabel[3 - uses]

			return <div key={link}>
				<div className="row sm">
					<div className="six columns">
						<p>{i+1}. {link.substring(link.length-8)}</p>
					</div>
					<div className="six columns">
						<button onClick={() => {
							if (shared && !window.confirm('It looks like you shared this ticket! Share this link again?')) {
								return
							}
							if (uses !== 3 && !window.confirm('Ticket claimed! Share this link again?')) {
								return
							}
							
							links[i].shared = true
							setLinks([...links])
							set(LINKS, links)

							const { mobile } = share(links[i].link)
							if (!mobile) dispatch(popMessage('Link Copied'))
						}}>Share</button>
					</div>
				</div>
				<div className="row sm">
					<div className="six columns">
						<button onClick={() => {
							if (!window.confirm(`Manually mark ticket as ${ shared ? 'not shared? It looks like you shared this link!' : 'shared?'} Only visible to you.`)) {
								return
							}
							links[i].shared = !shared
							setLinks([...links])
							set(LINKS, links)
						}}>{ shared ? 'Not Shared' : 'Mark Shared'}</button>
					</div>
					<div className="six columns flex">
						{ uses === 3 && <p className={shared ? 'claimed' : 'unclaimed'}>{ shared ? 'shared' : 'not shared' }</p>}
						<p className={status}>{ status }</p>
					</div>
				</div>
				<hr />
			</div>
		})
	}
	
	</>

}