import { googleOAuthService } from './oauth.service.ts';
import { db } from '../../db/database.ts';

export class GoogleBusinessProfileService {
  private async fetchWithAuth(businessId: string, url: string, options: RequestInit = {}): Promise<any> {
    const accessToken = await googleOAuthService.getValidAccessToken(businessId);
    
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      throw new Error('Google authorization expired. Reconnect Google to continue.');
    }
    if (response.status === 403) {
      const err = await response.text();
      throw new Error(`Google Business Profile API permission denied: ${err}`);
    }
    if (response.status === 404) {
      throw new Error('Resource not found on Google Business Profile.');
    }
    if (response.status === 429) {
      throw new Error('Google API quota or rate limit exceeded. Please try again shortly.');
    }
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Google API request failed (${response.status}): ${err}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // Account Management API: https://mybusinessaccountmanagement.googleapis.com/v1/accounts
  public async listAccounts(businessId: string): Promise<any[]> {
    const url = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
    const data = await this.fetchWithAuth(businessId, url);
    return data.accounts || [];
  }

  // Business Information API v1: https://mybusinessbusinessinformation.googleapis.com/v1/{parent}/locations
  public async listLocations(businessId: string, accountName: string): Promise<any[]> {
    const readMask = [
      'name',
      'title',
      'storefrontAddress',
      'websiteUri',
      'phoneNumbers',
      'categories',
      'regularHours',
      'specialHours',
      'profile',
      'metadata',
      'serviceArea'
    ].join(',');

    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=${readMask}`;
    const data = await this.fetchWithAuth(businessId, url);
    return data.locations || [];
  }

  public async getLocation(businessId: string, locationName: string): Promise<any> {
    const readMask = 'name,title,storefrontAddress,websiteUri,phoneNumbers,categories,regularHours,profile,metadata';
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=${readMask}`;
    return this.fetchWithAuth(businessId, url);
  }

  public async updateLocation(businessId: string, locationName: string, updateMask: string, location: any): Promise<any> {
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?updateMask=${updateMask}`;
    return this.fetchWithAuth(businessId, url, {
      method: 'PATCH',
      body: JSON.stringify(location)
    });
  }

  // Reviews v4: https://mybusiness.googleapis.com/v4/{account}/{location}/reviews
  public async listReviews(businessId: string, accountName: string, locationName: string, pageSize: number = 50): Promise<any[]> {
    // locationName is usually "locations/{locationId}"
    const url = `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews?pageSize=${pageSize}`;
    const data = await this.fetchWithAuth(businessId, url);
    return data.reviews || [];
  }

  public async replyToReview(businessId: string, accountName: string, locationName: string, reviewId: string, comment: string): Promise<any> {
    const url = `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews/${reviewId}/reply`;
    return this.fetchWithAuth(businessId, url, {
      method: 'PUT',
      body: JSON.stringify({ comment })
    });
  }

  public async deleteReviewReply(businessId: string, accountName: string, locationName: string, reviewId: string): Promise<any> {
    const url = `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews/${reviewId}/reply`;
    return this.fetchWithAuth(businessId, url, {
      method: 'DELETE'
    });
  }

  // Local Posts v4: https://mybusiness.googleapis.com/v4/{account}/{location}/localPosts
  public async listPosts(businessId: string, accountName: string, locationName: string): Promise<any[]> {
    const url = `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/localPosts`;
    const data = await this.fetchWithAuth(businessId, url);
    return data.localPosts || [];
  }

  public async createPost(businessId: string, accountName: string, locationName: string, postPayload: any): Promise<any> {
    const url = `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/localPosts`;
    return this.fetchWithAuth(businessId, url, {
      method: 'POST',
      body: JSON.stringify(postPayload)
    });
  }

  public async deletePost(businessId: string, postName: string): Promise<any> {
    const url = `https://mybusiness.googleapis.com/v4/${postName}`;
    return this.fetchWithAuth(businessId, url, {
      method: 'DELETE'
    });
  }

  // Media v4: https://mybusiness.googleapis.com/v4/{account}/{location}/media
  public async listMedia(businessId: string, accountName: string, locationName: string): Promise<any[]> {
    const url = `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/media`;
    const data = await this.fetchWithAuth(businessId, url);
    return data.mediaItems || [];
  }

  public async uploadMedia(businessId: string, accountName: string, locationName: string, mediaPayload: any): Promise<any> {
    const url = `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/media`;
    return this.fetchWithAuth(businessId, url, {
      method: 'POST',
      body: JSON.stringify(mediaPayload)
    });
  }
}

export const googleBusinessProfileService = new GoogleBusinessProfileService();
