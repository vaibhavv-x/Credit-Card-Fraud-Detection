import os
import numpy as np
import pandas as pd
from sklearn.datasets import make_classification

def generate_synthetic_data(output_path="credit_card_transactions.csv", n_samples=5000, random_state=42):
    print(f"Generating {n_samples} synthetic credit card transactions...")
    np.random.seed(random_state)
    
    # 1. Generate 28 PCA-like features V1-V28
    X, y = make_classification(
        n_samples=n_samples,
        n_features=28,
        n_informative=20,
        n_redundant=8,
        n_repeated=0,
        n_classes=2,
        n_clusters_per_class=2,
        weights=[0.984, 0.016],  # Imbalanced: ~1.6% fraud
        flip_y=0.01,             # Add some noise
        random_state=random_state
    )
    
    # Create column names V1 to V28
    v_cols = [f"V{i}" for i in range(1, 29)]
    df = pd.DataFrame(X, columns=v_cols)
    df["Class"] = y
    
    # 2. Generate Time (seconds elapsed from first transaction, e.g. over 2 days)
    df["Time"] = np.random.randint(0, 172800, size=n_samples)
    
    # 3. Generate Amount based on class
    # Genuine transactions: mostly smaller, log-normal scaled to INR (average ~₹4,000)
    genuine_amounts = np.random.lognormal(mean=3.5, sigma=1.0, size=n_samples) * 80
    # Fraudulent transactions: often larger, scaled to INR (average ~₹28,000)
    fraud_amounts = np.random.lognormal(mean=5.5, sigma=0.8, size=n_samples) * 80
    
    df["Amount"] = np.where(df["Class"] == 0, genuine_amounts, fraud_amounts)
    df["Amount"] = np.round(df["Amount"], 2)
    
    # 4. Sort by Time to represent sequential transactions
    df = df.sort_values("Time").reset_index(drop=True)
    
    # 5. Generate metadata for UI enhancement (Indian Merchants, Categories, Cardholder, ID)
    merchants_genuine = ["JioMart", "Flipkart", "Swiggy", "Zomato", "Reliance Retail", "HPCL Petrol Pump", "Airtel Pay", "BookMyShow", "IRCTC", "Swiggy Instamart"]
    merchants_fraud = ["Tanishq Jewellery", "Reliance Digital", "MakeMyTrip Travel", "WazirX Crypto", "Amazon India", "Swiggy Gourmet", "Gucci Delhi", "Gold Palace Store"]
    
    categories = {
        "JioMart": "Groceries", "Flipkart": "Shopping", "Swiggy": "Dining",
        "Zomato": "Dining", "Reliance Retail": "Shopping", "HPCL Petrol Pump": "Fuel",
        "Airtel Pay": "Utilities", "BookMyShow": "Entertainment", "IRCTC": "Travel",
        "Swiggy Instamart": "Groceries", "Tanishq Jewellery": "Luxury",
        "Reliance Digital": "Electronics", "MakeMyTrip Travel": "Travel",
        "WazirX Crypto": "Finance", "Amazon India": "Shopping", "Swiggy Gourmet": "Dining",
        "Gucci Delhi": "Luxury", "Gold Palace Store": "Luxury"
    }
    
    first_names = ["Aarav", "Priya", "Rohan", "Aditi", "Rahul", "Ananya", "Vikram", "Neha", "Amit", "Sneha", "Karan", "Rajesh", "Divya", "Sanjay"]
    last_names = ["Sharma", "Patel", "Gupta", "Rao", "Verma", "Iyer", "Singh", "Nair", "Mishra", "Reddy", "Mehta", "Kumar", "Chawla", "Joshi"]
    
    def get_metadata(row):
        is_fraud = row["Class"] == 1
        merchant = np.random.choice(merchants_fraud) if is_fraud else np.random.choice(merchants_genuine)
        category = categories.get(merchant, "Other")
        cardholder = f"{np.random.choice(first_names)} {np.random.choice(last_names)}"
        return pd.Series([merchant, category, cardholder])
        
    df[["Merchant", "Category", "Cardholder"]] = df.apply(get_metadata, axis=1)
    
    # Reorder columns: ID, Time, Merchant, Category, Cardholder, V1-V28, Amount, Class
    df.insert(0, "TransactionID", [f"TXN{10000 + i}" for i in range(len(df))])
    
    # Save to file
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Data saved successfully to {output_path}. Shape: {df.shape}")
    return df

if __name__ == "__main__":
    generate_synthetic_data("backend/app/data/credit_card_transactions.csv")
