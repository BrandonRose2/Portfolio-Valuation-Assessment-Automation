"""Model row codes used by the GPC Underwriting Model (Scenario 0, column A).

Scenario 0 column E (the T12 column) is filled with
    SUMIF('T-12'!O:O, <code>, 'T-12'!N:N)
so every line on the seller's T-12 needs exactly one of these codes in column O.
"""

# code -> (Scenario 0 row in the template, model line name)
MODEL_CODES = {
    "GPI": (7, "Gross Potential Income"),
    "VC": (8, "Vacancy Factor"),
    "OI": (11, "Laundry and Other Income"),
    "BAD": (17, "Bad Debt"),
    "RES": (20, "Replacement Reserves"),
    "COM": (21, "Compliance Fee"),
    "REG": (24, "Regional Manager Salary"),
    "MAN": (25, "Property Manager Salary"),
    "ASS": (26, "Assistant Manager"),
    "PAY": (27, "Commissions/Bonuses"),
    "MAIT": (28, "Maintenance Salary"),
    "MGMT": (31, "Management Fee"),
    "LEGAL": (32, "Legal Expense"),
    "OFF": (33, "Office Expense"),
    "TRAVEL": (34, "Travel Cost"),
    "AUD": (35, "Audit Expense"),
    "ADV": (36, "Advertising"),
    "TRAIN": (37, "Training Charge"),
    "BANK": (38, "Bank Charges"),
    "BOOK": (39, "Bookkeeping"),
    "PAYSERV": (40, "Payroll Service"),
    "UNIT": (41, "Manager Unit"),
    "MISCAD": (42, "Misc. Admin Expenses"),
    "ELEC": (45, "Electric"),
    "VAC": (46, "Electric - Vacant"),
    "WS": (47, "Water & Sewer"),
    "GAS": (48, "Gas"),
    "CABLE": (49, "Cable"),
    "TRASH": (50, "Trash/Garbage"),
    "RM": (53, "In-House R&M"),
    "TURN": (54, "Turnover"),
    "SUPP": (55, "Supplies"),
    "APP": (56, "Appliance/Electrical"),
    "HP": (57, "HVAC & Plumbing"),
    "CONC": (58, "Rent Concessions"),
    "LAND": (61, "Landscaping/Grounds Contract"),
    "FIRE": (62, "Fire & Safety System"),
    "SEC": (63, "Security"),
    "PEST": (64, "Pest Control"),
    "CON": (65, "Misc. Contracts"),
    "ELEV": (66, "Elevator Costs"),
    "SNOW": (67, "Snow"),
    "MISCOP": (68, "Misc. Operating & Maint."),
    "RETAX": (71, "Real Estate Taxes"),
    "INS": (72, "Property & Liability Insurance"),
    "WORKCOMP": (73, "Workmens Comp"),
    "HEALTH": (74, "Health Insurance & Other Benefits"),
    "PTAX": (75, "Payroll Tax"),
    "MISCTAX": (76, "Misc Taxes, Licenses, Etc."),
}

# Codes the model treats as income. Everything else is a positive cost or a
# deduction from income (vacancy, concessions, bad debt, employee units).
INCOME_CODES = {"GPI", "OI"}

# Codes whose Year-1 value comes from the Dashboard, not the T-12.
NOT_FROM_T12 = {"RES"}
