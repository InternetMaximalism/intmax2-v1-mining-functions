export interface DeFiProtocol {
  name: string;
  address: string;
}
[];

export interface Exchange {
  execution_id: string;
  query_id: number;
  is_execution_finished: boolean;
  state: "QUERY_STATE_COMPLETED" | string;
  submitted_at: string;
  expires_at: string;
  execution_started_at: string;
  execution_ended_at: string;
  result: QueryResult;
}

interface QueryResult {
  rows: Row[];
  metadata: QueryMetadata;
}

interface Row {
  added_by: string;
  added_date: string;
  address: string;
  cex_name: string;
  distinct_name: string;
}

interface QueryMetadata {
  column_names: string[];
  column_types: string[];
  row_count: number;
  result_set_bytes: number;
  total_row_count: number;
  total_result_set_bytes: number;
  datapoint_count: number;
  pending_time_millis: number;
  execution_time_millis: number;
}
