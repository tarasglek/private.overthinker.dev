import { ChatCraftCommand } from "../ChatCraftCommand";
import { ChatCraftChat } from "../ChatCraftChat";
import { ChatCraftHumanMessage } from "../ChatCraftMessage";
import db from "../../lib/db";
import { query, queryResultToJson, queryToMarkdown } from "../duckdb";

export class DuckCommand extends ChatCraftCommand {
  constructor() {
    super("duck", "/duck", "Do some SQL queries");
  }

  async execute(chat: ChatCraftChat, _user: User | undefined, args?: string[]) {
    const exportResult = await db.exportToDuckDB();

    if (!args?.length) {
      // Get a list of all tables and describe each one
      const message: string[] = ["## DuckDB Tables"];
    
      // Directly query and format the table names
      const tables = await query("SHOW TABLES");
      const tableNames = queryResultToJson(tables).map((row: any) => row.name);

      await Promise.all(
        tableNames.map(async (name: string) => {
          const rowCount = exportResult.tables.find((table) => table.name === name)?.rowCount || 0;
          const tableDescription = await queryToMarkdown(`DESCRIBE ${name}`);
          message.push(`### ${name} (${rowCount} rows)`, tableDescription);
        })
      );

      return chat.addMessage(new ChatCraftHumanMessage({ text: message.join("\n\n") }));
    }

    const sql = args.join(" ");
    const results = await queryToMarkdown(sql);
    const message = [
      // show query
      "```sql",
      sql,
      "```",
      // show results
      results,
    ].join("\n\n");
    return chat.addMessage(new ChatCraftHumanMessage({ text: message }));
  }
}
