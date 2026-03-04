import { toolRegistry } from "./registry.js";
import { searchJobsTool } from "./searchJobs.js";
import { getJobDetailsTool } from "./getJobDetails.js";
import { listCategoriesTool } from "./listCategories.js";

toolRegistry.register(searchJobsTool);
toolRegistry.register(getJobDetailsTool);
toolRegistry.register(listCategoriesTool);

export { toolRegistry };
