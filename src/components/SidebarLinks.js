import {
	Link
} from "react-router-dom";

export const SidebarLinks = ({ pathname, update, account }) => {
	const hideMenu = () => update('app.menu', false)

	switch (pathname.substring(1)) {
		case 'account':
			return <nav>
				<Link onClick={() => {
					account.wallet.signOut()
					hideMenu()
				}} to="/">Sign Out</Link>
			</nav>
		break;
		case 'deploy':
			return <nav>
				<Link onClick={hideMenu} to="/deploy/nft">NFT</Link>
				<Link to="/deploy/nft-series">Deploy NFT Series</Link>
			</nav>
		default:
			return <nav>
				{/* <Link onClick={hideMenu} to="/">Home</Link>
				<Link onClick={hideMenu} to="/deploy">Deploy</Link>
				<Link onClick={hideMenu} to="/account">Account</Link> */}
			</nav>
	}

	
}