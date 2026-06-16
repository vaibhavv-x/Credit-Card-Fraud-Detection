import os
import sys
import json
import argparse
import pandas as pd
import numpy as np
import io

# Setup path so it can import from app
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from app.inference import (
    load_resources,
    predict_single,
    get_shap_explanation,
    get_model,
    SCALER
)

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

def run_predict(args):
    # Load model resources
    load_resources(MODELS_DIR)
    
    try:
        data = json.loads(args.data)
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON data: {str(e)}"}))
        return
        
    try:
        pred_res = predict_single(data, args.model)
        shap_res = get_shap_explanation(data, args.model)
        
        output = {
            "prediction": pred_res["prediction"],
            "probability": pred_res["probability"],
            "confidence": pred_res["confidence"],
            "risk_score": pred_res["risk_score"],
            "risk_level": pred_res["risk_level"],
            "shap": shap_res
        }
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": f"Prediction error: {str(e)}"}))

def run_predict_batch(args):
    load_resources(MODELS_DIR)
    
    if not os.path.exists(args.csv):
        print(json.dumps({"error": f"CSV file not found at {args.csv}"}))
        return
        
    try:
        df = pd.read_csv(args.csv)
        
        # Check required columns
        required_cols = ["Time", "Amount"] + [f"V{i}" for i in range(1, 29)]
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            print(json.dumps({"error": f"CSV missing columns: {', '.join(missing)}"}))
            return
            
        clf = get_model(args.model)
        
        # Add metadata columns if not present
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
        
        df["PredictedClass"] = preds.astype(int)
        df["FraudProbability"] = probs.astype(float)
        df["RiskScore"] = np.round(probs * 100, 2)
        df["RiskLevel"] = np.where(df["RiskScore"] >= 70, "High", np.where(df["RiskScore"] >= 30, "Medium", "Low"))
        
        # Save output csv
        df.to_csv(args.out, index=False)
        
        # Calculate stats
        total_records = len(df)
        fraud_count = int(preds.sum())
        genuine_count = total_records - fraud_count
        fraud_percentage = round((fraud_count / total_records) * 100, 2) if total_records > 0 else 0
        
        high_risk_txns = df[df["RiskLevel"] == "High"].to_dict(orient="records")
        all_txns = df.to_dict(orient="records")
        
        # Serialize numpy float types to native python float
        def clean_record(r):
            return {k: (float(v) if isinstance(v, (np.float32, np.float64)) else int(v) if isinstance(v, (np.int32, np.int64)) else v) for k, v in r.items()}
            
        cleaned_txns = [clean_record(r) for r in all_txns[:200]]
        
        print(json.dumps({
            "total_records": total_records,
            "fraud_count": fraud_count,
            "genuine_count": genuine_count,
            "fraud_percentage": fraud_percentage,
            "high_risk_count": len(high_risk_txns),
            "predictions": cleaned_txns
        }))
        
    except Exception as e:
        print(json.dumps({"error": f"Batch prediction error: {str(e)}"}))

def run_export_pdf(args):
    if not os.path.exists(args.csv):
        print("Error: Prediction CSV file not found")
        sys.exit(1)
        
    try:
        df = pd.read_csv(args.csv)
        
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        
        doc = SimpleDocTemplate(
            args.out,
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
        total = len(df)
        frauds = int(df["PredictedClass"].sum())
        percentage = round((frauds / total) * 100, 2)
        high_risk = len(df[df["RiskLevel"] == "High"])
        
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
        
        high_risk_df = df[df["RiskLevel"] == "High"].sort_values("FraudProbability", ascending=False).head(15)
        
        if len(high_risk_df) == 0:
            story.append(Paragraph("No high-risk transactions were flagged in this batch.", normal_style))
        else:
            table_data = [[
                Paragraph("<b>TXN ID</b>", normal_style),
                Paragraph("<b>Cardholder</b>", normal_style),
                Paragraph("<b>Merchant</b>", normal_style),
                Paragraph("<b>Amount (Rs.)</b>", normal_style),
                Paragraph("<b>Probability</b>", normal_style)
            ]]
            
            for _, row in high_risk_df.iterrows():
                table_data.append([
                    str(row["TransactionID"]),
                    str(row["Cardholder"]),
                    str(row["Merchant"]),
                    f"Rs. {row['Amount']:.2f}",
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
        print("PDF generated successfully")
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Python ML Inference Bridge for Express Node Server")
    subparsers = parser.add_subparsers(dest="command")
    
    # Predict subparser
    pred_parser = subparsers.add_parser("predict")
    pred_parser.add_argument("--model", type=str, default="XGBoost", help="Model name")
    pred_parser.add_argument("--data", type=str, required=True, help="Transaction JSON data")
    
    # Predict batch subparser
    batch_parser = subparsers.add_parser("predict_batch")
    batch_parser.add_argument("--model", type=str, default="XGBoost", help="Model name")
    batch_parser.add_argument("--csv", type=str, required=True, help="Input CSV path")
    batch_parser.add_argument("--out", type=str, required=True, help="Output CSV path")
    
    # Export PDF subparser
    pdf_parser = subparsers.add_parser("export_pdf")
    pdf_parser.add_argument("--csv", type=str, required=True, help="Prediction CSV path")
    pdf_parser.add_argument("--out", type=str, required=True, help="Output PDF path")
    
    args = parser.parse_args()
    
    if args.command == "predict":
        run_predict(args)
    elif args.command == "predict_batch":
        run_predict_batch(args)
    elif args.command == "export_pdf":
        run_export_pdf(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
