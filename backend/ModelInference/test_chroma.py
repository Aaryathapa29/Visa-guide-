import chromadb
from chromadb.config import Settings

print("1. Creating client...")

client = chromadb.PersistentClient(
    path="./chroma_db",
    settings=Settings(anonymized_telemetry=False),
)

print("2. Client created")

collection = client.get_or_create_collection("visa_docs")

print("3. Collection opened")

print("4. Counting...")

count = collection.count()

print(f"5. Count = {count}")