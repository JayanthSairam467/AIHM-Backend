import {
  CreateSessionRequest,
  SessionResponse,
  UpdateSessionRequest,
  SubmitMessageRequest,
  MessageAcceptedResponse,
  MessageListResponse,
  RecordListResponse,
  GenerateSoapRequest,
  TaskResponse,
  SoapNoteResponse,
  FhirBundleResponse,
  HealthResponse,
} from './api-types.js';

export interface GetHealthOperation {
  request: void;
  response: HealthResponse;
  statusCode: 200;
}

export interface CreateSessionOperation {
  request: CreateSessionRequest;
  response: SessionResponse;
  statusCode: 201;
}

export interface GetSessionOperation {
  request: void; // Assuming path param is handled elsewhere or we can add it here if needed
  response: SessionResponse;
  statusCode: 200;
}

export interface UpdateSessionOperation {
  request: UpdateSessionRequest;
  response: SessionResponse;
  statusCode: 200;
}

export interface SubmitMessageOperation {
  request: SubmitMessageRequest;
  response: MessageAcceptedResponse;
  statusCode: 202;
}

export interface ListMessagesOperation {
  request: void;
  response: MessageListResponse;
  statusCode: 200;
}

export interface GetRecordsOperation {
  request: void;
  response: RecordListResponse;
  statusCode: 200;
}

export interface GenerateSoapOperation {
  request: GenerateSoapRequest | undefined;
  response: TaskResponse;
  statusCode: 202;
}

export interface GetTaskOperation {
  request: void;
  response: TaskResponse;
  statusCode: 200;
}

export interface GetSoapNoteOperation {
  request: void;
  response: SoapNoteResponse;
  statusCode: 200;
}

export interface ExportFhirOperation {
  request: void;
  response: FhirBundleResponse;
  statusCode: 201;
}

export interface GetFhirBundleOperation {
  request: void;
  response: FhirBundleResponse;
  statusCode: 200;
}
