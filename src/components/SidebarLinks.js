import {
	Link,
	useNavigate
} from "react-router-dom";

export const SidebarLinks = ({ pathname, update, wallet }) => {
	const hideMenu = () => update('app.menu', false)

	const navigate = useNavigate()

	switch (pathname.substring(1)) {
		case 'account':
			return <nav>
				<Link onClick={() => {
					wallet.signOut()
					hideMenu()
					navigate('/')
				}} to="/">Sign Out</Link>
			</nav>
		break;
		case 'deploy':
			return <nav>
				<Link onClick={hideMenu} to="/deploy/nft-simple">NFT Simple</Link>
				<Link to="/deploy/nft-series">NFT Series</Link>
			</nav>
		default:
			return <nav>
				{/* <Link onClick={hideMenu} to="/">Home</Link>
				<Link onClick={hideMenu} to="/deploy">Deploy</Link>
				<Link onClick={hideMenu} to="/account">Account</Link> */}
			</nav>
	}

	
}