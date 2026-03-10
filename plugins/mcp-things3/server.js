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

// --- Status change tools (AppleScript, no auth needed) ---

server.registerTool(
  "complete_todo",
  {
    description: "Mark a todo as completed in Things 3 by its ID.",
    inputSchema: {
      id: z.string().describe("The ID of the todo to complete"),
    },
  },
  async ({ id }) => {
    try {
      const script = `
tell application "Things3"
  set t to to do id "${id.replace(/"/g, '\\"')}"
  set status of t to completed
  return name of t
end tell`;
      const name = await runAppleScript(script);
      return {
        content: [{ type: "text", text: `Todo "${name}" marked as completed.` }],
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
  "cancel_todo",
  {
    description: "Cancel a todo in Things 3 by its ID.",
    inputSchema: {
      id: z.string().describe("The ID of the todo to cancel"),
    },
  },
  async ({ id }) => {
    try {
      const script = `
tell application "Things3"
  set t to to do id "${id.replace(/"/g, '\\"')}"
  set status of t to canceled
  return name of t
end tell`;
      const name = await runAppleScript(script);
      return {
        content: [{ type: "text", text: `Todo "${name}" has been canceled.` }],
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
  "delete_todo",
  {
    description: "Move a todo to the Trash in Things 3 by its ID.",
    inputSchema: {
      id: z.string().describe("The ID of the todo to move to Trash"),
    },
  },
  async ({ id }) => {
    try {
      const script = `
tell application "Things3"
  set t to to do id "${id.replace(/"/g, '\\"')}"
  set todoName to name of t
  move t to list "Trash"
  return todoName
end tell`;
      const name = await runAppleScript(script);
      return {
        content: [{ type: "text", text: `Todo "${name}" moved to Trash.` }],
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
  "complete_project",
  {
    description: "Mark a project as completed in Things 3 by its ID.",
    inputSchema: {
      id: z.string().describe("The ID of the project to complete"),
    },
  },
  async ({ id }) => {
    try {
      const script = `
tell application "Things3"
  set p to project id "${id.replace(/"/g, '\\"')}"
  set status of p to completed
  return name of p
end tell`;
      const name = await runAppleScript(script);
      return {
        content: [{ type: "text", text: `Project "${name}" marked as completed.` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// --- Reading tools (AppleScript, no auth needed) ---

server.registerTool(
  "get_areas",
  {
    description: "List all areas in Things 3 with their projects.",
    inputSchema: {},
  },
  async () => {
    try {
      const script = `
tell application "Things3"
  set output to ""
  set allAreas to areas
  repeat with a in allAreas
    set areaId to id of a
    set areaName to name of a
    set projNames to ""
    set areaProjects to projects of a
    repeat with p in areaProjects
      if projNames is not "" then set projNames to projNames & ", "
      set projNames to projNames & name of p
    end repeat
    set output to output & areaId & "|||" & areaName & "|||" & projNames & "
"
  end repeat
  return output
end tell`;
      const raw = await runAppleScript(script);
      if (!raw) {
        return { content: [{ type: "text", text: "No areas found." }] };
      }
      const areas = raw
        .split("\n")
        .filter((line) => line.includes("|||"))
        .map((line) => {
          const [id, name, projects] = line.split("|||");
          return {
            id: id || "",
            name: name || "",
            projects: projects ? projects.split(", ").filter(Boolean) : [],
          };
        });
      return {
        content: [{ type: "text", text: JSON.stringify(areas, null, 2) }],
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
  "get_tags",
  {
    description: "List all tags in Things 3.",
    inputSchema: {},
  },
  async () => {
    try {
      const script = `
tell application "Things3"
  set output to ""
  set allTags to tags
  repeat with t in allTags
    set tagId to id of t
    set tagName to name of t
    try
      set parentName to name of parent tag of t
    on error
      set parentName to "missing value"
    end try
    set output to output & tagId & "|||" & tagName & "|||" & parentName & "
"
  end repeat
  return output
end tell`;
      const raw = await runAppleScript(script);
      if (!raw) {
        return { content: [{ type: "text", text: "No tags found." }] };
      }
      const tags = raw
        .split("\n")
        .filter((line) => line.includes("|||"))
        .map((line) => {
          const [id, name, parent] = line.split("|||");
          return {
            id: id || "",
            name: name || "",
            parentTag: parent === "missing value" ? null : parent || null,
          };
        });
      return {
        content: [{ type: "text", text: JSON.stringify(tags, null, 2) }],
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
  "get_todo_detail",
  {
    description:
      "Get full details of a single todo in Things 3 by its ID, including name, notes, dates, tags, project, area, and status.",
    inputSchema: {
      id: z.string().describe("The ID of the todo to get details for"),
    },
  },
  async ({ id }) => {
    try {
      const escapedId = id.replace(/"/g, '\\"');
      const script = `
tell application "Things3"
  set t to to do id "${escapedId}"
  set todoId to id of t
  set todoName to name of t
  set todoNotes to notes of t
  set todoStatus to status of t as string
  set todoTags to tag names of t
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
  try
    set todoArea to name of area of t
  on error
    set todoArea to "missing value"
  end try
  try
    set todoCreation to creation date of t as string
  on error
    set todoCreation to "missing value"
  end try
  try
    set todoModification to modification date of t as string
  on error
    set todoModification to "missing value"
  end try
  try
    set todoCompletion to completion date of t as string
  on error
    set todoCompletion to "missing value"
  end try
  try
    set todoCancellation to cancellation date of t as string
  on error
    set todoCancellation to "missing value"
  end try
  try
    set todoActivation to activation date of t as string
  on error
    set todoActivation to "missing value"
  end try
  return todoId & "|||" & todoName & "|||" & todoNotes & "|||" & todoDue & "|||" & todoProject & "|||" & todoArea & "|||" & todoStatus & "|||" & todoTags & "|||" & todoCreation & "|||" & todoModification & "|||" & todoCompletion & "|||" & todoCancellation & "|||" & todoActivation
end tell`;
      const raw = await runAppleScript(script);
      const [
        todoId, name, notes, dueDate, project, area, status,
        tags, creationDate, modificationDate, completionDate,
        cancellationDate, activationDate,
      ] = raw.split("|||");
      const mv = (v) => (v === "missing value" || !v ? null : v);
      const detail = {
        id: todoId || "",
        name: name || "",
        notes: notes || "",
        dueDate: mv(dueDate),
        project: mv(project),
        area: mv(area),
        status: status || "",
        tags: tags && tags !== "missing value" ? tags : "",
        creationDate: mv(creationDate),
        modificationDate: mv(modificationDate),
        completionDate: mv(completionDate),
        cancellationDate: mv(cancellationDate),
        activationDate: mv(activationDate),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(detail, null, 2) }],
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
  "get_project_todos",
  {
    description:
      "Get all todos within a specific project in Things 3, organized by headings.",
    inputSchema: {
      name: z
        .string()
        .optional()
        .describe("Name of the project (used if id is not provided)"),
      id: z
        .string()
        .optional()
        .describe("ID of the project (takes precedence over name)"),
    },
  },
  async ({ name, id }) => {
    try {
      if (!name && !id) {
        return {
          content: [
            { type: "text", text: "Error: Either name or id must be provided." },
          ],
          isError: true,
        };
      }
      const projectRef = id
        ? `project id "${id.replace(/"/g, '\\"')}"`
        : `project "${name.replace(/"/g, '\\"')}"`;
      const script = `
tell application "Things3"
  set p to ${projectRef}
  set projName to name of p
  set output to "PROJECT: " & projName & "
"
  set todoList to to dos of p
  repeat with t in todoList
    set todoId to id of t
    set todoName to name of t
    set todoNotes to notes of t
    try
      set todoDue to due date of t as string
    on error
      set todoDue to "missing value"
    end try
    set todoStatus to status of t as string
    set todoTags to tag names of t
    set output to output & todoId & "|||" & todoName & "|||" & todoNotes & "|||" & todoDue & "|||" & projName & "|||" & todoStatus & "|||" & todoTags & "
"
  end repeat
  return output
end tell`;
      const raw = await runAppleScript(script);
      const lines = raw.split("\n").filter(Boolean);
      const projectLine = lines.shift() || "";
      const projectName = projectLine.replace("PROJECT: ", "");
      const todos = parseTodoLines(lines.join("\n"));
      const result = { project: projectName, todos };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// --- Update tools (AppleScript + optional URL scheme with auth token) ---

server.registerTool(
  "update_todo",
  {
    description:
      "Update an existing todo in Things 3. Title, notes, due date, and tags are changed via AppleScript (no auth needed). When, deadline, and checklist-items require THINGS_AUTH_TOKEN env var and use the URL scheme.",
    inputSchema: {
      id: z.string().describe("The ID of the todo to update"),
      title: z.string().optional().describe("New title for the todo"),
      notes: z.string().optional().describe("New notes for the todo"),
      dueDate: z
        .string()
        .optional()
        .describe("New due date (YYYY-MM-DD format, or empty string to clear)"),
      tags: z
        .string()
        .optional()
        .describe("Comma-separated tag names to set (replaces existing tags)"),
      when: z
        .string()
        .optional()
        .describe(
          "Schedule: 'today', 'tomorrow', 'evening', 'anytime', 'someday', or YYYY-MM-DD (requires auth token)"
        ),
      deadline: z
        .string()
        .optional()
        .describe("Deadline date in YYYY-MM-DD format (requires auth token)"),
      checklistItems: z
        .string()
        .optional()
        .describe(
          "Newline-separated checklist items to set (requires auth token, replaces existing)"
        ),
      appendChecklistItems: z
        .string()
        .optional()
        .describe(
          "Newline-separated checklist items to append (requires auth token)"
        ),
      completed: z
        .boolean()
        .optional()
        .describe("Set to true to mark completed, false to reopen"),
    },
  },
  async ({
    id,
    title,
    notes,
    dueDate,
    tags,
    when,
    deadline,
    checklistItems,
    appendChecklistItems,
    completed,
  }) => {
    try {
      const escapedId = id.replace(/"/g, '\\"');
      const results = [];

      // --- AppleScript updates (no auth needed) ---
      const asUpdates = [];
      if (title !== undefined) {
        asUpdates.push(
          `set name of t to "${title.replace(/"/g, '\\"')}"`
        );
      }
      if (notes !== undefined) {
        asUpdates.push(
          `set notes of t to "${notes.replace(/"/g, '\\"')}"`
        );
      }
      if (dueDate !== undefined) {
        if (dueDate === "") {
          asUpdates.push(`set due date of t to missing value`);
        } else {
          asUpdates.push(
            `set due date of t to date "${dueDate.replace(/"/g, '\\"')}"`
          );
        }
      }
      if (tags !== undefined) {
        asUpdates.push(
          `set tag names of t to "${tags.replace(/"/g, '\\"')}"`
        );
      }
      if (completed !== undefined) {
        asUpdates.push(
          `set status of t to ${completed ? "completed" : "open"}`
        );
      }

      if (asUpdates.length > 0) {
        const script = `
tell application "Things3"
  set t to to do id "${escapedId}"
  ${asUpdates.join("\n  ")}
  return name of t
end tell`;
        const name = await runAppleScript(script);
        results.push(`Updated via AppleScript: ${title || name}`);
      }

      // --- URL scheme updates (auth token needed) ---
      const urlFields = {};
      if (when !== undefined) urlFields.when = when;
      if (deadline !== undefined) urlFields.deadline = deadline;
      if (checklistItems !== undefined)
        urlFields["checklist-items"] = checklistItems;
      if (appendChecklistItems !== undefined)
        urlFields["append-checklist-items"] = appendChecklistItems;

      if (Object.keys(urlFields).length > 0) {
        const authToken = process.env.THINGS_AUTH_TOKEN;
        if (!authToken) {
          results.push(
            `Warning: Could not update ${Object.keys(urlFields).join(", ")} — THINGS_AUTH_TOKEN is not set. ` +
              `Get it from Things 3 → Settings → General → Enable Things URLs → Copy Auth Token, ` +
              `then set THINGS_AUTH_TOKEN in your environment.`
          );
        } else {
          urlFields["auth-token"] = authToken;
          urlFields.id = id;
          await openThingsURL("update", urlFields);
          results.push(
            `Updated via URL scheme: ${Object.keys(urlFields).filter((k) => k !== "auth-token" && k !== "id").join(", ")}`
          );
        }
      }

      if (results.length === 0) {
        return {
          content: [
            { type: "text", text: "No updates specified. Provide at least one field to update." },
          ],
        };
      }

      return {
        content: [{ type: "text", text: results.join("\n") }],
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
  "update_project",
  {
    description:
      "Update an existing project in Things 3. Title, notes, and tags are changed via AppleScript (no auth needed). When, deadline, and area require THINGS_AUTH_TOKEN env var and use the URL scheme.",
    inputSchema: {
      id: z.string().describe("The ID of the project to update"),
      title: z.string().optional().describe("New title for the project"),
      notes: z.string().optional().describe("New notes for the project"),
      tags: z
        .string()
        .optional()
        .describe("Comma-separated tag names to set (replaces existing tags)"),
      when: z
        .string()
        .optional()
        .describe(
          "Schedule: 'today', 'tomorrow', 'evening', 'anytime', 'someday', or YYYY-MM-DD (requires auth token)"
        ),
      deadline: z
        .string()
        .optional()
        .describe("Deadline date in YYYY-MM-DD format (requires auth token)"),
      area: z
        .string()
        .optional()
        .describe("Area name to move the project to (requires auth token)"),
    },
  },
  async ({ id, title, notes, tags, when, deadline, area }) => {
    try {
      const escapedId = id.replace(/"/g, '\\"');
      const results = [];

      // --- AppleScript updates (no auth needed) ---
      const asUpdates = [];
      if (title !== undefined) {
        asUpdates.push(
          `set name of p to "${title.replace(/"/g, '\\"')}"`
        );
      }
      if (notes !== undefined) {
        asUpdates.push(
          `set notes of p to "${notes.replace(/"/g, '\\"')}"`
        );
      }
      if (tags !== undefined) {
        asUpdates.push(
          `set tag names of p to "${tags.replace(/"/g, '\\"')}"`
        );
      }

      if (asUpdates.length > 0) {
        const script = `
tell application "Things3"
  set p to project id "${escapedId}"
  ${asUpdates.join("\n  ")}
  return name of p
end tell`;
        const name = await runAppleScript(script);
        results.push(`Updated via AppleScript: ${title || name}`);
      }

      // --- URL scheme updates (auth token needed) ---
      const urlFields = {};
      if (when !== undefined) urlFields.when = when;
      if (deadline !== undefined) urlFields.deadline = deadline;
      if (area !== undefined) urlFields.area = area;

      if (Object.keys(urlFields).length > 0) {
        const authToken = process.env.THINGS_AUTH_TOKEN;
        if (!authToken) {
          results.push(
            `Warning: Could not update ${Object.keys(urlFields).join(", ")} — THINGS_AUTH_TOKEN is not set. ` +
              `Get it from Things 3 → Settings → General → Enable Things URLs → Copy Auth Token, ` +
              `then set THINGS_AUTH_TOKEN in your environment.`
          );
        } else {
          urlFields["auth-token"] = authToken;
          urlFields.id = id;
          await openThingsURL("update-project", urlFields);
          results.push(
            `Updated via URL scheme: ${Object.keys(urlFields).filter((k) => k !== "auth-token" && k !== "id").join(", ")}`
          );
        }
      }

      if (results.length === 0) {
        return {
          content: [
            { type: "text", text: "No updates specified. Provide at least one field to update." },
          ],
        };
      }

      return {
        content: [{ type: "text", text: results.join("\n") }],
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
