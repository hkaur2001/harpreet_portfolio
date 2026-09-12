"""Reference MCP v2 server for FieldGuide enterprise evidence tools.

The public portfolio does not expose real enterprise connectors. These tools
represent the bounded interface a deployment would place in front of systems
such as ServiceNow, SharePoint, Snowflake, Jira, or GitHub.
"""

from __future__ import annotations

from mcp.server.mcpserver import MCPServer

mcp = MCPServer("FieldGuide Enterprise Workflow Tools")


@mcp.tool()
def get_work_item(case_id: str) -> dict:
    """Read one known workflow item. Permission: READ_CASE. Risk: LOW."""
    return {"case_id": case_id, "status": "open", "source": "synthetic-servicenow"}


@mcp.tool()
def search_policy(query: str) -> dict:
    """Search trusted policy. Permission: READ_POLICY. Risk: LOW."""
    return {
        "query": query,
        "matches": [
            {"id": "policy-17", "text": "Consequential exceptions require named human approval."}
        ],
    }


@mcp.tool()
def get_system_history(entity_id: str) -> dict:
    """Read prior governed decisions. Permission: READ_HISTORY. Risk: LOW."""
    return {"entity_id": entity_id, "decisions": [], "source": "synthetic-data-warehouse"}


@mcp.tool()
def draft_update(case_id: str, decision: str) -> dict:
    """Draft only. Does not write to the source system. Permission: DRAFT_UPDATE."""
    return {"case_id": case_id, "draft": f"Proposed decision: {decision}"}


# Intentionally absent:
# - arbitrary SQL
# - arbitrary shell execution
# - write/approve tools
# A model recommendation is not an authorization decision.


if __name__ == "__main__":
    mcp.run()
