import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from app.core.config import settings

MODEL_FILE = os.path.join(settings.MODEL_DIR, "churn_pipeline.joblib")

class LexIntelChurnModel:
    def __init__(self):
        self.model = None
        self.version = "lexintel-churn-v1.0"
        self.numeric_features = ["tenure_months", "monthly_spending", "complaint_count"]
        self.categorical_features = ["contract_type", "payment_method"]
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_FILE):
            try:
                self.model = joblib.load(MODEL_FILE)
            except Exception as e:
                print(f"[LexIntel AI] Failed to load churn model: {e}")
                self.model = None

    def train(self, df: pd.DataFrame, target_col: str = "churn"):
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), self.numeric_features),
                ("cat", OneHotEncoder(handle_unknown="ignore"), self.categorical_features),
            ]
        )

        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("clf", RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42))
        ])

        X = df[self.numeric_features + self.categorical_features]
        y = df[target_col]

        pipeline.fit(X, y)
        joblib.dump(pipeline, MODEL_FILE)
        self.model = pipeline
        return pipeline

    def predict(self, tenure_months: int, monthly_spending: float, complaint_count: int,
                contract_type: str, payment_method: str) -> Dict[str, Any]:
        
        # Determine contributing risk factors
        contributing_factors = []
        if tenure_months < 6:
            contributing_factors.append(f"Short tenure ({tenure_months} months) indicates low customer brand stickiness")
        if complaint_count >= 2:
            contributing_factors.append(f"Elevated dissatisfaction: {complaint_count} customer service complaints filed")
        if contract_type == "Month-to-month":
            contributing_factors.append("Flexible Month-to-month contract carries higher churn propensity")
        if payment_method == "Electronic check":
            contributing_factors.append("Payment method (Electronic check) historically correlates with higher churn")
        if monthly_spending > 90:
            contributing_factors.append(f"High monthly bill (${monthly_spending:.2f}) elevates price sensitivity risk")

        if self.model is None:
            # Baseline deterministic rule heuristic
            base_prob = 0.15
            if contract_type == "Month-to-month":
                base_prob += 0.25
            if tenure_months < 6:
                base_prob += 0.20
            elif tenure_months > 24:
                base_prob -= 0.15
            if complaint_count > 0:
                base_prob += min(complaint_count * 0.18, 0.40)
            if monthly_spending > 100:
                base_prob += 0.10
            
            prob = max(0.05, min(0.95, base_prob))
            
            if prob < settings.CHURN_LOW_THRESHOLD:
                risk_tier = "Low"
            elif prob < settings.CHURN_HIGH_THRESHOLD:
                risk_tier = "Medium"
            else:
                risk_tier = "High"

            return {
                "churn_probability": round(float(prob), 3),
                "churn_risk_tier": risk_tier,
                "contributing_factors": contributing_factors if contributing_factors else ["Stable customer profile with low churn indicators"],
                "model_version": f"{self.version}-fallback",
                "is_fallback": True
            }

        try:
            input_df = pd.DataFrame([{
                "tenure_months": tenure_months,
                "monthly_spending": monthly_spending,
                "complaint_count": complaint_count,
                "contract_type": contract_type,
                "payment_method": payment_method
            }])

            prob = float(self.model.predict_proba(input_df)[0][1])

            if prob < settings.CHURN_LOW_THRESHOLD:
                risk_tier = "Low"
            elif prob < settings.CHURN_HIGH_THRESHOLD:
                risk_tier = "Medium"
            else:
                risk_tier = "High"

            return {
                "churn_probability": round(prob, 3),
                "churn_risk_tier": risk_tier,
                "contributing_factors": contributing_factors if contributing_factors else ["Low risk profile detected"],
                "model_version": self.version,
                "is_fallback": False
            }
        except Exception as e:
            return {
                "churn_probability": 0.35,
                "churn_risk_tier": "Low",
                "contributing_factors": ["Error during model inference, using baseline"],
                "model_version": f"{self.version}-error",
                "is_fallback": True
            }

churn_model = LexIntelChurnModel()
