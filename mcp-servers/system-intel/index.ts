import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";

const server = new Server(
    {
        name: "system-intel-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Tool definitions
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_system_specs",
                description: "Returns CPU, RAM, and Disk usage of the host machine.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "list_active_processes",
                description: "Lists currently running processes with high resource usage.",
                inputSchema: {
                    type: "object",
                    properties: {
                        limit: { type: "number", default: 5 }
                    },
                },
            },
        ],
    };
});

/**
 * tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
        case "get_system_specs": {
            const output = execSync("systeminfo").toString().split("\n").slice(0, 30).join("\n");
            return {
                content: [{ type: "text", text: `System Snapshot:\n${output}` }],
            };
        }
        case "list_active_processes": {
            const limit = (request.params.arguments?.limit as number) || 5;
            const output = execSync(`powershell "Get-Process | Sort-Object CPU -Descending | Select-Object -First ${limit} | Format-Table -AutoSize"`).toString();
            return {
                content: [{ type: "text", text: `Top ${limit} Processes:\n${output}` }],
            };
        }
        default:
            throw new Error("Tool not found");
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
