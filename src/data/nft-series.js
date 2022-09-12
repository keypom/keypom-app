export const nftSeries = {
	wasm: '/nft-series.wasm',
	form: {
		contract_id: '',
		NEAR: 5,
		owner_id: '',
		__spec: 'nft-1.0.99',
		name: '',
		symbol: '',
		// icon: '_',
		// base_uri: '_',
		// reference: '_',
		// reference_hash: '_',
	},
	data: {
		get_series: {
			from_index: '0',
			limit: 50,
		}
	},
	interact: {
		create_series: {
			form: {
				mint_id: 1,
				media: '',

				title: 'The JS Pizza',
				description: 'Grab a piece of pizza to celebrate your work at the NEARCON IRL Hackathon! Don’t forget to get one for each team member. This collectible is your identification: save it to receive your travel stipend from NEAR.',

				copies: 10,
				royalty_receiver: '',
				royalty_percent: 0,
			},
			valuesMap: {
				media: 'metadata.media',
				title: 'metadata.title',
				description: 'metadata.description',
				copies: 'metadata.copies',
			},
			number: ['mint_id', 'copies'],
			deposit: '0.1'
		},
		update_mint_id: {
			form: {
				old_mint_id: 1,
				new_mint_id: 2,
			},
			number: ['old_mint_id', 'new_mint_id'],
		},
		add_approved_minter: {
			form: {
				account_id: ''
			}
		},
	}
}