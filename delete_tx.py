import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:Amanrai%232005@db.yqrwxplohfobejelrkrm.supabase.co:5432/postgres"

async def main():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine)

    tx_prefixes = [
        "TXNB2C583BD",
        "TXN39516F9E",
        "TXNA555689A",
        "TXN2A3D6CBF",
        "TXNBAE576AC",
        "TXN3B52A1C2",
        "TXN77230414",
        "TXNB9660794"
    ]

    async with async_session() as session:
        # Get user ID
        result = await session.execute(text("SELECT id FROM users WHERE email = 'adityagr8.05@gmail.com'"))
        user_id = result.scalar_one_or_none()
        
        if not user_id:
            print("User not found!")
            return

        print(f"Found user ID: {user_id}")

        for prefix in tx_prefixes:
            # We need to manually delete from child tables first if CASCADE is not configured correctly on Postgres
            # Find the transaction ID first
            tx_res = await session.execute(text(f"SELECT id FROM transactions WHERE transaction_id LIKE '{prefix}%' AND user_id = {user_id}"))
            tx_ids = [row[0] for row in tx_res.fetchall()]
            
            for tx_id in tx_ids:
                print(f"Deleting transaction ID {tx_id} (prefix {prefix})")
                
                # Find predictions
                pred_res = await session.execute(text(f"SELECT id FROM predictions WHERE transaction_id = {tx_id}"))
                pred_ids = [row[0] for row in pred_res.fetchall()]
                
                for pred_id in pred_ids:
                    await session.execute(text(f"DELETE FROM risk_scores WHERE prediction_id = {pred_id}"))
                    await session.execute(text(f"DELETE FROM feedback WHERE prediction_id = {pred_id}"))
                    await session.execute(text(f"DELETE FROM predictions WHERE id = {pred_id}"))
                
                await session.execute(text(f"DELETE FROM alerts WHERE transaction_id = {tx_id}"))
                await session.execute(text(f"DELETE FROM transactions WHERE id = {tx_id}"))
                
        await session.commit()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
