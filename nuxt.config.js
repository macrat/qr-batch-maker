export default {
	head: {
		title: 'BatchQR',
		meta: [
			{charset: 'utf-8'},
			{name: 'viewport', content: 'width=device-width, initial-scale=1'},
		],
		link: [
			{rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Roboto'},
		],
	},
	plugins: [
		{src: '~plugins/vue-async-computed'},
		{src: '~plugins/vue-awesome-swiper', ssr: false},
		{src: '~plugins/element-ui'},
		{src: '~plugins/codemirror', ssr: false},
	],
};
