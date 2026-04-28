import re


GSTIN_PATTERN = re.compile(r"^[0-9A-Z]{15}$")


def is_valid_gstin(gstin: str) -> bool:
    if not gstin:
        return False
    return bool(GSTIN_PATTERN.match(gstin))


def find_duplicate_irns(irns: list[str]) -> set[str]:
    seen: set[str] = set()
    dupes: set[str] = set()
    for irn in irns:
        if irn in seen:
            dupes.add(irn)
        else:
            seen.add(irn)
    return dupes
