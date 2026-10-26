import os
import sys
import pandas as pd
import numpy as np

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml.sentiment_model import LexIntelSentimentModel
from app.ml.churn_model import LexIntelChurnModel

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
os.makedirs(DATA_DIR, exist_ok=True)

def generate_and_train_sentiment():
    print("[1/2] Generating Synthetic Sentiment Dataset...")
    
    samples = [
        # Positive
        ("The resolution for my billing inquiry was handled promptly and courteously. Very satisfied!", "positive"),
        ("Excellent customer support! The representative solved my issue in under 5 minutes.", "positive"),
        ("I love the new dashboard analytics and automated reports. Outstanding speed and clarity.", "positive"),
        ("Thank you so much for waiving the accidental fee. Best service ever!", "positive"),
        ("Smooth onboarding experience. Everything works exactly as described in the documentation.", "positive"),
        ("The customer care team went above and beyond to fix my dispute. Truly grateful.", "positive"),
        ("Fast, friendly, and highly professional service. Keep up the great work!", "positive"),
        ("Everything was resolved smoothly and my refund was processed without hassle.", "positive"),
        ("Very impressed with how quickly the technical glitch was addressed. Great job!", "positive"),
        ("Outstanding enterprise product and responsive customer service team.", "positive"),
        ("Great communication, transparent explanation of charges, and great follow-up.", "positive"),
        ("Kudos to the support staff! They answered all my questions with utmost patience.", "positive"),
        ("I am really pleased with the reliability of your services and prompt notifications.", "positive"),
        ("The dispute was investigated thoroughly and the outcome was completely fair.", "positive"),
        ("Wonderful assistance today. The agent was clear, polite, and effective.", "positive"),
        ("Seamless upgrade experience and zero unexpected downtime. Highly recommended!", "positive"),
        ("Thank you for helping me navigate the new features. Everything is working wonderfully.", "positive"),
        ("Appreciate the proactive notification regarding my upcoming contract renewal.", "positive"),
        ("Quick turnaround on my ticket. Definitely one of the best vendor teams I have worked with.", "positive"),
        ("Superb experience from start to finish. Everything was explained clearly.", "positive"),
        ("We are extremely happy with your prompt customer service and quick resolution!", "positive"),
        ("Very happy with the platform performance and dedicated support agent.", "positive"),
        ("I am delighted with the quick turnaround and courteous support team.", "positive"),
        ("Fantastic experience, our team is very satisfied with the customer service.", "positive"),
        ("We love the fast support response and helpful guidance.", "positive"),

        # Neutral
        ("Please confirm if my monthly payment was received for invoice #4421.", "neutral"),
        ("I would like to update my primary billing address and email contact details.", "neutral"),
        ("How do I change my contract tier from month-to-month to an annual agreement?", "neutral"),
        ("Can someone provide a copy of the contract signed last December?", "neutral"),
        ("Inquiring about standard maintenance windows scheduled for next quarter.", "neutral"),
        ("Need instructions on how to add additional team members to our portal account.", "neutral"),
        ("Checking the current status of ticket #9823 submitted yesterday morning.", "neutral"),
        ("What payment methods are currently supported for international wire transfers?", "neutral"),
        ("Requesting an itemized PDF statement for the period ending March 31.", "neutral"),
        ("Can we schedule a 15-minute call to discuss our upcoming subscription renewal?", "neutral"),
        ("Please let me know the standard SLA for non-critical priority tickets.", "neutral"),
        ("I received an automated receipt for my monthly subscription.", "neutral"),
        ("Could you clarify whether user training sessions are included in our tier?", "neutral"),
        ("Please re-send the password reset link to my registered email address.", "neutral"),
        ("Looking for the documentation regarding API rate limits and webhook configurations.", "neutral"),
        ("Confirming that our account contact person has been updated to Sarah Miller.", "neutral"),
        ("What is the cutoff date for submitting end-of-month invoice disputes?", "neutral"),
        ("Inquiring about adding an extra seat license to our development workspace.", "neutral"),
        ("Checking if the platform supports automated weekly CSV exports.", "neutral"),
        ("Please advise on the standard procedure for requesting audit logs.", "neutral"),

        # Negative
        ("I was charged twice for the same monthly transaction! This is completely unacceptable.", "negative"),
        ("My refund is still not credited after 14 business days. No one is responding to emails.", "negative"),
        ("The platform was down during our peak business hours causing severe business disruption.", "negative"),
        ("Terrible customer service. I was transferred between four departments and nothing was resolved.", "negative"),
        ("An unauthorized charge of $189.50 appeared on my credit card statement. Investigate immediately!", "negative"),
        ("The software is riddled with bugs and the latest update broke our integration.", "negative"),
        ("I have been trying to cancel my subscription for two weeks and you keep billing me.", "negative"),
        ("Horrible response times. My critical ticket has been sitting untouched for three days.", "negative"),
        ("Your billing department made a blatant error and refuses to acknowledge the overcharge.", "negative"),
        ("Constant downtime and laggy performance. We are seriously considering switching to a competitor.", "negative"),
        ("I was promised a full credit by your representative but my statement still shows the fee.", "negative"),
        ("Very frustrated with the lack of transparency regarding sudden hidden price hikes.", "negative"),
        ("The system lost our transaction history and your support team seems clueless.", "negative"),
        ("Unresponsive support, unhelpful automated bots, and zero human accountability.", "negative"),
        ("My service was suspended despite payment having cleared my bank five days ago.", "negative"),
        ("Inaccurate transaction records and duplicate deductions on my ledger.", "negative"),
        ("Worst enterprise experience we have encountered this year. Escalating to legal if not fixed.", "negative"),
        ("Still waiting for my disputed transaction to be credited back. Extremely disappointed.", "negative"),
        ("The recent release broke our core checkout workflow. We lost customers because of this.", "negative"),
        ("Unacceptable delays and total disregard for our enterprise SLA commitment.", "negative")
    ]

    # Duplicate with minor variations to create a robust dataset of 300+ records
    expanded_samples = []
    modifiers_pos = ["Overall, ", "I want to say that ", "Notice: ", "Feedback: ", "Happy to report: ", ""]
    modifiers_neu = ["Question: ", "Inquiry: ", "Hello, ", "Attention support: ", "FYI, ", ""]
    modifiers_neg = ["Urgent: ", "Complaint: ", "Warning: ", "Escalation: ", "Very upset: ", ""]

    for text, label in samples:
        expanded_samples.append((text, label))
        if label == "positive":
            for m in modifiers_pos:
                expanded_samples.append((f"{m}{text}", label))
        elif label == "neutral":
            for m in modifiers_neu:
                expanded_samples.append((f"{m}{text}", label))
        else:
            for m in modifiers_neg:
                expanded_samples.append((f"{m}{text}", label))

    sentiment_df = pd.DataFrame(expanded_samples, columns=["text", "sentiment"]).drop_duplicates()
    sentiment_csv_path = os.path.join(DATA_DIR, "sentiment_training.csv")
    sentiment_df.to_csv(sentiment_csv_path, index=False)
    print(f"  Saved {len(sentiment_df)} sentiment training records to {sentiment_csv_path}")

    print("  Training LexIntel Sentiment Pipeline (TF-IDF + Logistic Regression)...")
    model = LexIntelSentimentModel()
    pipeline = model.train(sentiment_df["text"], sentiment_df["sentiment"])
    
    # Test evaluation
    test_texts = [
        "Everything was handled smoothly and quickly, thank you!",
        "What is the status of my invoice update request?",
        "I was charged twice and nobody will return my money, this is unacceptable fraud!"
    ]
    print("  Evaluating LexIntel Sentiment Model on holdout probes:")
    for probe in test_texts:
        res = model.predict(probe)
        print(f"    Probe: '{probe[:45]}...' -> Sentiment: {res['sentiment']} (Confidence: {res['confidence']:.2f}, Fallback: {res['is_fallback']})")

