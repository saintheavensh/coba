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
				rewrite: (path) => path.replace(/^\/api/, '')
			},
			'/uploads': {
				target: 'http://localhost:4000',
				changeOrigin: true
			}
		}
	}
});
