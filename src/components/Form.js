import { useState } from 'react'

const genFields = (data, values, onChange) => {
	return Object.entries(data).map(([k, v]) => {
		if (/__/.test(k)) return null

		const input = {
			id: k,
			type: 'text',
			className: 'u-full-width',
			required: v !== '_',
			value: values[k],
			onChange: (e) => {
				onChange(k, e.target.value)
			}
		}

		// if (/password/gi.test(k)) {
		// 	input.type = 'password'
		// }

		if (typeof v === 'number') {
			input.type = 'number'
		} else if (typeof v === 'boolean') {
			input.type = 'checkbox'
			input.checked = values[k]
			input.onChange = (e) => {
				onChange(k, e.target.checked)
			}
		} else if (Array.isArray(v)) {
			if (Array.isArray(values[k])) values[k] = v[0]
			input.value = values[k]
		}
		
		return <div key={k}>
			<label htmlFor={k}>{k}</label>
			{
				Array.isArray(v)
				?
				<select {...input}>
					{
						v.map((val) => <option key={val} value={val}>{val}</option>)
					}
				</select>
				:
				v.toString().length > 64 ? 
				<textarea {...input} />
				:
				<input {...input} />

			}
		</div>
	})
}

export const Form = ({ data, onChange, submit, submitLabel }) => {

	const [values, setValues] = useState({ ...data })
	const onValueChange = (k, v) => {
		const newValues = { ...values, [k]: v }
		setValues(newValues)
		if (onChange) onChange(k, newValues)
	}

	return <>
		<div className="row">
			{genFields(data, values, onValueChange)}
		</div>
		{ submit && <button onClick={() => submit(values)}>{ submitLabel ? submitLabel : 'Submit' }</button> }
	</>
}