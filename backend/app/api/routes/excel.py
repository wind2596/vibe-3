from __future__ import annotations

from urllib.parse import quote

from fastapi import APIRouter, Body, HTTPException, Query, Response

from app.services.excel_service import (
    XLSX_MIME,
    build_output_workbook,
    inspect_workbook,
    parse_workbook,
    summarize_merge,
    summarize_split,
)

router = APIRouter()


@router.post("/excel/inspect")
def inspect_excel(
    content: bytes = Body(..., media_type="application/octet-stream"),
    sheet_name: str | None = Query(default=None),
) -> dict:
    return inspect_workbook(content, sheet_name=sheet_name)


@router.post("/excel/preview")
def preview_excel(
    content: bytes = Body(..., media_type="application/octet-stream"),
    sheet_name: str | None = Query(default=None),
    mode: str = Query(default="split"),
    key_columns: str = Query(default=""),
) -> dict:
    _, sheet = parse_workbook(content, sheet_name=sheet_name)
    selected_columns = [column.strip() for column in key_columns.split(",") if column.strip()]
    if mode == "split":
        return summarize_split(sheet, selected_columns)
    if mode == "merge":
        return summarize_merge(sheet, selected_columns)
    raise HTTPException(status_code=400, detail="Unsupported processing mode.")


@router.post("/excel/transform")
def transform_excel(
    content: bytes = Body(..., media_type="application/octet-stream"),
    sheet_name: str | None = Query(default=None),
    mode: str = Query(default="split"),
    key_columns: str = Query(default=""),
) -> Response:
    _, sheet = parse_workbook(content, sheet_name=sheet_name)
    selected_columns = [column.strip() for column in key_columns.split(",") if column.strip()]
    output, _summary = build_output_workbook(sheet, selected_columns, mode)
    filename = "excel-result.xlsx" if mode == "merge" else "excel-split-result.xlsx"
    disposition = f"attachment; filename={filename}; filename*=UTF-8''{quote(filename)}"
    return Response(
        content=output,
        media_type=XLSX_MIME,
        headers={"Content-Disposition": disposition},
    )
