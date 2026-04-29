"""
app/core/network.py
====================
Circular Trading Detection using lightweight directed graph analysis.

The Fraud Pattern:
    Shell company A bills B → B bills C → C bills A.
    This circular loop artificially inflates turnover and generates
    fraudulent ITC (Input Tax Credit) for all three entities.

Algorithm:
    1. Build a directed graph where edges represent billing relationships
       (vendor_gstin → client_gstin).
    2. Use DFS-based cycle detection (networkx.simple_cycles) to find loops.
    3. If the current invoice creates or is part of a cycle, flag RED.

Performance:
    Queries are bounded by GSTIN — we only load relationships involving
    GSTINs connected to the current vendor, not the entire DB.
"""

from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.models.invoice import Invoice
from app.models.client import Client

try:
    import networkx as nx
    _HAS_NETWORKX = True
except ImportError:
    _HAS_NETWORKX = False


def _get_client_gstin(db: Session, client_id: int | None) -> str | None:
    """Resolve client_id → company_gstin via the Client table."""
    if not client_id:
        return None
    result = db.execute(
        select(Client.company_gstin).where(Client.id == client_id)
    ).scalar_one_or_none()
    return result


def detect_circular_trading(
    current_invoice: Invoice,
    db: Session,
    depth: int = 4,
) -> tuple[bool, float, str]:
    """
    Detects circular billing loops (A→B→C→A) using directed graph analysis.

    Args:
        current_invoice: The invoice being evaluated.
        db: Active SQLAlchemy session.
        depth: Maximum hop depth to explore (default 4 = up to 4-entity rings).

    Returns:
        (is_flagged: bool, score: float, explanation: str)
    """
    if not _HAS_NETWORKX:
        return (
            False, 0.0,
            "NetworkX not installed — circular trading check skipped. Run: pip install networkx"
        )

    vendor_gstin = current_invoice.vendor_gstin
    client_gstin = _get_client_gstin(db, current_invoice.client_id)

    if not client_gstin:
        return (False, 0.0, "No client GSTIN associated — circular trading check skipped.")

    # Build a directed graph of billing relationships from the DB
    # We fetch all (vendor_gstin, client_id) pairs for vendors connected
    # within `depth` hops of the current vendor.
    G = nx.DiGraph()

    # Seed: add the current invoice edge
    G.add_edge(vendor_gstin, client_gstin)

    # BFS to expand the graph up to `depth` hops
    frontier = {vendor_gstin, client_gstin}
    for _ in range(depth):
        if not frontier:
            break
        rows = db.execute(
            select(Invoice.vendor_gstin, Invoice.client_id)
            .where(Invoice.vendor_gstin.in_(frontier))
            .distinct()
        ).all()

        new_frontier = set()
        for v_gstin, c_id in rows:
            c_gstin = _get_client_gstin(db, c_id)
            if c_gstin and v_gstin != c_gstin:
                G.add_edge(v_gstin, c_gstin)
                new_frontier.add(c_gstin)
        frontier = new_frontier - set(G.nodes)

    # Detect cycles
    cycles = list(nx.simple_cycles(G))

    if not cycles:
        return (False, 0.0, "No circular billing relationships detected.")

    # Check if the current vendor/client GSTIN is part of any cycle
    relevant_cycles = [
        c for c in cycles
        if vendor_gstin in c or client_gstin in c
    ]

    if relevant_cycles:
        ring = " → ".join(relevant_cycles[0] + [relevant_cycles[0][0]])
        return (
            True,
            0.95,
            f"Critical: Circular trading ring detected involving this vendor: [{ring}]. "
            f"This pattern indicates artificial turnover inflation (shell company loop)."
        )

    return (False, 0.0, "Vendor is not part of any detected circular billing loop.")
