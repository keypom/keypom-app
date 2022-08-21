import { generateSeedPhrase } from 'near-seed-phrase';
import { setAppData, getAppData } from '../state/app'
import { contractId, viewMethod } from '../state/near'
import { file } from '../utils/store'
import { parseNearAmount, formatNearAmount } from "near-api-js/lib/utils/format";
import {
	useNavigate
} from "react-router-dom";

const ImportAppData = ({ update, wallet }) => <button onClick={() => {
	const confirm = window.confirm(`Do you want to remove all current app data and replace it? Make sure you export app data first!`)
	if (!confirm) return
	const fileBtn = document.querySelector('#file-btn')
	fileBtn.onchange = ({ target }) => {
		const reader = new FileReader()
		reader.onload = ({ target: { result } }) => {
			try {
				const json = JSON.parse(result)
				if (!json.seedPhrase) return alert(error)
				console.log(json)
				setAppData(update, json)
				wallet.update()
			} catch (e) {
				const error = `Something is wrong with your App Data, try again please!`
				return alert(error)
			}
		}
		reader.readAsText(target.files[0]);
		target.value = []
	}
	fileBtn.click()
}}>Import App Data</button>

export default Account = ({ update, wallet, contract }) => {

	const navigate = useNavigate()
	if (!wallet.isSignedIn()) navigate('/')

	const appData = getAppData()
	const { balanceFormatted } = contract

	const handleAddDeposit = async () => {
		const howMuch = window.prompt('How much (in NEAR) would you like to add to your account?')
		if (parseInt(howMuch) === NaN) return

		update('app.loading', true)
		await wallet.functionCall({
			contractId,
			methodName: `add_to_balance`,
			gas: '100000000000000',
			attachedDeposit: parseNearAmount(howMuch)
		})
		await wallet.update()
		update('app.loading', false)
	}

	const handleWithdraw = async () => {
		update('app.loading', true)
		await wallet.functionCall({
			contractId,
			methodName: `withdraw_from_balance`,
			gas: '100000000000000',
		})
		await wallet.update()
		update('app.loading', false)
	}

	return <>
		<h4>{wallet.accountId}</h4>
		<button onClick={() => {
			wallet.signOut()
			navigate('/')
		}}>Sign Out</button>

		<h4>Balance {balanceFormatted}</h4>
		<button onClick={handleAddDeposit}>Add Deposit</button>
		<button onClick={handleWithdraw}>Withdraw All</button>

		<h4>Key Management</h4>
		{
			appData?.seedPhrase ?
				<div>
					<button onClick={() => {
						file('ProxyAppData.json', JSON.stringify(appData))
					}}>Export App Data</button>
					<ImportAppData {...{ update, wallet }} />
					<button onClick={() => {
						setAppData(update, null)
					}}>Clear App Data</button>
				</div>
				:
				<div>
					<ImportAppData {...{ update, wallet }} />
					<button onClick={() => {
						alert(`You're going to create a main key for using this app. You should keep it somewhere safe. DO NOT SHARE IT!`)
						const trySeedPhrase = () => {
							const { seedPhrase } = generateSeedPhrase()
							const words = seedPhrase.split(' ')
							window.prompt('Copy this somewhere safe!', seedPhrase)
							const wordChoice = Math.ceil(Math.random() * words.length)
							const wordPrompt = window.prompt(`What is the ${wordChoice} word?`)
							if (wordPrompt !== words[wordChoice - 1]) {
								alert('Incorrect try again')
								return trySeedPhrase()
							}
							// correct
							setAppData(update, { seedPhrase })
							alert('App Data Created')
						}
						trySeedPhrase()

					}}>Create App Data</button>
				</div>
		}
	</>

}