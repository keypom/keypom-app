import { useEffect, useState } from "react";
import { QrReader } from 'react-qr-reader';
import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { view, call, getClaimAccount } from '../state/near'
import { get, set } from '../utils/store'
import { hash } from '../utils/crypto'

import './Scanner.scss'

const PASSWORD = '__PASSWORD'

const claim = async (secretKey) => {
	const keyPair = KeyPair.fromString(secretKey)
	const publicKey = keyPair.publicKey.toString()
	let keyInfo = await view('get_key_information', { key: publicKey })

	if (keyInfo?.remaining_uses === 1) return false
	
	const account = await getClaimAccount(keyPair.secretKey)
	const password = get(PASSWORD)
	await call(account, 'claim', {
		account_id: `testnet`,
		password: password ? await hash(password + publicKey + 1) : undefined
	})
	
	keyInfo = await view('get_key_information', { key: publicKey })
	if (keyInfo?.remaining_uses === 1) return true
	
	return false
}

const Scanner = ({ state, update }) => {

	const { loading } = state.app
	const [valid, setValid] = useState(null);

	const onMount = async () => {
		set(PASSWORD, window.prompt('Update Password for Claiming?'))

		setTimeout(() => document.body.classList.add('dark'), 10)
		update('app.loading', false)
	}
	useEffect(() => {
		onMount()
	}, [])

	return <>
		{ valid === null && !loading && <QrReader
			constraints={{ facingMode: 'environment' }}
			onResult={async (result, error) => {
				if (!!result) {
					try {
						update('app.loading', true)
						const res = await claim(result?.text)
						setValid(res)
					} catch (e) {
						setValid('Network Error. Reload Scanner. Try ticket again but please admit the attendee.')
					} finally {
						update('app.loading', false)
					}
				}
				if (!!error) {
					console.info(error);
				}
			}}
		/>}

		<div className="result">
			{
				valid === null && <p>Scan Ticket</p>
			}
			{
				valid === true && <p className="valid">Valid Ticket</p>
			}
			{
				valid === false && <p className="invalid">Invalid Ticket</p>
			}
			{
				typeof valid === 'string' && <p className="info">{ valid }</p>
			}
		</div>
		<button className="outline" onClick={() => {
			setValid(null)
		}}>Next Ticket</button>
		<br />
		<br />
		<p>If the scanner is frozen or stops working:</p>
		<button className="outline" onClick={() => {
			window.location.reload()
			window.location.href = window.location.href
		}}>Reload Scanner</button>
	</>

}


export default Scanner