import React, { useContext, useEffect, useRef } from 'react';
import {
	Routes,
	Route,
	useLocation,
} from "react-router-dom";

import { appStore, onAppMount } from './state/app';
import { initNear } from './state/near';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Contracts } from './components/Contracts';
import { Drops } from './components/Drops';
import { Create } from './components/Create';
import { Deploy } from './components/Deploy';
import { Claim } from './components/Claim';
import { Ticket } from './components/Ticket';
import { Scanner } from './components/Scanner';
import { Account } from './components/Account';
import { Home } from './components/Home';
import { Loading } from './components/Loading';

import './css/normalize.css';
import './css/skeleton.css';
import './css/modal-ui.css';
import './App.scss';

const alt = (loading, path, Component, routeArgs) => {
	return <main className={path.split('/')[1]}>
		{ loading && <Loading /> }
		<Routes>
			<Route path={path} element={<Component {...routeArgs} />} />
		</Routes>
	</main>
}

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const { app, wallet, contract } = state
	const { menu, loading } = app
	const { pathname } = useLocation();

	const onMount = async () => {
		document.body.classList.remove('dark')
		if (/claim|ticket|scanner/.test(pathname)) return
		await dispatch(onAppMount());
		await dispatch(initNear());
	};
	useEffect(() => {
		onMount()
	}, []);

	const routeArgs = {
		state, update, wallet, contract
	}

	if (/claim/.test(pathname)) return alt(loading, "/claim/:secretKey", Claim, routeArgs)
	if (/ticket/.test(pathname)) return alt(loading, "/ticket/:secretKey", Ticket, routeArgs)
	if (/scanner/.test(pathname)) return alt(loading, "/scanner", Scanner, routeArgs)

	return (
		<>
			{ loading && <Loading /> }
			<Header {...{ pathname, menu, wallet, update }} />
			<Sidebar {...{ pathname, wallet, update }} />
			{
				wallet.isSignedIn() ?
					/* Account Paths */
					<main>
						<Routes>
							<Route path="/account" element={<Account {...routeArgs} />} />
							<Route path="/deploy/:what" element={<Deploy {...routeArgs} />} />
							<Route path="/deploy" element={<Deploy {...routeArgs} />} />
							<Route path="/create" element={<Create {...routeArgs} />} />
							<Route path="/drops" element={<Drops {...routeArgs} />} />
							<Route path="/drops/:which" element={<Drops {...routeArgs} />} />
							<Route path="/contracts" element={<Contracts {...routeArgs} />} />
							<Route path="/contracts/:which" element={<Contracts {...routeArgs} />} />
							<Route path="/" element={<Home {...routeArgs} />} />
						</Routes>
					</main>
					:
					/* Public Paths */
					<main>
						<Routes>
							<Route path="/about" element={
								<>
									<p>Drop Zone is dope</p>
								</>
							} />
							<Route path="/" element={
								<>
									<p>Please sign in to get started</p>
									<button onClick={() => wallet.signIn()}>Sign In</button>
								</>
							} />
						</Routes>
					</main>
			}

			<input type="file" id="file-btn" />
		</>
	);
};

export default App;
