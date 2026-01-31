/**
 * PDF Generation Worker
 * Fastify server with Puppeteer for generating PDF documents
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import puppeteer, { Browser, Page } from 'puppeteer';
import Handlebars from 'handlebars';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Environment config
const PORT = parseInt(process.env.PORT || '8080', 10);
const API_KEY = process.env.PDF_WORKER_API_KEY || 'dev-key';

// Browser instance (reused for performance)
let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        });
    }
    return browser;
}

// Compile and cache templates
const templateCache = new Map<string, Handlebars.TemplateDelegate>();

async function getTemplate(name: string): Promise<Handlebars.TemplateDelegate> {
    if (!templateCache.has(name)) {
        const templatePath = path.join(TEMPLATES_DIR, `${name}.hbs`);
        const content = await fs.readFile(templatePath, 'utf-8');
        templateCache.set(name, Handlebars.compile(content));
    }
    return templateCache.get(name)!;
}

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
});

Handlebars.registerHelper('formatCurrency', (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
    }).format(amount);
});

Handlebars.registerHelper('formatNumber', (num: number, decimals = 2) => {
    return num?.toFixed(typeof decimals === 'number' ? decimals : 2) || '-';
});

// Build server
async function buildApp() {
    const app = Fastify({
        logger: {
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        },
    });

    await app.register(helmet, { contentSecurityPolicy: false });
    await app.register(cors);

    // Auth middleware
    app.addHook('preHandler', async (request, reply) => {
        // Skip auth for health check
        if (request.url === '/health') return;

        const apiKey = request.headers['x-api-key'];
        if (apiKey !== API_KEY) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // Health check
    app.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
    }));

    // ==================== Quotation PDF ====================

    const quotationSchema = z.object({
        quotationNumber: z.string(),
        date: z.string(),
        validUntil: z.string(),
        customer: z.object({
            name: z.string(),
            address: z.string().optional(),
            contactPerson: z.string().optional(),
            email: z.string().optional(),
        }),
        items: z.array(z.object({
            no: z.number(),
            parameterName: z.string(),
            methodName: z.string().optional(),
            unit: z.string().optional(),
            price: z.number(),
            quantity: z.number(),
            subtotal: z.number(),
        })),
        subtotal: z.number(),
        discount: z.number().optional(),
        tax: z.number().optional(),
        total: z.number(),
        notes: z.string().optional(),
        preparedBy: z.string().optional(),
    });

    app.post('/api/pdf/quotation', async (request, reply) => {
        const data = quotationSchema.parse(request.body);

        const template = await getTemplate('quotation');
        const html = template(data);

        const browser = await getBrowser();
        const page = await browser.newPage();

        try {
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
                printBackground: true,
            });

            reply.header('Content-Type', 'application/pdf');
            reply.header('Content-Disposition', `attachment; filename="quotation-${data.quotationNumber}.pdf"`);
            return reply.send(pdfBuffer);
        } finally {
            await page.close();
        }
    });

    // ==================== Sample Receipt PDF ====================

    const sampleReceiptSchema = z.object({
        workOrderNumber: z.string(),
        receivedDate: z.string(),
        customer: z.object({
            name: z.string(),
            address: z.string().optional(),
        }),
        samples: z.array(z.object({
            no: z.number(),
            sampleLabId: z.string(),
            sampleName: z.string(),
            condition: z.string().optional(),
            quantity: z.string().optional(),
        })),
        receivedBy: z.string().optional(),
        notes: z.string().optional(),
    });

    app.post('/api/pdf/sample-receipt', async (request, reply) => {
        const data = sampleReceiptSchema.parse(request.body);

        const template = await getTemplate('sample-receipt');
        const html = template(data);

        const browser = await getBrowser();
        const page = await browser.newPage();

        try {
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
                printBackground: true,
            });

            reply.header('Content-Type', 'application/pdf');
            reply.header('Content-Disposition', `attachment; filename="receipt-${data.workOrderNumber}.pdf"`);
            return reply.send(pdfBuffer);
        } finally {
            await page.close();
        }
    });

    // ==================== Certificate of Analysis (CoA) PDF ====================

    const coaSchema = z.object({
        reportNumber: z.string(),
        title: z.string().optional(),
        customer: z.object({
            name: z.string(),
            address: z.string().optional(),
        }),
        sample: z.object({
            sampleLabId: z.string(),
            sampleName: z.string(),
            receivedDate: z.string(),
            analysisDate: z.string().optional(),
            condition: z.string().optional(),
        }),
        results: z.array(z.object({
            no: z.number(),
            parameterName: z.string(),
            method: z.string().optional(),
            unit: z.string().optional(),
            result: z.string(),
            specification: z.string().optional(),
            status: z.string().optional(), // PASS, FAIL
        })),
        conformityStatement: z.string().optional(),
        notes: z.string().optional(),
        signatures: z.array(z.object({
            name: z.string(),
            role: z.string(),
            signatureImage: z.string().optional(), // Base64 or URL
            date: z.string().optional(),
        })).optional(),
        isDraft: z.boolean().optional(),
        watermark: z.string().optional(), // DRAFT, COPY, etc.
    });

    app.post('/api/pdf/coa', async (request, reply) => {
        const data = coaSchema.parse(request.body);

        const template = await getTemplate('coa');
        const html = template(data);

        const browser = await getBrowser();
        const page = await browser.newPage();

        try {
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
                printBackground: true,
            });

            reply.header('Content-Type', 'application/pdf');
            const suffix = data.isDraft ? '-DRAFT' : '';
            reply.header('Content-Disposition', `attachment; filename="coa-${data.reportNumber}${suffix}.pdf"`);
            return reply.send(pdfBuffer);
        } finally {
            await page.close();
        }
    });

    // ==================== Generic HTML to PDF ====================

    const htmlToPdfSchema = z.object({
        html: z.string(),
        filename: z.string().optional(),
        options: z.object({
            format: z.enum(['A4', 'Letter', 'Legal']).optional(),
            landscape: z.boolean().optional(),
            margin: z.object({
                top: z.string().optional(),
                right: z.string().optional(),
                bottom: z.string().optional(),
                left: z.string().optional(),
            }).optional(),
        }).optional(),
    });

    app.post('/api/pdf/html', async (request, reply) => {
        const data = htmlToPdfSchema.parse(request.body);

        const browser = await getBrowser();
        const page = await browser.newPage();

        try {
            await page.setContent(data.html, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: data.options?.format || 'A4',
                landscape: data.options?.landscape || false,
                margin: data.options?.margin || { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
                printBackground: true,
            });

            reply.header('Content-Type', 'application/pdf');
            reply.header('Content-Disposition', `attachment; filename="${data.filename || 'document'}.pdf"`);
            return reply.send(pdfBuffer);
        } finally {
            await page.close();
        }
    });

    return app;
}

// Start server
async function start() {
    const app = await buildApp();

    try {
        await app.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`PDF Worker running on port ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }

    // Graceful shutdown
    const shutdown = async () => {
        console.log('Shutting down...');
        if (browser) {
            await browser.close();
        }
        await app.close();
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

start();
