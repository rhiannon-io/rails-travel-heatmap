# 🗺️ Travel Heatmap

A Rails application that lets users create and share interactive heatmaps of countries they've visited. Each country can be marked with the number of visits, creating a personalized travel visualization.

## ✨ Features

- **User Authentication**: Sign up and log in to manage your personal travel map
- **Interactive Map Visualization**: D3.js-powered world map with color-coded visit frequency
- **Visit Count Tracking**: Record how many times you've visited each country
- **Shareable Links**: Generate unique URLs to share your travel map with friends
- **Dynamic Updates**: Update your map and shared links reflect changes instantly
- **Multi-User Support**: Each user has their own independent travel data

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

1. **Sign Up**: Create a new account
2. **Mark Countries**: Check countries you've visited and set visit counts
3. **Save Changes**: The share button automatically saves your selections
4. **Share Your Map**: Click "📤 Share Your Map" to generate a unique shareable link
5. **Update Anytime**: Make changes and click "🔄 Update Shared Link" to refresh

## 🏗️ Architecture

### Models

- **User**: Devise authentication with email/password
- **Country**: Master list of all countries with ISO codes
- **UserCountry**: Join table linking users to visited countries with visit counts
- **SharedMap**: Stores shareable map data with unique tokens

### Key Technologies

- **Rails 8.1.1**: Backend framework
- **Devise**: User authentication
- **D3.js**: Interactive map visualization
- **Stimulus**: JavaScript framework for interactivity
- **SQLite**: Development database
- **PostgreSQL**: Production database

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
  
countries
  - id
  - name
  - iso_code
  
user_countries
  - id
  - user_id (foreign key)
  - country_id (foreign key)
  - visit_count
  
shared_maps
  - id
  - user_id (foreign key)
  - token (unique)
  - data (JSON)
```

### Running Tests

```bash
rails test
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

