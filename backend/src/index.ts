import { buildApp } from './app.js';
import { config, env } from './config/index.js';

async function main() {
    const app = await buildApp();

    try {
        await app.listen({
            port: config.port,
            host: '0.0.0.0', // Required for Docker/Fly.io
        });

        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧪 LabFlow LIMS API                                     ║
║                                                           ║
║   Server running at: http://localhost:${config.port}              ║
║   API Docs: http://localhost:${config.port}/docs                  ║
║   Environment: ${env.NODE_ENV.padEnd(12)}                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'] as const;
signals.forEach((signal) => {
    process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        process.exit(0);
    });
});

main();
