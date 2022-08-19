import React, { useContext, useEffect, useRef } from 'react';
import {
	Routes,
	Route,
	useLocation,
	useSearchParams,
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
import { Distro } from './components/Distro';
import { Account } from './components/Account';
import { Home } from './components/Home';
import { Loading } from './components/Loading';
import { Message } from './components/Message';

import anime from 'animejs/lib/anime.es.js';
import Keypom from './img/keypom-small.png'

import './css/normalize.css';
import './css/skeleton.css';
import './css/modal-ui.css';
import './App.scss';

const alt = (loading, message, path, Component, routeArgs) => {
	return <main className={path.split('/')[1]}>
		{ loading && <Loading /> }
		<Routes>
			<Route path={path} element={<Component {...routeArgs} />} />
		</Routes>
		<input type="file" id="file-btn" />
		{ message && <Message {...{message}} /> }
	</main>
}

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const { app, wallet, contract } = state
	const { menu, loading, message } = app
	const { pathname } = useLocation();
	const [search] = useSearchParams();

	const onMount = async () => {
		document.body.classList.remove('dark')
		if (/claim|ticket|scanner|distro/.test(pathname)) return
		await dispatch(onAppMount());
		await dispatch(initNear());
	};
	useEffect(() => {
		onMount()
	}, []);

	const routeArgs = {
		dispatch, state, update, wallet, contract
	}

	if (pathname === '/' && search.get('v') !== '42') {
		return <div className='footer'>
			<img onClick={({ target }) => {
				anime({
					targets: target,
					duration: 0,
					scale: 1,
					complete: () => {
						anime({
							targets: target,
							scale: 4,
							easing: 'easeOutCubic',
							duration: 150,
							complete: () => {
								anime({
									targets: target,
									scale: 1,
									easing: 'easeInCubic',
									duration: 150,
								});
							}
						});
					}
				});
			}} src={Keypom} />
			<p>Keypom is lit!</p>
		</div>
	}

	/// TODO switch to switch
	if (/claim|ticket|scanner|distro/.test(pathname)) {
		if (/claim/.test(pathname)) return alt(loading, message, "/claim/:secretKey", Claim, routeArgs)
		if (/ticket/.test(pathname)) return alt(loading, message, "/ticket/:secretKey", Ticket, routeArgs)
		if (/scanner/.test(pathname)) return alt(loading, message, "/scanner", Scanner, routeArgs)
		if (/distro/.test(pathname)) return alt(loading, message, "/distro", Distro, routeArgs)
	}

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
