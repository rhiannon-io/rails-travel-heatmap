# 🗺️ Travel Heatmap

A Rails application that lets users create and share interactive heatmaps of countries they've visited. Each country can be marked with visit frequency, personal ratings, and notes, creating a personalized travel visualization.

## ✨ Features

- **User Authentication**: Sign up and log in to manage your personal travel map
- **Interactive Map Visualization**: D3.js-powered world map with color-coded visit frequency and rating scores
- **Visit Tracking**: Record how many times you've visited each country
- **Country Ratings**: Rate countries on a 1-5 scale based on your experience
- **Personal Notes**: Add notes and memories for each country you've visited
- **Home Country Selection**: Mark your home country for personalized heatmap context
- **Shareable Links**: Generate unique URLs to share your travel map with friends (no login required)
- **Dynamic Updates**: Update your map and shared links reflect changes instantly
- **Multi-User Support**: Each user has their own independent travel data and preferences

## 🚀 Quick Start

### Prerequisites

- Ruby 3.3.6 or later
- Rails 8.1.1 or later
- SQLite3 (development) / PostgreSQL (production)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd rails-travel-heatmap
```

2. Install dependencies:
```bash
bundle install
```

3. Set up the database:
```bash
rails db:migrate
rails db:seed
```

4. Start the server:
```bash
rails server
```

5. Visit http://localhost:3000

## 📖 Usage

1. **Sign Up**: Create a new account with email and password
2. **Explore the Map**: View the interactive world map showing all countries
3. **Mark Visited Countries**: Check countries you've visited
4. **Set Visit Counts**: Track how many times you've visited each country
5. **Rate Your Experiences**: Rate countries 1-5 stars based on your experience
6. **Add Personal Notes**: Write notes and memories for each country
7. **Set Home Country**: Mark your home country for personalized context
8. **Save Changes**: The map automatically saves all your selections
9. **Share Your Map**: Click "📤 Share Your Map" to generate a unique shareable link
10. **Update Anytime**: Make changes and click "🔄 Update Shared Link" to refresh the shared map
11. **View Shared Maps**: View shared maps without needing an account

## 🏗️ Architecture

### Models

- **User**: Devise authentication with email/password and profile management
- **Country**: Master list of all countries with ISO codes
- **UserCountry**: Join table linking users to visited countries with:
  - Visit counts (how many times visited)
  - Ratings (1-5 star personal ratings)
  - Personal notes (memories and observations)
  - Home country flag (designate your home)
- **SharedMap**: Stores shareable map data with unique secure tokens

### Scoring System

The heatmap uses a sophisticated scoring algorithm:
- **Visit Frequency Score**: Logarithmic scale (1-5) based on visit count
- **User Rating**: Personal 1-5 star rating for each country
- **Super Score**: Combined metric (70% rating + 30% visit frequency) for map visualization

### Key Technologies

- **Rails 8.1.1**: Backend framework
- **Ruby 3.3+**: Programming language
- **Devise**: User authentication and authorization
- **D3.js**: Interactive map visualization
- **Stimulus**: JavaScript framework for interactivity
- **SQLite**: Development database
- **PostgreSQL**: Production database
- **Countries Gem**: Comprehensive ISO country data

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- Render.com (recommended - free tier)
- Railway.app
- Fly.io
- Heroku

## 🛠️ Development

### Database Schema

```
users
  - id
  - email
  - encrypted_password
  - created_at
  - updated_at
  
countries
  - id
  - name
  - iso_code
  
user_countries
  - id
  - user_id (foreign key)
  - country_id (foreign key)
  - visit_count (integer, min: 1)
  - rating (integer, 1-5, nullable)
  - notes (text, max 1000 chars, nullable)
  - home_country (boolean, default: false)
  - created_at
  - updated_at
  
shared_maps
  - id
  - user_id (foreign key)
  - token (unique, secure)
  - data (JSON)
  - created_at
  - updated_at
```

### Prerequisites for Development

- Ruby 3.3.6 or later
- Rails 8.1.1 or later
- SQLite3
- Node.js 18+ (for asset pipeline)
- Bundler

### Running Tests

```bash
rails test
```

### Running the Server

```bash
bundle exec rails server
```

The application will be available at `http://localhost:3000`

### Database Management

```bash
# Create and migrate database
rails db:create
rails db:migrate

# Seed with country data
rails db:seed

# Reset database (development only)
rails db:reset
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📚 Additional Resources

- See [SETUP.md](SETUP.md) for detailed local testing instructions
- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guides to various platforms
- See [CHECKLIST.md](CHECKLIST.md) for project development status

