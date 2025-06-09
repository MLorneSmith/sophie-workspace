#!/usr/bin/env python3
"""
New Relic MCP Server for Claude Code
Provides access to New Relic logs and data via MCP protocol
"""

import asyncio
import json
import os
from typing import Any, Dict, List, Optional

import httpx
from mcp.server import NotificationOptions, Server
from mcp.server.models import InitializationOptions
import mcp.server.stdio
import mcp.types as types


class NewRelicMCPServer:
    def __init__(self):
        self.api_key = os.getenv("NEW_RELIC_API_KEY")
        self.account_id = os.getenv("NEW_RELIC_ACCOUNT_ID")
        
        if not self.api_key or not self.account_id:
            raise ValueError("NEW_RELIC_API_KEY and NEW_RELIC_ACCOUNT_ID environment variables are required")
        
        self.base_url = "https://api.newrelic.com/graphql"
        self.headers = {
            "Api-Key": self.api_key,
            "Content-Type": "application/json"
        }
        
        self.server = Server("newrelic-mcp")
        self.setup_handlers()

    def setup_handlers(self):
        @self.server.list_tools()
        async def handle_list_tools() -> List[types.Tool]:
            return [
                types.Tool(
                    name="query_newrelic_logs",
                    description="Query New Relic logs using NRQL",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "nrql": {
                                "type": "string",
                                "description": "NRQL query to execute"
                            },
                            "timeout": {
                                "type": "integer",
                                "description": "Query timeout in seconds (default: 30)",
                                "default": 30
                            }
                        },
                        "required": ["nrql"]
                    }
                ),
                types.Tool(
                    name="get_transaction_traces",
                    description="Get recent transaction traces from New Relic",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "app_name": {
                                "type": "string",
                                "description": "Application name to filter by (optional)"
                            },
                            "since": {
                                "type": "string",
                                "description": "Time period (e.g., '1 hour ago', '30 minutes ago')",
                                "default": "1 hour ago"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Number of traces to return (default: 50)",
                                "default": 50
                            }
                        }
                    }
                ),
                types.Tool(
                    name="get_error_traces",
                    description="Get recent error traces from New Relic",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "app_name": {
                                "type": "string",
                                "description": "Application name to filter by (optional)"
                            },
                            "since": {
                                "type": "string",
                                "description": "Time period (e.g., '1 hour ago', '30 minutes ago')",
                                "default": "1 hour ago"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Number of error traces to return (default: 50)",
                                "default": 50
                            }
                        }
                    }
                ),
                types.Tool(
                    name="get_otel_traces",
                    description="Get OpenTelemetry traces from New Relic",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "service_name": {
                                "type": "string",
                                "description": "Service name to filter by (e.g., 'slideheroes-web')"
                            },
                            "since": {
                                "type": "string",
                                "description": "Time period (e.g., '1 hour ago', '30 minutes ago')",
                                "default": "1 hour ago"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Number of traces to return (default: 50)",
                                "default": 50
                            }
                        }
                    }
                )
            ]

        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
            try:
                if name == "query_newrelic_logs":
                    result = await self.query_nrql(arguments["nrql"], arguments.get("timeout", 30))
                elif name == "get_transaction_traces":
                    result = await self.get_transaction_traces(
                        app_name=arguments.get("app_name"),
                        since=arguments.get("since", "1 hour ago"),
                        limit=arguments.get("limit", 50)
                    )
                elif name == "get_error_traces":
                    result = await self.get_error_traces(
                        app_name=arguments.get("app_name"),
                        since=arguments.get("since", "1 hour ago"),
                        limit=arguments.get("limit", 50)
                    )
                elif name == "get_otel_traces":
                    result = await self.get_otel_traces(
                        service_name=arguments.get("service_name"),
                        since=arguments.get("since", "1 hour ago"),
                        limit=arguments.get("limit", 50)
                    )
                else:
                    raise ValueError(f"Unknown tool: {name}")

                return [types.TextContent(type="text", text=json.dumps(result, indent=2))]
            
            except Exception as e:
                return [types.TextContent(type="text", text=f"Error: {str(e)}")]

    async def query_nrql(self, nrql: str, timeout: int = 30) -> Dict[str, Any]:
        """Execute a NRQL query against New Relic"""
        query = {
            "query": f"""
            {{
                actor {{
                    account(id: {self.account_id}) {{
                        nrql(query: "{nrql}", timeout: {timeout}) {{
                            results
                            totalResult
                        }}
                    }}
                }}
            }}
            """
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.base_url,
                headers=self.headers,
                json=query,
                timeout=timeout + 10
            )
            response.raise_for_status()
            return response.json()

    async def get_transaction_traces(self, app_name: Optional[str] = None, since: str = "1 hour ago", limit: int = 50) -> Dict[str, Any]:
        """Get recent transaction traces"""
        where_clause = ""
        if app_name:
            where_clause = f"WHERE appName = '{app_name}'"
        
        nrql = f"SELECT * FROM Transaction {where_clause} SINCE {since} LIMIT {limit}"
        return await self.query_nrql(nrql)

    async def get_error_traces(self, app_name: Optional[str] = None, since: str = "1 hour ago", limit: int = 50) -> Dict[str, Any]:
        """Get recent error traces"""
        where_clause = "WHERE error IS TRUE"
        if app_name:
            where_clause += f" AND appName = '{app_name}'"
        
        nrql = f"SELECT * FROM Transaction {where_clause} SINCE {since} LIMIT {limit}"
        return await self.query_nrql(nrql)

    async def get_otel_traces(self, service_name: Optional[str] = None, since: str = "1 hour ago", limit: int = 50) -> Dict[str, Any]:
        """Get OpenTelemetry traces"""
        where_clause = ""
        if service_name:
            where_clause = f"WHERE service.name = '{service_name}'"
        
        nrql = f"SELECT * FROM Span {where_clause} SINCE {since} LIMIT {limit}"
        return await self.query_nrql(nrql)

    async def run(self):
        """Run the MCP server"""
        async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="newrelic-mcp",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={},
                    ),
                ),
            )


def main():
    """Main entry point"""
    try:
        server = NewRelicMCPServer()
        asyncio.run(server.run())
    except Exception as e:
        print(f"Failed to start New Relic MCP Server: {e}")
        exit(1)


if __name__ == "__main__":
    main()