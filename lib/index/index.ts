export { openDatabase, closeDatabase, getDb, isIndexAvailable } from "./sqlite";
export type { IndexConfig } from "./sqlite";
export { initIndex, reindexFile, reindexProject } from "./builder";
export type { InitIndexResult } from "./builder";
export {
  queryTasksByStatus,
  queryBlockedTasks,
  querySprintsByProject,
  queryFindingsBySeverity,
  queryAllFindings,
  queryDebtItems,
  queryProjectSummary,
  searchIndex,
} from "./queries";
export type { ProjectSummary, SearchOptions } from "./queries";
export { watchProject, unwatchProject, unwatchAll, onIndexUpdate, getWatcherCount } from "./file-watcher";
export type { FileChangeEvent, IndexUpdateListener } from "./file-watcher";
export { ensureIndex, shutdownIndex, isIndexReady } from "./startup";
