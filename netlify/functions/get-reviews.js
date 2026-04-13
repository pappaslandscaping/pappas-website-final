// Netlify serverless function to fetch Google reviews
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Using CID extracted from Google Maps embed - converting hex to decimal
const CID = '14930073848678187635'; // Decimal conversion of 0xcf36b41a09f6a673

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Try using CID (Customer ID) instead of Place ID
    const url = `https://maps.googleapis.com/maps/api/place/details/json?cid=${CID}&fields=rating,user_ratings_total,reviews&key=${GOOGLE_API_KEY}`;
    
    console.log('Fetching with CID:', CID);
    
    const response = await fetch(url);
    const data = await response.json();

    console.log('API Response:', JSON.stringify(data));

    if (data.status === 'OK' && data.result) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          rating: data.result.rating,
          totalReviews: data.result.user_ratings_total,
          reviews: (data.result.reviews || []).map(review => ({
            author: review.author_name,
            rating: review.rating,
            text: review.text,
            time: review.relative_time_description,
            profilePhoto: review.profile_photo_url
          }))
        })
      };
    } else {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: data.status,
          message: data.error_message,
          cid_used: CID
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
