/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			genie: {
  				primary: 'hsl(var(--genie-primary))',
  				'primary-hover': 'hsl(var(--genie-primary-hover))',
  				secondary: 'hsl(var(--genie-secondary))',
  				'secondary-hover': 'hsl(var(--genie-secondary-hover))',
  				accent: 'hsl(var(--genie-accent))',
  				'accent-hover': 'hsl(var(--genie-accent-hover))',
  				success: 'hsl(var(--genie-success))',
  				warning: 'hsl(var(--genie-warning))',
  				error: 'hsl(var(--genie-error))',
  				info: 'hsl(var(--genie-info))',
  				neutral: {
  					50: 'hsl(var(--genie-neutral-50))',
  					100: 'hsl(var(--genie-neutral-100))',
  					200: 'hsl(var(--genie-neutral-200))',
  					300: 'hsl(var(--genie-neutral-300))',
  					400: 'hsl(var(--genie-neutral-400))',
  					500: 'hsl(var(--genie-neutral-500))',
  					600: 'hsl(var(--genie-neutral-600))',
  					700: 'hsl(var(--genie-neutral-700))',
  					800: 'hsl(var(--genie-neutral-800))',
  					900: 'hsl(var(--genie-neutral-900))'
  				}
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
