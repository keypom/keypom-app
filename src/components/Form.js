import { useState } from 'react'

const genFields = (data, onChange) => {
	return Object.entries(data).map(([k, v]) => <div className="six columns" key={k}>
		<label htmlFor={k}>{k}</label>
		<input
			id={k}
			type={ typeof v === 'number' ? 'number' : 'text'}
			className="u-full-width"
			required={v !== '_'}
			defaultValue={v !== '_' ? v : null}
			onChange={(e) => onChange(k, e.target.value)}
		/>
	</div>)
}

export const Form = ({ data, submit }) => {

	const [values, setValues] = useState({ ...data })
	const onChange = (k, v) => setValues({ ...values, [k]: v })

	return <>
		<div className="row">
			{genFields(data, onChange)}
		</div>
		<button className="button-primary" onClick={() => submit(values)}>Submit</button>
	</>
}