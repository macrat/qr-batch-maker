<style>
html, body {
	margin: 0;
	background-color: #D6D6D6;
}
html, input, textarea, select, button, meter, progress {
	font-family: roboto, sans-serif;
}
</style>

<style scoped>
header {
	background-color: #E9E9E9;
	display: flex;
	justify-content: center;
}
header > div {
	width: 1200px;
	max-width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
}
header .links {
	display: flex;
	align-items: center;
}
header .links > * {
	margin-left: 10px;
}
header .links > *:last-child {
	margin-left: 16px;
}
header .links i {
	font-size: 26px;
}
header a {
	color: #606060;
	text-decoration: none;
}
header h1 {
	display: inline-block;
	font-size: 20px;
}

main {
	padding: 30px 0;
}
.edit-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0 20px;
	margin-top: 14px;
}
.edit-area > * {
	width: 1200px;
	max-width: 100%;
}

.controls {
	position: relative;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	margin: auto;
}
.controls > * {
	margin: 12px;
}
@media (min-width:1000px) {
	.controls > :last-child {
		position: absolute;
		top: 0;
		right: 0;
	}
}
</style>

<template>
	<el-container>
		<el-header>
			<div>
				<a href="/"><h1>BatchQR</h1></a>

				<div class=links>
					<el-tooltip content="Share via Facebook">
						<a :href=facebookURL target=_blank><i class="fab fa-facebook fa-2x" /></a>
					</el-tooltip>
					<el-tooltip content="Share via Twitter">
						<a :href=twitterURL target=_blank><i class="fab fa-twitter-square fa-2x" /></a>
					</el-tooltip>
					<el-tooltip content="Share via LINE">
						<a :href=lineURL target=_blank><i class="fab fa-line fa-2x" /></a>
					</el-tooltip>
					<el-tooltip content="open repository">
						<a href="https://github.com/macrat/batch-qr"><img src="~assets/github.svg" width=32px height=32px></a>
					</el-tooltip>
				</div>
			</div>
		</el-header>

		<el-main>
			<qr-thumbnails
				ref=thumbnails
				:data=data
				:options=options
				:current=viewLine
				@update:current="lineAsQR ? (viewLine = editLine = $event) : (viewLine = $event)" />

			<div class=edit-area>
				<div class=controls>
					<div>
						<color-picker label="background color" v-model=options.color.light clear-color=#FFFFFF00 />

						<color-picker label="foreground color" v-model=options.color.dark clear-color=#000000FF />
					</div>

					<el-slider
						v-model=options.margin
						:min=0
						:max=12
						:format-tooltip="x => `margin: ${x}`"
						style="width: 160px" />

					<el-tooltip content="error correction level">
						<el-select v-model=options.errorCorrectionLevel style="width: 8em">
							<el-option value=High />
							<el-option value=Quartile />
							<el-option value=Medium />
							<el-option value=Low />
						</el-select>
					</el-tooltip>

					<el-tooltip content="convert mode">
						<el-switch v-model=lineAsQR active-text="line as QR" inactive-text="single QR" />
					</el-tooltip>

					<el-dropdown split-button type=primary @click="downloadAll('png')" @command=handleDownloadCommand v-if=lineAsQR>
						Download
						<el-dropdown-menu slot=dropdown>
							<el-dropdown-item command=it:svg>Download It as SVG</el-dropdown-item>
							<el-dropdown-item command=it:png>Download It as PNG</el-dropdown-item>
							<el-dropdown-item command=all:svg>Download All as SVG</el-dropdown-item>
							<el-dropdown-item command=all:png>Download All as PNG</el-dropdown-item>
						</el-dropdown-menu>
					</el-dropdown>
					<el-dropdown split-button type=primary @click="downloadSingle('png')" @command=handleDownloadCommand v-else>
						Download
						<el-dropdown-menu slot=dropdown>
							<el-dropdown-item command="single:png">Download as PNG</el-dropdown-item>
							<el-dropdown-item command="single:svg">Download as SVG</el-dropdown-item>
						</el-dropdown-menu>
					</el-dropdown>
				</div>

				<TextEditor
					v-model=text
					:line=editLine
					@update:line="lineAsQR ? (editLine = viewLine = $event) : (editLine = $event)"
					:mode="lineAsQR ? 'lineasqr' : 'singleqr'" />
			</div>
		</el-main>

		<qr-downloader ref=downloader />
	</el-container>
</template>