def generate_and_train_churn():
    print("\n[2/2] Generating Synthetic Customer Churn Dataset...")
    np.random.seed(42)
    n_samples = 600

    tenure_months = np.random.randint(1, 72, size=n_samples)
    monthly_spending = np.round(np.random.uniform(20.0, 180.0, size=n_samples), 2)
    complaint_count = np.random.choice([0, 1, 2, 3, 4, 5], p=[0.55, 0.20, 0.12, 0.08, 0.03, 0.02], size=n_samples)
    contract_types = np.random.choice(["Month-to-month", "One year", "Two year"], p=[0.55, 0.25, 0.20], size=n_samples)
    payment_methods = np.random.choice(
        ["Electronic check", "Mailed check", "Bank transfer", "Credit card"],
        p=[0.35, 0.20, 0.25, 0.20],
        size=n_samples
    )

    # Churn probability formula based on domain patterns
    # Short tenure + high complaints + month-to-month + high spending = high churn
    churn_prob = (
        0.35 * (contract_types == "Month-to-month")
        + 0.15 * (payment_methods == "Electronic check")
        + 0.25 * (tenure_months < 12)
        - 0.20 * (tenure_months > 36)
        + 0.12 * (complaint_count >= 2)
        + 0.08 * (monthly_spending > 100)
        + np.random.normal(0, 0.1, size=n_samples)
    )
    churn_prob = np.clip(churn_prob, 0.02, 0.98)
    churn = (churn_prob >= 0.45).astype(int)

    churn_df = pd.DataFrame({
        "tenure_months": tenure_months,
        "monthly_spending": monthly_spending,
        "complaint_count": complaint_count,
        "contract_type": contract_types,
        "payment_method": payment_methods,
        "churn": churn
    })

    churn_csv_path = os.path.join(DATA_DIR, "churn_training.csv")
    churn_df.to_csv(churn_csv_path, index=False)
    print(f"  Saved {len(churn_df)} churn training records to {churn_csv_path} (Churn rate: {churn.mean()*100:.1f}%)")

    print("  Training LexIntel Churn Random Forest Pipeline...")
    model = LexIntelChurnModel()
    model.train(churn_df, target_col="churn")

    print("  Evaluating LexIntel Churn Predictor on sample profiles:")
    probes = [
        {"tenure_months": 2, "monthly_spending": 140.0, "complaint_count": 3, "contract_type": "Month-to-month", "payment_method": "Electronic check"},
        {"tenure_months": 48, "monthly_spending": 65.0, "complaint_count": 0, "contract_type": "Two year", "payment_method": "Credit card"},
        {"tenure_months": 14, "monthly_spending": 85.0, "complaint_count": 1, "contract_type": "One year", "payment_method": "Bank transfer"}
    ]
    for p in probes:
        res = model.predict(**p)
        print(f"    Profile (Tenure: {p['tenure_months']}m, Spending: ${p['monthly_spending']}, Complaints: {p['complaint_count']}) -> Prob: {res['churn_probability']:.2f}, Risk: {res['churn_risk_tier']}, Factors: {len(res['contributing_factors'])}")

if __name__ == "__main__":
    generate_and_train_sentiment()
    generate_and_train_churn()
    print("\n[SUCCESS] LexIntel AI models trained and serialized successfully!")
