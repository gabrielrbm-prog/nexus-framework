/*
 * 🚀 NEXUS Generated JavaScript
 * Business: general
 * Target: millennial
 * Generated: 2026-03-12T14:24:31.585Z
 */

// Core functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NEXUS site loaded - general');
    
    // Initialize components
    initializeNavigation();
    initializeAnimations();
    initializeTracking();
    
});

// Navigation functionality
function initializeNavigation() {
    const mobileToggle = document.querySelector('.nexus-nav__mobile-toggle');
    const navMenu = document.querySelector('.nexus-nav__menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('nexus-nav__menu--open');
        });
    }
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animation initialization
function initializeAnimations() {
    // Intersection Observer for animations
    const animateElements = document.querySelectorAll('[data-animate]');
    
    if (animateElements.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        animateElements.forEach(el => observer.observe(el));
    }
    
    // Initialize component-specific animations
    // Animation initialization

}

// Analytics and tracking
function initializeTracking() {
    // Button click tracking
    document.querySelectorAll('.nexus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.textContent.trim();
            console.log('🎯 CTA clicked:', action);
            // Add your analytics code here
        });
    });
}


// Performance monitoring
window.addEventListener('load', function() {
    console.log('📊 Site loaded in:', performance.now().toFixed(2) + 'ms');
});
