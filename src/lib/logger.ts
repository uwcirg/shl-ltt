import { LOG_URL, DEPLOYMENT_TYPE, SYSTEM_URL } from "./config";
import { dev } from "$app/environment";

interface LogMessage {
  "message": string;
  "tags"?: string[];
  "level"?: "INFO" | "ERROR" | "WARN" | "DEBUG";
  "subject"?: string;
  "user"?: string;
  "name"?: string;
  "deployment"?: "dev" | "test" | "demo" | "stage" | "prod";
  "system-type"?: string;
  "system-url"?: string;
  "session-id"?: string;
}
export function log(content: LogMessage|string, dest?: string) {
  if (typeof content === "string") {
    content = {
      message: content
    };
  }
  Logger.Instance.log(content, dest);
}

export class Logger {
  private static _instance: Logger;
  user_id: string;
  session_id: string;
  dest: string;

  private constructor(user_id: string = "", session_id: string = "") {
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

  public log(content: LogMessage, dest?: string): void {
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
  
    let defaults = {
      "level": "INFO",
      "user": this.user_id,
      "name": "shl-creator",
      "deployment": DEPLOYMENT_TYPE || dev ? "dev" : "prod",
      "system-type": "web",
      "system-url": SYSTEM_URL || window.location.href,
      "session-id": this.session_id,
    };
  
    let logMessage = {
      ...defaults,
      ...content,
    };
  
    fetch(logURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logMessage),
    });
  }
}