import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        proxy: {
            '/api': {
                target: 'https://api.muapi.ai',
                changeOrigin: true,
                secure: false
            },
            '/byteplus': {
                target: 'https://ark.ap-southeast.byteplus.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/byteplus/, ''),
                secure: true
            }
        }
    }
});
