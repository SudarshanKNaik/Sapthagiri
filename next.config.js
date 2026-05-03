/** @type {import('next').NextConfig} */
const nextConfig = {
	allowedDevOrigins: [
		'localhost',
		'127.0.0.1',
		'reunite-obstacle-enzyme.ngrok-free.dev',
		'*.ngrok-free.dev',
	],
};

module.exports = nextConfig;
