# 🛡️ AegisFraud: Indian Credit Card Fraud Analytics Platform

<div align="center">

[![MERN Stack](https://img.shields.io/badge/MERN-Stack-informational?style=for-the-badge&logo=mongodb&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](#)

*An end-to-end, high-performance credit card fraud analytics platform customized for the Indian financial sector.*

&nbsp; [Live (Vercel)](https://aegisfraud.vercel.app/)

</div>

---

## 📌 Project Overview

**AegisFraud** is an advanced MERN-stack credit card fraud detection and analytics platform. Built to serve the Indian digital payments market, the system operates in Indian Rupees (₹), analyzes domestic card transactions (RuPay, Visa, Mastercard), and integrates **6 Machine Learning models** alongside **Explainable AI (SHAP)** to offer transparent fraud assessments.

The platform provides dual prediction capabilities (Real-time Single Prediction and Batch CSV Upload), interactive Exploratory Data Analysis (EDA) dashboards, and pipeline visualization—fully secured with user authentication.

---

## 🚀 Key Features

*   **🔒 Secure User Auth**: Registration and login flow via Express and MongoDB, protecting access to internal dashboards.
*   **🧠 6 Trained ML Models**: Real-time comparisons across **XGBoost, LightGBM, Random Forest, SVM, Decision Tree, and Logistic Regression**.
*   **🔍 Explainable AI (SHAP)**: Local and global feature importance charts displaying why the models flagged a transaction as fraudulent.
*   **📊 EDA & Data Pipeline Dashboards**: Fully interactive visualization of class balances, transaction distributions, amount vs. time scatter plots, and data pre-processing stages (SMOTE, Scaling).
*   **📁 Batch Processing**: Upload test CSV files with transaction features to obtain class analytics, prediction logs, and export reports in **CSV** or **PDF (ReportLab-powered Rs. formatting)** formats.
*   **🇮🇳 Customized for India**: Financial indicators, currencies, transaction ranges, merchant registries, and sample structures customized for Indian consumers.

---

## 🛠️ Tech Stack

### Frontend
*   **React (Vite)**: Component-based SPA architecture
*   **Tailwind CSS**: Sleek dashboard design with dark-mode accents
*   **Framer Motion**: Smooth micro-animations and route transitions
*   **Recharts**: Clean vector charts for EDA and model metrics
*   **Lucide React**: Clean vector icon suite

### Backend
*   **Node.js & Express**: API gateway, session validation, and Python process executor
*   **Mongoose (MongoDB)**: Structured data schema for users and seeded transaction records

### Machine Learning Core
*   **Python 3**: Runs under a virtual environment inside Node
*   **Scikit-Learn, XGBoost, LightGBM**: Model architecture and evaluations
*   **SHAP**: Explainable AI generation
*   **Joblib**: Deserializes trained model binaries on-the-fly

---

## 📂 Project Structure

```text
├── backend/
│   ├── app/                      # Python ML Engine
│   │   ├── data/                 # Sample datasets
│   │   ├── models/               # Pre-trained .joblib model binaries
│   │   ├── bridge.py             # Interfaces Python scripts to Node stdout
│   │   └── inference.py          # Executes SHAP & single/batch predictions
│   ├── models/                   # Mongoose Database Schemas
│   ├── db.js                     # MongoDB connection wrapper
│   ├── server.js                 # Express API Endpoints & Auth middleware
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Shared UI Layouts (Sidebar, protected route)
│   │   ├── pages/                # Dashboards (EDA, Preprocessing, MLModels, XAI)
│   │   ├── config.js             # Dynamic API URL client configuration
│   │   └── main.jsx
│   ├── vercel.json               # SPA routing rewrite rule
│   └── package.json
├── docker-compose.yml            # Standard Docker orchestrator
└── README.md
```

---

## 💻 Local Setup

### Prerequisites
*   [Node.js (v18+)](https://nodejs.org/)
*   [Python (v3.9+)](https://www.python.org/)
*   [MongoDB (Running locally on default port 27017)](https://www.mongodb.com/try/download/community)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python packages
pip install -r requirements.txt

# Install Node dependencies
npm install

# Run database seeder (seeds transactions & admin user admin@aegisfraud.in / admin123)
node server.js --seed

# Start backend server (runs on port 8000)
npm start
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install Node dependencies
npm install

# Start Vite React server (runs on port 5173)
npm run dev
```

---

## 🌐 Production Deployment

### 1. Database (MongoDB Atlas)
1. Set up a free **M0 cluster** on [MongoDB Atlas](https://www.mongodb.com/).
2. Under **Network Access**, add `0.0.0.0/0` to whitelist external connections.
3. Retrieve your connection string: `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/aegisfraud?retryWrites=true&w=majority`

### 2. Backend (Render - Docker Web Service)
1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Configure the following settings:
   * **Root Directory**: `backend`
   * **Runtime**: `Docker` (Render automatically builds using our customized `backend/Dockerfile` which builds both Node & Python dependencies).
4. Under **Environment Variables**, add:
   * `MONGO_URI` = *Your MongoDB Atlas connection string*
   * `PORT` = `8000`

### 3. Frontend (Vercel)
1. Import your GitHub repository in [Vercel](https://vercel.com/).
2. Configure settings:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
3. Under **Environment Variables**, add:
   * `VITE_API_URL` = *Your deployed Render backend URL (e.g. `https://aegisfraud-backend.onrender.com`)*
4. Click **Deploy**. Vercel handles static assets and routes endpoints correctly via `vercel.json`.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