<script>
import Vue from 'vue';
import QueryString from 'querystring';

import ColorPicker from '~/components/ColorPicker';
import QrThumbnails from '~/components/QRThumbnails';
import QrDownloader from '~/components/QRDownloader';
import TextEditor from '~/components/TextEditor';


export default {
	components: {ColorPicker, QrThumbnails, QrDownloader, TextEditor},

	validate({query}) {
		return (
			(!query.mode || /^(line-as-qr|single-qr)$/.test(query.mode))
			&& (!query.background || /^#[0-9a-fA-F]{8}$/.test(query.background))
			&& (!query.foreground || /^#[0-9a-fA-F]{8}$/.test(query.foreground))
			&& (!query.margin || /^[0-9]+$/.test(query.margin))
			&& (!query.errorlevel || /^(Low|Medium|Quartile|High)$/.test(query.errorlevel))
		);
	},

	data() {
		return {
			text: this.$route.query.text || 'Please type text here!\nEach line will convert to QR code.',
			options: {
				color: {
					light: this.$route.query.background || '#BC67D0FF',
					dark: this.$route.query.foreground || '#F4F6F9FF',
				},
				margin: this.$route.query.margin ? parseInt(this.$route.query.margin) : 1,
				errorCorrectionLevel: this.$route.query.errorlevel || 'Medium',
			},
			lineAsQR: this.$route.query.mode !== 'single-qr',
			editLine: 1,
			viewLine: 1,
		};
	},

	computed: {
		data() {
			if (this.lineAsQR) {
				return this.text.split('\n');
			} else {
				return [this.text];
			}
		},
		urlQuery() {
			return QueryString.stringify({
				background: this.options.color.light,
				foreground: this.options.color.dark,
				margin: this.options.margin,
				errorlevel: this.options.errorCorrectionLevel,
				mode: this.lineAsQR ? 'line-as-qr' : 'single-qr',
				text: this.text,
			});
		},
		shareURL() {
			return process.env.baseURL + this.$router.history.base + '?' + this.urlQuery;
		},
		facebookURL() {
			return `https://facebook.com/sharer.php?u=${encodeURIComponent(this.shareURL)}`;
		},
		twitterURL() {
			return `https://twitter.com/share?text=Create+QR+Code+via+BatchQR&url=${encodeURIComponent(this.shareURL)}`;
		},
		lineURL() {
			return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(this.shareURL)}`;
		},
	},

	methods: {
		async downloadSingle(type) {
			this.$refs.downloader.downloadIt(this.text, type, 'batch-qr', this.options);
		},
		async downloadIt(type) {
			const current = this.$refs.thumbnails.current;
			this.$refs.downloader.downloadIt(this.data[current], type, `${current + 1}`, this.options);
		},
		async downloadAll(type) {
			this.$refs.downloader.downloadAll(this.data, type, this.options);
		},
		async handleDownloadCommand(command) {
			const m = command.match(/(.*):(.*)/);

			switch (m[1]) {
			case 'single':
				return await this.downloadSingle(m[2]);
			case 'it':
				return await this.downloadIt(m[2]);
			case 'all':
				return await this.downloadAll(m[2]);
			}
		},
		updateURL() {
			if (this.urlQuery.toString() !== new URLSearchParams(location.search).toString()) {
				if (history.state !== 'batch-qr') {
					history.pushState('batch-qr', null, '?' + this.urlQuery);
				} else {
					history.replaceState('batch-qr', null, '?' + this.urlQuery);
				}
			}
		},
	},

	watch: {
		text() {
			this.updateURL();
		},
		options: {
			handler() {
				this.updateURL();
			},
			deep: true,
		},
		lineAsQR(val) {
			this.updateURL();
			if (val) {
				Vue.nextTick(() => {
					this.viewLine = this.editLine;
				});
			}
		},
	},

	mounted() {
		window.addEventListener('popstate', () => {
			this.text = this.$route.query.text || 'Please type text here!\nEach line will convert to QR code.';
			this.options = {
				color: {
					light: this.$route.query.background || '#BC67D0FF',
					dark: this.$route.query.foreground || '#F4F6F9FF',
				},
				margin: this.$route.query.margin ? parseInt(this.$route.query.margin) : 1,
				errorCorrectionLevel: this.$route.query.errorlevel || 'Medium',
			};
			this.lineAsQR = this.$route.query.mode !== 'single-qr';
		});
	},
};
</script>
