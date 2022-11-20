import React from 'react'

import anime from 'animejs/lib/anime.es.js';
import Keypom from '../img/keypom-small.png'

const Home = ({ wallet }) => {

	return <div>

		<center><h2>Woof! Woof! Beta Warning</h2></center>
		<p>The Keypom App is still in active beta and things may break.</p>
		<p>The app is currently ONLY available on testnet</p>
		<div className='footer'>
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

		{!wallet.isSignedIn() &&

			<>
				<h2>Sign in to get started</h2>
				<button className="outline" onClick={() => wallet.signIn()}>Sign In</button>

			</>
		}


	</div>
}
export default Home