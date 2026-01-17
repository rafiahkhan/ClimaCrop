# ClimaCrop

<div align="center">

**AI-Powered Smart Farming Platform for Crop Recommendations**

[![Python](https://img.shields.io/badge/Python-3.13+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.124.0-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

ClimaCrop is an intelligent crop recommendation system that leverages multiple AI models (Decision Tree, XGBoost, Random Forest) to help farmers make data-driven decisions. The platform provides revenue predictions, fertilizer recommendations, pest control insights, and comprehensive agricultural analytics.

### Key Highlights

- 🤖 **Multi-Model AI Predictions**: Decision Tree, XGBoost, and Random Forest algorithms
- 📊 **Interactive Data Visualizations**: Comprehensive charts and analytics
- 🌍 **Bilingual Support**: Full English and Urdu (RTL) interface
- 🌓 **Dark Mode**: Modern theme support
- 📱 **Responsive Design**: Mobile-first approach for all devices
- 🔒 **Secure & Scalable**: Production-ready architecture

---

## Features

### Core Functionality

1. **AI-Powered Revenue Prediction**
   - Multi-model predictions (Decision Tree, XGBoost, Random Forest)
   - Temperature-based scenarios (Best/Average/Worst)
   - Detailed revenue breakdown with interactive charts
   - Climate risk assessment

2. **Fertilizer & Pest Control Recommendations**
   - NPK (Nitrogen-Phosphorus-Potassium) composition recommendations
   - Fertilizer type distribution analysis
   - Pest control recommendations
   - Disease predictions

3. **Crop Comparison Tool**
   - Side-by-side crop comparison
   - Revenue, yield, and climate factor analysis
   - Model breakdown visualization
   - Best pick recommendations

4. **Advanced Analytics & Insights**
   - Overview metrics and performance analysis
   - Smart recommendations based on data
   - Revenue distribution and trend analysis
   - Climate trend visualization

5. **Additional Features**
   - Favorites system for saving predictions
   - PDF export functionality
   - Social sharing capabilities
   - User authentication
   - Toast notifications

---

## Technology Stack

### Backend
- **Framework**: FastAPI 0.124.0
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Server**: Uvicorn (ASGI server)
- **Language**: Python 3.13+

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 4.1.0
- **UI Library**: React Bootstrap 2.10.10
- **Routing**: React Router DOM 6.8.0
- **Charts**: Recharts 2.15.4
- **Styling**: Bootstrap 5.3.8 + Custom CSS

### Database
- **RDBMS**: PostgreSQL
- **ORM**: SQLAlchemy 2.0+
- **Driver**: psycopg2-binary

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** 3.13 or higher
- **Node.js** 16+ and npm
- **PostgreSQL** (latest version)
- **Git** (for cloning the repository)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/rafiahkhan/ClimaCrop.git
cd ClimaCrop
```

### 2. Database Setup

#### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
```

**Windows:** Download from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)

#### Create Database

```bash
sudo -u postgres psql
CREATE DATABASE clima;
\q
```

#### Set Database Password (if needed)

```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'your_password';
\q
```

#### Run Schema Script

```bash
psql -U postgres -d clima -f "sql/schema_staging_table.sql"
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clima
DB_USER=postgres
DB_PASSWORD=your_password_here

BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
FRONTEND_PORT=5173
```

### 4. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be available at `http://127.0.0.1:8000`

**API Documentation:**
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 5. Frontend Setup

Open a new terminal:

```bash
cd frotend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port specified in vite.config.js)

### 6. Quick Start Script (Alternative)

For convenience, use the provided startup script:

```bash
chmod +x START_BOTH.sh
./START_BOTH.sh
```

This will start both backend and frontend servers automatically.

To stop the servers:

```bash
./STOP.sh
```

---

## Project Structure

```
ClimaCrop_gt/
├── backend/
│   ├── main.py                      # FastAPI application
│   ├── requirements.txt             # Python dependencies
│   └── venv/                        # Virtual environment (gitignored)
├── frotend/                         # Frontend application
│   ├── app.jsx                      # Main app component
│   ├── main.jsx                     # React entry point
│   ├── components/                  # Reusable components
│   ├── contexts/                    # React contexts
│   ├── utils/                       # Utility functions
│   └── *.jsx                        # Page components
├── sql/                             # SQL scripts
│   ├── schema_staging_table.sql     # Database schema
│   ├── analytical_queries.sql       # Analytical queries
│   └── quick_queries.sql            # Quick reference queries
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── START_BOTH.sh                    # Startup script
├── STOP.sh                          # Stop script
├── load_data_to_dw.py              # Data loading script
└── README.md                        # This file
```

---

## API Endpoints

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and available endpoints |
| `/crops` | GET | Get list of available crops |
| `/revenue-prediction` | GET | Get revenue predictions (requires `crop` and `temp` params) |
| `/fertilizer-pest-control` | GET | Get fertilizer and pest control recommendations (requires `crop` and `temp` params) |
| `/crop-statistics` | GET | Get crop statistics (requires `crop` param) |
| `/upload-data` | POST | Upload CSV data to staging table |
| `/diagnose` | GET | Database diagnostic information |

### Example API Calls

```bash
# Get available crops
curl http://127.0.0.1:8000/crops

# Get revenue predictions
curl "http://127.0.0.1:8000/revenue-prediction?crop=Rice&temp=Best"

# Get fertilizer recommendations
curl "http://127.0.0.1:8000/fertilizer-pest-control?crop=Cotton&temp=Average"
```

For detailed API documentation, visit `http://127.0.0.1:8000/docs` when the backend is running.

---

## Usage Guide

### Basic Workflow

1. **Login**: Access the application through the login page
2. **Select Language**: Choose between English and Urdu
3. **Navigate Features**:
   - **Revenue Prediction**: Select crop and temperature to view predictions
   - **Fertilizer Guide**: Get NPK recommendations and pest control advice
   - **Crop Comparison**: Compare two crops side-by-side
   - **Insights**: View comprehensive analytics and recommendations
   - **Trends**: Analyze historical trends and patterns
4. **Save Favorites**: Save important predictions for quick access
5. **Export**: Download predictions as PDF or share on social media

### Features Overview

- **Multi-Language Support**: Toggle between English and Urdu with full RTL support
- **Dark Mode**: Switch between light and dark themes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Interactive Charts**: Visualize data with bar, line, pie, and area charts
- **Export & Share**: Export predictions as PDF or share via social media

---

## Configuration

### Environment Variables

The application uses environment variables for configuration. Key variables:

- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: clima)
- `DB_USER`: Database user (default: postgres)
- `DB_PASSWORD`: Database password (required)
- `BACKEND_HOST`: Backend host (default: 127.0.0.1)
- `BACKEND_PORT`: Backend port (default: 8000)
- `FRONTEND_PORT`: Frontend port (default: 5173)

