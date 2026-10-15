# Portfolio Valuation Automation

Goal (from Marc): drop an offering memorandum (OM) and the seller's documents in, and get the
Granite Park underwriting model (GPC Underwriting Model Template v4) filled in with no hand entry.

## Layout

```
docs/                         Template, input map, meeting notes
  GPC Underwriting Model Template v4.xlsx
  GPC Template Input Map.xlsx   every input cell -> source -> rule
  meetings/                     Marc + Abraham sessions
reference-deal/cambridge-court/ Answer key: OM, seller request file, Abraham's finished model
mappings/                     Per-system GL account -> model code lookups
  onesite_gl_map.csv            RealPage OneSite (seeded from Cambridge)
src/valuation/                Code
  codes.py                      the model's 49 row codes (Scenario 0, column A)
  rules.py                      keyword rules for accounts not in a GL map
  t12.py                        T-12 tagger
tests/                        Cambridge regression tests
```

## Step 1: T-12 tagger (done)

The model reads the T-12 through a code column: Scenario 0 column E is
`SUMIF('T-12'!O:O, code, 'T-12'!N:N)`. The tagger reads a seller T-12, gives every GL
line one of the 49 codes, and checks the result.

```bash
pip install -r requirements.txt
cd src
python -m valuation.t12 "../reference-deal/cambridge-court/Cambridge 3-20-2026 Request.xls" --out ../out
```

How a line gets its code:
1. Exact account number in `mappings/<system>_gl_map.csv` (Abraham-approved tags).
2. Otherwise the first matching keyword rule in `rules.py`.
3. Otherwise **UNTAGGED**. The run fails until every non-zero line has a code.

Checks:
- Every non-zero line is tagged.
- Model NOI (income codes minus all other codes) equals the T-12's own NOI line, within $1.

Outputs (`--out`): `t12_tagged.csv`, `summary.json` (the Scenario 0 T12 column, by code),
and `t12_for_model.xlsx` (a `T-12` sheet with the 12-month total in column N and the code in
column O, ready to paste into the model).

Cambridge Court results: 78 lines, all tagged, NOI $986,818.73 ties. Matches Abraham's
T12 column on every row except two expected differences:
- `RES` comes from the Dashboard, not the T-12.
- `OFF` is $352.04 lower: the Cambridge model left "6392-0002 Paymode Rebates" untagged,
  so it silently dropped out of the model. The tagger catches it.

With keyword rules only (no GL map), 74 of 75 Cambridge tags match Abraham's; the one
difference ("Electricity Vacant" -> VAC instead of ELEC) is deliberate.

```bash
python -m pytest -q tests
```

## Next steps

- [ ] Rent roll -> unit-set table (subsidy lines, AMI tagging, unit-code decoding)
- [ ] Lookups: HUD FMR / SAFMR by ZIP, TCAC LIHTC limits by county, HOME limits
- [ ] OM extraction (property facts, affordability dates, existing debt)
- [ ] Write everything into a copy of the template and compare with the Cambridge model

## Data privacy

`reference-deal/` contains a rent roll with resident names and a payroll schedule with
employee names and pay. Keep this repository private.
