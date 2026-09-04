from main import can_read, retrieve, DOCS

def test_restricted_document_is_not_readable_by_everyone():
    pricing=next(doc for doc in DOCS if doc.id=="pricing-q3"); assert not can_read(pricing,{"everyone"})
def test_restricted_document_is_readable_by_authorized_group():
    pricing=next(doc for doc in DOCS if doc.id=="pricing-q3"); assert can_read(pricing,{"revenue-enablement"})
def test_retrieval_pre_filters_restricted_content():
    docs,denied=retrieve("Q3 pricing playbook",{"everyone"}); assert all(doc.id!="pricing-q3" for doc in docs); assert denied>=1
def test_irrelevant_restricted_document_does_not_trigger_guard():
    docs,denied=retrieve("onboarding approval SLA",{"everyone"}); assert any(doc.id=="onboarding-v18" for doc in docs); assert denied==0
def test_unrelated_question_does_not_return_zero_score_documents():
    docs,denied=retrieve("quantum cafeteria menu",{"everyone"}); assert docs==[]; assert denied==0
