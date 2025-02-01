import { LOG_URL, VERSION_STRING, SYSTEM_URL } from "./config";

type Action = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'login' | 'logout';
type Severity = 'critical' | 'error' | 'warning' | 'info' | 'debug';

export interface LogMessage {
  version: string; // default: 2
  severity: Severity; // default: info
  action: Action;
  occurred?: string; // datetime of event
  subject?: string; // subject id
  agent?: {
    ip_address?: string; // Handled by server
    user_agent?: string; // Handled by server
    type?: string; // Server default: user
    who?: string; // user id
  };
  source?: {
    observer?: string; // system url
    type?: string; // system name
    version?: string; // system version
  };
  entity?: {
    detail?: {[key: string] : string}; // additional info e.g. {action: "Copied SHL url to clipboard"}
    query?: string; // query info
  };
  outcome?: string; // failure or warning details
}

export interface LogMessageSimple extends Partial<LogMessage> {
  action: Action;
}
export function log(content: LogMessageSimple, dest?: string) {
  Logger.Instance.log(content, dest);
}

export class Logger {
  private static _instance: Logger;
  user_id: string;
  session_id: string;
  dest: string;

  private constructor(user_id: string = "unknown", session_id: string = "unknown") {
    this.dest = LOG_URL || "";
    this.user_id = user_id;
    this.session_id = session_id;
  }

  public static get Instance(): Logger {
    return this._instance || (this._instance = new this());
  }

  public setUserId(user_id: string): void {
    this.user_id = user_id;
  }

  public setSessionId(session_id: string): void {
    this.session_id = session_id;
  }

  public applyLogFallbacks(logMessage: LogMessageSimple, defaults: Partial<LogMessage>): LogMessageSimple {
    if (logMessage.entity) {
      logMessage.entity.detail = {...(defaults.entity?.detail ?? {}), ...(logMessage.entity?.detail ?? {})}; 
    }
    logMessage.entity = {...defaults.entity, ...logMessage.entity};
    logMessage.source = {...defaults.source, ...logMessage.source};
    logMessage.agent = {...defaults.agent, ...logMessage.agent};
    return {...defaults, ...logMessage};
  }

  public log(content: LogMessageSimple, dest?: string): void {  
    let defaults: Partial<LogMessage> = {
      version: "2",
      severity: "info",
      occurred: new Date().toISOString(),
      subject: this.user_id,
      agent: {
        who: this.user_id,
      },
      source: {
        observer: SYSTEM_URL || window.location.origin,
        type: 'shl-ltt',
        version: VERSION_STRING,
      },
      entity: {
        detail: {
          url: window.location.href, // current url
          session_id: this.session_id
        }, // additional info
      },
      outcome: "", // failure or warning details
    }
    let logMessage: LogMessageSimple = this.applyLogFallbacks(content, defaults);

    let logURL = dest ?? this.dest;
    if (!logURL) {
      console.log(JSON.stringify(content));
      return;
    }
    if (!URL.canParse(logURL)) {
      console.warn('Invalid log destination: ' + logURL);
      console.log(JSON.stringify(content));
      return;
    }
  
    fetch(logURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logMessage),
    });
  }
}
