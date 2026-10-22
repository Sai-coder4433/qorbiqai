import { Business, BusinessLocation } from '../../types/index.ts';

export class LocalSchemaService {
  public generateLocalBusinessSchema(business: Business, location?: BusinessLocation): any {
    let schemaType = 'LocalBusiness';
    const cat = (location?.primaryCategory || business.category || '').toLowerCase();
    
    if (cat.includes('jewelry') || cat.includes('jeweller')) {
      schemaType = 'JewelryStore';
    } else if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('food')) {
      schemaType = 'Restaurant';
    } else if (cat.includes('dentist') || cat.includes('dental')) {
      schemaType = 'Dentist';
    } else if (cat.includes('beauty') || cat.includes('salon') || cat.includes('spa')) {
      schemaType = 'BeautySalon';
    } else if (cat.includes('auto') || cat.includes('car') || cat.includes('mechanic')) {
      schemaType = 'AutomotiveBusiness';
    } else if (cat.includes('real estate')) {
      schemaType = 'RealEstateAgent';
    } else if (cat.includes('hotel') || cat.includes('lodging')) {
      schemaType = 'Hotel';
    }

    const address = location?.addressLines ? location.addressLines.join(', ') : business.address;
    const locality = location?.locality || business.city;
    const region = location?.administrativeArea || '';
    const postalCode = location?.postalCode || '';
    const country = business.country || 'IN';

    const schema: any = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      'name': business.name,
      'description': location?.description || `${business.name} in ${locality}`,
      'url': location?.websiteUri || business.website || 'https://example.com',
      'telephone': location?.phoneNumber || business.phone || '',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': address || '',
        'addressLocality': locality,
        'addressRegion': region,
        'postalCode': postalCode,
        'addressCountry': country
      }
    };

    if (location?.latitude && location?.longitude) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        'latitude': location.latitude,
        'longitude': location.longitude
      };
    }

    if (location?.googlePlaceId) {
      schema.hasMap = `https://www.google.com/maps/place/?q=place_id:${location.googlePlaceId}`;
    }

    return schema;
  }
}

export const localSchemaService = new LocalSchemaService();
