# Ito Development Tracker

**Municipal Permit Tracking for Small Towns** | $300/month

A complete permit tracking system designed for Montana municipalities with populations under 5,000. Built to integrate with HometownMap parcel data.

![Ito Geospatial](https://img.shields.io/badge/Ito_Geospatial-Permit_Tracking-22c55e)
![License](https://img.shields.io/badge/license-proprietary-blue)

## Features

### Public Portal
- 🔍 Search permits by address, permit number, or applicant
- 🗺️ Interactive map showing all active development
- 📊 Real-time permit status tracking
- 📱 Mobile-friendly design

### Staff Dashboard  
- ✅ One-click permit creation and management
- 📋 Action queue for pending reviews
- 🗺️ Map view with parcel integration
- 📈 Council-ready reports and statistics
- 🔔 Activity tracking and notifications

### GIS Integration
- Connects to existing HometownMap parcel data
- Zoning district visualization
- Flood zone mapping
- Parcel-level permit history

## Quick Start

### Option 1: Static Demo (No Server Required)

Just open `index.html` in your browser. The demo includes sample data for Three Forks, MT.

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

### Option 2: Full Backend with Database

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python server.py

# Open http://localhost:5000
```

## Configuration

Edit `server.py` to customize for your city:

```python
CITY_CONFIG = {
    'city_name': 'Three Forks',
    'city_state': 'MT',
    'map_center': [-111.5513, 45.8930],
    'map_zoom': 14,
    'mapbox_token': 'your-mapbox-token',
    'county': 'Gallatin',
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/config` | GET | City configuration |
| `/api/permits` | GET | List all permits |
| `/api/permits/:id` | GET | Single permit details |
| `/api/permits` | POST | Create new permit |
| `/api/permits/:id` | PUT | Update permit status |
| `/api/parcels` | GET | GeoJSON parcel data |
| `/api/parcels/:id` | GET | Parcel with permit history |
| `/api/map/permits` | GET | Permits as GeoJSON for map |
| `/api/stats` | GET | Dashboard statistics |
| `/api/permit-types` | GET | Available permit types |

## Permit Types (Default)

| Code | Type | Fee | Review Days |
|------|------|-----|-------------|
| ZP | Zoning Permit | $50 | 14 |
| FP | Flood Permit | $75 | 21 |
| SP | Sign Permit | $35 | 7 |
| SUB | Subdivision | $500 | 30 |
| SPR | Site Plan Review | $150 | 21 |
| VAR | Variance | $200 | 30 |
| CUP | Conditional Use | $150 | 30 |
| ENC | Encroachment | $25 | 7 |
| DEM | Demolition | $50 | 14 |

## Database Schema

The system uses SQLite by default (PostgreSQL for production). Key tables:

- `users` - Staff and applicant accounts
- `permits` - All permit applications
- `permit_types` - Configurable permit categories
- `parcels` - Property data (from HometownMap)
- `activity_log` - Audit trail

## Deployment

### Development
```bash
python server.py
```

### Production (with Gunicorn)
```bash
gunicorn -w 4 -b 0.0.0.0:8000 server:app
```

### Docker (Coming Soon)
```bash
docker-compose up -d
```

## Integration with HometownMap

This system is designed to share a database with HometownMap. The `parcels` table connects permit applications to parcel geometry, enabling:

- Click parcel → See permit history
- Create permit → Auto-populate parcel data
- Map view → Show permits on parcel boundaries

## Pricing

| Tier | Price | Includes |
|------|-------|----------|
| **Starter** | $300/mo | Up to 200 permits/year, 1 staff user |
| **Standard** | $500/mo | Unlimited permits, 3 staff users, reports |
| **Premium** | $750/mo | All features + custom integrations |

*Annual prepay: 2 months free*

## Support

- **Email**: support@itogeospatial.com
- **Phone**: (406) 555-0123
- **Documentation**: docs.itogeospatial.com

## License

Proprietary software. © 2026 Ito Geospatial LLC. All rights reserved.

---

**Built for Montana. Built for small towns.**
