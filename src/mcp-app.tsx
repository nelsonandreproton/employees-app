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
  selectedEmployee?: Employee | null;
  error: string | null;
}

interface UpdateResult {
  success: boolean;
  employee: Employee | null;
  error: string | null;
}

const LOGO_URL = "data:image/jpeg;base64,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RhGzMWEBdSOhgnk0MRjFYPdjFWBC9aVg4ykYXbSF6KKakW26QAFKBwjN18ojioukZHOFOWwocEzI8gWDIeIANsVQMF3eC3xACdLFQHsS4QkcIxP7w//aAAwDAQACAAMAAAAQ99999999999999999999999999999999999999999999999999999734+99999999ufbJcggC989999/0/8AE7hCvMvvb2dKarLDf3rfvffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff/xAAoEQEAAQMDBAEDBQAAAAAAAAABEQAhMUFRYXGRobHwECAwUGDB4fH/2gAIAQMBAT8Q/VbaePPbPikVCXoJsVJtHzTP4SIu57qSoiLaYNMUAwjvh+dIqYiNwt9N/fNPDwrmnbijeea3GyizkikymQ66Us5AibpYwChnpQPS3RbkFtKSUE5Z+zyj3Xr+lYNNL3amWHmvJqDlCVgmb7UZQEhOBrMtqSy7JG6xszUt0OOWbzb+a4lGomN4zTObInJMbxmKAjA4ubT9HE5L0c2ImF7c/wC0XRsIWgqNXyfOzzSZRdIv879aO6GWuJZq2nEIunXSkkQEBO+sxVhKNYhKEI6dTz/VS3dF0sR03+RTgiIA7fsP/8QAKBEAAgEDAwQABwEAAAAAAAAAAREAITFBUWFxkaGx8BAgMFBggcHh/9oACAECAQE/EPuuCPt1tAQDEJVTFSP3NvokQUaHxEOlvm5zeEiZ23HvWL+FQQ0z6oFAMKHPWFpCq7rMNEQAI2BsTxmBHRghYg8kAm3MJkBKkQKFmsEBcHZb5O3PieV5S+RmlBEiEbTs44ISAAOipDH4CyqzsrwAgoJRoqnZRFHOmlqKv8m7GrFPRwKVTVino7OG5WRsePgIxZhWrNNSvu0JAXDVcYj2PfVBUSTRDT3pxDsML+0FKqUmEM8ZgIuRIEVpiVzIw2DCBBGWPt/sVFDaQb50gjCWyT1/A//EACgQAQACAgIBAwMFAQEAAAAAAAERIQAxQVFhcYGREDChIHCxwfBA4f/aAAgBAQABPxD94wj8bKtMgS6mewxEAEx/UHwuLRnkfE/UDPpghgA5cNwczfEUE+i5f0Q6B2+jyKHMf8IZtcKDJ7lYsKpOwxB4P6mRsvbU+KPlYE4GGz4Anuhivl4dHyl+BMgJOir80fCxInQ2NMOpsPEvJiHLJSTbdw8HUc4oUo5LQDpRs5G/IkwvWY+wh7YZO9cKbhIZue52YguIgOYScnJsxciyrEsleDR/GKpcYibgEh4+MgqPMJdEgq+AwI4BUSU1F5I/Ju8Fo2iQIop2/GWlyIuTSIa4X7H+v0/RQ0Z5HzGR8DTofFXujlBWkMvB3OlYqauvqi2psSr7SHI4sGiXqfUEyrpfICVMnyGNO6UnqGFClQggMEg1MrEzzwRVWBEQSniRDseMh4bYomkoWp6ucqHhO4HjHalMz7JVfY/1+n2qRbTyCjaCEIihr1y6DZyiSSpwKcsrFbZLzStpgwakIn3yn7SfI6ezw4SkIM4gmKKNuQwOGBGYmN7fn7P+v0+tT9TNh2JGALXyHMiOagDFHDpL5l9MU9KQe1L9g/Si2hDwpjSsMdhfnJd1kMJNKR2v0cbDOZgDZQS0EK/EoPnlgzIO5EdemBsr0tBSu+WusIwF1EjIBY2pvCBkCxYVC7trB87bOslVOF75fayFpoQpWR3dYdmakA5iSzEowQrvDHhBxK6ZKRhJghqMfoFRJQeUoS8S+M5iogIW6bU9vrKI0OCZfE4FxOAC1FoN/XEg4D3eT+DnBbWIhH5jLPldTj7szTO2QK97wFxaTX8rT29mXFd/qCnuh85HLejUPkPaTziOmCAmT1Q8XSAVOyUxLW0ZSWiIyMkASSClmyt3ExkUJzey2VpUtmn0zSVinA5SUbWzPOCUyEAMnJzOS9sJbgF/jASGFQJIkAur1gZBQiax43rDO3Vnh43kSFwNKTaUSGSYayGWDsPYIkCyW9XE5KXioTAOIHuH6RvKMANA1DuR9cc4Vo97VH4wyFQCCaDgP/W368/emk6Y2eHBzmRT7uz2wYn0AV7RHor1zY3QxGV/fD//2Q==";

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
  logo: {
    width: "36px",
    height: "36px",
    borderRadius: "6px",
    objectFit: "contain" as const,
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

      // If a selected employee is provided, navigate to detail view
      if (data.selectedEmployee) {
        setSelectedEmployee(data.selectedEmployee);
        setView("detail");
      }
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
      // Only include optional fields if they have actual values
      const updateArgs: Record<string, unknown> = {
        Id: editedEmployee.Id,
        Name: editedEmployee.Name,
      };
      if (editedEmployee.NIF) {
        updateArgs.NIF = editedEmployee.NIF;
      }
      if (editedEmployee.DateOfBirth) {
        updateArgs.DateOfBirth = editedEmployee.DateOfBirth;
      }
      if (editedEmployee.Address) {
        updateArgs.Address = editedEmployee.Address;
      }
      if (editedEmployee.Phone) {
        updateArgs.Phone = editedEmployee.Phone;
      }

      const result = await appInstance.callServerTool({
        name: "update-employee",
        arguments: updateArgs,
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
          <img src={LOGO_URL} alt="Logo" style={styles.logo} />
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
          <img src={LOGO_URL} alt="Logo" style={styles.logo} />
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
        <img src={LOGO_URL} alt="Logo" style={styles.logo} />
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
