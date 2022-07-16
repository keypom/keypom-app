
import NearIcon from '../img/near-icon.svg'
import './Loading.scss'

export const Loading = () => {
	return <div className="modal-overlay">
		<img src={NearIcon} />
	</div>
}