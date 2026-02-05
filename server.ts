import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

const BASE_URL = "https://nelsonandre.outsystemscloud.com/MCPServer/rest/MCP";

interface Employee {
  Id: number;
  Name: string;
  NIF?: number;
  DateOfBirth?: string;
  Address?: string;
  CreatedOn?: string;
  Phone?: string;
}

const employeeSchema = z.object({
  Id: z.number(),
  Name: z.string(),
  NIF: z.number().optional(),
  DateOfBirth: z.string().optional(),
  Address: z.string().optional(),
  CreatedOn: z.string().optional(),
  Phone: z.string().optional(),
});

async function fetchEmployees(): Promise<Employee[]> {
  const response = await fetch(`${BASE_URL}/GetEmployees`);
  if (!response.ok) {
    throw new Error(`Failed to fetch employees (HTTP ${response.status})`);
  }
  return response.json() as Promise<Employee[]>;
}

async function fetchEmployeeById(id: number): Promise<Employee> {
  const response = await fetch(`${BASE_URL}/GetEmployeeBy?EmployeeId=${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Employee not found");
    }
    throw new Error(`Failed to fetch employee (HTTP ${response.status})`);
  }
  return response.json() as Promise<Employee>;
}

async function updateEmployee(employee: Employee): Promise<void> {
  const response = await fetch(`${BASE_URL}/EmployeeUpdate`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employee),
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Employee not found");
    }
    // Try to get more details from the response body
    let errorDetail = "";
    try {
      const errorBody = await response.text();
      if (errorBody) {
        errorDetail = `: ${errorBody}`;
      }
    } catch {
      // Ignore if we can't read the body
    }
    throw new Error(`Failed to update employee (HTTP ${response.status})${errorDetail}`);
  }
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "Employee Browser",
    version: "1.0.0",
  });

  const resourceUri = "ui://employee-browser/mcp-app.html";

  // Tool to list all employees (main entry point)
  registerAppTool(
    server,
    "list-employees",
    {
      title: "List Employees",
      description: "Returns a list of all employees to display in the browser UI.",
      inputSchema: z.object({}),
      outputSchema: z.object({
        employees: z.array(employeeSchema),
        error: z.string().nullable(),
      }),
      _meta: { ui: { resourceUri } },
    },
    async (): Promise<CallToolResult> => {
      try {
        const employees = await fetchEmployees();
        const result = { employees, error: null };
        return {
          content: [{ type: "text", text: `Displayed ${employees.length} employees in the UI above. Do not list employees in text form.` }],
          structuredContent: result,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        const result = { employees: [], error };
        return {
          content: [{ type: "text", text: `Error: ${error}` }],
          structuredContent: result,
        };
      }
    }
  );

  // Tool to show employee details in the UI (callable by Claude)
  registerAppTool(
    server,
    "show-employee-details",
    {
      title: "Show Employee Details",
      description: "USE THIS TOOL when the user asks to see, view, or show employee details. Displays the employee information in an interactive visual UI panel.",
      inputSchema: z.object({
        employeeId: z.number().describe("The ID of the employee to show"),
      }),
      outputSchema: z.object({
        employees: z.array(employeeSchema),
        selectedEmployee: employeeSchema.nullable(),
        error: z.string().nullable(),
      }),
      _meta: { ui: { resourceUri } },
    },
    async ({ employeeId }): Promise<CallToolResult> => {
      try {
        const [employees, selectedEmployee] = await Promise.all([
          fetchEmployees(),
          fetchEmployeeById(employeeId),
        ]);
        const result = { employees, selectedEmployee, error: null };
        return {
          content: [{ type: "text", text: `Displayed details for ${selectedEmployee.Name} in the UI above. Do not repeat the details in text form.` }],
          structuredContent: result,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        const result = { employees: [], selectedEmployee: null, error };
        return {
          content: [{ type: "text", text: `Error: ${error}` }],
          structuredContent: result,
        };
      }
    }
  );

  // Tool to get employee details (called from UI only - not for Claude)
  registerAppTool(
    server,
    "get-employee-details",
    {
      title: "Get Employee Details",
      description: "Internal API for the UI app. Do NOT use this directly - use show-employee-details instead to display employee details to the user.",
      inputSchema: z.object({
        employeeId: z.number().describe("The ID of the employee to fetch"),
      }),
      outputSchema: z.object({
        employee: employeeSchema.nullable(),
        error: z.string().nullable(),
      }),
      _meta: { ui: { resourceUri, visibility: ["app"] } },
    },
    async ({ employeeId }): Promise<CallToolResult> => {
      try {
        const employee = await fetchEmployeeById(employeeId);
        const result = { employee, error: null };
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        const result = { employee: null, error };
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
        };
      }
    }
  );

  // Tool to refresh employee list (called from UI)
  registerAppTool(
    server,
    "refresh-employees",
    {
      title: "Refresh Employee List",
      description: "Refreshes the employee list from the server.",
      inputSchema: z.object({}),
      outputSchema: z.object({
        employees: z.array(employeeSchema),
        error: z.string().nullable(),
      }),
      _meta: { ui: { resourceUri, visibility: ["app"] } },
    },
    async (): Promise<CallToolResult> => {
      try {
        const employees = await fetchEmployees();
        const result = { employees, error: null };
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        const result = { employees: [], error };
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
        };
      }
    }
  );

  // Tool to update employee (called from UI)
  registerAppTool(
    server,
    "update-employee",
    {
      title: "Update Employee",
      description: "Updates an employee's information.",
      inputSchema: z.object({
        Id: z.number().describe("The ID of the employee to update"),
        Name: z.string().describe("Employee name"),
        NIF: z.number().optional().describe("Tax identification number"),
        DateOfBirth: z.string().optional().describe("Date of birth (YYYY-MM-DD)"),
        Address: z.string().optional().describe("Employee address"),
        Phone: z.string().optional().describe("Phone number"),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        employee: employeeSchema.nullable(),
        error: z.string().nullable(),
      }),
      _meta: { ui: { resourceUri, visibility: ["app"] } },
    },
    async (employeeData): Promise<CallToolResult> => {
      try {
        await updateEmployee(employeeData as Employee);
        // Fetch the updated employee to return current state
        const employee = await fetchEmployeeById(employeeData.Id);
        const result = { success: true, employee, error: null };
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        const result = { success: false, employee: null, error };
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
        };
      }
    }
  );

  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(
        path.join(DIST_DIR, "mcp-app.html"),
        "utf-8"
      );

      return {
        contents: [
          { uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    }
  );

  return server;
}
