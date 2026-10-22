import { CompetitorItem, RankGridPoint, RankGridScan } from '../../types/index.ts';

export class GooglePlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  // Cost-conscious Text Search (New) with exact field mask
  public async searchCompetitors(query: string, latitude: number, longitude: number, radiusMeters: number = 5000): Promise<CompetitorItem[]> {
    if (!this.apiKey) {
      throw new Error('Google Maps / Places API Key not configured. Please set GOOGLE_MAPS_API_KEY in environment or admin settings.');
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    // Strict Field Mask to control billing cost
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.rating',
      'places.userRatingCount',
      'places.primaryType',
      'places.websiteUri',
      'places.googleMapsUri',
      'places.location'
    ].join(',');

    const payload = {
      textQuery: query,
      locationBias: {
        circle: {
          center: {
            latitude,
            longitude
          },
          radius: radiusMeters
        }
      },
      pageSize: 10
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Places API search failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    const places = data.places || [];

    return places.map((p: any) => {
      // Calculate approximate distance
      let distanceMeters: number | undefined;
      if (p.location?.latitude && p.location?.longitude) {
        distanceMeters = this.calculateHaversineDistance(
          latitude,
          longitude,
          p.location.latitude,
          p.location.longitude
        );
      }

      return {
        id: p.id,
        name: p.displayName?.text || 'Unnamed Place',
        placeId: p.id,
        rating: p.rating || 0,
        userRatingCount: p.userRatingCount || 0,
        primaryType: p.primaryType || 'local_business',
        address: p.formattedAddress || '',
        websiteUri: p.websiteUri,
        googleMapsUri: p.googleMapsUri,
        distanceMeters: distanceMeters ? Math.round(distanceMeters) : undefined
      };
    });
  }

  // Local Visibility Grid Scanner (Geo-Grid)
  public async scanVisibilityGrid(
    businessId: string,
    targetKeyword: string,
    targetPlaceId: string,
    centerLat: number,
    centerLng: number,
    gridSize: number = 3, // 3x3 = 9 points or 5x5 = 25 points
    radiusKm: number = 5
  ): Promise<RankGridScan> {
    if (!this.apiKey) {
      throw new Error('Google Maps / Places API Key not configured.');
    }

    const points: RankGridPoint[] = [];
    const stepKm = (radiusKm * 2) / (gridSize - 1 || 1);
    const kmPerDegreeLat = 110.574;
    const kmPerDegreeLng = 111.320 * Math.cos((centerLat * Math.PI) / 180);

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const offsetLatKm = (r - (gridSize - 1) / 2) * stepKm;
        const offsetLngKm = (c - (gridSize - 1) / 2) * stepKm;

        const pointLat = centerLat + offsetLatKm / kmPerDegreeLat;
        const pointLng = centerLng + offsetLngKm / kmPerDegreeLng;

        try {
          // Perform location-biased search for this grid point
          const competitors = await this.searchCompetitors(targetKeyword, pointLat, pointLng, 2000);
          const foundIndex = competitors.findIndex(
            comp => comp.placeId === targetPlaceId || (targetKeyword && comp.name.toLowerCase().includes(targetKeyword.toLowerCase()))
          );

          if (foundIndex !== -1) {
            const rank = foundIndex + 1;
            let status: RankGridPoint['status'] = 'NOT_FOUND';
            if (rank <= 3) status = 'TOP_3';
            else if (rank <= 10) status = 'TOP_10';
            else status = 'BELOW_10';

            points.push({
              lat: Number(pointLat.toFixed(6)),
              lng: Number(pointLng.toFixed(6)),
              found: true,
              rank,
              status,
              placeId: competitors[foundIndex].placeId
            });
          } else {
            points.push({
              lat: Number(pointLat.toFixed(6)),
              lng: Number(pointLng.toFixed(6)),
              found: false,
              status: 'NOT_FOUND'
            });
          }
        } catch (e) {
          points.push({
            lat: Number(pointLat.toFixed(6)),
            lng: Number(pointLng.toFixed(6)),
            found: false,
            status: 'NOT_FOUND'
          });
        }
      }
    }

    return {
      id: 'scan_' + Date.now(),
      businessId,
      keyword: targetKeyword,
      centerLat,
      centerLng,
      gridSize,
      radiusKm,
      points,
      methodology: 'Local visibility sampled at discrete geo-coordinates via Places API Text Search with location bias. Not an organic ranking guarantee.',
      scannedAt: new Date().toISOString()
    };
  }

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const googlePlacesService = new GooglePlacesService();
