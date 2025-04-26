@echo off
echo Starting Deebo MCP server...
echo.
echo Configuration has been updated in:
echo C:\Users\msmit\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
echo.
echo Please restart VSCode to activate the new MCP server connection
echo.
echo Deebo MCP Server configuration:
echo ----------------------------
echo Command: node
echo Args:
echo   --experimental-specifier-resolution=node
echo   --experimental-modules
echo   --max-old-space-size=4096
echo   C:\Users\msmit\Documents\Cline\MCP\deebo\build\index.js
echo Environment Variables:
echo   NODE_ENV: development
echo   USE_MEMORY_BANK: true
echo.
echo To manually test the server, you can run:
echo node --experimental-specifier-resolution=node --experimental-modules --max-old-space-size=4096 C:\Users\msmit\Documents\Cline\MCP\deebo\build\index.js
echo.
echo Press any key to exit...
pause > nul
