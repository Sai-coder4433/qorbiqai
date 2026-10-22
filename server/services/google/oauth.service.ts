import { encrypt, decrypt } from '../../utils/crypto.ts';
import { db } from '../../db/database.ts';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export class GoogleOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback';
  }

  public isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  public getAuthorizationUrl(businessId: string, organizationId: string): string {
    const state = Buffer.from(JSON.stringify({ businessId, organizationId, ts: Date.now() })).toString('base64');
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  public async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    scope: string;
    userEmail?: string;
  }> {
    const params = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code'
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google token exchange failed (${res.status}): ${errorText}`);
    }

    const data = await res.json();

    // Fetch user info for audit / identification
    let userEmail: string | undefined;
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        userEmail = userInfo.email;
      }
    } catch (e) {
      console.warn('Could not fetch user email during Google OAuth:', e);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
      userEmail
    };
  }

  public async getValidAccessToken(businessId: string): Promise<string> {
    const integration = db.getGoogleIntegration(businessId);
    if (!integration || integration.status !== 'connected') {
      throw new Error('Google integration not connected or requires reauthorization');
    }

    const now = Date.now();
    // If token exists and hasn't expired (with 2 min buffer)
    if (integration.accessTokenEncrypted && integration.tokenExpiresAt && integration.tokenExpiresAt > now + 120000) {
      return decrypt(integration.accessTokenEncrypted);
    }

    // Refresh token
    if (!integration.refreshTokenEncrypted) {
      integration.status = 'reauthorization_required';
      integration.errorMessage = 'Refresh token missing. Reconnect Google required.';
      db.saveGoogleIntegration(integration);
      throw new Error('Refresh token missing. Reconnect Google required.');
    }

    const rawRefreshToken = decrypt(integration.refreshTokenEncrypted);
    try {
      const refreshed = await this.refreshAccessToken(rawRefreshToken);
      integration.accessTokenEncrypted = encrypt(refreshed.accessToken);
      integration.tokenExpiresAt = Date.now() + (refreshed.expiresIn * 1000);
      integration.status = 'connected';
      integration.errorMessage = undefined;
      db.saveGoogleIntegration(integration);
      return refreshed.accessToken;
    } catch (err: any) {
      integration.status = 'reauthorization_required';
      integration.errorMessage = err.message || 'Token refresh failed';
      db.saveGoogleIntegration(integration);
      throw new Error('Google authorization expired. Reconnect Google required.');
    }
  }

  public async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Token refresh failed: ${err}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in
    };
  }
}

export const googleOAuthService = new GoogleOAuthService();
