# Employee Browser MCP App

An interactive MCP App for browsing, viewing, and editing employee data. Built with the [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps) and React.

## Features

- **Employee List** - View all employees with name, ID, and phone number
- **Employee Details** - View complete employee information including NIF, date of birth, address, and creation date
- **Edit Employee** - Update employee information with an inline form
- **Navigation** - Seamless navigation between list, detail, and edit views

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

This will:
1. Type-check the TypeScript code
2. Bundle the React UI into a single HTML file using Vite
3. Compile the server TypeScript files

## Running

### Development Mode

```bash
npm run dev
```

This runs the Vite watcher and server concurrently with hot reload.

### Production Mode

```bash
npm run build
npm run serve
```

The MCP server will start on `http://localhost:3001/mcp`.

## Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "employee-browser": {
      "command": "npx",
      "args": ["tsx", "C:\\dev\\employee-app\\main.ts", "--stdio"]
    }
  }
}
```

Restart Claude Desktop after adding the configuration.

## Usage

Once configured, ask Claude to "list employees" and the interactive Employee Browser UI will appear. You can:

1. Click on any employee to view their details
2. Click "Edit" to modify employee information
3. Click "Back to List" to return to the employee list

## Project Structure

```
employee-app/
├── src/
│   ├── mcp-app.tsx      # React UI component
│   └── global.css       # Global styles
├── dist/                # Build output
├── server.ts            # MCP server with tools
├── main.ts              # Server entry point (HTTP/stdio)
├── mcp-app.html         # HTML entry point for Vite
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript config (UI)
├── tsconfig.server.json # TypeScript config (server)
└── package.json
```

## MCP Tools

| Tool | Description | Visibility |
|------|-------------|------------|
| `list-employees` | Returns all employees | Model + App |
| `get-employee-details` | Get employee by ID | App only |
| `refresh-employees` | Reload employee list | App only |
| `update-employee` | Update employee data | App only |

## API Backend

The app connects to a REST API at:
`https://nelsonandre.outsystemscloud.com/MCPServer/rest/MCP`

### Endpoints Used

- `GET /GetEmployees` - List all employees
- `GET /GetEmployeeBy?EmployeeId={id}` - Get employee by ID
- `PATCH /EmployeeUpdate` - Update employee

## Tech Stack

- **Frontend:** React 19, TypeScript
- **MCP SDK:** @modelcontextprotocol/ext-apps, @modelcontextprotocol/sdk
- **Build:** Vite with vite-plugin-singlefile
- **Server:** Express with Streamable HTTP transport

## Changelog

### v1.0.2
- **Fixed:** Detail/edit views no longer show extra black background space - Removed fixed `height: 100%` constraints so container height adapts to content

### v1.0.1
- **Fixed:** Employee update HTTP 500 error - Optional fields (NIF, DateOfBirth, Address, Phone) are now only sent when they have actual values, preventing invalid data from being sent to the API
- **Improved:** Better error messages when API calls fail - error responses now include details from the server

## License

MIT
