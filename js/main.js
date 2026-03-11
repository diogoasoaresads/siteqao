document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const closeMenuBtn = document.querySelector('.close-menu-btn');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleMenu() {
        mobileMenuOverlay.classList.toggle('active');
        document.body.style.overflow = mobileMenuOverlay.classList.contains('active') ? 'hidden' : 'auto';
    }

    if (mobileMenuBtn && closeMenuBtn && mobileMenuOverlay) {
        mobileMenuBtn.addEventListener('click', toggleMenu);
        closeMenuBtn.addEventListener('click', toggleMenu);
        
        mobileLinks.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    }

    // 2. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Scroll Reveal Animations
    const revealElements = document.querySelectorAll('.reveal, .reveal-right');
    
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    // 4. Form Submission (Simulated)
    const contactForm = document.getElementById('contact-form');
    if(contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            // Loading state
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            btn.style.opacity = '0.8';
            btn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-check"></i> Recebemos seus dados!';
                btn.style.background = 'var(--success)';
                btn.style.color = '#000';
                
                setTimeout(() => {
                    contactForm.reset();
                    btn.innerHTML = originalText;
                    btn.style.background = 'var(--accent-gradient)';
                    btn.style.opacity = '1';
                    btn.disabled = false;
                }, 3000);
            }, 1500);
        });
    }
});
