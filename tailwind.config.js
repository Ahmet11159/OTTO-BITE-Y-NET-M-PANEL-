/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    safelist: [
        {
            pattern: /(bg|text|border|shadow)-(emerald|purple|cyan|blue|rose|amber)-(50|100|200|300|400|500|600|700|800|900)/,
            variants: ['hover', 'group-hover'],
        },
        {
            pattern: /(bg|text|border)-(emerald|purple|cyan|blue|rose|amber)-500\/(10|20|30|40|50)/,
            variants: ['hover', 'group-hover'],
        },
    ],
    theme: {
        extend: {
            colors: {
                'gold': '#d4af37',
            },
            animation: {
                'fade-in-down': 'fadeInDown 0.5s ease-out',
                'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
