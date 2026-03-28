# AgroSmart Web App

A comprehensive agricultural technology platform combining a modern React frontend with a Django backend API.

## Project Structure

```
agrosmart-web-app/
├── hackathon-project/          # Frontend - React + Vite
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/                    # Backend - Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   └── api/
└── .gitignore
```

---

## Quick Start

### Frontend Setup

```bash
cd hackathon-project
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs at: **http://127.0.0.1:8000/api**

---

## Features

### Frontend

- ✅ Dashboard with weather & crop status
- ✅ Seeding workflow management
- ✅ Crop library with AI-powered guides
- ✅ Support chat (backend + Gemini + local keywords)
- ✅ User authentication with JWT
- ✅ Real-time weather data integration

### Backend

- ✅ JWT authentication
- ✅ Crop image API
- ✅ Support reply system
- ✅ Seeding task management
- ✅ Dashboard summary endpoints

---

## Environment Variables

### Frontend (.env)

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_ENABLE_AUTH_GUARD=false
VITE_GEMINI_API_KEY=your_key_here
VITE_ALLOW_HTTP_IN_PROD=false
```

### Backend (.env)

```
SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
```

---

## Deployment

See individual README files:

- [Frontend README](./hackathon-project/README.md)
- [Backend README](./backend/README.md)

---

## Support

For issues or questions, please refer to the support system within the app or check the documentation in each folder.
