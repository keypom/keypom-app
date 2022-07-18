import { useEffect } from "react";

export const Comtracts = ({ state, update, account }) => {

	const { contracts } = state.app?.data
	
	const onMount = async () => {

	}
	useEffect(() => {
		onMount()
	}, [])

}