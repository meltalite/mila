/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: '#8B7FC7',
				secondary: '#A8D5BA',
				accent: '#FF8B7C',
				background: '#FAFAFA',
				'text-dark': '#2D3748'
			}
		}
	},
	plugins: []
};
