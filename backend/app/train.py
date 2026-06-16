import os
import time
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, roc_curve, precision_recall_curve
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, HistGradientBoostingClassifier
from sklearn.svm import SVC
from imblearn.over_sampling import SMOTE

# Fallback imports
try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except Exception as e:
    print(f"Failed to import xgboost: {e}. Using scikit-learn GradientBoosting fallback.")
    HAS_XGB = False

try:
    from lightgbm import LGBMClassifier
    HAS_LGBM = True
except Exception as e:
    print(f"Failed to import lightgbm: {e}. Using scikit-learn HistGradientBoosting fallback.")
    HAS_LGBM = False

def train_all_models(data_path="backend/app/data/credit_card_transactions.csv", models_dir="backend/app/models"):
    print("Starting ML Model Training Pipeline...")
    os.makedirs(models_dir, exist_ok=True)
    
    # 1. Load Data
    df = pd.read_csv(data_path)
    
    # Drop non-numeric columns for model training
    features = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"]
    X = df[features]
    y = df["Class"]
    
    # 2. Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # 3. Fit Scaler (Fit on train, transform both)
    scaler = StandardScaler()
    # Let's scale Time and Amount
    X_train_scaled = X_train.copy()
    X_test_scaled = X_test.copy()
    X_train_scaled[["Time", "Amount"]] = scaler.fit_transform(X_train[["Time", "Amount"]])
    X_test_scaled[["Time", "Amount"]] = scaler.transform(X_test[["Time", "Amount"]])
    
    # Save the scaler
    joblib.dump(scaler, os.path.join(models_dir, "scaler.joblib"))
    
    # Save a small subset of test/train data for explainability reference
    joblib.dump(X_train_scaled.head(100), os.path.join(models_dir, "background_data.joblib"))
    joblib.dump(X_test_scaled, os.path.join(models_dir, "X_test.joblib"))
    joblib.dump(y_test, os.path.join(models_dir, "y_test.joblib"))
    
    # 4. Apply SMOTE to handle imbalance on training set
    print(f"Original training shape: {X_train_scaled.shape}, Class 1 count: {sum(y_train == 1)}")
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train_scaled, y_train)
    print(f"Resampled training shape: {X_train_res.shape}, Class 1 count: {sum(y_train_res == 1)}")
    
    # 5. Define Models with Fallbacks
    xgb_model = XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1, eval_metric="logloss") if HAS_XGB else GradientBoostingClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
    
    lgbm_model = LGBMClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1) if HAS_LGBM else HistGradientBoostingClassifier(max_iter=100, max_depth=6, learning_rate=0.1, random_state=42)
    
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
        "XGBoost": xgb_model,
        "LightGBM": lgbm_model,
        "SVM": SVC(probability=True, kernel="rbf", random_state=42)
    }
    
    metrics_summary = {}
    
    for name, model in models.items():
        print(f"Training {name}...")
        start_time = time.time()
        model.fit(X_train_res, y_train_res)
        train_time = round(time.time() - start_time, 4)
        
        # Save model
        model_filename = name.lower().replace(" ", "_") + ".joblib"
        joblib.dump(model, os.path.join(models_dir, model_filename))
        
        # Predict
        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]
        
        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        try:
            auc = roc_auc_score(y_test, y_prob)
        except Exception:
            auc = 0.5
            
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()
        
        # Curve coordinates (downsampled for performance/UI rendering)
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        precision_vals, recall_vals, _ = precision_recall_curve(y_test, y_prob)
        
        # Downsample curves to 50 points max for smooth Chart UI
        roc_step = max(1, len(fpr) // 50)
        pr_step = max(1, len(precision_vals) // 50)
        
        roc_data = [{"fpr": float(fpr[i]), "tpr": float(tpr[i])} for i in range(0, len(fpr), roc_step)]
        # Make sure the last point is included
        if len(fpr) > 0:
            roc_data.append({"fpr": float(fpr[-1]), "tpr": float(tpr[-1])})
            
        pr_data = [{"precision": float(precision_vals[i]), "recall": float(recall_vals[i])} for i in range(0, len(precision_vals), pr_step)]
        if len(precision_vals) > 0:
            pr_data.append({"precision": float(precision_vals[-1]), "recall": float(recall_vals[-1])})
            
        # Feature Importance (if available)
        importance_list = []
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            importance_list = [{"feature": f, "importance": float(i)} for f, i in zip(features, importances)]
            importance_list = sorted(importance_list, key=lambda x: x["importance"], reverse=True)
        elif hasattr(model, "coef_"):
            importances = np.abs(model.coef_[0])
            # normalize coefficients
            importances = importances / np.sum(importances)
            importance_list = [{"feature": f, "importance": float(i)} for f, i in zip(features, importances)]
            importance_list = sorted(importance_list, key=lambda x: x["importance"], reverse=True)
        else:
            # For SVM, use default importance placeholder (we can also calculate it on data subset)
            importance_list = [{"feature": f, "importance": 1.0 / len(features)} for f in features]
            
        metrics_summary[name] = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(auc), 4),
            "training_time": train_time,
            "confusion_matrix": {
                "tn": int(tn),
                "fp": int(fp),
                "fn": int(fn),
                "tp": int(tp)
            },
            "roc_curve": roc_data,
            "pr_curve": pr_data,
            "feature_importance": importance_list[:15] # Top 15 features
        }
        print(f"{name} trained: F1={f1:.4f}, AUC={auc:.4f}, time={train_time}s")
        
    # Write metrics to json
    with open(os.path.join(models_dir, "metrics.json"), "w") as f:
        json.dump(metrics_summary, f, indent=4)
        
    print("Training pipeline completed successfully. All models and metrics saved.")

if __name__ == "__main__":
    # If raw data does not exist, run generator
    raw_data = "backend/app/data/credit_card_transactions.csv"
    if not os.path.exists(raw_data):
        from data_generator import generate_synthetic_data
        generate_synthetic_data(raw_data)
    train_all_models(raw_data)
