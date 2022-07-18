import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useEffect, useState } from "react";
import { genKeys } from '../state/drops'
import { contractId } from '../state/near'
import { Form } from "./Form";

export const Create = ({ state, update, account }) => {

	const { seedPhrase } = state.app?.data
	const [type, setType] = useState('Simple')

	const onMount = async () => {

	}

	useEffect(() => {
		onMount()
	}, [])

	return <>
		<h4>Create Drop</h4>

		{
			type === 'Simple' && <>
				<Form {...{
					data: {
						number_of_keys: 0,
						balance_in_near: 0,
					},
					submit: async (values) => {
						let args = {
							public_keys: [],
							balance: parseNearAmount(values.balance_in_near) || '1',
						}
						
						update('app.loading', true)
						try {
							const res = await account.functionCall({
								contractId,
								methodName: 'create_drop',
								args,
								gas: '100000000000000',
							})
							console.log(res)

							const drop_id = parseInt(Buffer.from(res?.status?.SuccessValue, 'base64').toString(), 10)
							const keys = await genKeys(seedPhrase, values.number_of_keys, drop_id)
							args = {
								drop_id,
								public_keys: keys.map(({ publicKey }) => publicKey.toString()),
							}

							const res2 = await account.functionCall({
								contractId,
								methodName: 'add_to_drop',
								args,
								gas: '100000000000000',
							})
							console.log(res2)

						} catch (e) {
							update('app.loading', false)
							throw e
						}
						await account.update()
						update('app.loading', false)
					}
				}} />
			</>
		}

	</>

}