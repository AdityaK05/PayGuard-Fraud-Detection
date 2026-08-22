import asyncio
from src.core.database import async_session_factory
from src.core.models import User, Admin
from src.core.security import hash_password
from sqlalchemy import select

async def seed():
    async with async_session_factory() as session:
        # Check if user exists
        stmt = select(User).where(User.email == "admin@payguard.ai")
        result = await session.execute(stmt)
        user = result.scalars().first()

        if not user:
            print("Seeding admin@payguard.ai...")
            user = User(
                email="admin@payguard.ai",
                name="Admin User",
                password_hash=hash_password("admin123!"),
                role="admin"
            )
            session.add(user)
            await session.flush()
            
            admin = Admin(user_id=user.id)
            session.add(admin)
            await session.commit()
            print("Successfully seeded admin user!")
        else:
            print("Admin user already exists.")

if __name__ == "__main__":
    asyncio.run(seed())
