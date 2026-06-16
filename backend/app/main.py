import os
import io
import json
import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from app.data_generator import generate_synthetic_data
from app.inference import (
    load_resources,
    predict_single,
    get_shap_explanation,
    preprocess_input,
    get_model,
    MODELS,
    METRICS,
    SCALER
)

# Initialize FastAPI App
app = FastAPI(
    title="AI-Powered Credit Card Fraud Detection API",
    description="Backend API for dataset analysis, EDA, ML models, evaluation, prediction, and SHAP explainability.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve paths relative to the script directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "credit_card_transactions.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")

class TransactionInput(BaseModel):
    Time: float
    Amount: float
    V1: float
    V2: float
    V3: float
    V4: float
    V5: float
    V6: float
    V7: float
    V8: float
    V9: float
    V10: float
    V11: float
    V12: float
    V13: float
    V14: float
    V15: float
    V16: float
    V17: float
    V18: float
    V19: float
    V20: float
    V21: float
    V22: float
    V23: float
    V24: float
    V25: float
    V26: float
    V27: float
    V28: float

# Ensure directories and resources are loaded on startup
@app.on_event("startup")
def startup_event():
    # Load ML models and scaler
    load_resources(MODELS_DIR)

@app.get("/api/health")
def health_check():
    load_resources(MODELS_DIR)
    models_loaded = list(MODELS.keys())
    return {
        "status": "healthy",
        "models_count": len(models_loaded),
        "loaded_models": models_loaded,
        "scaler_loaded": SCALER is not None
    }

@app.get("/api/dataset/stats")
def get_dataset_stats():
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail="Dataset not found. Please wait until training pipeline initializes.")
    
    df = pd.read_csv(DATA_PATH)
    total_records = len(df)
    fraud_count = int(df["Class"].sum())
    genuine_count = total_records - fraud_count
    
    # Missing values
    missing_vals = int(df.isnull().sum().sum())
    
    # Column types
    dtypes = {col: str(df[col].dtype) for col in df.columns}
    
    # Basic statistics
    stats = df.describe().to_dict()
    
    return {
        "total_records": total_records,
        "fraud_count": fraud_count,
        "genuine_count": genuine_count,
        "fraud_percentage": round((fraud_count / total_records) * 100, 4),
        "missing_values": missing_vals,
        "column_types": dtypes,
        "stats": {
            "Amount": {
                "mean": round(stats["Amount"]["mean"], 2),
                "min": round(stats["Amount"]["min"], 2),
                "max": round(stats["Amount"]["max"], 2),
                "std": round(stats["Amount"]["std"], 2)
            },
            "Time": {
                "mean": round(stats["Time"]["mean"], 2),
                "min": round(stats["Time"]["min"], 2),
                "max": round(stats["Time"]["max"], 2),
                "std": round(stats["Time"]["std"], 2)
            }
        }
    }

@app.get("/api/dataset/sample")
def get_dataset_sample(limit: int = 100):
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail="Dataset not found.")
    
    df = pd.read_csv(DATA_PATH)
    sample = df.head(limit).to_dict(orient="records")
    return sample

