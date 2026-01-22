import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
	plugins: [sveltekit(), basicSsl()],
	server: {
		host: "0.0.0.0",
		proxy: {
			'/api': {
				target: 'http://localhost:4000',
				changeOrigin: true,
				secure: false, // Allow self-signed certificates
				rewrite: (path) => path.replace(/^\/api/, ''),
				configure: (proxy, _options) => {
					proxy.on('proxyReq', (proxyReq, req, _res) => {
						// Forward x-forwarded-proto header so backend knows request came from HTTPS
						proxyReq.setHeader('x-forwarded-proto', 'https');
					});
				}
			},
			'/uploads': {
				target: 'http://localhost:4000',
				changeOrigin: true,
				secure: false
			}
		}
	},
	ssr: {
		noExternal: ['chart.js']
	}
});
