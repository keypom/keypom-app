import { useEffect, useState } from "react";
import { QrReader } from 'react-qr-reader';
import * as nearAPI from 'near-api-js';
const { KeyPair } = nearAPI
import { view, call, getClaimAccount } from '../state/near'

import './Scanner.scss'

const claim = async (secretKey) => {
	const keyPair = KeyPair.fromString(secretKey)
	let keyInfo = await view('get_key_information', { key: keyPair.publicKey.toString() })

	if (keyInfo?.key_info?.remaining_uses === 1) return false
	
	const account = await getClaimAccount(keyPair.secretKey)
	await call(account, 'claim', { account_id: `testnet` })
	
	keyInfo = await view('get_key_information', { key: keyPair.publicKey.toString() })
	if (keyInfo?.key_info?.remaining_uses === 1) return true
	
	return false
}

const Scanner = ({ state, update, wallet }) => {

	const { loading } = state.app
	const [valid, setValid] = useState(null);

	const onMount = async () => {
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
			style={{ width: '100%' }}
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
		<button onClick={() => {
			setValid(null)
		}}>Next Ticket</button>
		<br />
		<br />
		<p>If the scanner is frozen or stops working:</p>
		<button onClick={() => {
			window.location.reload()
			window.location.href = window.location.href
		}}>Reload Scanner</button>
	</>

}


export default Scanner