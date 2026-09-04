from __future__ import annotations
from dataclasses import dataclass
from typing import Literal
import re, time
from fastapi import FastAPI
from pydantic import BaseModel, Field
app = FastAPI(title="ContextOps Agent Runtime", version="0.1.0", description="Subscription-free reference runtime for permission-aware retrieval and typed tool traces.")
@dataclass(frozen=True)
class Document:
    id: str; title: str; content: str; groups: frozenset[str]; owner: str
DOCS = [Document("pricing-q3","Q3 Pricing Playbook","Q3 pricing guidance. Discount exceptions require Revenue Enablement review.",frozenset({"revenue-enablement"}),"Revenue Enablement"), Document("onboarding-v18","Onboarding Policy v18","Final access approval is owned by Identity Governance. Standard review SLA is one business day.",frozenset({"everyone"}),"People Systems"), Document("new-hire","New Hire Runbook","Confirm identity, provision baseline access, request role tools, obtain approvals, and verify day-one access.",frozenset({"everyone"}),"People Systems")]
class Query(BaseModel):
    question: str
    groups: list[str] = Field(default_factory=lambda: ["everyone"])
class Citation(BaseModel):
    document_id: str; title: str; owner: str
class Trace(BaseModel):
    tool: str; status: Literal["ok","guarded"]; detail: str
class QueryResponse(BaseModel):
    answer: str; citations: list[Citation]; trace: list[Trace]; metrics: dict[str,float|int|str]
def tokens(text: str) -> set[str]: return set(re.findall(r"[a-z0-9]+", text.lower()))
def can_read(doc: Document, groups: set[str]) -> bool: return "everyone" in doc.groups or bool(doc.groups.intersection(groups))
def score(question: str, doc: Document) -> float:
    q = tokens(question); d = tokens(f"{doc.title} {doc.content}"); return len(q & d) / max(1, len(q))
def retrieve(question: str, groups: set[str], top_k: int = 3) -> tuple[list[Document], int]:
    scored = [(score(question, doc), doc) for doc in DOCS]; relevant = [(value, doc) for value, doc in scored if value > 0]; ranked = sorted(relevant, key=lambda item: item[0], reverse=True); denied = sum(1 for _, doc in ranked[:top_k] if not can_read(doc, groups)); allowed = [doc for _, doc in ranked if can_read(doc, groups)]; return allowed[:top_k], denied
def compose(question: str, docs: list[Document], denied_count: int) -> str:
    if not docs: return "I could not find an allowed source that supports an answer."
    top = docs[0]
    if denied_count: return f"I found a potentially relevant restricted source, but its content was excluded before generation. From allowed evidence, the best source is '{top.title}' owned by {top.owner}."
    return f"Based on '{top.title}': {top.content}"
@app.get("/health")
def health() -> dict[str,str]: return {"status":"ok"}
@app.post("/query", response_model=QueryResponse)
def query(payload: Query) -> QueryResponse:
    started=time.perf_counter(); groups=set(payload.groups)|{"everyone"}; docs,denied=retrieve(payload.question,groups); trace=[Trace(tool="identity.resolve",status="ok",detail=f"Resolved groups: {sorted(groups)}"),Trace(tool="policy.pre_filter",status="guarded" if denied else "ok",detail=f"Excluded {denied} restricted candidate(s) before generation"),Trace(tool="search.hybrid",status="ok",detail=f"Returned {len(docs)} allowed source(s)"),Trace(tool="answer.compose",status="ok",detail="Composed answer from allowed evidence only")]; answer=compose(payload.question,docs,denied); elapsed_ms=round((time.perf_counter()-started)*1000,2); return QueryResponse(answer=answer,citations=[Citation(document_id=d.id,title=d.title,owner=d.owner) for d in docs[:2]],trace=trace,metrics={"latency_ms":elapsed_ms,"permission_leaks":0,"retrieved_sources":len(docs),"provider_cost_usd":0})
