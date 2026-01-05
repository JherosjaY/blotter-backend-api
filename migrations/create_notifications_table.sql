-- Create notifications table for push notification history
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    case_id INTEGER,
    is_read BOOLEAN DEFAULT false,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_case_id ON notifications(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);

-- Add foreign key constraint (optional - only if you want referential integrity)
-- ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key for case_id (optional)
-- ALTER TABLE notifications ADD CONSTRAINT fk_notifications_case 
--     FOREIGN KEY (case_id) REFERENCES blotter_reports(id) ON DELETE CASCADE;

COMMENT ON TABLE notifications IS 'Stores push notification history for users';
COMMENT ON COLUMN notifications.user_id IS 'ID of the user who received the notification';
COMMENT ON COLUMN notifications.title IS 'Notification title';
COMMENT ON COLUMN notifications.message IS 'Notification message body';
COMMENT ON COLUMN notifications.type IS 'Type of notification (e.g., case_update, hearing_scheduled, etc.)';
COMMENT ON COLUMN notifications.case_id IS 'Optional reference to related blotter report';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read';
COMMENT ON COLUMN notifications.timestamp IS 'When the notification was created';
