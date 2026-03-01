import './ShadowDashboard.css';

export default function ShadowDashboard({ agentLogs = [] }) {
  return (
    <section className="shadow-dashboard card">
      <span className="label">Agent Status</span>
      <div className="shadow-dashboard__terminal" role="log" aria-live="polite" aria-label="Agent status: shows 402 Challenge Received then 200 Success when claim completes">
        {agentLogs.length === 0 ? (
          <div className="shadow-dashboard__line shadow-dashboard__line--muted">
            [Agent]: Idle. Complete a Zen session to trigger the X402 flow.
          </div>
        ) : (
          agentLogs.map((line, i) => (
            <div key={i} className="shadow-dashboard__line">
              {line}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
