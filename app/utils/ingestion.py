import difflib

# Canonical schema fields expected by our detection engine
CANONICAL_FIELDS = ["irn", "vendor_gstin", "invoice_date", "taxable_value", "hsn_code"]

# Pre-defined aliases for extremely common messy headers to avoid fuzzy misses
HARDCODED_ALIASES = {
    "gst_no": "vendor_gstin",
    "supplier_id": "vendor_gstin",
    "amount": "taxable_value",
    "total": "taxable_value",
    "invoice_id": "irn",
    "product_code": "hsn_code"
}

def map_messy_headers(uploaded_headers: list[str]) -> dict[str, str]:
    """
    Takes a list of messy CSV headers and maps them to the canonical schema.
    Returns a dict: { "messy_header": "canonical_field" }
    """
    mapping = {}
    
    for messy_header in uploaded_headers:
        normalized_header = messy_header.lower().strip().replace(" ", "_")
        
        # 1. Check exact match
        if normalized_header in CANONICAL_FIELDS:
            mapping[messy_header] = normalized_header
            continue
            
        # 2. Check hardcoded aliases
        if normalized_header in HARDCODED_ALIASES:
            mapping[messy_header] = HARDCODED_ALIASES[normalized_header]
            continue
            
        # 3. Fuzzy match against canonical fields
        # Cutoff 0.6 means 60% similarity required
        fuzzy_matches = difflib.get_close_matches(normalized_header, CANONICAL_FIELDS, n=1, cutoff=0.6)
        if fuzzy_matches:
            mapping[messy_header] = fuzzy_matches[0]
        else:
            # Check fuzzy match against known aliases if canonical fails
            fuzzy_alias_matches = difflib.get_close_matches(normalized_header, HARDCODED_ALIASES.keys(), n=1, cutoff=0.7)
            if fuzzy_alias_matches:
                mapping[messy_header] = HARDCODED_ALIASES[fuzzy_alias_matches[0]]
            else:
                mapping[messy_header] = None # Unmapped column
                
    return mapping
