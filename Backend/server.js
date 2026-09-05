const { port } = require('./config/env');
const { connectDatabase } = require('./config/database');
const app = require('./app');

async function start() {
	await connectDatabase();
	app.listen(port, () => console.log(`MitraScan API listening on http://localhost:${port}`));
}

start().catch((error) => {
	console.error('Unable to start API:', error.message);
	process.exit(1);
});