@app.get("/api/eda/charts")
def get_eda_charts():
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail="Dataset not found.")
    
    df = pd.read_csv(DATA_PATH)
    
    # 1. Fraud vs Genuine Counts
    class_counts = df["Class"].value_counts().to_dict()
    class_dist = [
        {"name": "Genuine", "value": int(class_counts.get(0, 0))},
        {"name": "Fraudulent", "value": int(class_counts.get(1, 0))}
    ]
    
    # 2. Amount Distribution (Bins)
    # Filter high values to make the distribution look good
    amount_genuine = df[df["Class"] == 0]["Amount"]
    amount_fraud = df[df["Class"] == 1]["Amount"]
    
    # Create histograms bin counts
    bins = [0, 10, 50, 100, 250, 500, 1000, 5000]
    bin_labels = ["$0-10", "$10-50", "$50-100", "$100-250", "$250-500", "$500-1000", "$1000+"]
    
    genuine_binned = pd.cut(amount_genuine, bins=bins, labels=bin_labels).value_counts().reindex(bin_labels).fillna(0).to_dict()
    fraud_binned = pd.cut(amount_fraud, bins=bins, labels=bin_labels).value_counts().reindex(bin_labels).fillna(0).to_dict()
    
    amount_dist = []
    for label in bin_labels:
        amount_dist.append({
            "bin": label,
            "genuine": int(genuine_binned[label]),
            "fraud": int(fraud_binned[label])
        })
        
    # 3. Correlation Heatmap (Top 10 features + Class)
    correlation_features = ["Class", "Amount", "Time", "V1", "V2", "V3", "V4", "V10", "V12", "V14", "V17"]
    corr_matrix = df[correlation_features].corr().fillna(0)
    
    # Format correlation matrix for UI heatmaps
    corr_data = []
    for x in correlation_features:
        for y in correlation_features:
            corr_data.append({
                "x": x,
                "y": y,
                "value": round(float(corr_matrix.loc[x, y]), 4)
            })
            
    # 4. PCA Component Scatter Plot (V1 vs V2, sample 500 points for performance)
    df_sample = df.sample(min(800, len(df)), random_state=42)
    # Ensure some frauds are in sample
    frauds = df[df["Class"] == 1]
    if len(frauds) > 0:
        df_sample = pd.concat([df_sample, frauds]).drop_duplicates().sample(min(800, len(df)), random_state=42)
        
    pca_scatter = []
    for _, row in df_sample.iterrows():
        pca_scatter.append({
            "id": str(row["TransactionID"]),
            "x": float(row["V1"]),
            "y": float(row["V2"]),
            "amount": float(row["Amount"]),
            "class": int(row["Class"]),
            "merchant": str(row["Merchant"])
        })
        
    # 5. Boxplots for Amount and Time
    # Let's provide standard quartiles for genuine vs fraud amounts
    amount_stats = {}
    for c_label, c_val in [("genuine", 0), ("fraud", 1)]:
        c_amounts = df[df["Class"] == c_val]["Amount"]
        amount_stats[c_label] = {
            "min": float(c_amounts.min()),
            "q1": float(c_amounts.quantile(0.25)),
            "median": float(c_amounts.median()),
            "q3": float(c_amounts.quantile(0.75)),
            "max": float(c_amounts.max())
        }
        
    return {
        "class_distribution": class_dist,
        "amount_distribution": amount_dist,
        "correlation_heatmap": corr_data,
        "pca_scatter": pca_scatter,
        "boxplots": amount_stats
    }

@app.get("/api/pipeline-steps")
def get_pipeline_steps():
    # Simple details to render the pipeline diagram dynamically on frontend
    return [
        {
            "step": 1,
            "name": "Data Ingestion & Cleaning",
            "description": "Loads raw credit card transactions, handles missing features, and scales raw Amount and Time to match distribution requirements.",
            "status": "completed"
        },
        {
            "step": 2,
            "name": "Feature Engineering & Selection",
            "description": "Excludes meta columns (Merchant, Category, Cardholder) and preserves Time, Amount, and the V1-V28 PCA features.",
            "status": "completed"
        },
        {
            "step": 3,
            "name": "Train-Test Splitting",
            "description": "Splits the input dataset into 80% for training and 20% for validation using Stratified Sampling to preserve class proportions.",
            "status": "completed"
        },
        {
            "step": 4,
            "name": "SMOTE Class Balancing",
            "description": "Applies Synthetic Minority Over-sampling Technique (SMOTE) strictly on the training set to resolve the 1.6% fraud class imbalance, increasing minority samples to create a 50-50 class distribution.",
            "status": "completed"
        },
        {
            "step": 5,
            "name": "Multi-Model Fitting & Scaling",
            "description": "Fits 6 machine learning models concurrently on the balanced training data and generates evaluation coordinates.",
            "status": "completed"
        }
    ]

