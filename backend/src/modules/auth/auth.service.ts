import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from '../../db/index';
import { users, portalAccounts, portalSessions } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { ApiError } from '../../shared/errors';
import { env } from '../../config/env';
import crypto from 'crypto';

// Types
export interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'MANAGER' | 'ANALYST';
    isActive: boolean;
}

export interface PortalUser {
    id: string;
    customerId: string;
    email: string;
    customerName: string;
    sessionId: string;
}

// Supabase client for server-side auth
// Use service role key if available (for admin operations), otherwise use anon key
const supabase: SupabaseClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
);

export const authService = {
    /**
     * Get Supabase admin client
     */
    getSupabaseClient(): SupabaseClient {
        return supabase;
    },

    /**
     * Verify Supabase JWT token and get user
     */
    async verifyToken(token: string): Promise<AuthUser> {
        // Verify JWT with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw ApiError.unauthorized('Invalid or expired token');
        }

        // Get user details from our database
        const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        if (!dbUser) {
            throw ApiError.notFound('User');
        }

        if (!dbUser.isActive) {
            throw ApiError.forbidden('User account is disabled');
        }

        return {
            id: dbUser.id,
            email: dbUser.email,
            fullName: dbUser.fullName,
            role: dbUser.role as 'ADMIN' | 'MANAGER' | 'ANALYST',
            isActive: dbUser.isActive,
        };
    },

    /**
     * Login with email and password (internal users)
     */
    async login(email: string, password: string): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw ApiError.unauthorized(error.message);
        }

        if (!data.user || !data.session) {
            throw ApiError.unauthorized('Login failed');
        }

        // Get user from our database
        const authUser = await this.verifyToken(data.session.access_token);

        return {
            user: authUser,
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
        };
    },

    /**
     * Logout (revoke session)
     */
    async logout(token: string): Promise<void> {
        const { error } = await supabase.auth.admin.signOut(token);
        if (error) {
            console.warn('Logout warning:', error.message);
        }
    },

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error || !data.session) {
            throw ApiError.unauthorized('Failed to refresh token');
        }

        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
        };
    },

    /**
     * Get current user from token
     */
    async getCurrentUser(token: string): Promise<AuthUser> {
        return this.verifyToken(token);
    },

    /**
     * Create a new user (admin only)
     */
    async createUser(
        email: string,
        password: string,
        fullName: string,
        role: 'ADMIN' | 'MANAGER' | 'ANALYST'
    ): Promise<AuthUser> {
        // Create user in Supabase Auth
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (error) {
            throw ApiError.badRequest(`Failed to create user: ${error.message}`);
        }

        if (!data.user) {
            throw ApiError.internal('Failed to create user');
        }

        // Create user in our database
        const [newUser] = await db
            .insert(users)
            .values({
                id: data.user.id,
                email,
                fullName,
                role,
                isActive: true,
            })
            .returning();

        return {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role as 'ADMIN' | 'MANAGER' | 'ANALYST',
            isActive: newUser.isActive,
        };
    },

    // ==================== Portal Authentication ====================

    /**
     * Portal login (customers)
     */
    async portalLogin(email: string, password: string): Promise<{ user: PortalUser; sessionToken: string }> {
        // Find portal account
        const [account] = await db
            .select()
            .from(portalAccounts)
            .where(and(
                eq(portalAccounts.email, email),
                eq(portalAccounts.isActive, true)
            ))
            .limit(1);

        if (!account) {
            throw ApiError.unauthorized('Invalid credentials');
        }

        // Verify password hash
        const passwordHash = this.hashPassword(password, account.id);
        if (passwordHash !== account.passwordHash) {
            throw ApiError.unauthorized('Invalid credentials');
        }

        // Create session
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const [session] = await db
            .insert(portalSessions)
            .values({
                id: crypto.randomUUID(),
                accountId: account.id,
                token: sessionToken,
                expiresAt,
                ipAddress: null, // Will be set by the route
                userAgent: null, // Will be set by the route
            })
            .returning();

        // Update last login
        await db
            .update(portalAccounts)
            .set({ lastLoginAt: new Date() })
            .where(eq(portalAccounts.id, account.id));

        // Get customer name for the response
        const portalUser: PortalUser = {
            id: account.id,
            customerId: account.customerId,
            email: account.email,
            customerName: account.contactName || 'Customer',
            sessionId: session.id,
        };

        return {
            user: portalUser,
            sessionToken,
        };
    },

    /**
     * Verify portal session token
     */
    async verifyPortalSession(sessionToken: string): Promise<PortalUser> {
        const [session] = await db
            .select()
            .from(portalSessions)
            .where(and(
                eq(portalSessions.token, sessionToken),
                gt(portalSessions.expiresAt, new Date())
            ))
            .limit(1);

        if (!session) {
            throw ApiError.unauthorized('Invalid or expired session');
        }

        // Get portal account
        const [account] = await db
            .select()
            .from(portalAccounts)
            .where(and(
                eq(portalAccounts.id, session.accountId),
                eq(portalAccounts.isActive, true)
            ))
            .limit(1);

        if (!account) {
            throw ApiError.unauthorized('Account not found or disabled');
        }

        return {
            id: account.id,
            customerId: account.customerId,
            email: account.email,
            customerName: account.contactName || 'Customer',
            sessionId: session.id,
        };
    },

    /**
     * Portal logout
     */
    async portalLogout(sessionToken: string): Promise<void> {
        await db
            .delete(portalSessions)
            .where(eq(portalSessions.token, sessionToken));
    },

    /**
     * Hash password for portal accounts (simple HMAC-based)
     */
    hashPassword(password: string, salt: string): string {
        return crypto
            .createHmac('sha256', env.JWT_SECRET!)
            .update(password + salt)
            .digest('hex');
    },

    /**
     * Create portal account for a customer
     */
    async createPortalAccount(
        customerId: string,
        email: string,
        password: string,
        contactName: string
    ): Promise<PortalUser> {
        const accountId = crypto.randomUUID();
        const passwordHash = this.hashPassword(password, accountId);

        const [account] = await db
            .insert(portalAccounts)
            .values({
                id: accountId,
                customerId,
                email,
                passwordHash,
                contactName,
                isActive: true,
            })
            .returning();

        return {
            id: account.id,
            customerId: account.customerId,
            email: account.email,
            customerName: account.contactName || 'Customer',
            sessionId: '',
        };
    },
};
