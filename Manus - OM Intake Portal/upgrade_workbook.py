#!/usr/bin/env python3
"""Create GPC Underwriting Model Template v5 from the supplied v4 template.

The script deliberately performs only controlled, reviewable changes:
* copies Scenario 3 to an independent Scenario 4 sheet immediately after it;
* builds a Scenario 4 block in Unit Mix (AK:AP) from Scenario 3's layout;
* implements the stated Scenario 4 rule:
  - if a maximum LIHTC rent exists, use the higher of net LIHTC and Scenario 1;
  - if no maximum LIHTC rent exists, retain current rent;
* updates visible text references from Scenarios 0–3 to Scenarios 0–4;
* turns off Excel Page Break Preview, which displays the intrusive "Page 1" overlay.

It never overwrites the input workbook.
"""

from __future__ import annotations

import argparse
import re
from copy import copy
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.cell.cell import MergedCell
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.cell_range import CellRange

SOURCE_BLOCK = (30, 35)  # AD:AI — Scenario 3 Unit Mix block
TARGET_BLOCK = (37, 42)  # AK:AP — Scenario 4 Unit Mix block


def copy_cell(source, target) -> None:
    if isinstance(source, MergedCell):
        return
    target.value = source.value
    if source.has_style:
        target._style = copy(source._style)
    if source.number_format:
        target.number_format = source.number_format
    if source.font:
        target.font = copy(source.font)
    if source.fill:
        target.fill = copy(source.fill)
    if source.border:
        target.border = copy(source.border)
    if source.alignment:
        target.alignment = copy(source.alignment)
    if source.protection:
        target.protection = copy(source.protection)


def copy_unit_mix_scenario_4(ws) -> None:
    src_start, src_end = SOURCE_BLOCK
    dst_start, dst_end = TARGET_BLOCK
    shift = dst_start - src_start

    # Clear target cells in case the script is run against a previously edited copy.
    for row in range(1, ws.max_row + 1):
        for col in range(dst_start, dst_end + 1):
            cell = ws.cell(row, col)
            cell.value = None
            cell._style = copy(ws.cell(row, src_start)._style)

    # Source block values, formulas, styles, and row dimensions.
    for col in range(src_start, src_end + 1):
        src_letter = get_column_letter(col)
        dst_letter = get_column_letter(col + shift)
        ws.column_dimensions[dst_letter].width = ws.column_dimensions[src_letter].width
        ws.column_dimensions[dst_letter].hidden = ws.column_dimensions[src_letter].hidden
        ws.column_dimensions[dst_letter].outlineLevel = ws.column_dimensions[src_letter].outlineLevel
        for row in range(1, ws.max_row + 1):
            copy_cell(ws.cell(row, col), ws.cell(row, col + shift))

    # Copy merged ranges wholly contained in the source block.
    for merged in list(ws.merged_cells.ranges):
        if merged.min_col >= src_start and merged.max_col <= src_end:
            shifted = CellRange(str(merged))
            shifted.shift(col_shift=shift, row_shift=0)
            if str(shifted) not in {str(r) for r in ws.merged_cells.ranges}:
                ws.merge_cells(str(shifted))

    # Scenario 4 headings and labels.
    ws['AK3'] = 'Scenario 4 (Max Net LIHTC)'
    ws['AK6'] = 'Unit Type'
    ws['AL6'] = 'AMI / S8'
    ws['AM6'] = '# of Units'
    ws['AN6'] = 'Avg. SF'
    ws['AO6'] = 'Avg. Utilities'
    ws['AP6'] = 'Max Net LIHTC / Voucher Floor'

    # Translate only formulas that refer to the Scenario 3 output column (AI). References
    # to base input columns remain intentionally fixed, because Scenario 4 consumes the
    # same property/rent-roll inputs as Scenario 3.
    for row in range(1, ws.max_row + 1):
        cell = ws.cell(row, 42)  # AP
        formula = cell.value
        if isinstance(formula, str) and formula.startswith('='):
            cell.value = re.sub(r'(?<![A-Z])AI(\$?\d+)', r'AP\1', formula)

    # Detail rows have units in AM. Scenario 4 retains current rent (N) where there is no
    # maximum LIHTC rent; otherwise it uses the higher of the Scenario 1 outcome (U) and
    # the maximum net LIHTC outcome (AB). The formula is annual because all scenario
    # output columns calculate annual gross income.
    for row in range(7, ws.max_row + 1):
        unit_count_formula = ws.cell(row, 39).value  # AM
        label = ws.cell(row, 37).value  # AK
        if isinstance(unit_count_formula, str) and unit_count_formula.startswith('='):
            # Summary rows label themselves "Total (Pre-Vacancy)"; detail rows preserve
            # the current rent when no maximum LIHTC rent is available.
            if label != 'Total (Pre-Vacancy)':
                ws.cell(row, 42).value = f'=IF(G{row}>0,MAX(U{row},AB{row}),N{row})'

    # Totals must sum Scenario 4's own output column rather than Scenario 3's output.
    for row in range(1, ws.max_row + 1):
        if ws.cell(row, 37).value == 'Total (Pre-Vacancy)':
            # Detail groups begin after the previous blank/heading sequence. Reuse the
            # copied total formula and switch its AI references to AP.
            existing = ws.cell(row, 42).value
            if isinstance(existing, str) and existing.startswith('='):
                ws.cell(row, 42).value = re.sub(r'(?<![A-Z])AI(\$?\d+)', r'AP\1', existing)


