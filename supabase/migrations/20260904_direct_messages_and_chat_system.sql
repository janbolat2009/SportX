-- ==============================================================================
-- SPORTX DIRECT MESSAGES & REALTIME CHAT MIGRATION
-- Enables secure Athlete <-> Trainer communication with Row Level Security (RLS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimized query indexes for conversation threads
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_receiver ON public.direct_messages (sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_sender ON public.direct_messages (receiver_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can ONLY see messages where they are the sender or receiver
DROP POLICY IF EXISTS "Users view own messages" ON public.direct_messages;
CREATE POLICY "Users view own messages"
    ON public.direct_messages
    FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy 2: Users can only send messages as themselves
DROP POLICY IF EXISTS "Users insert own messages" ON public.direct_messages;
CREATE POLICY "Users insert own messages"
    ON public.direct_messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Policy 3: Recipients can update read status
DROP POLICY IF EXISTS "Recipients update read status" ON public.direct_messages;
CREATE POLICY "Recipients update read status"
    ON public.direct_messages
    FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'direct_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
    END IF;
END $$;
