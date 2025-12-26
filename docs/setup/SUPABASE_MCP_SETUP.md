# Supabase MCP Setup for Cursor

This guide will help you configure Supabase as a Model Context Protocol (MCP) server in Cursor, allowing the AI assistant to directly interact with your Supabase database.

## What is MCP?

Model Context Protocol (MCP) is a standard that allows AI assistants to connect to external services like Supabase. Once configured, the AI can:
- Query your database schema
- Check RLS policies
- View table structures
- Execute SQL queries (with proper permissions)
- Manage database configurations

## Prerequisites

1. A Supabase project (you already have one)
2. Cursor IDE installed
3. Access to your Supabase project credentials

## Step 1: Get Your Supabase Credentials

You'll need three pieces of information:

### 1. Project Reference (Project ID)
- Go to your Supabase Dashboard: https://supabase.com/dashboard
- Select your project
- The project reference is in the URL: `https://supabase.com/dashboard/project/<project-ref>`
- Or find it in: **Project Settings → General → Reference ID**

**Your project reference:** `mryretaoanuuwruhjdvn` (from your config)

### 2. Service Role Key
- In Supabase Dashboard: **Project Settings → API**
- Under **Project API keys**, find the **`service_role`** key
- ⚠️ **WARNING**: This key has admin privileges. Keep it secret!
- Copy the `service_role` key (starts with `eyJ...`)

### 3. Access Token (Optional but Recommended)
- In Supabase Dashboard: **Account Settings → Access Tokens**
- Click **Generate New Token**
- Give it a name (e.g., "Cursor MCP")
- Copy the token

## Step 2: Install Supabase MCP Server

The Supabase MCP server is available as an npm package. You can install it globally or use it via npx.

### Option A: Install Globally (Recommended)
```bash
npm install -g @supabase/mcp-server-supabase
```

### Option B: Use via npx (No Installation)
You can use it directly without installing:
```bash
npx @supabase/mcp-server-supabase
```

## Step 3: Configure Cursor MCP Settings

Cursor uses a configuration file to set up MCP servers. The location depends on your OS:

### Windows
```
%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

Or via Cursor Settings:
1. Open Cursor Settings (Ctrl+,)
2. Search for "MCP" or "Model Context Protocol"
3. Click "Edit in settings.json" or find the MCP configuration section

### Configuration Format

Create or edit the MCP settings file with this configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "https://mryretaoanuuwruhjdvn.supabase.co",
        "SUPABASE_KEY": "YOUR_SERVICE_ROLE_KEY_HERE",
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

### Alternative: Using Environment Variables

You can also set environment variables in your system and reference them:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "https://mryretaoanuuwruhjdvn.supabase.co",
        "SUPABASE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}",
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

Then set these in your system environment variables or `.env` file.

## Step 4: Restart Cursor

After configuring the MCP server:
1. Save the configuration file
2. Completely restart Cursor (close and reopen)
3. The MCP server should connect automatically

## Step 5: Verify Connection

To verify the MCP server is working:

1. Open a chat with the AI assistant in Cursor
2. Ask: "Can you check my Supabase database schema?"
3. Or: "What tables do I have in my Supabase database?"
4. The AI should be able to query your Supabase project

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Service Role Key**: 
   - Never commit this key to version control
   - Never share it publicly
   - It has full admin access to your database
   - Consider using a separate Supabase project for development if possible

2. **Access Token**:
   - Store securely
   - Rotate periodically
   - Use the minimum required permissions

3. **RLS Policies**:
   - Your RLS policies still apply to queries made through MCP
   - The service role key bypasses RLS, so be careful with what you allow

4. **Environment Variables**:
   - Use environment variables instead of hardcoding keys
   - Add `.env` files to `.gitignore`
   - Use a secrets manager for production

## Troubleshooting

### MCP Server Not Connecting

1. **Check Node.js is installed**:
   ```bash
   node --version
   npm --version
   ```

2. **Verify credentials are correct**:
   - Double-check the project reference
   - Ensure the service role key is correct
   - Verify the access token is valid

3. **Check Cursor logs**:
   - Open Cursor's developer console (Help → Toggle Developer Tools)
   - Look for MCP-related errors

4. **Test MCP server manually**:
   ```bash
   npx -y @supabase/mcp-server-supabase
   ```

### Permission Errors

If you get permission errors:
- Ensure you're using the `service_role` key, not the `anon` key
- Check that your Supabase project is active
- Verify your account has access to the project

### Connection Timeout

If the connection times out:
- Check your internet connection
- Verify the Supabase URL is correct
- Check if there are firewall restrictions

## What You Can Do With MCP

Once configured, the AI assistant can:

- ✅ Query your database schema
- ✅ Check RLS policies
- ✅ View table structures and relationships
- ✅ Execute read-only queries (if configured)
- ✅ Help debug database issues
- ✅ Suggest schema improvements
- ✅ Check for missing indexes
- ✅ Verify trigger configurations

## Example Queries

After setup, you can ask the AI:

- "What's the structure of my profiles table?"
- "Show me all RLS policies on the activities table"
- "Check if the handle_new_user trigger is installed"
- "What indexes exist on the profiles table?"
- "Help me debug why profile creation is failing"

## Additional Resources

- [Supabase MCP Server GitHub](https://github.com/supabase-community/supabase-mcp)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Cursor MCP Documentation](https://cursor.sh/docs/mcp)

## Next Steps

1. ✅ Get your Supabase credentials
2. ✅ Install or configure the MCP server
3. ✅ Add configuration to Cursor
4. ✅ Restart Cursor
5. ✅ Test the connection
6. ✅ Start using MCP-powered database queries!

---

**Note**: This setup allows the AI to read your database schema and potentially execute queries. Always review what the AI suggests before applying changes to your production database.

