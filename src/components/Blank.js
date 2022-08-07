import { useEffect } from "react";

export const Comtracts = ({ state, update, wallet }) => {

	const { contracts } = state.app?.data
	
	const onMount = async () => {

	}
	useEffect(() => {
		onMount()
	}, [])

}