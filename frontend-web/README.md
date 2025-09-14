# Black Hole Splitter - Next.js Frontend

A modern React/Next.js frontend for the Black Hole Splitter video downloader application.

## Features

- 🎨 **Modern UI**: Built with React, Next.js, and Tailwind CSS
- 🎯 **Interactive Black Hole**: Animated black hole with hover effects
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔄 **Real-time Updates**: Live feedback during video processing
- 🎬 **Multi-format Support**: MP4 and MP3 download options
- 📋 **Clipboard Integration**: Automatic URL detection from clipboard

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: React functional components with hooks
- **API Integration**: Fetch API for backend communication

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running on http://localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at http://localhost:3000

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main page component
│   └── globals.css     # Global styles
└── components/
    ├── BlackHole.tsx       # Interactive black hole component
    ├── UrlInput.tsx        # URL input modal
    ├── LoadingModal.tsx    # Loading state modal
    ├── ResultModal.tsx     # Result display modal
    └── VideoDownloader.tsx # Video format selection
```

## Components

### BlackHole
Interactive black hole with:
- Hover animations
- Click handlers
- Visual effects with CSS gradients and shadows

### UrlInput
Modal for URL input with:
- Form validation
- Keyboard shortcuts (Escape to close)
- Auto-focus

### LoadingModal
Loading state with:
- Spinning animation
- Progress indicators
- Backdrop blur

### ResultModal
Result display with:
- Success/error states
- Download links
- HTML content rendering

### VideoDownloader
Advanced video selection with:
- Format quality options
- MP4/MP3 output selection
- File size information

## API Integration

The frontend communicates with the FastAPI backend at `http://localhost:8000`:

- `POST /extract` - Extract video information
- `POST /download` - Download video in specified format
- `GET /files/{filename}` - Serve downloaded files

## Customization

### Styling
- Modify `tailwind.config.js` for custom themes
- Update component styles in individual `.tsx` files
- Global styles in `src/app/globals.css`

### API Endpoints
- Update API URLs in `src/app/page.tsx`
- Modify request/response handling as needed

## Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Variables

Create `.env.local` for environment-specific settings:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is part of the Black Hole Splitter application.