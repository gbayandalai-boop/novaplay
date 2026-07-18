from app.database import SessionLocal, Base, engine
from app.models import User
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

email = "admin@test.com"
password = "123456"

admin = db.query(User).filter(User.email == email).first()

if not admin:
    admin = User(
        name="Admin",
        email=email,
        password_hash=hash_password(password),
        role="admin",
        is_subscribed=True
    )
    db.add(admin)
else:
    admin.password_hash = hash_password(password)
    admin.role = "admin"
    admin.is_subscribed = True

db.commit()
db.close()

print("✅ Admin ready: admin@test.com / 123456")