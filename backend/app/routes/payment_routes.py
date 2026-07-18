import os
import stripe
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.auth import get_current_user, require_admin

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter(prefix="/api/payment", tags=["Payment"])


PRICE_MAP = {
    "basic": os.getenv("STRIPE_BASIC_PRICE_ID", "price_basic_xxx"),
    "pro": os.getenv("STRIPE_PRO_PRICE_ID", "price_pro_xxx"),
    "enterprise": os.getenv("STRIPE_ENTERPRISE_PRICE_ID", "price_enterprise_xxx"),
}

AMOUNT_MAP = {
    "basic": 4.99,
    "pro": 9.99,
    "enterprise": 19.99,
}


def check_subscription(user, db: Session):
    if not user:
        return False

    if not user.subscription_end:
        return user.is_subscribed

    if datetime.utcnow() > user.subscription_end:
        user.is_subscribed = False
        db.commit()
        return False

    return True


@router.post("/create-checkout-session")
def create_checkout(
    plan: str = "pro",
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if plan not in PRICE_MAP:
        raise HTTPException(status_code=400, detail="Invalid plan")

    price_id = PRICE_MAP[plan]

    if not price_id or price_id.startswith("price_") is False:
        raise HTTPException(status_code=400, detail="Invalid Stripe price ID")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            customer_email=user.email,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{os.getenv('FRONTEND_URL')}/success",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/subscribe",

            # ✅ Coupon / discount code input
            allow_promotion_codes=True,

            metadata={
                "user_id": str(user.id),
                "plan": plan
            },

            # ✅ 1 day free trial
            subscription_data={
                "trial_period_days": 1,
                "metadata": {
                    "user_id": str(user.id),
                    "plan": plan
                }
            },
        )

        payment = models.Payment(
            user_id=user.id,
            amount=AMOUNT_MAP.get(plan, 9.99),
            status="pending",
            payment_method=f"stripe_{plan}",
            reference=session.id,
        )

        db.add(payment)
        db.commit()

        return {"url": session.url}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-billing-portal")
def create_billing_portal(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        customers = stripe.Customer.list(email=user.email, limit=1)

        if customers.data:
            customer_id = customers.data[0].id
        else:
            customer = stripe.Customer.create(email=user.email)
            customer_id = customer.id

        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{os.getenv('FRONTEND_URL')}/billing"
        )

        return {"url": session.url}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/status")
def status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    active = check_subscription(user, db)

    return {
        "is_subscribed": active,
        "subscription_end": str(user.subscription_end) if user.subscription_end else None,
        "role": user.role
    }


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(payload, sig, endpoint_secret)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        plan = session.get("metadata", {}).get("plan", "pro")

        if user_id:
            user = db.query(models.User).filter(models.User.id == int(user_id)).first()

            if user:
                user.is_subscribed = True
                user.subscription_end = datetime.utcnow() + timedelta(days=30)

                payment = (
                    db.query(models.Payment)
                    .filter(models.Payment.reference == session.id)
                    .first()
                )

                if payment:
                    payment.status = "approved"
                    payment.approved_at = datetime.utcnow()
                else:
                    payment = models.Payment(
                        user_id=user.id,
                        amount=AMOUNT_MAP.get(plan, 9.99),
                        status="approved",
                        payment_method=f"stripe_{plan}",
                        reference=session.id,
                        approved_at=datetime.utcnow(),
                    )
                    db.add(payment)

                db.commit()

    if event["type"] == "invoice.paid":
        invoice = event["data"]["object"]
        subscription_id = invoice.get("subscription")

        if subscription_id:
            subscription = stripe.Subscription.retrieve(subscription_id)
            user_id = subscription.get("metadata", {}).get("user_id")
            plan = subscription.get("metadata", {}).get("plan", "pro")

            if user_id:
                user = db.query(models.User).filter(models.User.id == int(user_id)).first()

                if user:
                    user.is_subscribed = True
                    user.subscription_end = datetime.utcnow() + timedelta(days=30)

                    exists = (
                        db.query(models.Payment)
                        .filter(models.Payment.reference == invoice.get("id"))
                        .first()
                    )

                    if not exists:
                        payment = models.Payment(
                            user_id=user.id,
                            amount=(invoice.get("amount_paid") or 0) / 100,
                            status="approved",
                            payment_method=f"stripe_auto_{plan}",
                            reference=invoice.get("id"),
                            approved_at=datetime.utcnow(),
                        )

                        db.add(payment)

                    db.commit()

    if event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        user_id = subscription.get("metadata", {}).get("user_id")

        if user_id:
            user = db.query(models.User).filter(models.User.id == int(user_id)).first()

            if user:
                user.is_subscribed = False
                user.subscription_end = None
                db.commit()

    return {"status": "ok"}


# ✅ ШИНЭЧИЛСЭН: Монгол банкны дансны мэдээлэл буцаадаг хэсэг
@router.post("/manual")
def create_manual_payment(
    amount: float = 9.99,
    method: str = "bank_transfer",
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = models.Payment(
        user_id=current_user,
        amount=amount,
        payment_method=method,
        status="pending"
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "status": "success",
        "message": "Payment request created successfully.",
        "bank_account": "790005005156142612",
        "amount": amount,
        "payment_id": payment.id,
        "description": f"NOVAPLAY {current_user}" # Хэрэглэгчийн гүйлгээний утга
    }


@router.get("/admin/payments")
def admin_payments(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    rows = (
        db.query(models.Payment, models.User)
        .join(models.User, models.User.id == models.Payment.user_id)
        .order_by(models.Payment.created_at.desc())
        .all()
    )

    return [
        {
            "id": p.id,
            "user_id": p.user_id,
            "user_email": u.email,
            "amount": p.amount,
            "status": p.status,
            "payment_method": p.payment_method,
            "reference": p.reference,
            "created_at": str(p.created_at),
            "approved_at": str(p.approved_at) if p.approved_at else None
        }
        for p, u in rows
    ]


@router.post("/admin/payments/{payment_id}/approve")
def approve_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    user = db.query(models.User).filter(models.User.id == payment.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    payment.status = "approved"
    payment.approved_at = datetime.utcnow()

    user.is_subscribed = True
    user.subscription_end = datetime.utcnow() + timedelta(days=30)

    db.commit()

    return {"message": "Payment approved"}


@router.post("/admin/payments/{payment_id}/reject")
def reject_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment.status = "rejected"
    db.commit()

    return {"message": "Payment rejected"}


@router.get("/history")
def payment_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payments = (
        db.query(models.Payment)
        .filter(models.Payment.user_id == current_user)
        .order_by(models.Payment.created_at.desc())
        .all()
    )

    return [
        {
            "id": p.id,
            "amount": p.amount,
            "status": p.status,
            "payment_method": p.payment_method,
            "reference": p.reference,
            "created_at": str(p.created_at),
            "approved_at": str(p.approved_at) if p.approved_at else None
        }
        for p in payments
    ]


@router.post("/cancel")
def cancel_subscription(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_subscribed = False
    user.subscription_end = None
    db.commit()

    return {"message": "Subscription cancelled"}