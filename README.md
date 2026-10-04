# India Local Finder

India-wide local search app using SerpAPI Google Local results.

## Categories

Colleges, ITI, Polytechnics, Skill Training Centers, Academies, Centers of Excellence, Skill India Centers, PMKVY Centers, DDU-GKY Centers, Mobile Repair Shops, SIM Shops, CSC Centers, E-Mitra Centers, Jan Shikshan Sansthan, NGOs, Coaching Centers, Pilot Training, Air Hostess Training, and Skill Academies.

## Features
- Search by city, sector, locality or pincode
- Live local listings from Google through SerpAPI
- Load more pagination
- Rating/review filters
- Google Maps and website links
- Download currently loaded records as Excel
- No database

## Setup
1. Create `backend/.env` from `backend/.env.example`.
2. Add your SerpAPI key to `SERPAPI_KEY`.
3. Run backend: `cd backend && npm install && npm run dev`
4. Run frontend: `cd frontend && npm install && npm run dev`
