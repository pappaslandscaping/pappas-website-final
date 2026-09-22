// Public facts reviewed from about.html, faq.html, and contact.html. The
// service-area policy below was supplied directly by the owner on Sep 21, 2026
// and supersedes older website lists and the quote backend's broader routing.
// Refresh this file when those sources or business policies change.
export const WEBSITE_CONTEXT = `
Website and company information:
- Pappas & Co. Landscaping is a family-owned Cleveland-area landscaping company. Tim Pappas is the owner and founder. He began working in lawn care in 2004 and has more than 20 years of experience. Theresa Pappas is the office manager and handles scheduling and customer care. Chris is a crew leader, and Aidan helps when home from college. Source: About page.
- Current service area, confirmed directly by the owner: Lakewood, Brook Park, Bay Village, and the west side of Cleveland only. A Cleveland city name alone is not enough to confirm coverage; ask for the property address so the team can check which side of Cleveland it is. Other cities, including Westlake, Rocky River, North Olmsted, Fairview Park, and Parma, are outside the current service area. This owner policy supersedes older website lists and the quote backend's broader routing.
- The company offers one-time projects and recurring maintenance. A quote depends on the property and requested work. The team reviews submitted property details and follows up with custom pricing; do not guarantee a response time. Source: FAQ and Contact pages.
- Snow removal timing depends on when snowfall begins and ends, total accumulation, storm duration, road conditions, and the scheduled route. Specific arrival times cannot be guaranteed. The snowfall trigger, walkways, deicing, and any follow-up passes depend on the property agreement. During a prolonged or heavy storm an initial pass may be followed by final clearing. Source: HomeWorks Snow Removal Contract reviewed September 21, 2026.
- Contact: (440) 886-7318 and hello@pappaslandscaping.com. Mailing address: PO Box 770057, Lakewood, OH 44107. Source: Contact page.
- For account-specific schedules, invoices, payments, and existing quotes, direct visitors to the secure customer portal. Do not disclose customer information in public chat.
Use these website and operational facts alongside the HomeWorks service descriptions. Do not claim a city is served unless it is confirmed above. Do not make up biographies, service boundaries, prices, or scheduling commitments.
`;

const PUBLIC_CITIES = ['lakewood', 'brook park', 'bay village'];
const EXCLUDED_CITIES = ['westlake', 'rocky river', 'north olmsted', 'fairview park', 'parma', 'avon lake', 'avon', 'north royalton', 'strongsville', 'berea', 'middleburg heights', 'olmsted falls'];

function cityLabel(city) {
  return city.replace(/\b\w/g, character => character.toUpperCase());
}

export function websiteAnswer(question) {
  const q = question.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\b(invoice|bill|payment|balance|account|next visit|scheduled visit)\b/.test(q) || /\bmy schedule\b/.test(q)) {
    return "For your schedule, invoices, payments, and account details, use the My account button below to open the secure customer portal, or call us at (440) 886-7318. Please don't share passwords or payment details in chat.";
  }
  if (/\b(price|cost|rate|charge|how much)\b/.test(q)) {
    return 'Pricing depends on your property and the scope of work. Use Get a quote below and our team will follow up with a custom quote.';
  }
  if (/\b(who|about|owner|founder|meet)\b/.test(q) && /\btim\b/.test(q)) {
    return 'Tim Pappas is the owner and founder of Pappas & Co. Landscaping. He started working in lawn care in 2004 and brings more than 20 years of experience to the business. You can read more about Tim and the team on our About page.';
  }
  if (/\b(who|about|manager|meet)\b/.test(q) && /\btheresa\b/.test(q)) {
    return 'Theresa Pappas is the office manager at Pappas & Co. Landscaping. She handles scheduling and customer care. You can meet the team on our About page.';
  }
  if (/\b(who|about|crew|meet)\b/.test(q) && /\bchris\b/.test(q)) {
    return 'Chris is a crew leader with Pappas & Co. Landscaping and works alongside Tim on customers\' properties. You can meet the team on our About page.';
  }
  if (/\b(who|about|team|meet)\b/.test(q) && /\baidan\b/.test(q)) {
    return 'Aidan is part of the Pappas family team and helps with landscaping work when he is home from college. You can meet the team on our About page.';
  }
  if (/\b(who|about|owner|family|company|business|team)\b/.test(q) &&
      /\b(pappas|you|your|landscaping)\b/.test(q) &&
      !/\b(service|services|serve|areas|where|cities|location)\b/.test(q)) {
    return 'Pappas & Co. Landscaping is a family-owned Cleveland-area business. Tim Pappas is the owner and founder, and Theresa Pappas manages scheduling and customer care. Our About page introduces the rest of the team.';
  }
  const mentionedCity = [...PUBLIC_CITIES, ...EXCLUDED_CITIES, 'cleveland'].some(name => q.includes(name));
  const areaQuestion = /\b(serve|serves|served|servicing|cover|covers|covered|area|areas|location|cities)\b/.test(q) ||
    /\b(work in|come to|do you service)\b/.test(q) ||
    (mentionedCity && /\b(service|services|offer)\b/.test(q)) ||
    (/\bwhere\b/.test(q) && /\b(service|services|work)\b/.test(q));
  if (areaQuestion) {
    const excluded = EXCLUDED_CITIES.find(name => q.includes(name));
    if (excluded) return `${cityLabel(excluded)} is outside our current service area. We currently serve Lakewood, Brook Park, Bay Village, and the west side of Cleveland only.`;
    const city = PUBLIC_CITIES.find(name => q.includes(name));
    if (city) return `Yes, ${cityLabel(city)} is listed in our current service area. Send us your property address through Get a quote and the team can confirm the service and scope.`;
    if (/\bcleveland\b/.test(q)) return 'We serve the west side of Cleveland, not all of Cleveland. Send us the property address through Get a quote or call (440) 886-7318 so the team can confirm whether it is in our service area.';
    if (/\b(where|which|what|areas|cities)\b/.test(q)) {
      return 'We currently serve Lakewood, Brook Park, Bay Village, and the west side of Cleveland only. For a Cleveland property, send us the address so the team can confirm it is on the west side.';
    }
    return 'We currently serve Lakewood, Brook Park, Bay Village, and the west side of Cleveland only. If your property is in Cleveland, send us its address and the team can confirm coverage.';
  }
  if (/\b(one time|one off|single visit|recurring|weekly maintenance)\b/.test(q)) {
    return 'We offer both one-time projects and recurring maintenance. You can request a spring or fall cleanup, weekly mowing, or another service through Get a quote, and the team will confirm the right scope for your property.';
  }
  if (/\b(how|when)\b/.test(q) && /\b(quote|estimate|response|respond)\b/.test(q)) {
    return 'You can request a free property quote through Get a quote or call (440) 886-7318. Our team will review your property details and follow up with custom pricing.';
  }
  if (/\b(phone|email|contact|call|text)\b/.test(q)) {
    return 'You can call or text Pappas & Co. Landscaping at (440) 886-7318, or email hello@pappaslandscaping.com.';
  }
  return null;
}