def replace_visible_scenario_text(workbook) -> None:
    substitutions = {
        'Scenarios 0–3': 'Scenarios 0–4',
        'Scenarios 0-3': 'Scenarios 0-4',
        'all four scenarios': 'all five scenarios',
        'All four scenarios': 'All five scenarios',
    }
    for ws in workbook.worksheets:
        for row in ws.iter_rows():
            for cell in row:
                if isinstance(cell.value, str) and not cell.value.startswith('='):
                    for original, replacement in substitutions.items():
                        if original in cell.value:
                            cell.value = cell.value.replace(original, replacement)


def normalize_workbook_views(workbook) -> None:
    for ws in workbook.worksheets:
        # Excel Page Break Preview is the source of the visible Page 1/2 overlays.
        ws.sheet_view.view = 'normal'
        ws.sheet_view.showGridLines = True
        ws.row_breaks.brk.clear()
        ws.col_breaks.brk.clear()


def build_v5(source: Path, destination: Path) -> None:
    workbook = load_workbook(source, data_only=False, keep_links=True)

    if 'Scenario 3' not in workbook.sheetnames or 'Unit Mix' not in workbook.sheetnames:
        raise ValueError('Expected Scenario 3 and Unit Mix worksheets in the supplied template.')
    if 'Scenario 4' in workbook.sheetnames:
        raise ValueError('The output template already contains Scenario 4; use a clean v4 source.')

    scenario_3 = workbook['Scenario 3']
    scenario_4 = workbook.copy_worksheet(scenario_3)
    scenario_4.title = 'Scenario 4'
    workbook._sheets.remove(scenario_4)
    scenario_3_index = workbook._sheets.index(scenario_3)
    workbook._sheets.insert(scenario_3_index + 1, scenario_4)

    # Rewrite copied-sheet self references and Scenario 3's Unit Mix references.
    for row in scenario_4.iter_rows():
        for cell in row:
            value = cell.value
            if isinstance(value, str):
                if cell.coordinate == 'C1':
                    cell.value = 'Underwriting Model Scenario 4'
                elif isinstance(value, str) and value.startswith('='):
                    # Worksheet copying preserves references back to Scenario 3. Scenario 4
                    # must use its own debt schedules and supporting calculations.
                    value = value.replace("'Scenario 3'!", "'Scenario 4'!")
                    value = value.replace("Scenario 3!", "Scenario 4!")
                    value = value.replace("'Unit Mix'!AD3", "'Unit Mix'!AK3")
                    value = re.sub(r"'Unit Mix'!AI(\d+)", r"'Unit Mix'!AP\1", value)
                    cell.value = value
                elif 'Scenario 3' in value:
                    cell.value = value.replace('Scenario 3', 'Scenario 4')

    copy_unit_mix_scenario_4(workbook['Unit Mix'])
    replace_visible_scenario_text(workbook)
    normalize_workbook_views(workbook)

    # Request recalculation when the file is opened in Excel/LibreOffice.
    workbook.calculation.fullCalcOnLoad = True
    workbook.calculation.forceFullCalc = True
    workbook.calculation.calcMode = 'auto'

    destination.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(destination)


def validate_v5(path: Path) -> None:
    workbook = load_workbook(path, data_only=False, keep_links=True)
    scenario_index = workbook.sheetnames.index('Scenario 4')
    assert workbook.sheetnames[scenario_index - 1] == 'Scenario 3', 'Scenario 4 must follow Scenario 3.'
    assert workbook['Scenario 4']['C1'].value == 'Underwriting Model Scenario 4'
    assert workbook['Scenario 4']['F7'].value == "=+'Unit Mix'!AP26", 'Scenario 4 must read Unit Mix AP output.'
    assert workbook['Unit Mix']['AK3'].value == 'Scenario 4 (Max Net LIHTC)'
    assert workbook['Unit Mix']['AP7'].value == '=IF(G7>0,MAX(U7,AB7),N7)'
    assert all(ws.sheet_view.view == 'normal' for ws in workbook.worksheets), 'All workbook views must be normal.'
    stale_refs = [
        cell.coordinate
        for row in workbook['Scenario 4'].iter_rows()
        for cell in row
        if isinstance(cell.value, str)
        and cell.value.startswith('=')
        and re.search(r"(?:'Scenario 3'|Scenario 3)!", cell.value)
    ]
    assert not stale_refs, f'Scenario 4 contains stale Scenario 3 formula references: {stale_refs}'
    print('Validated:', path)
    print('Sheets:', ', '.join(workbook.sheetnames))
    print('Scenario 4 output formula:', workbook['Unit Mix']['AP7'].value)


def main() -> None:
    parser = argparse.ArgumentParser(description='Create and validate GPC Underwriting Model Template v5.')
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    build_v5(args.source, args.destination)
    validate_v5(args.destination)


if __name__ == '__main__':
    main()
