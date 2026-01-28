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
- **Portfolio Management**: Track and manage favorite stocks
- **Stock Comparison**: Compare multiple stocks side by side
- **Personalization**: Customizable user preferences and settings

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Authentication**: Clerk
- **Routing**: React Router v6
- **Data Fetching**: TanStack React Query
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Backend**: FastAPI (Python)
- **Data**: Yahoo Finance (yfinance)
- **ML Models**: scikit-learn (joblib)
- **Deployment**: Vercel/Netlify with Docker support

## 📦 Installation

### Frontend

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Stock-Price-Prediction-System
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
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Backend

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI server**
   ```bash
   uvicorn app.main:app --reload
   ```

   The backend will run at `http://localhost:8000`

## 🔧 Configuration

### Clerk Setup

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable key to the `.env.local` file
4. Configure redirect URLs:
   - Sign-in redirect: `/sign-in`
   - Sign-up redirect: `/sign-up`
   - After sign-in/out: `/` (root)

### API Integration

The application includes a mock API mode for development. When `VITE_API_BASE_URL` is not set, the application uses mock data for all API calls.

**Available API Endpoints:**

- `GET /api/companies` - Fetch list of available stocks
- `GET /api/historical?ticker={ticker}` - Fetch historical price data (5 years)
- `GET /api/quote?ticker={ticker}` - Fetch current stock price and daily change
- `GET /api/predict?ticker={ticker}&year={year}&month={month}&day={day}` - Fetch price predictions

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Header.tsx       # Navigation header with auth
│   ├── LoadingSpinner.tsx
│   ├── ProtectedRoute.tsx  # Route protection with Clerk auth
│   ├── PredictionCard.tsx
│   └── StockChart.tsx   # Interactive price charts
├── pages/               # Route components
│   ├── Dashboard.tsx    # Main dashboard with stock analysis
│   ├── Home.tsx        # Landing page
│   ├── SignInPage.tsx  # Clerk sign-in integration
│   ├── SignUpPage.tsx  # Clerk sign-up integration
│   ├── Favorites.tsx   # User's favorite stocks
│   ├── Compare.tsx     # Stock comparison tool
│   ├── Recognize.tsx   # Stock recognition/analysis
│   └── Personalize.tsx # User preferences
├── services/           # API service layer
│   └── api.ts         # Data fetching functions with mock support
├── types/             # TypeScript type definitions
│   └── index.ts
├── App.tsx           # Main app component with routing and animations
└── main.tsx         # App entry point with providers

backend/
├── app/
│   ├── main.py       # FastAPI application entry point
│   ├── routes/
│   │   └── predict.py # Prediction API routes
│   ├── data/
│   │   └── companies.json # Stock ticker data
│   └── models/       # Trained ML models (.pkl files)
├── scripts/
│   └── train_models.py # Model training script
└── requirements.txt  # Python dependencies
```

## 🚀 Deployment

### Vercel (Frontend Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard:**
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_BASE_URL` (your backend URL)
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
- Animated page transitions between routes

### Stock Analysis
- Search and select from 140+ Indian stocks
- Interactive historical price charts (5 years)
- Current price with daily change indicators
- AI/ML powered price predictions
- Confidence scores for predictions
- Responsive data visualization

### User Interface
- Modern, professional design
- Mobile-first responsive layout
- Loading states and error handling
- Smooth animations and transitions (Framer Motion)
- Accessible components

### Additional Features
- **Favorites**: Save and track preferred stocks
- **Compare**: Compare multiple stocks side by side
- **Personalize**: Customize app preferences
- **Recognize**: Stock pattern recognition and analysis

## 🔮 Future Enhancements

- **Real-time Data**: WebSocket integration for live price updates
- **Portfolio Management**: Track and manage stock portfolios
- **Advanced Analytics**: Technical indicators and market sentiment
- **Notifications**: Price alerts and prediction updates
- **Social Features**: Share predictions and insights
- **Mobile App**: React Native companion app

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `VITE_API_BASE_URL` | Backend API base URL | No (defaults to mock mode) |

## 🧪 Development

### Running in Mock Mode

By default, without setting `VITE_API_BASE_URL`, the application uses mock data for all API calls. This is useful for development without running the backend.

### Running with Backend

1. Start the backend: `uvicorn app.main:app --reload` (in backend directory)
2. Set `VITE_API_BASE_URL=http://localhost:8000/api` in `.env.local`
3. Start the frontend: `npm run dev`

## 📄 License

This project is for educational and personal use only. Stock predictions are for informational purposes only and should not be considered financial advice.

## ⚠️ Disclaimer

Stock predictions are for informational purposes only. Past performance does not guarantee future results. Please consult with financial advisors before making investment decisions.

