"""Keyword rules for tagging T-12 account names with model codes.

Used when an account is not in a known GL map (mappings/*.csv). Rules are
checked top to bottom and the first match wins, so specific rules
(e.g. "payroll tax") must come before general ones (e.g. "tax").

Each rule: (code, regex, section) where section is "income", "expense" or None (either).
"""
import re

RULES = [
    # ---- income section ----
    ("VC", r"vacan", "income"),
    ("CONC", r"concess|free rent", None),
    ("BAD", r"bad debt|write.?off|collection loss", None),
    ("UNIT", r"rent.?free|employee unit rent|staff unit|model unit|manager.?s? unit|courtesy (officer )?unit", None),
    ("GPI", r"rental income|rent income|gross potential|rental assistance|subsidy|\bhap\b|housing assistance|(gain|loss)\W*\s*to lease|market rent", "income"),
    ("OI", r"fee|late|damage|interest|\bint\b|laundry|vending|misc|other income|tenant services|application|parking|pet|storage|cable income|utility reimb|rubs|forfeit|nsf|cleaning income", "income"),

    # ---- payroll (before generic 'tax' / 'insurance') ----
    ("PTAX", r"payroll tax|taxes.?-?\s*payroll|fica|futa|suta|employer tax", None),
    ("WORKCOMP", r"worker.?s?.? comp", None),
    ("HEALTH", r"health|medical|dental|benefit|401k|retirement", None),
    ("PAY", r"bonus|commission|incentive", None),
    ("REG", r"regional|supervis|district manager", None),
    ("MAIT", r"maint\w*\s*payroll|maint\w* salar|maint\w* wages|porter|groundskeeper payroll|superint", None),
    ("MAN", r"manager.?s?\s*payroll|manager salar|property manager|resident manager", None),
    ("ASS", r"office payroll|leasing payroll|assistant|leasing agent|admin\w* payroll|leasing salar", None),
    ("PAYSERV", r"payroll (service|processing)|paychex|adp", None),

    # ---- admin ----
    ("MGMT", r"management fee|mgmt fee|asset management", None),
    ("AUD", r"audit|accounting|tax return prep|cpa", None),
    ("BOOK", r"bookkeep", None),
    ("LEGAL", r"legal|attorney|eviction|credit report|screening|background check", None),
    ("TRAIN", r"training|seminar|education", None),
    ("TRAVEL", r"travel|mileage|auto expense|vehicle", None),
    ("BANK", r"bank (charge|fee)|bank service", None),
    ("CABLE", r"telephone|phone|internet|cable|answering", None),
    ("ADV", r"advertis|marketing|collateral|brand|renting exp|resident (supplies|relations|events)|promotion|signage|ils|apartments\.com", None),
    ("OFF", r"office|copy|copier|postage|dues|membership|software|computer|transaction fee|subscription|printing|paymode|rebate", None),
    ("COM", r"compliance|monitoring fee", None),

    # ---- utilities ----
    ("VAC", r"electric\w*\s*vacant|vacant\s*electric", None),
    ("WS", r"water|sewer", None),
    ("TRASH", r"rubbish|trash|garbage|refuse|waste", None),
    ("GAS", r"\bgas\b|natural gas|heating oil|propane", None),
    ("ELEC", r"electric|utility|utilities|employee unit util", None),

    # ---- operating & maintenance / contracts ----
    ("PEST", r"extermin|pest", None),
    ("SEC", r"security|patrol|alarm monitoring|camera", None),
    ("FIRE", r"fire|life safety|sprinkler", None),
    ("ELEV", r"elevator", None),
    ("SNOW", r"snow", None),
    ("LAND", r"landscap|grounds|tree|lawn|irrigation", None),
    ("TURN", r"turnover|make.?ready|decorat|cleaning|carpet clean|paint", None),
    ("HP", r"hvac|plumb|heating|air condition|pool supplies", None),
    ("APP", r"appliance|electrical repair", None),
    ("CON", r"contract|pool", None),
    ("SUPP", r"supplies|uniform|tools|keys|locks", None),
    ("RM", r"repair|window|maintenance", None),

    # ---- taxes & insurance ----
    ("INS", r"insurance|franchise tax", None),
    ("RETAX", r"real estate tax|property tax|taxes real estate|taxes other|assessment", None),
    ("MISCTAX", r"license|permit|\btax", None),

    ("MISCOP", r"miscellaneous operating|other operating", None),
]

_COMPILED = [(code, re.compile(rx, re.I), sec) for code, rx, sec in RULES]


def tag_by_keyword(name: str, section: str):
    """Return (code, matched_pattern) or (None, None)."""
    for code, rx, sec in _COMPILED:
        if sec and sec != section:
            continue
        if rx.search(name):
            return code, rx.pattern
    return None, None
