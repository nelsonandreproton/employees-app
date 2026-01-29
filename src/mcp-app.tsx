import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";

interface Employee {
  Id: number;
  Name: string;
  NIF?: number;
  DateOfBirth?: string;
  Address?: string;
  CreatedOn?: string;
  Phone?: string;
}

type View = "list" | "detail" | "edit";

interface ListResult {
  employees: Employee[];
  error: string | null;
}

interface UpdateResult {
  success: boolean;
  employee: Employee | null;
  error: string | null;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
    padding: "16px",
    background: "var(--color-background-primary, #ffffff)",
    color: "var(--color-text-primary, #1a1a1a)",
  },
  header: {
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: 600,
    margin: 0,
    flex: 1,
  },
  button: {
    padding: "8px 16px",
    border: "1px solid var(--color-border-primary, #ccc)",
    borderRadius: "6px",
    background: "var(--color-background-secondary, #f5f5f5)",
    color: "var(--color-text-primary, inherit)",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  buttonPrimary: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    background: "#0066cc",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  buttonDisabled: {
    padding: "8px 16px",
    border: "1px solid var(--color-border-primary, #ccc)",
    borderRadius: "6px",
    background: "var(--color-background-secondary, #e0e0e0)",
    color: "#999",
    cursor: "not-allowed",
    fontSize: "0.875rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  listItem: {
    padding: "12px 16px",
    border: "1px solid var(--color-border-primary, #ddd)",
    borderRadius: "6px",
    background: "var(--color-background-secondary, #f9f9f9)",
    cursor: "pointer",
  },
  listItemName: {
    fontSize: "1rem",
    fontWeight: 500,
    marginBottom: "4px",
  },
  listItemMeta: {
    fontSize: "0.875rem",
    color: "var(--color-text-secondary, #666)",
  },
  detailCard: {
    padding: "20px",
    border: "1px solid var(--color-border-primary, #ddd)",
    borderRadius: "8px",
    background: "var(--color-background-secondary, #f9f9f9)",
  },
  detailName: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--color-border-primary, #ddd)",
  },
  detailRow: {
    display: "flex",
    padding: "10px 0",
    borderBottom: "1px solid var(--color-border-secondary, #eee)",
    alignItems: "center",
  },
  detailLabel: {
    width: "120px",
    flexShrink: 0,
    fontWeight: 500,
    color: "var(--color-text-secondary, #666)",
    fontSize: "0.875rem",
  },
  detailValue: {
    flex: 1,
    fontSize: "1rem",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid var(--color-border-primary, #ccc)",
    borderRadius: "4px",
    fontSize: "1rem",
    background: "var(--color-background-primary, #fff)",
    color: "var(--color-text-primary, inherit)",
  },
  message: {
    padding: "24px",
    textAlign: "center",
    color: "var(--color-text-secondary, #666)",
  },
  error: {
    padding: "16px",
    borderRadius: "6px",
    background: "#fee",
    color: "#c00",
    border: "1px solid #fcc",
    marginBottom: "16px",
  },
  success: {
    padding: "16px",
    borderRadius: "6px",
    background: "#efe",
    color: "#060",
    border: "1px solid #cfc",
    marginBottom: "16px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid var(--color-border-primary, #ddd)",
  },
};

