#!/usr/bin/env node
/**
 * MCP Server: mcp-things3
 * Integrates with Things 3 task manager on macOS via AppleScript (read) and URL scheme (write).
 *
 * Uses stdio transport (JSON-RPC over stdin/stdout).
 * IMPORTANT: Never use console.log() -- it corrupts the JSON-RPC stream.
 * Use console.error() for debug logging.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const server = new McpServer({
  name: "mcp-things3",
  version: "1.0.0",
});

// --- Helper functions ---

/**
 * Run an AppleScript command against Things 3 and return the result.
 */
async function runAppleScript(script) {
  try {
    const { stdout } = await execFileAsync("osascript", ["-e", script], {
      timeout: 15000,
    });
    return stdout.trim();
  } catch (error) {
    throw new Error(`AppleScript error: ${error.message}`);
  }
}

/**
 * Open a things:// URL to perform write operations.
 */
async function openThingsURL(path, params = {}) {
  const url = new URL(`things:///${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  try {
    await execFileAsync("open", [url.toString()], { timeout: 10000 });
    return url.toString();
  } catch (error) {
    throw new Error(`Failed to open Things URL: ${error.message}`);
  }
}

/**
 * Parse AppleScript list output into structured todo objects.
 * The AppleScript returns one todo per line in the format:
 * id|||name|||notes|||dueDate|||project|||status|||tags
 */
function parseTodoLines(raw) {
  if (!raw) return [];
  return raw
    .split("\n")
    .filter((line) => line.includes("|||"))
    .map((line) => {
      const [id, name, notes, dueDate, project, status, tags] =
        line.split("|||");
      return {
        id: id || "",
        name: name || "",
        notes: notes || "",
        dueDate: dueDate === "missing value" ? null : dueDate || null,
        project: project === "missing value" ? null : project || null,
        status: status || "",
        tags: tags && tags !== "missing value" ? tags : "",
      };
    });
}

/**
 * Build AppleScript to extract todos from a given list.
 */
function buildListScript(listName) {
  return `
tell application "Things3"
  set output to ""
  set todoList to to dos of list "${listName}"
  repeat with t in todoList
    set todoId to id of t
    set todoName to name of t
    set todoNotes to notes of t
    try
      set todoDue to due date of t as string
    on error
      set todoDue to "missing value"
    end try
    try
      set todoProject to name of project of t
    on error
      set todoProject to "missing value"
    end try
    set todoStatus to status of t as string
    set todoTags to tag names of t
    set output to output & todoId & "|||" & todoName & "|||" & todoNotes & "|||" & todoDue & "|||" & todoProject & "|||" & todoStatus & "|||" & todoTags & "
"
  end repeat
  return output
end tell`;
}

// --- Register tools ---

server.registerTool(
  "get_todos",
  {
    description:
      "Get todos from a Things 3 list. Lists: Inbox, Today, Anytime, Upcoming, Someday, Logbook, Trash.",
    inputSchema: {
      list: z
        .enum([
          "Inbox",
          "Today",
          "Anytime",
          "Upcoming",
          "Someday",
          "Logbook",
          "Trash",
        ])
        .describe("Which Things 3 list to retrieve todos from"),
    },
  },
  async ({ list }) => {
    try {
      const raw = await runAppleScript(buildListScript(list));
      const todos = parseTodoLines(raw);
      if (todos.length === 0) {
        return {
          content: [{ type: "text", text: `No todos found in ${list}.` }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(todos, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "search_todos",
  {
    description:
      "Search for todos in Things 3 by name. Returns matching todos across all lists.",
    inputSchema: {
      query: z.string().describe("Search text to match against todo names"),
    },
  },
  async ({ query }) => {
    try {
      const script = `
tell application "Things3"
  set output to ""
  set matchingTodos to to dos whose name contains "${query.replace(/"/g, '\\"')}"
  repeat with t in matchingTodos
    set todoId to id of t
    set todoName to name of t
    set todoNotes to notes of t
    try
      set todoDue to due date of t as string
    on error
      set todoDue to "missing value"
    end try
    try
      set todoProject to name of project of t
    on error
      set todoProject to "missing value"
    end try
    set todoStatus to status of t as string
    set todoTags to tag names of t
    set output to output & todoId & "|||" & todoName & "|||" & todoNotes & "|||" & todoDue & "|||" & todoProject & "|||" & todoStatus & "|||" & todoTags & "
