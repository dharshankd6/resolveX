from typing import Dict, Any, List, Optional
from datetime import datetime

class LexIntelRecommendationEngine:
    """
    Autonomous Resolution Recommendation Engine.
    Generates explainable, evidence-backed resolution paths with human-in-the-loop governance.
    """

    @staticmethod
    def generate_recommendations(
        customer: Any,
        complaint: Optional[Any] = None,
        dispute: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        recommendations = []

        # 1. Recommendations based on Dispute
        if dispute:
            reasons_str = " | ".join(dispute.detection_reasons) if isinstance(dispute.detection_reasons, list) else str(dispute.detection_reasons)
            if "duplicate" in reasons_str.lower():
                recommendations.append({
                    "customer_id": customer.id,
                    "complaint_id": complaint.id if complaint else None,
                    "dispute_id": dispute.id,
                    "recommended_action": "Verify duplicate charge gateway telemetry and propose authorized credit adjustment voucher.",
                    "reason": "Detection engine identified identical transaction amounts within a tight time window.",
                    "supporting_evidence": f"Dispute #{dispute.dispute_id} detection telemetry: {reasons_str}",
                    "recommended_priority": "High",
                    "approval_status": "Pending"
                })
            elif "unauthorized" in reasons_str.lower():
                recommendations.append({
                    "customer_id": customer.id,
                    "complaint_id": complaint.id if complaint else None,
                    "dispute_id": dispute.id,
                    "recommended_action": "Freeze card token, initiate security credential reset, and request identity verification review.",
                    "reason": "Potential fraudulent or unauthorized transaction activity reported.",
                    "supporting_evidence": f"Dispute #{dispute.dispute_id} - High risk fraud indicators flagged in customer interaction.",
                    "recommended_priority": "Critical",
                    "approval_status": "Pending"
                })
            elif "mismatch" in reasons_str.lower() or "billing" in reasons_str.lower():
                recommendations.append({
                    "customer_id": customer.id,
                    "complaint_id": complaint.id if complaint else None,
                    "dispute_id": dispute.id,
                    "recommended_action": "Verify billing invoice line items against agreed subscription tariff and adjust discrepancy balance.",
                    "reason": "Billed transaction differs from expected plan rate.",
                    "supporting_evidence": f"Dispute #{dispute.dispute_id}: {reasons_str}",
                    "recommended_priority": "Medium",
                    "approval_status": "Pending"
                })
            else:
                recommendations.append({
                    "customer_id": customer.id,
                    "complaint_id": complaint.id if complaint else None,
                    "dispute_id": dispute.id,
                    "recommended_action": "Execute merchant acquirer transaction audit and initiate customer statement reconciliation.",
                    "reason": "Financial transaction anomaly flagged for human specialist review.",
                    "supporting_evidence": f"Dispute #{dispute.dispute_id} details: {reasons_str}",
                    "recommended_priority": dispute.risk_priority or "Medium",
                    "approval_status": "Pending"
                })

        # 2. Recommendations based on Complaint Category
        if complaint:
            category = (complaint.category or "Other").lower()
            subject_desc = f"{complaint.subject} {complaint.description}".lower()

            if "billing" in category:
                recommendations.append({
                    "customer_id": customer.id,
                    "complaint_id": complaint.id,
                    "dispute_id": dispute.id if dispute else None,
                    "recommended_action": "Review itemized billing statement, audit tax/fee adjustments, and issue official billing clarification memo.",
                    "reason": "Customer reported billing calculation or invoice discrepancy.",
                    "supporting_evidence": f"Complaint #{complaint.complaint_id} '{complaint.subject}' categorized under Billing.",
                    "recommended_priority": complaint.priority or "Medium",
                    "approval_status": "Pending"
                })
            elif "refund" in category or "refund" in subject_desc:
                recommendations.append({
                    "customer_id": customer.id,
                    "complaint_id": complaint.id,
                    "dispute_id": dispute.id if dispute else None,
                    "recommended_action": "Trace refund ARN with payment processor, verify policy adherence, and expedite refund release token.",
                    "reason": "Customer is experiencing refund processing delay beyond standard SLA.",
                    "supporting_evidence": f"Complaint #{complaint.complaint_id} with description: '{complaint.description[:120]}...'",
                    "recommended_priority": "High",
                    "approval_status": "Pending"
                })
            elif "technical" in category:
                recommendations.append({
                    "customer_id": customer.id,
                    "complaint_id": complaint.id,
                    "dispute_id": dispute.id if dispute else None,
                    "recommended_action": "Collect client telemetry and console diagnostics, assign Tier-2 engineering, and schedule diagnostic follow-up.",
                    "reason": "Technical defect or system error affecting customer service access.",
                    "supporting_evidence": f"Technical incident logged under Complaint #{complaint.complaint_id}.",
                    "recommended_priority": "High" if complaint.priority in ["High", "Critical"] else "Medium",
                    "approval_status": "Pending"
                })
            elif "service" in category:
                recommendations.append({
                    "customer_id": customer.id,
                    "complaint_id": complaint.id,
                    "dispute_id": dispute.id if dispute else None,
                    "recommended_action": "Investigate service incident logs, issue personalized apology notification, and credit 1 week courtesy service extension.",
                    "reason": "Customer impacted by service outage, downtime, or performance degradation.",
                    "supporting_evidence": f"Complaint #{complaint.complaint_id}: '{complaint.subject}'",
                    "recommended_priority": "Medium",
                    "approval_status": "Pending"
                })
            else:
                recommendations.append({
                    "customer_id": customer.id,
                    "complaint_id": complaint.id,
                    "dispute_id": dispute.id if dispute else None,
                    "recommended_action": "Initiate personalized customer outreach by Senior Resolution Specialist.",
                    "reason": "General customer grievance requiring human touchpoint.",
                    "supporting_evidence": f"Complaint #{complaint.complaint_id} logged on {complaint.created_at}.",
                    "recommended_priority": "Low",
                    "approval_status": "Pending"
                })

        return recommendations

recommendation_engine = LexIntelRecommendationEngine()
