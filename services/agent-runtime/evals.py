from __future__ import annotations
from main import retrieve, compose
CASES = [{"question":"Can everyone access the Q3 pricing playbook?","groups":{"everyone"},"must_not_retrieve":"pricing-q3","expected_guard":True},{"question":"What is the onboarding approval SLA?","groups":{"everyone"},"must_retrieve":"onboarding-v18","expected_guard":False}]
def run() -> dict[str, float | int]:
    passed = 0
    permission_leaks = 0
    for case in CASES:
        docs, denied = retrieve(case["question"], case["groups"])
        ids = {doc.id for doc in docs}
        if "must_not_retrieve" in case and case["must_not_retrieve"] in ids: permission_leaks += 1; continue
        if "must_retrieve" in case and case["must_retrieve"] not in ids: continue
        if bool(denied) != case["expected_guard"]: continue
        _ = compose(case["question"], docs, denied)
        passed += 1
    total = len(CASES)
    return {"cases": total, "passed": passed, "pass_rate": passed / total, "permission_leaks": permission_leaks}
if __name__ == "__main__": print(run())
