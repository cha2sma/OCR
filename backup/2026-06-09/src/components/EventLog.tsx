import React from 'react';

interface EventLogProps {
  logs: string[];
}

const EventLog: React.FC<EventLogProps> = ({ logs }) => {
  return (
    <div className="event-log">
      <h3 className="cp-title">Event Log</h3>
      <div className="event-log-list">
        {logs.map((entry, i) => (
          <div key={i} className="event-log-entry">
            <span className="event-log-index">{String(logs.length - i).padStart(3, '0')}</span>
            <span className="event-log-text">{entry}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="event-log-empty">No events yet</div>
        )}
      </div>
    </div>
  );
};

export default EventLog;
