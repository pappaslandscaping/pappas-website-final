// Quote Form JavaScript
// Handles multi-step form, package selection, and form submission

let currentStep = 1;
let selectedPackage = null;
let selectedServices = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    initializePackageCards();
    initializeAddressAutocomplete();
    initializeFormNavigation();
    initializeFormSubmission();
});

// Initialize form
function initializeForm() {
    showStep(1);
}

// Package card selection
function initializePackageCards() {
    const packageCards = document.querySelectorAll('.package-card');
    
    packageCards.forEach(card => {
        card.addEventListener('click', function() {
            // Check if this card is already selected
            const isAlreadySelected = this.classList.contains('selected');
            
            // Remove selected class from all cards
            packageCards.forEach(c => c.classList.remove('selected'));
            
            // If it wasn't selected before, select it now
            if (!isAlreadySelected) {
                this.classList.add('selected');
                selectedPackage = this.dataset.package;
            } else {
                // If it was selected, unselect it
                selectedPackage = null;
            }
            
            console.log('Selected package:', selectedPackage);
        });
    });
}

// Google Places Address Autocomplete (new API)
async function initializeAddressAutocomplete() {
    try {
        // Load the Places library
        await google.maps.importLibrary('places');
        
        const placeAutocompleteElement = document.getElementById('address');
        const addressValue = document.getElementById('addressValue');
        
        if (!placeAutocompleteElement || !addressValue) return;
        
        // Restrict to US addresses
        placeAutocompleteElement.componentRestrictions = { country: 'us' };
        
        // Listen for place selection
        placeAutocompleteElement.addEventListener('gmp-placeselect', async (event) => {
            const place = event.place;
            
            if (place) {
                // Get the formatted address
                await place.fetchFields({ fields: ['formattedAddress'] });
                
                // Set the hidden input value for form submission
                if (place.formattedAddress) {
                    addressValue.value = place.formattedAddress;
                }
            }
        });
        
        console.log('Address autocomplete initialized');
    } catch (error) {
        console.warn('Google Places API not available:', error);
    }
}

// Form navigation
function initializeFormNavigation() {
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    
    nextButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });
    
    prevButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            currentStep--;
            showStep(currentStep);
        });
    });
}

// Show specific step
function showStep(step) {
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    
    steps.forEach((s, index) => {
        if (index + 1 === step) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
    
    progressSteps.forEach((s, index) => {
        if (index + 1 <= step) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
    
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validate current step
function validateStep(step) {
    const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!currentStepElement) return true;
    
    const requiredInputs = currentStepElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredInputs.forEach(input => {
        // Skip the web component itself, check the hidden input instead
        if (input.tagName === 'GMP-PLACE-AUTOCOMPLETE') {
            const addressValue = document.getElementById('addressValue');
            if (!addressValue || !addressValue.value.trim()) {
                isValid = false;
                const placeAutocomplete = document.getElementById('address');
                if (placeAutocomplete) {
                    placeAutocomplete.style.borderColor = '#dc3545';
                }
            }
            return;
        }
        
        if (!input.value.trim() && input.type !== 'radio' && input.type !== 'checkbox') {
            isValid = false;
            input.classList.add('error');
        } else if (input.type === 'radio') {
            const radioGroup = currentStepElement.querySelectorAll(`input[name="${input.name}"]`);
            const hasChecked = Array.from(radioGroup).some(radio => radio.checked);
            if (!hasChecked) {
                isValid = false;
            }
        } else {
            input.classList.remove('error');
        }
    });
    
    if (!isValid) {
        alert('Please fill in all required fields');
    }
    
    return isValid;
}

// Form submission
function initializeFormSubmission() {
    const form = document.getElementById('quoteForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateStep(currentStep)) {
            return;
        }
        
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            if (key === 'services[]') {
                if (!data.services) data.services = [];
                data.services.push(value);
            } else {
                data[key] = value;
            }
        });
        
        // Add selected package
        if (selectedPackage) {
            data.package = selectedPackage;
        }

        // Collect SMS consent checkboxes (not in FormData since unchecked boxes aren't included)
        data.consentTransactional = document.getElementById('consentTransactional')?.checked || false;
        data.consentMarketing = document.getElementById('consentMarketing')?.checked || false;
        data.consentTerms = document.getElementById('consentTerms')?.checked || false;
        
        console.log('Form data:', data);
        
        // Get reCAPTCHA token before submitting
        try {
            const recaptchaToken = await grecaptcha.execute('6LeNqnQsAAAAAGgwOp8QUnjq6U8HZNoC1tVFTTV3', {action: 'quote_request'});
            data.recaptchaToken = recaptchaToken;
        } catch (recaptchaError) {
            console.error('reCAPTCHA error:', recaptchaError);
            // Continue without token if reCAPTCHA fails to load
        }
        
        // Submit to backend
        try {
            const response = await fetch('https://pappas-quote-backend-production.up.railway.app/api/quotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                // Show success message
                document.getElementById('successEmail').textContent = data.email;
                currentStep = 4;
                showStep(4);
            } else {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error === 'Spam detection triggered. Please try again.') {
                    alert('Our spam filter flagged this submission. Please try again or call us at (440) 886-7318');
                } else {
                    alert('There was an error submitting your quote request. Please try again or call us at (440) 886-7318');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error submitting your quote request. Please try again or call us at (440) 886-7318');
        }
    });
}

// Add CSS for selected package cards
const style = document.createElement('style');
style.textContent = `
    .package-card {
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }
    
    .package-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
    
    .package-card.selected {
        border-color: var(--green-primary);
        box-shadow: 0 8px 20px rgba(92, 184, 92, 0.3);
    }
    
    .package-card.selected::after {
        content: '✓ Selected';
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: var(--green-primary);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
    }
    
    input.error {
        border-color: #dc3545 !important;
    }
    
    /* Style for Google Places Autocomplete Web Component */
    gmp-place-autocomplete {
        width: 100%;
        font-size: 1rem;
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        transition: border-color 0.3s ease;
    }
    
    gmp-place-autocomplete:focus-within {
        outline: none;
        border-color: var(--green-primary);
    }
`;
document.head.appendChild(style);