### Database Configuration

Edit `.env` file or set environment variables before running the application.

---

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The `--reload` flag enables auto-reload on code changes.

### Frontend Development

```bash
cd frotend
npm run dev
```

### Building for Production

**Backend:**
- No build step required for Python
- Use a production ASGI server like Gunicorn with Uvicorn workers

**Frontend:**
```bash
cd frotend
npm run build
```

Production files will be in `dist/` directory.

---

## Security Notes

1. **Database Credentials**: Never commit `.env` file. Use environment variables in production.
2. **CORS**: Update CORS settings in `backend/main.py` to restrict origins in production.
3. **Input Validation**: All inputs are validated through FastAPI's type system.
4. **SQL Injection**: Protected through SQLAlchemy's parameterized queries.

---

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database exists: `psql -U postgres -l`
- Verify credentials in `.env` file
- Check firewall settings

### Backend Issues

- Check backend logs: `tail -f backend.log`
- Verify virtual environment is activated
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check port availability: `lsof -i :8000`

### Frontend Issues

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (requires 16+)
- Verify backend is running on correct port
- Check browser console for errors

### No Data Returned

- Verify data exists in `staging_crop_data` table
- Check crop names match exactly (case-sensitive)
- Verify temperature categories are "Best", "Average", or "Worst"

---

## Contributors
- [Rafia Khan](https://github.com/rafiahkhan)
- [Hashir Saeed](https://github.com/hashir-saeed-002)
- [Mahnoor Haider](https://github.com)

### Code Style

- **Python**: Follow PEP 8 style guide
- **JavaScript**: Follow ESLint configuration
- **Commit Messages**: Use descriptive commit messages

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Acknowledgments

- FastAPI team for the excellent framework
- React team for the powerful UI library
- Recharts for beautiful data visualizations
- PostgreSQL community for the robust database

---

## Support

For questions, issues, or contributions:

- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---

## Roadmap

Future enhancements planned:

- [ ] Advanced analytics with confidence intervals
- [ ] User profiles and farm management
- [ ] Email/SMS notifications
- [ ] Mobile app (iOS/Android)
- [ ] Weather API integration
- [ ] Market price API integration
- [ ] Advanced search and filtering
- [ ] Excel/CSV export options

---

<div align="center">

**Growing food with intelligence🌱, not guesswork🌾✨**

[Report Bug](https://github.com/rafiahkhan/ClimaCrop/issues) · [Request Feature](https://github.com/rafiahkhan/ClimaCrop/issues)

</div>
