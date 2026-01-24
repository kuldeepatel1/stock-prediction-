# Stock Market Price Prediction System

A comprehensive React application with Clerk authentication for predicting stock prices using AI/ML models. This system provides interactive charts, historical data visualization, and future price predictions for top Indian stocks.

## 🚀 Features

- **Clerk Authentication**: Secure user registration and login flows
- **Interactive Dashboard**: User-friendly interface with stock selection and analysis
- **Historical Data Visualization**: Interactive charts showing 5 years of stock price history
- **AI-Powered Predictions**: Future price predictions with confidence scores
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Data**: Efficient data fetching with React Query
- **Production Ready**: Built with TypeScript, ESLint, and modern best practices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Authentication**: Clerk
- **Routing**: React Router v6
- **Data Fetching**: TanStack React Query
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel/Netlify with Docker support

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stock-market-prediction-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Clerk publishable key:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-key-here
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Clerk Setup

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable key to the `.env.local` file
4. Configure redirect URLs:
   - Sign-in redirect: `/dashboard`
   - Sign-up redirect: `/dashboard`
   - Sign-out redirect: `/`

### API Integration

The application includes mock API services for development. For production, replace the mock functions in `src/services/api.ts` with real API endpoints:

- `GET /api/companies` - Fetch list of available stocks
- `GET /api/historical?ticker={ticker}` - Fetch historical price data
- `GET /api/predict?ticker={ticker}&year={year}` - Fetch price predictions

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Header.tsx       # Navigation header with auth
│   ├── LoadingSpinner.tsx
│   ├── ProtectedRoute.tsx
│   ├── PredictionCard.tsx
│   └── StockChart.tsx   # Interactive price charts
├── pages/               # Route components
│   ├── Dashboard.tsx    # Main dashboard with stock analysis
│   ├── Home.tsx        # Landing page
│   ├── SignInPage.tsx  # Clerk sign-in integration
│   └── SignUpPage.tsx  # Clerk sign-up integration
├── services/           # API service layer
│   └── api.ts         # Data fetching functions
├── types/             # TypeScript type definitions
│   └── index.ts
├── App.tsx           # Main app component with routing
└── main.tsx         # App entry point with providers
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard:**
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_BASE_URL`
3. **Deploy automatically on push to main branch**

### Docker

```bash
# Build the Docker image
docker build -t stock-prediction-app .

# Run the container
docker run -p 80:80 stock-prediction-app
```

### Manual Build

```bash
# Build for production
npm run build

# Preview the build
npm run preview
```

## 📊 Features Overview

### Authentication
- Secure user registration and login with Clerk
- Protected routes for authenticated users
- User profile display and management

### Stock Analysis
- Search and select from 250+ Indian stocks
- Interactive historical price charts (5 years)
- AI/ML powered price predictions
- Confidence scores for predictions
- Responsive data visualization

### User Interface
- Modern, professional design
- Mobile-first responsive layout
- Loading states and error handling
- Smooth animations and transitions
- Accessible components

## 🔮 Future Enhancements

- **Real-time Data**: WebSocket integration for live price updates
- **Portfolio Management**: Track and manage stock portfolios
- **Advanced Analytics**: Technical indicators and market sentiment
- **Notifications**: Price alerts and prediction updates
- **Social Features**: Share predictions and insights
- **Mobile App**: React Native companion app

