/**
 * Integrations Module
 * Handles external integrations: n8n webhooks, Supabase Realtime, and event notifications
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../../db/index.js';
import {
    customers,
    workOrders,
    reports,
} from '../../db/schema/index.js';
import { eq, sql, and } from 'drizzle-orm';
import crypto from 'crypto';

// ==================== Types ====================

interface WebhookPayload {
    event: string;
    timestamp: string;
    data: Record<string, unknown>;
    signature?: string;
}

// ==================== Webhook Configuration ====================

// Get webhook secret from environment (should be set in production)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-webhook-secret';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Generate HMAC signature for webhook payloads
function generateSignature(payload: string): string {
    return crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
}

// Verify incoming webhook signature
function verifySignature(payload: string, signature: string): boolean {
    const expected = generateSignature(payload);
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
    );
}

// Send webhook to n8n or other external systems
async function sendWebhook(event: string, data: Record<string, unknown>): Promise<boolean> {
    if (!N8N_WEBHOOK_URL) {
        console.log('N8N_WEBHOOK_URL not configured, skipping webhook');
        return false;
    }

    const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
    };

    const payloadString = JSON.stringify(payload);
    payload.signature = generateSignature(payloadString);

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': payload.signature,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Webhook failed: ${response.status} ${response.statusText}`);
            return false;
        }

        console.log(`Webhook sent: ${event}`);
        return true;
    } catch (error) {
        console.error('Webhook error:', error);
        return false;
    }
}

// ==================== Event Types ====================

export const WebhookEvents = {
    // Work Order Events
    WORK_ORDER_CREATED: 'work_order.created',
    WORK_ORDER_CONFIRMED: 'work_order.confirmed',
    WORK_ORDER_COMPLETED: 'work_order.completed',

    // Sample Events
    SAMPLE_RECEIVED: 'sample.received',
    SAMPLE_REGISTERED: 'sample.registered',

    // Result Events
    RESULT_SUBMITTED: 'result.submitted',
    RESULT_APPROVED: 'result.approved',
    RESULT_REJECTED: 'result.rejected',

    // Report Events
    REPORT_GENERATED: 'report.generated',
    REPORT_RELEASED: 'report.released',

    // Quotation Events
    QUOTATION_CREATED: 'quotation.created',
    QUOTATION_APPROVED: 'quotation.approved',

    // Customer Events
    CUSTOMER_CREATED: 'customer.created',

    // Alert Events
    DUE_DATE_WARNING: 'alert.due_date_warning',
    QC_FAILURE: 'alert.qc_failure',
} as const;

// ==================== Webhook Route Handlers ====================

export async function integrationsRoutes(app: FastifyInstance) {
    // ==================== Outgoing Webhooks ====================

    /**
     * Send test webhook
     * POST /api/integrations/webhooks/test
     */
    app.post('/webhooks/test', async (request: FastifyRequest, reply: FastifyReply) => {
        const result = await sendWebhook('test.ping', {
            message: 'Test webhook from LabFlow LIMS',
            timestamp: new Date().toISOString(),
        });

        return reply.send({
            success: result,
            message: result ? 'Webhook sent successfully' : 'Webhook failed or not configured',
        });
    });

    /**
     * Trigger work order notification
     * POST /api/integrations/webhooks/work-order/:id
     */
    const workOrderWebhookSchema = z.object({
        event: z.enum(['created', 'confirmed', 'completed']),
    });

    app.post('/webhooks/work-order/:id', async (request: FastifyRequest<{
        Params: { id: string };
        Body: z.infer<typeof workOrderWebhookSchema>;
    }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { event } = workOrderWebhookSchema.parse(request.body);

        // Fetch work order with customer
        const [workOrder] = await db
            .select({
                id: workOrders.id,
                workOrderNumber: workOrders.workOrderNumber,
                status: workOrders.status,
                receivedDate: workOrders.receivedDate,
                dueDate: workOrders.dueDate,
                totalSamples: workOrders.totalSamples,
                customerName: customers.name,
                customerEmail: customers.email,
            })
            .from(workOrders)
            .leftJoin(customers, eq(workOrders.customerId, customers.id))
            .where(eq(workOrders.id, id))
            .limit(1);

        if (!workOrder) {
            return reply.status(404).send({ error: 'Work order not found' });
        }

        const eventType = `work_order.${event}`;
        const result = await sendWebhook(eventType, {
            workOrder: {
                id: workOrder.id,
                workOrderNumber: workOrder.workOrderNumber,
                status: workOrder.status,
                receivedDate: workOrder.receivedDate,
                dueDate: workOrder.dueDate,
                totalSamples: workOrder.totalSamples,
            },
            customer: {
                name: workOrder.customerName,
                email: workOrder.customerEmail,
            },
        });

        return reply.send({ success: result, event: eventType });
    });

    /**
     * Trigger report notification
     * POST /api/integrations/webhooks/report/:id
     */
    const reportWebhookSchema = z.object({
        event: z.enum(['generated', 'released']),
    });

    app.post('/webhooks/report/:id', async (request: FastifyRequest<{
        Params: { id: string };
        Body: z.infer<typeof reportWebhookSchema>;
    }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { event } = reportWebhookSchema.parse(request.body);

        const [report] = await db
            .select({
                id: reports.id,
                reportNumber: reports.reportNumber,
                status: reports.status,
                title: reports.title,
            })
            .from(reports)
            .where(eq(reports.id, id))
            .limit(1);

        if (!report) {
            return reply.status(404).send({ error: 'Report not found' });
        }

        const eventType = `report.${event}`;
        const result = await sendWebhook(eventType, { report });

        return reply.send({ success: result, event: eventType });
    });

    // ==================== Incoming Webhooks ====================

    /**
     * Receive webhook from external systems (e.g., n8n callback)
     * POST /api/integrations/webhooks/receive
     */
    const incomingWebhookSchema = z.object({
        event: z.string(),
        source: z.string(),
        data: z.record(z.unknown()),
    });

    app.post('/webhooks/receive', async (request: FastifyRequest<{
        Body: z.infer<typeof incomingWebhookSchema>;
    }>, reply: FastifyReply) => {
        // Verify signature if provided
        const signature = request.headers['x-webhook-signature'] as string;
        if (signature) {
            const payloadString = JSON.stringify(request.body);
            if (!verifySignature(payloadString, signature)) {
                return reply.status(401).send({ error: 'Invalid signature' });
            }
        }

        const { event, source, data } = incomingWebhookSchema.parse(request.body);

        // Log incoming webhook
        console.log(`Received webhook: ${event} from ${source}`, data);

        // Process based on event type
        switch (event) {
            case 'payment.confirmed':
                // Handle payment confirmation from external system
                // Could update quotation/invoice status
                break;

            case 'email.delivered':
                // Track email delivery status
                break;

            case 'sms.delivered':
                // Track SMS delivery status
                break;

            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        return reply.send({
            received: true,
            event,
            timestamp: new Date().toISOString()
        });
    });

    // ==================== Realtime Subscriptions Info ====================

    /**
     * Get Supabase Realtime channel configuration
     * GET /api/integrations/realtime/channels
     */
    app.get('/realtime/channels', async (_request: FastifyRequest, reply: FastifyReply) => {
        // Return channel configuration for frontend to subscribe
        return reply.send({
            channels: [
                {
                    name: 'work-orders',
                    table: 'work_orders',
                    events: ['INSERT', 'UPDATE'],
                    description: 'Real-time work order updates',
                },
                {
                    name: 'samples',
                    table: 'samples',
                    events: ['INSERT', 'UPDATE'],
                    description: 'Real-time sample status updates',
                },
                {
                    name: 'test-results',
                    table: 'test_results',
                    events: ['INSERT', 'UPDATE'],
                    description: 'Real-time test result updates',
                },
                {
                    name: 'reports',
                    table: 'reports',
                    events: ['INSERT', 'UPDATE'],
                    description: 'Real-time report status updates',
                },
                {
                    name: 'notifications',
                    table: 'notifications',
                    events: ['INSERT'],
                    description: 'User notifications',
                },
            ],
            documentation: 'Use Supabase JS client to subscribe to these channels',
        });
    });

    // ==================== Scheduled Alerts ====================

    /**
     * Check for due date warnings (to be called by cron/scheduler)
     * POST /api/integrations/alerts/due-date-check
     */
    app.post('/alerts/due-date-check', async (_request: FastifyRequest, reply: FastifyReply) => {
        const now = new Date();
        const warningThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

        // Find work orders due within 24 hours that aren't completed
        const upcomingDue = await db
            .select({
                id: workOrders.id,
                workOrderNumber: workOrders.workOrderNumber,
                dueDate: workOrders.dueDate,
                status: workOrders.status,
                customerName: customers.name,
            })
            .from(workOrders)
            .leftJoin(customers, eq(workOrders.customerId, customers.id))
            .where(
                and(
                    sql`${workOrders.dueDate} <= ${warningThreshold.toISOString()}`,
                    sql`${workOrders.dueDate} >= ${now.toISOString()}`,
                    sql`${workOrders.status} NOT IN ('COMPLETED', 'CANCELLED')`
                )
            );

        // Send alerts for each
        const results = await Promise.all(
            upcomingDue.map(wo =>
                sendWebhook(WebhookEvents.DUE_DATE_WARNING, {
                    workOrder: wo,
                    hoursUntilDue: Math.round(
                        (new Date(wo.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60)
                    ),
                })
            )
        );

        return reply.send({
            checked: upcomingDue.length,
            alertsSent: results.filter(r => r).length,
            workOrders: upcomingDue.map(wo => wo.workOrderNumber),
        });
    });

    // ==================== Integration Status ====================

    /**
     * Get integration status and configuration
     * GET /api/integrations/status
     */
    app.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
        return reply.send({
            webhooks: {
                outgoing: {
                    configured: !!N8N_WEBHOOK_URL,
                    url: N8N_WEBHOOK_URL ? '***configured***' : null,
                },
                incoming: {
                    endpoint: '/api/integrations/webhooks/receive',
                    signatureVerification: true,
                },
            },
            realtime: {
                provider: 'Supabase',
                enabled: true,
                channelCount: 5,
            },
            alerts: {
                dueDateCheck: '/api/integrations/alerts/due-date-check',
                recommended: 'Call via cron every hour',
            },
        });
    });
}

// Export webhook sender for use in other modules
export { sendWebhook };
