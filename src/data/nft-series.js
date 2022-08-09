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
	interact: {
		create_series: {
			form: {
				id: 1,
				media: '',
				copies: 10,
				royalty_receiver: '',
				royalty_percent: 0,
			},
			valuesMap: {
				media: 'metadata.media',
				copies: 'metadata.copies',
			},
			deposit: '0.1'
		},
		update_series_id: {
			form: {
				current_id: 1,
				new_id: 2,
			},
			number: [ 'current_id', 'new_id' ],
		}
	}
}