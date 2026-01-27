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
        <div class="footer-links">
          <a href="https://github.com/mariojgt/invoicio" target="_blank" rel="noopener noreferrer" class="footer-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View on GitHub
          </a>
          <a href="https://github.com/mariojgt" target="_blank" rel="noopener noreferrer" class="footer-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Made by @mariojgt
          </a>
        </div>
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

.footer-links {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--gray-600);
  font-size: 0.85rem;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--primary);
}

.footer-link svg {
  flex-shrink: 0;
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
