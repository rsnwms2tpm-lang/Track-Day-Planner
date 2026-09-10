ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_pkey;
ALTER TABLE votes ADD PRIMARY KEY (member_id, event_id);
