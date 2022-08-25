import React, { lazy, Suspense, useContext, useEffect, useRef } from 'react';
import {
	Routes,
	Route,
	useLocation,
	useSearchParams,
} from "react-router-dom";

import anime from 'animejs/lib/anime.es.js';
import Keypom from './img/keypom-small.png'
import { appStore, onAppMount } from './state/app';
import { initNear } from './state/near';
/// all
import { Loading } from './components/Loading';
import { Message } from './components/Message';
/// main 
const Header = React.lazy(() => import('./components/Header'));
const Sidebar = React.lazy(() => import('./components/Sidebar'));
/// main
const Home = React.lazy(() => import('./components/Home'));
const Account = React.lazy(() => import('./components/Account'));
const Drops = React.lazy(() => import('./components/Drops'));
const Create = React.lazy(() => import('./components/Create'));
const Contracts = React.lazy(() => import('./components/Contracts'));
const Deploy = React.lazy(() => import('./components/Deploy'));
/// alt
const Claim = React.lazy(() => import('./components/Claim'));
const Ticket = React.lazy(() => import('./components/Ticket'));
const Scanner = React.lazy(() => import('./components/Scanner'));
const Distro = React.lazy(() => import('./components/Distro'));

// import './css/normalize.css';
// import './css/skeleton.css';
import './css/modal-ui.css';
import './App.scss';

const alt = (loading, message, path, Component, routeArgs) => {
	return <main className={path.split('/')[1]}>
		{loading && <Loading />}
		<Routes>
			<Route path={path} element={<Suspense fallback={null}>
				<Component {...routeArgs} />
			</Suspense>} />
		</Routes>
		<input type="file" id="file-btn" />
		{message && <Message {...{ message }} />}
	</main>
}

const main = (path, Component, routeArgs) => {
	return <Route path={path} element={
		<Suspense fallback={null}>
			<Component {...routeArgs} />
		</Suspense>
	} />
}

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const { app, wallet, contract } = state
	const { menu, loading, message } = app
	const { pathname } = useLocation();
	const [search] = useSearchParams();

	const onMount = async () => {
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
			{loading && <Loading />}
			<Suspense fallback={null}>
				<Header {...{ pathname, menu, wallet, update }} />
				<Sidebar {...{ pathname, wallet, update }} />
			</Suspense>
			{
				wallet.isSignedIn() ?
					/* Account Paths */
					<main>
						<Routes>
							{ main('/account', Account, routeArgs) }
							{ main('/deploy/:what', Deploy, routeArgs) }
							{ main('/deploy', Deploy, routeArgs) }
							{ main('/create', Create, routeArgs) }
							{ main('/drops', Drops, routeArgs) }
							{ main('/drops/:which', Drops, routeArgs) }
							{ main('/contracts', Contracts, routeArgs) }
							{ main('/contracts/:which', Contracts, routeArgs) }
							{ main('/', Home, routeArgs) }
						</Routes>
					</main>
					:
					/* Public Paths */
					<main>
						<Routes>
							<Route path="/" element={
								<>
									<p>Please sign in to get started</p>
									<button className="outline" onClick={() => wallet.signIn()}>Sign In</button>
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
