import { toolRegistry } from "./registry.js";
import { getJobDetailsTool } from "./getJobDetails.js";
import { searchMuseTool } from "./searchMuse.js";
import { searchAdzunaTool } from "./searchAdzuna.js";
import { searchJSearchTool } from "./searchJSearch.js";

toolRegistry.register(searchJSearchTool);
toolRegistry.register(searchMuseTool);
toolRegistry.register(searchAdzunaTool);
toolRegistry.register(getJobDetailsTool);

export { toolRegistry };
