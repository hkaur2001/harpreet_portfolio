package fieldguide.authorization

default allow := false
default require_approval := false

# Reference policy: deny-by-default. In production, requester/agent identity,
# resource, action, purpose, and approval state should all be bound to the decision.

allow if {
  input.action == "read"
  input.resource in input.principal.readable_resources
  input.purpose in input.principal.allowed_purposes
}

allow if {
  input.action == "write"
  input.resource in input.principal.writable_resources
  input.purpose in input.principal.allowed_purposes
  input.risk == "low"
}

require_approval if {
  input.action == "write"
  input.risk in {"medium", "high"}
}

# Untrusted content never expands authority.
allow if {
  input.action == "write"
  input.risk in {"medium", "high"}
  input.approval.approved == true
  input.approval.approver in input.policy.named_approvers
  input.resource in input.principal.writable_resources
}

deny_reason := "external exfiltration is not permitted" if {
  input.destination_class == "unapproved_external"
}

deny_reason := "resource is outside the principal's grant" if {
  not input.resource in input.principal.readable_resources
  not input.resource in input.principal.writable_resources
}
