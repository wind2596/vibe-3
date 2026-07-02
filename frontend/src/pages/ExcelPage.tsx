import { useEffect, useMemo, useState } from 'react';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { downloadExcel, inspectExcel, previewExcel } from '../lib/api';
import type { ExcelInspectResponse, ExcelPreviewResponse } from '../types/excel';

type Mode = 'split' | 'merge';

function buildDownloadName(originalName: string, mode: Mode) {
  const base = originalName.replace(/\.[^.]+$/, '');
  return `${base}-${mode === 'split' ? 'split' : 'merge'}.xlsx`;
}

function formatCellValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
}

export function ExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [inspect, setInspect] = useState<ExcelInspectResponse | null>(null);
  const [preview, setPreview] = useState<ExcelPreviewResponse | null>(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>('split');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableColumns = useMemo(() => inspect?.columns ?? [], [inspect]);
  const currentPreviewRows = preview?.preview_rows ?? inspect?.preview_rows ?? [];
  const currentPreviewColumns = currentPreviewRows.length > 0 ? Object.keys(currentPreviewRows[0]) : availableColumns;

  useEffect(() => {
    if (!inspect) {
      return;
    }
    setSelectedSheet(inspect.selected_sheet);
    setSelectedColumns((current) => (current.length > 0 ? current.filter((column) => inspect.columns.includes(column)) : inspect.columns.slice(0, 2)));
  }, [inspect]);

  useEffect(() => {
    if (mode === 'merge' && selectedColumns.length < 1 && availableColumns.length > 0) {
      setSelectedColumns(availableColumns.slice(0, 1));
    }
  }, [availableColumns, mode, selectedColumns.length]);

  async function handleFileChange(nextFile: File | null) {
    setFile(nextFile);
    setInspect(null);
    setPreview(null);
    setMessage(null);
    setError(null);

    if (!nextFile) {
      return;
    }

    setLoading(true);
    try {
      const info = await inspectExcel(nextFile);
      setInspect(info);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to inspect the workbook.');
    } finally {
      setLoading(false);
    }
  }

  function toggleColumn(column: string) {
    setSelectedColumns((current) =>
      current.includes(column) ? current.filter((item) => item !== column) : [...current, column],
    );
  }

  async function handlePreview() {
    if (!file) {
      setError('Upload an Excel file first.');
      return;
    }
    if (selectedColumns.length === 0) {
      setError('Select at least one key column.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await previewExcel(file, {
        sheetName: selectedSheet || undefined,
        mode,
        keyColumns: selectedColumns,
      });
      setPreview(result);
      setMessage(mode === 'split' ? 'Split preview generated.' : 'Merge preview generated.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to generate a preview.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!file) {
      setError('Upload an Excel file first.');
      return;
    }
    if (selectedColumns.length === 0) {
      setError('Select at least one key column.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const blob = await downloadExcel(file, {
        sheetName: selectedSheet || undefined,
        mode,
        keyColumns: selectedColumns,
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = buildDownloadName(file.name, mode);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Result workbook download started.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to download the result workbook.');
    } finally {
      setLoading(false);
    }
  }

  const summaryRows = preview?.summary_rows ?? [];

  return (
    <div className="page-stack excel-page">
      <section className="hero excel-hero">
        <div className="hero-copy">
          <span className="eyebrow">Excel Automation</span>
          <h1>Upload, inspect, split, merge</h1>
          <p>
            Inspect an XLSX workbook, choose a target sheet and key columns, preview the transformation, and download the
            generated result.
          </p>
        </div>

        <div className="hero-grid hero-grid--compact">
          <StatusPill label="File" value={file?.name ?? 'No file'} tone={file ? 'success' : 'neutral'} />
          <StatusPill
            label="Key columns"
            value={selectedColumns.length > 0 ? selectedColumns.join(', ') : 'None'}
            tone={selectedColumns.length > 0 ? 'success' : 'warning'}
          />
          <StatusPill label="Mode" value={mode === 'split' ? 'Split' : 'Merge'} tone="neutral" />
        </div>
      </section>

      {error ? (
        <section className="alert alert--danger" role="alert">
          {error}
        </section>
      ) : null}

      {message ? (
        <section className="alert alert--success" role="status">
          {message}
        </section>
      ) : null}

      <div className="two-column excel-grid">
        <SectionCard title="Workbook" description="Upload an xlsx file and inspect the available sheets and columns.">
          <div className="excel-upload">
            <label className="field">
              <span>Workbook file</span>
              <input
                type="file"
                accept=".xlsx"
                onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
              />
            </label>

            {inspect ? (
              <div className="excel-sheet-panel">
                <div className="toolbar">
                  <div className="toolbar-group toolbar-group--stack">
                    <strong>{inspect.sheet_names.length} sheet(s)</strong>
                    <span>{inspect.selected_sheet}</span>
                  </div>

                  <label className="field field--compact">
                    <span>Sheet</span>
                    <select value={selectedSheet} onChange={(event) => setSelectedSheet(event.target.value)}>
                      {inspect.sheet_names.map((sheetName) => (
                        <option key={sheetName} value={sheetName}>
                          {sheetName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="preview-meta">
                  <div>
                    <span>Rows</span>
                    <strong>{inspect.row_count}</strong>
                  </div>
                  <div>
                    <span>Columns</span>
                    <strong>{inspect.columns.length}</strong>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {inspect.columns.map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inspect.preview_rows.length === 0 ? (
                        <tr>
                          <td className="empty-cell" colSpan={inspect.columns.length}>
                            No preview rows available.
                          </td>
                        </tr>
                      ) : (
                        inspect.preview_rows.map((row, index) => (
                          <tr key={`${inspect.selected_sheet}-${index}`}>
                            {inspect.columns.map((column) => (
                              <td key={column}>{formatCellValue(row[column])}</td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="Transform" description="Choose split or merge, then select the key columns used for grouping.">
          <div className="mode-switch">
            <button
              type="button"
              className={mode === 'split' ? 'mode-switch__button is-active' : 'mode-switch__button'}
              onClick={() => setMode('split')}
            >
              Split
            </button>
            <button
              type="button"
              className={mode === 'merge' ? 'mode-switch__button is-active' : 'mode-switch__button'}
              onClick={() => setMode('merge')}
            >
              Merge
            </button>
          </div>

          <div className="choice-list">
            {availableColumns.map((column) => (
              <button
                type="button"
                key={column}
                className={selectedColumns.includes(column) ? 'choice choice--active' : 'choice'}
                onClick={() => toggleColumn(column)}
              >
                {column}
              </button>
            ))}
          </div>

          <div className="action-row">
            <button type="button" className="secondary-button" onClick={() => void handlePreview()} disabled={loading}>
              Preview
            </button>
            <button type="button" className="primary-button" onClick={() => void handleDownload()} disabled={loading}>
              Download
            </button>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <span>Selected columns</span>
              <strong>{selectedColumns.length > 0 ? selectedColumns.join(' / ') : 'None'}</strong>
            </div>
            <div className="summary-card">
              <span>Preview mode</span>
              <strong>{preview?.mode ?? mode}</strong>
            </div>
            <div className="summary-card">
              <span>Groups</span>
              <strong>{preview?.group_count ?? 0}</strong>
            </div>
          </div>

          {summaryRows.length > 0 ? (
            <div className="mini-table">
              <table className="data-table data-table--compact">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Label</th>
                    <th>Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row) => (
                    <tr key={row.index}>
                      <td>{row.index}</td>
                      <td>{row.label}</td>
                      <td>{row.row_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard title="Result preview" description="Inspect the transformed rows before downloading the generated workbook.">
        <div className="excel-result-head">
          <div className="summary-card">
            <span>Output sheets</span>
            <strong>{preview?.output_sheet_names.join(', ') ?? 'None yet'}</strong>
          </div>
          <div className="summary-card">
            <span>Total rows</span>
            <strong>{preview?.total_rows ?? 0}</strong>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {currentPreviewColumns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPreviewRows.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={currentPreviewColumns.length || 1}>
                    Upload a workbook to start.
                  </td>
                </tr>
              ) : (
                currentPreviewRows.map((row, index) => (
                  <tr key={index}>
                    {currentPreviewColumns.map((column) => (
                      <td key={column}>{formatCellValue(row[column])}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
