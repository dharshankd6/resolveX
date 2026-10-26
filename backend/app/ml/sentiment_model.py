import os
import joblib
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from app.core.config import settings

MODEL_FILE = os.path.join(settings.MODEL_DIR, "sentiment_pipeline.joblib")

class LexIntelSentimentModel:
    def __init__(self):
        self.model = None
        self.version = "lexintel-sentiment-v1.0"
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_FILE):
            try:
                self.model = joblib.load(MODEL_FILE)
            except Exception as e:
                print(f"[LexIntel AI] Failed to load sentiment model: {e}")
                self.model = None

    def train(self, texts, labels):
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000, lowercase=True)),
            ("clf", LogisticRegression(max_iter=1000, C=1.0, random_state=42))
        ])
        pipeline.fit(texts, labels)
        joblib.dump(pipeline, MODEL_FILE)
        self.model = pipeline
        return pipeline

    def predict(self, text: str) -> Dict[str, Any]:
        if not text or not text.strip():
            return {
                "sentiment": "neutral",
                "confidence": 0.50,
                "model_version": self.version,
                "is_fallback": True
            }

        if self.model is None:
            # Explicit rule-based fallback when model is not yet trained
            lower = text.lower()
            positive_words = ["great", "excellent", "good", "happy", "resolved", "thank", "helpful", "love", "fast", "awesome", "perfect"]
            negative_words = ["terrible", "awful", "bad", "unhappy", "angry", "worst", "unacceptable", "delay", "refund", "charged", "incorrect", "broken", "failed", "hate", "issue", "problem"]
            
            pos_score = sum(1 for w in positive_words if w in lower)
            neg_score = sum(1 for w in negative_words if w in lower)

            if pos_score > neg_score:
                sentiment = "positive"
                conf = min(0.60 + 0.1 * (pos_score - neg_score), 0.90)
            elif neg_score > pos_score:
                sentiment = "negative"
                conf = min(0.60 + 0.1 * (neg_score - pos_score), 0.90)
            else:
                sentiment = "neutral"
                conf = 0.55

            return {
                "sentiment": sentiment,
                "confidence": round(float(conf), 3),
                "model_version": f"{self.version}-fallback",
                "is_fallback": True
            }

        try:
            probs = self.model.predict_proba([text])[0]
            classes = self.model.classes_
            best_idx = np.argmax(probs)
            sentiment = classes[best_idx]
            confidence = float(probs[best_idx])

            return {
                "sentiment": sentiment,
                "confidence": round(confidence, 3),
                "model_version": self.version,
                "is_fallback": False
            }
        except Exception as e:
            return {
                "sentiment": "neutral",
                "confidence": 0.50,
                "model_version": f"{self.version}-error",
                "is_fallback": True
            }

sentiment_model = LexIntelSentimentModel()
