/**
 * SIEM Logger Service
 * Handles real-time logging to Splunk HEC and generic SIEM Webhooks.
 */

export interface SiemConfig {
  enabled: boolean;
  splunkUrl: string;
  splunkToken: string;
  webhookUrl: string;
  systemId: string;
}

export type LogSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'AUDIT';

export interface LogEvent {
  event: string;
  severity: LogSeverity;
  source: string;
  user?: string;
  details?: any;
  mitreTactic?: string;
  mitreTechnique?: string;
  timestamp?: string;
}

class SiemLogger {
  private config: SiemConfig = {
    enabled: false,
    splunkUrl: '',
    splunkToken: '',
    webhookUrl: '',
    systemId: 'AEGIS-IIOT-01'
  };

  private dispatchHistory: any[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private onDispatchUpdate: ((history: any[]) => void) | null = null;

  constructor() {
    this.loadConfig();
    this.startHeartbeat();
  }

  private loadConfig() {
    try {
      const saved = localStorage.getItem('aegis_siem_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load SIEM config', e);
    }
  }

  public updateConfig(newConfig: Partial<SiemConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('aegis_siem_config', JSON.stringify(this.config));
    
    // Restart heartbeat with new status
    this.startHeartbeat();
  }

  public getConfig(): SiemConfig {
    return { ...this.config };
  }

  public setOnDispatchUpdate(cb: (history: any[]) => void) {
    this.onDispatchUpdate = cb;
  }

  private addToHistory(dispatch: any) {
    this.dispatchHistory = [dispatch, ...this.dispatchHistory].slice(0, 10);
    if (this.onDispatchUpdate) this.onDispatchUpdate(this.dispatchHistory);
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (!this.config.enabled) return;

    // Send initial pulse
    this.log({
      event: 'SYSTEM_PULSE',
      severity: 'INFO',
      source: 'HeartbeatService',
      details: { status: 'Nominal', uptime: 'Active' }
    });

    // Every 60 seconds (accelerated for demo)
    this.heartbeatInterval = setInterval(() => {
      this.log({
        event: 'SYSTEM_PULSE_HEARTBEAT',
        severity: 'INFO',
        source: 'HeartbeatService',
        details: { status: 'Operational' }
      });
    }, 60000);
  }

  /**
   * Primary method to log events to external SIEMs
   */
  public async log(event: LogEvent) {
    if (!this.config.enabled) return;

    const payload = {
      time: Date.now() / 1000,
      host: this.config.systemId,
      source: 'aegis-dashboard',
      sourcetype: '_json',
      event: {
        ...event,
        timestamp: new Date().toISOString(),
        system_id: this.config.systemId
      }
    };

    const tasks = [];

    if (this.config.splunkUrl && this.config.splunkToken) {
      tasks.push(this.sendToSplunk(payload));
    }

    if (this.config.webhookUrl) {
      tasks.push(this.sendToWebhook(payload));
    }

    try {
      await Promise.all(tasks);
    } catch (error) {
      console.warn('SIEM Logging failed for one or more targets', error);
    }
  }

  private async sendToSplunk(payload: any) {
    try {
      const response = await fetch(this.config.splunkUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Splunk ${this.config.splunkToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      this.addToHistory({ target: 'Splunk HEC', success: response.ok, timestamp: new Date().toLocaleTimeString(), event: payload.event.event });
      return response.ok;
    } catch (e) {
      this.addToHistory({ target: 'Splunk HEC', success: false, timestamp: new Date().toLocaleTimeString(), event: payload.event.event });
      return false;
    }
  }

  private async sendToWebhook(payload: any) {
    try {
      // Automatic Formatting for Slack/Discord
      let body = JSON.stringify(payload);
      const isDiscord = this.config.webhookUrl.includes('discord.com');
      const isSlack = this.config.webhookUrl.includes('slack.com');

      if (isDiscord) {
        body = JSON.stringify({
          username: "AEGIS IIoT SECURITY",
          avatar_url: "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/shield-alert.svg",
          embeds: [{
            title: `🚨 ${payload.event.severity}: ${payload.event.event}`,
            description: `**Source**: ${payload.event.source}\n**Target**: ${payload.event.details?.target || 'Network'}\n**Details**: ${typeof payload.event.details === 'string' ? payload.event.details : JSON.stringify(payload.event.details)}`,
            color: payload.event.severity === 'CRITICAL' ? 15548997 : 3447003,
            footer: { text: `System ID: ${this.config.systemId} | ${payload.event.timestamp}` }
          }]
        });
      } else if (isSlack) {
        body = JSON.stringify({
          text: `*🚨 AEGIS SECURITY ALERT*\n*Event*: ${payload.event.event}\n*Severity*: ${payload.event.severity}\n*Source*: ${payload.event.source}\n*Details*: ${JSON.stringify(payload.event.details)}`
        });
      }

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      this.addToHistory({ target: 'Webhook', success: response.ok, timestamp: new Date().toLocaleTimeString(), event: payload.event.event });
      return response.ok;
    } catch (e) {
      this.addToHistory({ target: 'Webhook', success: false, timestamp: new Date().toLocaleTimeString(), event: payload.event.event });
      return false;
    }
  }

  public logAuth(user: string, action: string, success: boolean) {
    this.log({
      event: `AUTH_${action.toUpperCase()}`,
      severity: success ? 'INFO' : 'CRITICAL',
      source: 'IdentityManager',
      user,
      details: { success }
    });
  }

  public logThreat(threat: string, level: string, action: string, mitre?: { tactic?: string, technique?: string }) {
    this.log({
      event: 'THREAT_DETECTED',
      severity: level === 'High' || level === 'critical' ? 'CRITICAL' : 'WARNING',
      source: 'ThreatCenter',
      mitreTactic: mitre?.tactic,
      mitreTechnique: mitre?.technique,
      details: { threat, level, action_taken: action }
    });
  }
}

export const siemLogger = new SiemLogger();

