import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Transaction, Customer
from app.schemas.schemas import TransactionCreate, TransactionResponse
from app.services.services import AuditService

router = APIRouter()

@router.get("/", response_model=List[TransactionResponse])
def list_transactions(
    customer_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction)
    if customer_id:
        query = query.filter(Transaction.customer_id == customer_id)
    return query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=TransactionResponse)
def create_transaction(
    txn_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == txn_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    txn = Transaction(
        transaction_id=txn_in.transaction_id,
        customer_id=txn_in.customer_id,
        transaction_ref=txn_in.transaction_ref,
        amount=txn_in.amount,
        expected_amount=txn_in.expected_amount,
        currency=txn_in.currency,
        status=txn_in.status,
        transaction_date=txn_in.transaction_date or datetime.datetime.utcnow()
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    AuditService.log(db, "TRANSACTION_RECORDED", "Transaction", txn.transaction_id, user_id=current_user.id,
                     details={"amount": txn.amount, "ref": txn.transaction_ref})
    return txn
