import { useEffect, useState } from "react";
import { QrReader } from 'react-qr-reader';

import './Scanner.scss'

export const Scanner = ({ state, update, wallet }) => {
	
	const [data, setData] = useState('No result');

	const onMount = async () => {
		
		update('app.loading', false)
	}
	useEffect(() => {
		onMount()
	}, [])


	return <>
		<QrReader
		constraints={{ facingMode: 'environment' }}
        onResult={(result, error) => {
          if (!!result) {
            setData(result?.text);
          }

          if (!!error) {
            console.info(error);
          }
        }}
        style={{ width: '100%' }}
      />
      <p>{data}</p>
	</>

}