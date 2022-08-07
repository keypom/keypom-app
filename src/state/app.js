import { get, set } from '../utils/store'
import { State } from '../utils/state';
import { initNear } from './near';

export const APP_DATA = '__APP_DATA'

// example
const initialState = {
	app: {
		mounted: false,
		menu: false,
		loading: true,
		data: get(APP_DATA),
	},
	wallet: {
		isSignedIn: () => false
	},
	contract: {},
};

export const { appStore, AppProvider } = State(initialState, 'app');

// example app function
export const onAppMount = () => async ({ update, getState, dispatch }) => {
	update('app', { mounted: true });
};

export const insertAppDataArr = (update, k, v) => {
	const appData = getAppData()
	if (!appData[k]) appData[k] = []
	if (!appData[k].includes(v)) appData[k].push(v)
	set(APP_DATA, appData)
	update('app.data', appData)
}

export const removeAppDataArr = (update, k, v) => {
	const appData = getAppData()
	if (!appData[k]) return
	const newArr = appData[k].filter((el) => el !== v)
	appData[k] = newArr
	set(APP_DATA, appData)
	update('app.data', appData)
}

export const setAppData = (update, data) => {
	set(APP_DATA, data)
	update('app.data', data)
}

export const getAppData = () => get(APP_DATA)
