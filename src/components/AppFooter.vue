<template>
  <footer class="app-footer" role="contentinfo">
    <div class="footer-content">
      <div class="footer-brand">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="100" height="100" rx="12" fill="currentColor"/>
          <text x="50" y="68" font-family="Arial" font-size="55" font-weight="bold" fill="white" text-anchor="middle">I</text>
        </svg>
        <div>
          <strong>Invoicio</strong>
          <span>Free Invoice Generator</span>
        </div>
      </div>
      
      <div class="footer-features">
        <h3>Features</h3>
        <ul>
          <li>Professional invoice templates</li>
          <li>PDF export</li>
          <li>Cryptocurrency payments</li>
          <li>QR code payments</li>
          <li>Multi-currency support</li>
          <li>No signup required</li>
        </ul>
      </div>
      
      <div class="footer-info">
        <h3>About</h3>
        <p>Invoicio is a free, open-source invoice generator that runs entirely in your browser. Your data stays private and is stored locally on your device.</p>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>&copy; {{ currentYear }} Invoicio. Free to use for personal and commercial projects.</p>
      <p class="footer-tagline">Create professional invoices in seconds — no account needed.</p>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  computed: {
    currentYear() {
      return new Date().getFullYear()
    }
  }
}
</script>

<style scoped>
.app-footer {
  background: var(--gray-900);
  color: var(--gray-300);
  padding: 3rem 2rem 1.5rem;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--gray-700);
}

.footer-brand {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.footer-brand svg {
  width: 40px;
  height: 40px;
  color: var(--primary);
  flex-shrink: 0;
}

.footer-brand strong {
  display: block;
  color: white;
  font-size: 1.25rem;
}

.footer-brand span {
  font-size: 0.875rem;
  color: var(--gray-400);
}

.footer-features h3,
.footer-info h3 {
  color: white;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.footer-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-features li {
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.footer-features li::before {
  content: "✓ ";
  color: var(--primary);
}

.footer-info p {
  font-size: 0.875rem;
  line-height: 1.6;
}

.footer-bottom {
  max-width: 1200px;
  margin: 1.5rem auto 0;
  text-align: center;
  font-size: 0.875rem;
}

.footer-bottom p {
  margin: 0.25rem 0;
}

.footer-tagline {
  color: var(--gray-500);
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .footer-brand {
    justify-content: center;
  }
  
  .footer-features ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem 1.5rem;
  }
}
</style>
