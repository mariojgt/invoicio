# Invoicio - Invoice Builder

A simple, browser-based invoice builder created with Vue.js. Create professional invoices, customize settings, and export everything as JSON.

## Features
- 📝 **Complete Invoice Creation** - Add invoice number, dates, sender/recipient details
- 📦 **Line Items** - Add multiple items with description, quantity, price, and tax
- 🧮 **Automatic Calculations** - Subtotal, tax, discount, and grand total calculated automatically
- 💰 **Flexible Tax Options** - Choose between per-item tax or tax on total
- 💳 **Payment Information** - Support for bank transfer, PayPal, credit card, cash, or custom
- 🖼️ **Logo Upload** - Add your company logo to invoices
- 🎨 **Template Customization** - Change accent color, currency, and date format
- 💾 **Save/Load** - Export and import invoices as JSON files
- ⚙️ **Settings Export** - Save and restore your preferences
- 🖨️ **Print Ready** - Clean print layout for physical copies
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository or download the files
2. Install dependencies:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

Build the app for deployment:

```bash
npm run build
```

The built files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Deploying to GitHub Pages

1. Build the project:
```bash
npm run build
```

2. Push the `dist` folder to your GitHub repository's `gh-pages` branch, or configure GitHub Pages to serve from the `dist` folder.

Alternatively, you can use a GitHub Action to automate deployment. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Usage

### Creating an Invoice

1. **Add Logo** - Click the upload area to add your company logo
2. **Invoice Details** - Fill in invoice number, date, and due date
3. **From/To** - Enter your company details and client information
4. **Items** - Add line items with descriptions, quantities, and prices
5. **Tax** - Choose per-item tax or tax on total, set rates accordingly
6. **Payment** - Select payment method and enter details
7. **Notes** - Add any additional terms or notes

### Tax Modes

- **Per Item**: Each item can have its own tax rate
- **On Total**: A single tax rate is applied to the subtotal

### Saving & Loading

- **Save**: Click "Save" to download the invoice as a JSON file
- **Load**: Click "Load" to import a previously saved invoice
- **Settings**: Export/import just your settings separately

### Printing

Click the "Print" button to print the invoice or save as PDF.

## File Structure

```
invoicio/
├── public/
│   └── favicon.svg
├── src/
│   ├── styles/
│   │   └── main.css
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## License

MIT License - feel free to use this for personal or commercial projects.