"
  end repeat
  return output
end tell`;
      const raw = await runAppleScript(script);
      const todos = parseTodoLines(raw);
      if (todos.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No todos found matching "${query}".`,
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(todos, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "get_projects",
  {
    description:
      "List all projects in Things 3 with their names, areas, and todo counts.",
    inputSchema: {},
  },
  async () => {
    try {
      const script = `
tell application "Things3"
  set output to ""
  set allProjects to projects
  repeat with p in allProjects
    set projId to id of p
    set projName to name of p
    set projStatus to status of p as string
    try
      set projArea to name of area of p
    on error
      set projArea to "missing value"
    end try
    set todoCount to count of to dos of p
    set output to output & projId & "|||" & projName & "|||" & projStatus & "|||" & projArea & "|||" & todoCount & "
"
  end repeat
  return output
end tell`;
      const raw = await runAppleScript(script);
      if (!raw) {
        return {
          content: [{ type: "text", text: "No projects found." }],
        };
      }
      const projects = raw
        .split("\n")
        .filter((line) => line.includes("|||"))
        .map((line) => {
          const [id, name, status, area, todoCount] = line.split("|||");
          return {
            id: id || "",
            name: name || "",
            status: status || "",
            area: area === "missing value" ? null : area || null,
            todoCount: parseInt(todoCount) || 0,
          };
        });
      return {
        content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "add_todo",
  {
    description:
      "Create a new todo in Things 3. Opens Things URL scheme to add the item.",
    inputSchema: {
      title: z.string().describe("Title of the todo"),
      notes: z.string().optional().describe("Notes for the todo"),
      when: z
        .string()
        .optional()
        .describe(
          "When to schedule: 'today', 'tomorrow', 'evening', 'anytime', 'someday', or a date like '2024-12-31'"
        ),
      deadline: z
        .string()
        .optional()
        .describe("Deadline date in YYYY-MM-DD format"),
      tags: z
        .string()
        .optional()
        .describe("Comma-separated tag names to apply"),
      list: z
        .string()
        .optional()
        .describe("Project or area name to add the todo to"),
      checklist: z
        .string()
        .optional()
        .describe(
          "Newline-separated checklist items (subtasks) for the todo"
        ),
    },
  },
  async ({ title, notes, when, deadline, tags, list, checklist }) => {
    try {
      const params = { title };
      if (notes) params.notes = notes;
      if (when) params.when = when;
      if (deadline) params.deadline = deadline;
      if (tags) params.tags = tags;
      if (list) params.list = list;
      if (checklist) params["checklist-items"] = checklist;

      const url = await openThingsURL("add", params);
      return {
        content: [
          {
            type: "text",
            text: `Todo "${title}" created successfully.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "add_project",
  {
    description: "Create a new project in Things 3 with optional todos.",
    inputSchema: {
      title: z.string().describe("Title of the project"),
      notes: z.string().optional().describe("Notes for the project"),
      when: z
        .string()
        .optional()
        .describe(
          "When to schedule: 'today', 'tomorrow', 'evening', 'anytime', 'someday', or a date"
        ),
      deadline: z
        .string()
        .optional()
        .describe("Deadline date in YYYY-MM-DD format"),
      tags: z
        .string()
        .optional()
        .describe("Comma-separated tag names to apply"),
      area: z.string().optional().describe("Area name to add the project to"),
      todos: z
        .string()
        .optional()
        .describe("Newline-separated todo titles to create inside the project"),
    },
  },
  async ({ title, notes, when, deadline, tags, area, todos }) => {
    try {
      const params = { title };
      if (notes) params.notes = notes;
      if (when) params.when = when;
      if (deadline) params.deadline = deadline;
      if (tags) params.tags = tags;
      if (area) params.area = area;
      if (todos) params["to-dos"] = todos;

      const url = await openThingsURL("add-project", params);
      return {
        content: [
          {
            type: "text",
            text: `Project "${title}" created successfully.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server mcp-things3 running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
