from fastapi import FastAPI
from pydantic import BaseModel

from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

app = FastAPI()

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.2
)

embeddings = OpenAIEmbeddings()

db = FAISS.load_local(
    "embeddings",
    embeddings,
    allow_dangerous_deserialization=True
)

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")

def chat(req: ChatRequest):

    docs = db.similarity_search(
        req.question,
        k=3
    )

    context = "\n".join(
        [d.page_content for d in docs]
    )

    prompt = f"""
    You are Visa Guide AI.

    Answer ONLY using the information below.

    Context:
    {context}

    Question:
    {req.question}
    """

    response = llm.invoke(prompt)

    return {
        "answer": response.content
    }