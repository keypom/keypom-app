import { SidebarLinks } from './SidebarLinks';
import './Sidebar.scss'

export const Sidebar = ({ pathname, update, account }) => {
	return <div className="sidebar">
		<SidebarLinks {...{ pathname, update, account }} />
	</div>
}