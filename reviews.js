// Reviews Page JavaScript
let currentIndex = 0;
let reviews = [];

// Fetch reviews from Google via serverless function
async function loadReviews() {
    try {
        const response = await fetch('/.netlify/functions/get-reviews');
        const data = await response.json();
        
        if (data.reviews) {
            reviews = data.reviews;
            
            // Update rating summary
            document.querySelector('.google-rating-number').textContent = data.rating.toFixed(1);
            document.querySelector('.google-reviews-count').textContent = `Based on ${data.totalReviews}+ Google Reviews`;
            
            renderReviews();
        } else {
            // Fallback to sample reviews if API fails
            useSampleReviews();
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        useSampleReviews();
    }
}

// Fallback sample reviews
function useSampleReviews() {
    reviews = [
        {
            author: "Sarah M.",
            time: "2 months ago",
            rating: 5,
            text: "I feel like I can call Pappas & Co. at anytime and they immediately come out the next day and fix the problem. They excel at the services they provide and have a professional service.",
            profilePhoto: null
        },
        {
            author: "Mike P.",
            time: "3 months ago",
            rating: 5,
            text: "I've had Pappas & Co. for several years now & my lawn has never looked better. I'm impressed by how my lawn has improved over time and I constantly receive compliments.",
            profilePhoto: null
        },
        {
            author: "Jennifer K.",
            time: "1 month ago",
            rating: 5,
            text: "Pappas & Co. is the best at what they do. I have used them for three years now and I have recommended them to my friends and co-workers because I trust them.",
            profilePhoto: null
        },
        {
            author: "David R.",
            time: "3 weeks ago",
            rating: 5,
            text: "Outstanding service! Tim and his team transformed our overgrown yard into something we're proud of. They're reliable, professional, and do quality work.",
            profilePhoto: null
        },
        {
            author: "Lisa H.",
            time: "1 month ago",
            rating: 5,
            text: "We've tried other lawn companies before, but Pappas & Co. is in a league of their own. Consistent quality, fair pricing, and excellent communication.",
            profilePhoto: null
        },
        {
            author: "Tom W.",
            time: "2 weeks ago",
            rating: 5,
            text: "Best decision we made was hiring Pappas & Co. for our lawn care. No more spending weekends mowing - they handle everything and it looks fantastic!",
            profilePhoto: null
        }
    ];
    renderReviews();
}

// Get initial from name
function getInitial(name) {
    return name.charAt(0).toUpperCase();
}

// Render reviews
function renderReviews() {
    const track = document.getElementById('reviewsTrack');
    track.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                ${review.profilePhoto ? 
                    `<img src="${review.profilePhoto}" alt="${review.author}" class="review-avatar" style="object-fit: cover;">` :
                    `<div class="review-avatar">${getInitial(review.author)}</div>`
                }
                <div class="review-info">
                    <div class="review-author">${review.author}</div>
                    <div class="review-date">${review.time}</div>
                </div>
            </div>
            <div class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
            <div class="review-text">${review.text}</div>
            <div class="review-source">
                <svg class="google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Posted on Google
            </div>
        </div>
    `).join('');
}

// Carousel navigation - GLOBALLY ACCESSIBLE
function moveCarousel(direction) {
    const track = document.getElementById('reviewsTrack');
    const cards = track.querySelectorAll('.review-card');
    if (cards.length === 0) return;
    
    const cardWidth = cards[0].offsetWidth + 32; // card width + gap (2rem = 32px)
    const visibleCards = window.innerWidth > 1024 ? 3 : window.innerWidth > 768 ? 2 : 1;
    const maxIndex = Math.max(0, cards.length - visibleCards);
    
    currentIndex = Math.max(0, Math.min(maxIndex, currentIndex + direction));
    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
}

// Auto-scroll every 5 seconds
function startAutoScroll() {
    setInterval(() => {
        const track = document.getElementById('reviewsTrack');
        const cards = track.querySelectorAll('.review-card');
        if (cards.length === 0) return;
        
        const visibleCards = window.innerWidth > 1024 ? 3 : window.innerWidth > 768 ? 2 : 1;
        const maxIndex = Math.max(0, cards.length - visibleCards);
        
        if (currentIndex >= maxIndex) {
            currentIndex = 0;
        } else {
            currentIndex++;
        }
        
        const cardWidth = cards[0].offsetWidth + 32;
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }, 5000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
    startAutoScroll();
    
    // Reset carousel position on window resize
    window.addEventListener('resize', () => {
        currentIndex = 0;
        const track = document.getElementById('reviewsTrack');
        if (track) {
            track.style.transform = 'translateX(0)';
        }
    });
});
