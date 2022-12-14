import { useEffect, useState } from "react";
import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { get, set, del } from '../utils/store'
import { popMessage } from '../state/app'
import { view, networkId } from '../state/near'
import { share } from '../utils/mobile'

const LINKS = '__DISTRO_LINKS'

import './Distro.scss'

const statusLabel = [
	'available',
	'clicked',
	'attended',
	'claimed'
]

const BATCH_SIZE = 100

const checkLinks = async (update, links, cur = 0) => {
	console.log('updating links', cur, cur + BATCH_SIZE)

	const keys = links.slice(cur, cur + BATCH_SIZE).map(({ link }) => KeyPair.fromString(link.split('/ticket/')[1]).publicKey.toString())
	let keyInfo
	try {
		keyInfo = await view('get_key_information_batch', { keys })
	} catch (e) {
		console.warn(e)
		return alert('error updating keys')
	}

	// console.log(keyInfo.map(({ key_info }) => key_info.remaining_uses))

	keyInfo.forEach((info, i) => {
		i += cur
		if (!info) {
			links[i].uses = 0
			return
		}
		const { key_info } = info
		links[i].uses = key_info.remaining_uses
	})

	links.forEach((_, i) => {
		i += cur
		if (networkId !== 'testnet') return
		links[i].link = links[i].link.replace('https://', 'https://testnet.')
	})

	set(LINKS, links)
	update([...links])

	// more?
	cur += BATCH_SIZE
	if (cur < links.length) {
		return await checkLinks(update, links, cur)
	}
}

const ImportLinks = ({ links, update }) => <button className="outline" onClick={() => {
	if (links.length) {
		const confirm = window.confirm(`Do you want to remove all current tickets and replace them with the ones in the file?!`)
		if (!confirm) return
	}
	const fileBtn = document.querySelector('#file-btn')
	fileBtn.onchange = ({ target }) => {
		const reader = new FileReader()
		reader.onload = ({ target: { result } }) => {
			result = result
			.replaceAll('\r', '')
			.replace(/,|'|"|;/gi, '')
			.split('\n')
			.filter((link) => link.length > 2)
			.map((link) => ({
				uses: 3,
				link
			}))
			console.log(result)
			// TODO recursive loop to check uses
			checkLinks(update, result)
		}
		reader.readAsText(target.files[0]);
		target.value = []
	}
	fileBtn.click()
}}>Import Tickets</button>

const Distro = ({ update, dispatch }) => {

	const [links, setLinks] = useState(get(LINKS) || [])
	const [tight, setTight] = useState(false)

	const onMount = async () => {
		checkLinks(setLinks, links)
		setInterval(() => checkLinks(setLinks, get(LINKS)), 30000)
		update('app.loading', false)
	}
	useEffect(() => {
		onMount()
	}, [])

	return <div className={tight ? "tight" : ""}>
		<ImportLinks {...{ links, update: setLinks }} />
		<button className="outline" onClick={() => setTight(!tight)} style={{backgroundColor: tight? '#00ff0044' : 'white'}}>{!tight ? 'Tight View' : 'Larger View'}</button>
		<h4>Tickets</h4>

		<button className="fixed-bottom" onClick={() => window.scrollTo(0, 0)}>Top</button>

		{
			links.map(({ uses, link, shared }, i) => {
				const status = statusLabel[3 - uses]

				return <div key={link}>
					<div className="grid sm">
						<div>
							<p>{i + 1}. {link.split('/ticket/')[1].substring(0, 8)}</p>
						</div>
						<div className={uses < 3 ? 'width-100' : 'flex'}>
							{uses === 3 && <p className={shared ? 'clicked' : 'available'}>{shared ? 'shared' : 'not shared'}</p>}
							<p className={status}>{status}</p>
						</div>
						{uses > 1 && <>
						<div>
							{
								uses > 2 && <button className="outline" onClick={() => {
									if (!window.confirm(`Manually mark ticket as ${shared ? 'not shared? It looks like you shared this ticket!' : 'shared?'} Only visible to you.`)) {
										return
									}
									links[i].shared = !shared
									setLinks([...links])
									set(LINKS, links)
								}}>{shared ? 'Not Shared' : 'Mark Shared'}</button>
							}
						</div>
						<div>
							<button className="outline" onClick={() => {
								if (shared && !window.confirm('It looks like you shared this ticket! Share this ticket again?')) {
									return
								}
								if (uses !== 3 && !window.confirm('The ticket has been claimed (clicked by someone)! Share this ticket again?')) {
									return
								}

								links[i].shared = true
								setLinks([...links])
								set(LINKS, links)

								const { mobile } = share(links[i].link)
								if (!mobile) dispatch(popMessage('Ticket Link Copied'))
							}}>Share</button>
						</div>
					</>
					}
					</div>
					
					<hr />
				</div>
			})
		}

	</div>

}

export default Distro