@app.get("/api/models/compare")
def get_models_comparison():
    load_resources(MODELS_DIR)
    if METRICS is None:
        raise HTTPException(status_code=404, detail="ML Models are still training. Please refresh in a moment.")
    
    # Return brief comparative table format
    comparison = []
    for model_name, metrics in METRICS.items():
        comparison.append({
            "model_name": model_name,
            "accuracy": metrics["accuracy"],
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "f1_score": metrics["f1_score"],
            "roc_auc": metrics["roc_auc"],
            "training_time": metrics["training_time"]
        })
    return comparison

@app.get("/api/models/evaluation/{model_name}")
def get_model_evaluation(model_name: str):
    load_resources(MODELS_DIR)
    if METRICS is None or model_name not in METRICS:
        raise HTTPException(status_code=404, detail=f"Metrics for model '{model_name}' not found.")
    
    return METRICS[model_name]

@app.post("/api/predict")
def post_predict_single(payload: TransactionInput, model: str = Query("XGBoost")):
    try:
        data_dict = payload.dict()
        pred_res = predict_single(data_dict, model)
        # Compute SHAP values
        shap_res = get_shap_explanation(data_dict, model)
        
        return {
            "prediction": pred_res["prediction"],
            "probability": pred_res["probability"],
            "confidence": pred_res["confidence"],
            "risk_score": pred_res["risk_score"],
            "risk_level": pred_res["risk_level"],
            "shap": shap_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/predict/batch")
async def post_predict_batch(file: UploadFile = File(...), model: str = Form("XGBoost")):
    load_resources(MODELS_DIR)
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Uploaded file must be a CSV.")
        
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Check required columns
        required_cols = ["Time", "Amount"] + [f"V{i}" for i in range(1, 29)]
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Uploaded CSV is missing columns: {', '.join(missing)}")
            
        clf = get_model(model)
        
        # Keep extra details if present in CSV, otherwise generate placeholders
        if "TransactionID" not in df.columns:
            df["TransactionID"] = [f"TXN_U{10000 + i}" for i in range(len(df))]
        if "Merchant" not in df.columns:
            df["Merchant"] = np.random.choice(["Online Store", "Retail Shop", "Restaurant", "Gas Station"], size=len(df))
        if "Category" not in df.columns:
            df["Category"] = np.random.choice(["Shopping", "Dining", "Transport", "Travel"], size=len(df))
        if "Cardholder" not in df.columns:
            df["Cardholder"] = "External User"
            
        # Scale time and amount
        df_scaled = df.copy()
        if SCALER:
            df_scaled[["Time", "Amount"]] = SCALER.transform(df[["Time", "Amount"]])
            
        # Run predictions
        X_eval = df_scaled[required_cols]
        preds = clf.predict(X_eval)
        probs = clf.predict_proba(X_eval)[:, 1]
        
        df["PredictedClass"] = preds
        df["FraudProbability"] = probs
        df["RiskScore"] = np.round(probs * 100, 2)
        df["RiskLevel"] = np.where(df["RiskScore"] >= 70, "High", np.where(df["RiskScore"] >= 30, "Medium", "Low"))
        
        # Save temp copy of batch predictions for export
        # We can dump to a temp JSON or cache in a simple in-memory structure
        global LATEST_BATCH_DF
        LATEST_BATCH_DF = df.copy()
        
        # Analytics
        total_records = len(df)
        fraud_count = int(preds.sum())
        genuine_count = total_records - fraud_count
        fraud_percentage = round((fraud_count / total_records) * 100, 2) if total_records > 0 else 0
        
        high_risk_txns = df[df["RiskLevel"] == "High"].to_dict(orient="records")
        all_txns = df.to_dict(orient="records")
        
        return {
            "total_records": total_records,
            "fraud_count": fraud_count,
            "genuine_count": genuine_count,
            "fraud_percentage": fraud_percentage,
            "high_risk_count": len(high_risk_txns),
            "predictions": all_txns[:200]  # Limit table rows to 200 for smooth UI rendering
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

# Global storage for batch prediction cache
LATEST_BATCH_DF = None

@app.get("/api/predict/batch/export")
def get_export_batch(format: str = Query("csv")):
    global LATEST_BATCH_DF
    if LATEST_BATCH_DF is None or len(LATEST_BATCH_DF) == 0:
        raise HTTPException(status_code=400, detail="No batch predictions available to export. Please run batch prediction first.")
        
    if format == "csv":
        stream = io.StringIO()
        LATEST_BATCH_DF.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=batch_fraud_predictions.csv"
        return response
        
    elif format == "pdf":
        # Generate ReportLab PDF
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
        )
        
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#4F46E5'),
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#6B7280'),
            spaceAfter=25
        )
        heading_style = ParagraphStyle(
            'HeadingStyle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=10,
            spaceBefore=15
        )
        normal_style = styles['Normal']
        
        story = []
        
        # Header
        story.append(Paragraph("Credit Card Fraud Analytics Report", title_style))
        story.append(Paragraph("Generated by Antigravity AI-Powered Fraud Engine", subtitle_style))
        story.append(Spacer(1, 10))
        
        # Summary metrics
        total = len(LATEST_BATCH_DF)
        frauds = int(LATEST_BATCH_DF["PredictedClass"].sum())
        percentage = round((frauds / total) * 100, 2)
        high_risk = len(LATEST_BATCH_DF[LATEST_BATCH_DF["RiskLevel"] == "High"])
        
        summary_data = [
            [Paragraph("<b>Metric</b>", normal_style), Paragraph("<b>Value</b>", normal_style)],
            ["Total Transactions Scanned", str(total)],
            ["Fraud Flagged Transactions", f"{frauds} (Class = 1)"],
            ["Fraud Ratio", f"{percentage}%"],
            ["High Risk Warnings (Prob >= 70%)", str(high_risk)]
        ]
        
        t_summary = Table(summary_data, colWidths=[200, 250])
        t_summary.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (1,0), colors.HexColor('#F3F4F6')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        
        story.append(Paragraph("1. Executive Summary", heading_style))
        story.append(t_summary)
        story.append(Spacer(1, 15))
        
        # Flagged High Risk table
        story.append(Paragraph("2. Flagged High-Risk Transactions (Top 15)", heading_style))
        
        high_risk_df = LATEST_BATCH_DF[LATEST_BATCH_DF["RiskLevel"] == "High"].sort_values("FraudProbability", ascending=False).head(15)
        
        if len(high_risk_df) == 0:
            story.append(Paragraph("No high-risk transactions were flagged in this batch.", normal_style))
        else:
            table_data = [[
                Paragraph("<b>TXN ID</b>", normal_style),
                Paragraph("<b>Cardholder</b>", normal_style),
                Paragraph("<b>Merchant</b>", normal_style),
                Paragraph("<b>Amount ($)</b>", normal_style),
                Paragraph("<b>Probability</b>", normal_style)
            ]]
            
            for _, row in high_risk_df.iterrows():
                table_data.append([
                    str(row["TransactionID"]),
                    str(row["Cardholder"]),
                    str(row["Merchant"]),
                    f"${row['Amount']:.2f}",
                    f"{row['FraudProbability']*100:.1f}%"
                ])
                
            t_flagged = Table(table_data, colWidths=[80, 100, 120, 80, 80])
            t_flagged.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FEE2E2')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#991B1B')),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FCA5A5')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#FFF5F5')]),
                ('PADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(t_flagged)
            
        doc.build(story)
        pdf_buffer.seek(0)
        
        response = StreamingResponse(pdf_buffer, media_type="application/pdf")
        response.headers["Content-Disposition"] = "attachment; filename=fraud_analytics_report.pdf"
        return response
    else:
        raise HTTPException(status_code=400, detail="Invalid export format. Supported: csv, pdf")