function EmployeeBrowserApp() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editedEmployee, setEditedEmployee] = useState<Employee | null>(null);
  const [view, setView] = useState<View>("list");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();
  const [appInstance, setAppInstance] = useState<App | null>(null);

  const handleToolResult = useCallback((result: CallToolResult) => {
    console.info("Processing tool result:", result);
    if (result.isError) {
      setError("Failed to load data");
      setLoading(false);
      return;
    }

    const data = result.structuredContent as unknown as ListResult;
    console.info("Parsed data:", data);
    if (data?.error) {
      setError(data.error);
    } else if (data?.employees) {
      setEmployees(data.employees);
      setError(null);
    }
    setLoading(false);
  }, []);

  const { app, error: appError } = useApp({
    appInfo: { name: "Employee Browser", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (instance) => {
      setAppInstance(instance);

      instance.onteardown = async () => {
        console.info("App is being torn down");
        return {};
      };

      instance.ontoolinput = async (input) => {
        console.info("Received tool call input:", input);
      };

      instance.ontoolresult = async (result) => {
        console.info("Received tool call result:", result);
        handleToolResult(result);
      };

      instance.ontoolcancelled = (params) => {
        console.info("Tool call cancelled:", params.reason);
      };

      instance.onerror = console.error;

      instance.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
    },
  });

  useHostStyles(app);

  useEffect(() => {
    if (app) {
      setHostContext(app.getHostContext());
    }
  }, [app]);

  const handleEmployeeClick = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setView("detail");
    setError(null);
    setSuccessMessage(null);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedEmployee(null);
    setEditedEmployee(null);
    setView("list");
    setError(null);
    setSuccessMessage(null);
  }, []);

  const handleEditClick = useCallback(() => {
    if (selectedEmployee) {
      setEditedEmployee({ ...selectedEmployee });
      setView("edit");
      setError(null);
      setSuccessMessage(null);
    }
  }, [selectedEmployee]);

  const handleCancelEdit = useCallback(() => {
    setEditedEmployee(null);
    setView("detail");
    setError(null);
  }, []);

  const handleInputChange = useCallback((field: keyof Employee, value: string | number) => {
    setEditedEmployee((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!appInstance || !editedEmployee) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await appInstance.callServerTool({
        name: "update-employee",
        arguments: {
          Id: editedEmployee.Id,
          Name: editedEmployee.Name,
          NIF: editedEmployee.NIF || 0,
          DateOfBirth: editedEmployee.DateOfBirth || "",
          Address: editedEmployee.Address || "",
          Phone: editedEmployee.Phone || "",
        },
      });

      const data = result.structuredContent as unknown as UpdateResult;

      if (data?.error) {
        setError(data.error);
      } else if (data?.success && data?.employee) {
        setSelectedEmployee(data.employee);
        setEditedEmployee(null);
        setView("detail");
        setSuccessMessage("Employee updated successfully!");

        // Update the employee in the list
        setEmployees((prev) =>
          prev.map((emp) => (emp.Id === data.employee!.Id ? data.employee! : emp))
        );
      }
    } catch (e) {
      console.error("Error updating employee:", e);
      setError("Failed to update employee");
    } finally {
      setSaving(false);
    }
  }, [appInstance, editedEmployee]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toISOString().split("T")[0];
    } catch {
      return dateStr;
    }
  };

  if (appError) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <strong>Connection Error:</strong> {appError.message}
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div style={styles.container}>
        <div style={styles.message}>Connecting...</div>
      </div>
    );
  }

  const safeArea = hostContext?.safeAreaInsets;
  const containerStyle = {
    ...styles.container,
    paddingTop: safeArea?.top ? safeArea.top + 16 : 16,
    paddingRight: safeArea?.right ? safeArea.right + 16 : 16,
    paddingBottom: safeArea?.bottom ? safeArea.bottom + 16 : 16,
    paddingLeft: safeArea?.left ? safeArea.left + 16 : 16,
  };

  // Edit View
  if (view === "edit" && editedEmployee) {
    return (
      <div style={containerStyle}>
        <header style={styles.header}>
          <button style={styles.button} onClick={handleCancelEdit} disabled={saving}>
            ← Cancel
          </button>
          <h1 style={styles.title}>Edit Employee</h1>
        </header>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.detailCard}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Employee ID</span>
            <span style={styles.detailValue}>{editedEmployee.Id}</span>
          </div>

          <div style={styles.detailRow}>
            <label style={styles.detailLabel}>Name *</label>
            <input
              style={styles.input}
              type="text"
              value={editedEmployee.Name}
              onChange={(e) => handleInputChange("Name", e.target.value)}
              disabled={saving}
            />
          </div>

          <div style={styles.detailRow}>
            <label style={styles.detailLabel}>NIF</label>
            <input
              style={styles.input}
              type="number"
              value={editedEmployee.NIF || ""}
              onChange={(e) => handleInputChange("NIF", parseInt(e.target.value) || 0)}
              disabled={saving}
            />
          </div>

          <div style={styles.detailRow}>
            <label style={styles.detailLabel}>Date of Birth</label>
            <input
              style={styles.input}
              type="date"
              value={formatDateForInput(editedEmployee.DateOfBirth)}
              onChange={(e) => handleInputChange("DateOfBirth", e.target.value)}
              disabled={saving}
            />
          </div>

          <div style={styles.detailRow}>
            <label style={styles.detailLabel}>Phone</label>
            <input
              style={styles.input}
              type="tel"
              value={editedEmployee.Phone || ""}
              onChange={(e) => handleInputChange("Phone", e.target.value)}
              disabled={saving}
            />
          </div>

          <div style={{ ...styles.detailRow, borderBottom: "none" }}>
            <label style={styles.detailLabel}>Address</label>
            <input
              style={styles.input}
              type="text"
              value={editedEmployee.Address || ""}
              onChange={(e) => handleInputChange("Address", e.target.value)}
              disabled={saving}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button
              style={saving ? styles.buttonDisabled : styles.buttonPrimary}
              onClick={handleSave}
              disabled={saving || !editedEmployee.Name.trim()}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              style={saving ? styles.buttonDisabled : styles.button}
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Detail View
  if (view === "detail" && selectedEmployee) {
    return (
      <div style={containerStyle}>
        <header style={styles.header}>
          <button style={styles.button} onClick={handleBackToList}>
            ← Back to List
          </button>
          <h1 style={styles.title}>{selectedEmployee.Name}</h1>
          <button style={styles.buttonPrimary} onClick={handleEditClick}>
            Edit
          </button>
        </header>

        {error && <div style={styles.error}>{error}</div>}
        {successMessage && <div style={styles.success}>{successMessage}</div>}

        <div style={styles.detailCard}>
          <div style={styles.detailName}>{selectedEmployee.Name}</div>

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Employee ID</span>
            <span style={styles.detailValue}>{selectedEmployee.Id}</span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>NIF</span>
            <span style={styles.detailValue}>
              {selectedEmployee.NIF || "—"}
            </span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Date of Birth</span>
            <span style={styles.detailValue}>
              {formatDate(selectedEmployee.DateOfBirth)}
            </span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Phone</span>
            <span style={styles.detailValue}>
              {selectedEmployee.Phone || "—"}
            </span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Address</span>
            <span style={styles.detailValue}>
              {selectedEmployee.Address || "—"}
            </span>
          </div>

          <div style={{ ...styles.detailRow, borderBottom: "none" }}>
            <span style={styles.detailLabel}>Created On</span>
            <span style={styles.detailValue}>
              {formatDateTime(selectedEmployee.CreatedOn)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div style={containerStyle}>
      <header style={styles.header}>
        <h1 style={styles.title}>Employees ({employees.length})</h1>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      {loading && !error && <div style={styles.message}>Loading employees...</div>}

      {!loading && !error && employees.length === 0 && (
        <div style={styles.message}>No employees found</div>
      )}

      {!loading && !error && employees.length > 0 && (
        <div style={styles.list}>
          {employees.map((employee) => (
            <div
              key={employee.Id}
              style={styles.listItem}
              onClick={() => handleEmployeeClick(employee)}
            >
              <div style={styles.listItemName}>{employee.Name}</div>
              <div style={styles.listItemMeta}>
                ID: {employee.Id}
                {employee.Phone && ` • Phone: ${employee.Phone}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EmployeeBrowserApp />
  </StrictMode>
);
