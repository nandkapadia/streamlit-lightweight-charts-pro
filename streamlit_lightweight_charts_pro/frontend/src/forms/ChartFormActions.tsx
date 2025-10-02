/**
 * React 19 Form Actions for chart configuration and data management
 * Provides native form handling with enhanced UX and server integration
 */

import React, { useTransition } from 'react';
import { useChartFormActions } from '../hooks/useChartFormActions';
import { react19Monitor } from '../utils/react19PerformanceMonitor';

interface ChartConfigFormProps {
  chartId: string;
  initialConfig?: any;
  onConfigUpdate?: (config: any) => void;
}

/**
 * Chart Configuration Form with React 19 Form Actions
 */
export const ChartConfigForm: React.FC<ChartConfigFormProps> = React.memo(({
  chartId,
  initialConfig,
  onConfigUpdate,
}) => {
  const [isPending, startTransition] = useTransition();
  const { config } = useChartFormActions();

  const handleFormSubmit = React.useCallback((formData: FormData) => {
    startTransition(() => {
      const transitionId = react19Monitor.startTransition('ChartConfigSubmit', 'sync');

      // Add chartId to form data
      formData.append('chartId', chartId);

      config.submitAction(formData);

      react19Monitor.endTransition(transitionId);
    });
  }, [chartId, config, startTransition]);

  React.useEffect(() => {
    if (config.state.data && config.state.lastAction === 'config_updated') {
      onConfigUpdate?.(config.state.data);
    }
  }, [config.state.data, config.state.lastAction, onConfigUpdate]);

  const isSubmitting = config.isSubmitting || isPending;

  return (
    <form action={handleFormSubmit} className="chart-config-form">
      <div className="form-header">
        <h3>Chart Configuration</h3>
        {isSubmitting && <div className="loading-spinner">⏳</div>}
      </div>

      {/* Title */}
      <div className="form-group">
        <label htmlFor="title">Chart Title</label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={initialConfig?.title || ''}
          disabled={isSubmitting}
          className={config.hasFieldError('title') ? 'error' : ''}
        />
        {config.getFieldError('title') && (
          <span className="field-error">{config.getFieldError('title')}</span>
        )}
      </div>

      {/* Dimensions */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="width">Width (px)</label>
          <input
            type="number"
            id="width"
            name="width"
            min="100"
            defaultValue={initialConfig?.width || 800}
            disabled={isSubmitting}
            className={config.hasFieldError('width') ? 'error' : ''}
          />
          {config.getFieldError('width') && (
            <span className="field-error">{config.getFieldError('width')}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="height">Height (px)</label>
          <input
            type="number"
            id="height"
            name="height"
            min="100"
            defaultValue={initialConfig?.height || 400}
            disabled={isSubmitting}
            className={config.hasFieldError('height') ? 'error' : ''}
          />
          {config.getFieldError('height') && (
            <span className="field-error">{config.getFieldError('height')}</span>
          )}
        </div>
      </div>

      {/* Background Color */}
      <div className="form-group">
        <label htmlFor="backgroundColor">Background Color</label>
        <input
          type="color"
          id="backgroundColor"
          name="backgroundColor"
          defaultValue={initialConfig?.backgroundColor || '#ffffff'}
          disabled={isSubmitting}
        />
      </div>

      {/* Chart Features */}
      <div className="form-group">
        <fieldset>
          <legend>Chart Features</legend>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="gridVisible"
              value="true"
              defaultChecked={initialConfig?.gridVisible ?? true}
              disabled={isSubmitting}
            />
            Show Grid
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="crosshairEnabled"
              value="true"
              defaultChecked={initialConfig?.crosshairEnabled ?? true}
              disabled={isSubmitting}
            />
            Enable Crosshair
          </label>
        </fieldset>
      </div>

      {/* Time Scale */}
      <div className="form-group">
        <fieldset>
          <legend>Time Scale</legend>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="timeScaleVisible"
              value="true"
              defaultChecked={initialConfig?.timeScale?.visible ?? true}
              disabled={isSubmitting}
            />
            Show Time Scale
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="timeVisible"
              value="true"
              defaultChecked={initialConfig?.timeScale?.timeVisible ?? true}
              disabled={isSubmitting}
            />
            Show Time
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="secondsVisible"
              value="true"
              defaultChecked={initialConfig?.timeScale?.secondsVisible ?? false}
              disabled={isSubmitting}
            />
            Show Seconds
          </label>
        </fieldset>
      </div>

      {/* Price Scale */}
      <div className="form-group">
        <fieldset>
          <legend>Price Scale</legend>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="priceScaleVisible"
              value="true"
              defaultChecked={initialConfig?.priceScale?.visible ?? true}
              disabled={isSubmitting}
            />
            Show Price Scale
          </label>

          <div className="form-group">
            <label htmlFor="priceScalePosition">Position</label>
            <select
              id="priceScalePosition"
              name="priceScalePosition"
              defaultValue={initialConfig?.priceScale?.position || 'right'}
              disabled={isSubmitting}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="autoScale"
              value="true"
              defaultChecked={initialConfig?.priceScale?.autoScale ?? true}
              disabled={isSubmitting}
            />
            Auto Scale
          </label>
        </fieldset>
      </div>

      {/* Error Display */}
      {config.hasError && (
        <div className="form-error">
          <strong>Error:</strong> {config.state.error}
        </div>
      )}

      {/* Success Message */}
      {config.state.lastAction === 'config_updated' && (
        <div className="form-success">
          ✅ Configuration updated successfully!
        </div>
      )}

      {/* Submit Button */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className="primary-button"
        >
          {isSubmitting ? 'Updating...' : 'Update Configuration'}
        </button>

        <button
          type="button"
          onClick={config.resetForm}
          disabled={isSubmitting}
          className="secondary-button"
        >
          Reset
        </button>
      </div>

      <style>{`
        .chart-config-form {
          max-width: 500px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .form-header h3 {
          margin: 0;
          color: #333;
        }

        .loading-spinner {
          font-size: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #555;
        }

        input, select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        input:disabled, select:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        input.error {
          border-color: #dc3545;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .checkbox-label input {
          width: auto;
          margin-right: 8px;
        }

        fieldset {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          margin: 0;
        }

        legend {
          font-weight: 500;
          color: #555;
          padding: 0 8px;
        }

        .field-error {
          color: #dc3545;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .form-error {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .form-success {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .primary-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .primary-button:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .primary-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }

        .secondary-button {
          background-color: transparent;
          color: #6c757d;
          border: 1px solid #6c757d;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .secondary-button:hover:not(:disabled) {
          background-color: #6c757d;
          color: white;
        }

        .secondary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
});

ChartConfigForm.displayName = 'ChartConfigForm';

/**
 * Data Import Form with React 19 Form Actions
 */
export const ChartDataImportForm: React.FC<{
  chartId: string;
  onImportComplete?: (data: any) => void;
}> = React.memo(({ chartId, onImportComplete }) => {
  const { import: importForm } = useChartFormActions();

  React.useEffect(() => {
    if (importForm.isCompleted && importForm.progress.completed) {
      onImportComplete?.(importForm.progress);
    }
  }, [importForm.isCompleted, importForm.progress, onImportComplete]);

  return (
    <form action={importForm.submitAction} className="data-import-form">
      <div className="form-header">
        <h3>Import Chart Data</h3>
        {importForm.isPending && <div className="loading-spinner">⏳</div>}
      </div>

      <input type="hidden" name="chartId" value={chartId} />

      <div className="form-group">
        <label htmlFor="dataFile">Select Data File</label>
        <input
          type="file"
          id="dataFile"
          name="dataFile"
          accept=".csv,.json,.xlsx,.xls"
          disabled={importForm.isPending}
          required
        />
        {importForm.state.validationErrors?.dataFile && (
          <span className="field-error">
            {importForm.state.validationErrors.dataFile}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="dataType">Data Format</label>
        <select
          id="dataType"
          name="dataType"
          disabled={importForm.isPending}
          required
        >
          <option value="">Select format...</option>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="excel">Excel</option>
        </select>
        {importForm.state.validationErrors?.dataType && (
          <span className="field-error">
            {importForm.state.validationErrors.dataType}
          </span>
        )}
      </div>

      {importForm.state.error && (
        <div className="form-error">
          <strong>Error:</strong> {importForm.state.error}
        </div>
      )}

      {importForm.isCompleted && (
        <div className="import-success">
          <h4>✅ Import Successful!</h4>
          <p><strong>File:</strong> {importForm.progress.fileName}</p>
          <p><strong>Records:</strong> {importForm.progress.recordCount}</p>

          {importForm.progress.preview && (
            <div className="data-preview">
              <h5>Data Preview:</h5>
              <div className="preview-table">
                {importForm.progress.preview.slice(0, 3).map((row: any, i: number) => (
                  <div key={i} className="preview-row">
                    <strong>Row {i + 1}:</strong> {JSON.stringify(row)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="form-actions">
        <button
          type="submit"
          disabled={importForm.isPending}
          className="primary-button"
        >
          {importForm.isPending ? 'Importing...' : 'Import Data'}
        </button>
      </div>

      <style>{`
        .data-import-form {
          max-width: 400px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .import-success {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 16px;
          border-radius: 4px;
          margin: 16px 0;
        }

        .data-preview {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #c3e6cb;
        }

        .preview-table {
          max-height: 200px;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.5);
          padding: 8px;
          border-radius: 4px;
          margin-top: 8px;
        }

        .preview-row {
          margin-bottom: 4px;
          font-size: 12px;
          word-break: break-all;
        }

        /* Inherit other styles from ChartConfigForm */
        .form-header,
        .form-group,
        .form-error,
        .form-actions,
        .primary-button,
        .field-error,
        .loading-spinner {
          /* Same styles as ChartConfigForm */
        }
      `}</style>
    </form>
  );
});

ChartDataImportForm.displayName = 'ChartDataImportForm';
