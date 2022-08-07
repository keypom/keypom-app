import { SidebarLinks } from './SidebarLinks';
import './Sidebar.scss'

export const Sidebar = ({ pathname, update, wallet }) => {
	return <div className="sidebar">
		<SidebarLinks {...{ pathname, update, wallet }} />
	</div>
}