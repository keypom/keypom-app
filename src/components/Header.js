import {
	Link
} from "react-router-dom";

import { SidebarLinks } from './SidebarLinks';
import { Menu } from 'react-feather';
import './Header.scss';

const Links = ({ update, wallet }) => {
	const hideMenu = () => update('app.menu', false)
	return <nav>
		{/* <Link onClick={hideMenu} to="/about">About</Link> */}
		{
			wallet.isSignedIn() ? <>
				<Link onClick={hideMenu} to="/create">Create</Link>
				<Link onClick={hideMenu} to="/drops">Drops</Link>
				<Link onClick={hideMenu} to="/contracts">Contracts</Link>
				<Link onClick={hideMenu} to="/deploy">Deploy</Link>
				<Link onClick={hideMenu} to="/account">Account</Link>
			</>
			:
			<Link onClick={hideMenu} to="/">Home</Link>
		}
	</nav>
}

export const Header = ({ pathname, menu, wallet, update }) => {

	return <header>
		<div>
			<p>
				Drop Zone { pathname.length > 1 && '/ ' + pathname.replaceAll('/', ' ') }
			</p>
		</div>
		<div>
			<Menu onClick={() => update('app', { menu: !menu })} />
			<Links {...{ update, wallet }} />
		</div>
		{menu && window.innerWidth < 768 && <div className="mobile">
			<SidebarLinks {...{ pathname, update, wallet }} />
			<Links {...{ update, wallet }} />
		</div>}
	</header>
}