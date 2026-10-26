from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

class LexIntelDisputeEngine:
    """
    Explainable Rule-Based Dispute Detection Engine.
    Identifies potential financial and transaction disputes without opaque black-boxes,
    flagging clear audit trails and enforcing mandatory human review.
    """

    @staticmethod
    def evaluate(
        customer_id: int,
        transactions: List[Any],
        complaints: List[Any],
        recent_interactions: Optional[List[Any]] = None
    ) -> List[Dict[str, Any]]:
        detected_disputes = []

        # 1. Check for Duplicate Charges
        # (Transactions with exact same amount for customer within 48 hours)
        sorted_txns = sorted(transactions, key=lambda t: t.transaction_date or datetime.min)
        for i in range(len(sorted_txns)):
            for j in range(i + 1, len(sorted_txns)):
                t1, t2 = sorted_txns[i], sorted_txns[j]
                if abs(t1.amount - t2.amount) < 0.01:
                    time_diff = abs((t2.transaction_date - t1.transaction_date).total_seconds())
                    if time_diff <= 48 * 3600:
                        reasons = [
                            f"Potential duplicate charge: Identical amount ${t1.amount:.2f} processed twice within {round(time_diff/3600, 1)} hours",
                            f"Matched Transaction Refs: {t1.transaction_ref} and {t2.transaction_ref}"
                        ]
                        detected_disputes.append({
                            "customer_id": customer_id,
                            "transaction_id": t2.id,
                            "complaint_id": None,
                            "detection_reasons": reasons,
                            "risk_priority": "High",
                            "suggested_action": "Verify payment gateway idempotency keys and request bank authorization slips. Do not auto-refund without dual sign-off.",
                            "human_review_required": True,
                            "status": "Under Review"
                        })

        # 2. Check for Incorrect Charges / Wrong Transaction Amounts (amount != expected_amount)
        for txn in transactions:
            if txn.expected_amount is not None and abs(txn.amount - txn.expected_amount) > 0.01:
                variance = txn.amount - txn.expected_amount
                reasons = [
                    f"Transaction billing amount mismatch: Billed ${txn.amount:.2f} versus expected ${txn.expected_amount:.2f}",
                    f"Discrepancy delta: ${variance:+.2f} variance on transaction {txn.transaction_ref}"
                ]
                detected_disputes.append({
                    "customer_id": customer_id,
                    "transaction_id": txn.id,
                    "complaint_id": None,
                    "detection_reasons": reasons,
                    "risk_priority": "High" if abs(variance) > 50 else "Medium",
                    "suggested_action": "Cross-reference subscription tier pricing schedule and contract promotional terms.",
                    "human_review_required": True,
                    "status": "Under Review"
                })

        # 3. Check for Missing Transaction Details
        for txn in transactions:
            if not txn.transaction_ref or txn.amount <= 0:
                reasons = [
                    f"Irregular transaction integrity: Transaction #{txn.transaction_id} is missing reference code or records invalid amount (${txn.amount:.2f})"
                ]
                detected_disputes.append({
                    "customer_id": customer_id,
                    "transaction_id": txn.id,
                    "complaint_id": None,
                    "detection_reasons": reasons,
                    "risk_priority": "Medium",
                    "suggested_action": "Request merchant processor trace ID and verify ledger balance.",
                    "human_review_required": True,
                    "status": "Under Review"
                })

        # 4. Check for Complaints Indicating Unauthorized Claims / Delayed Refunds / Billing
        for cmp in complaints:
            subject_desc = f"{cmp.subject} {cmp.description}".lower()
            reasons = []

            # Check unauthorized transaction claim
            unauthorized_keywords = ["unauthorized", "fraud", "did not authorize", "scam", "stolen", "unrecognized", "hacked"]
            if any(k in subject_desc for k in unauthorized_keywords):
                reasons.append("Customer explicit claim of unauthorized card or account transaction")
                reasons.append(f"Complaint category: {cmp.category} - Subject: '{cmp.subject}'")
                detected_disputes.append({
                    "customer_id": customer_id,
                    "transaction_id": None,
                    "complaint_id": cmp.id,
                    "detection_reasons": reasons,
                    "risk_priority": "Critical",
                    "suggested_action": "Immediately secure customer payment credentials, inspect IP session origin, and request signed affidavit.",
                    "human_review_required": True,
                    "status": "Under Review"
                })

            # Check refund not received / delayed refund
            elif cmp.category.lower() == "refund" or "refund not received" in subject_desc or "waiting for refund" in subject_desc:
                reasons.append("Reported missing or delayed merchant refund beyond standard 3-5 business day window")
                reasons.append(f"Linked complaint #{cmp.complaint_id} with status '{cmp.status}'")
                detected_disputes.append({
                    "customer_id": customer_id,
                    "transaction_id": None,
                    "complaint_id": cmp.id,
                    "detection_reasons": reasons,
                    "risk_priority": "High",
                    "suggested_action": "Check merchant acquiring bank ARN (Acquirer Reference Number) and trace refund status with processing bank.",
                    "human_review_required": True,
                    "status": "Under Review"
                })

            # Check unresolved billing complaints
            elif cmp.category.lower() == "billing" and cmp.status in ["Open", "In Progress"]:
                # Check if older than 7 days
                age_days = (datetime.utcnow() - (cmp.created_at or datetime.utcnow())).days
                if age_days >= 7:
                    reasons.append(f"Unresolved billing complaint #{cmp.complaint_id} aging past SLA ({age_days} days elapsed)")
                    detected_disputes.append({
                        "customer_id": customer_id,
                        "transaction_id": None,
                        "complaint_id": cmp.id,
                        "detection_reasons": reasons,
                        "risk_priority": "Medium",
                        "suggested_action": "Escalate to tier-2 billing specialist for account reconciliation and audit.",
                        "human_review_required": True,
                        "status": "Under Review"
                    })

        # 5. Check Repeated Complaints relating to Transactions or Billing
        billing_tx_complaints = [c for c in complaints if c.category in ["Billing", "Refund", "Transaction"]]
        if len(billing_tx_complaints) >= 2:
            reasons = [
                f"Repeated dispute frequency: {len(billing_tx_complaints)} billing/transaction complaints logged for this customer",
                "Indicates persistent ledger reconciliation defect or chronic customer service friction"
            ]
            detected_disputes.append({
                "customer_id": customer_id,
                "transaction_id": None,
                "complaint_id": billing_tx_complaints[0].id,
                "detection_reasons": reasons,
                "risk_priority": "High",
                "suggested_action": "Conduct full 90-day comprehensive statement audit and assign dedicated customer resolution specialist.",
                "human_review_required": True,
                "status": "Under Review"
            })

        return detected_disputes

dispute_engine = LexIntelDisputeEngine()
