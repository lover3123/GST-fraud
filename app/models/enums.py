from enum import Enum


class InvoiceStatus(str, Enum):
    PENDING = "PENDING"
    CLEAN = "CLEAN"
    FLAGGED = "FLAGGED"
