# ✅ AI Chat System - Complete Redesign (GPT/Gemini Style)

## What Changed

### Backend (Django)

#### 1. New Conversation Model
- **`AIConversation`** model created to store chat sessions
  - Each conversation has: `title`, `created_at`, `updated_at`
  - Linked to `company` and `user` for multi-tenant isolation
  - Messages now belong to a conversation (not flat list)

#### 2. Updated API Endpoints

| Old Endpoint | New Endpoint | Purpose |
|--------------|--------------|---------|
| `POST ai/chat/` | `POST ai/chat/` | Now accepts `conversation_id` (optional) |
| `GET ai/conversation/` | `GET ai/conversations/` | List all conversations |
| - | `GET ai/conversations/{id}/` | Get specific conversation with messages |
| - | `DELETE ai/conversations/{id}/delete/` | Delete specific conversation |
| `DELETE ai/messages/` | `DELETE ai/messages/` | Clear all (or specific conversation) |
| `POST ai/execute/` | `POST ai/execute/` | Now requires `conversation_id` |

#### 3. Response Format Changes
```typescript
// Old response
{
  "response": "AI answer",
  "conversation": [...]
}

// New response
{
  "response": "AI answer",
  "conversation": [...],
  "conversation_id": 123,
  "conversation_title": "Fuel consumption question"
}
```

#### 4. Migration
- Migration `0002_aiconversation_and_more.py` created and applied
- Old messages without conversation FK are supported (nullable field)

---

### Frontend (React + TypeScript)

#### 1. Complete UI Redesign
**Before:**
- localStorage-based sessions (not synced with backend)
- Sessions didn't persist properly
- White background issue on chat window
- No proper conversation management

**After (GPT/Gemini Style):**
- **Permanent sidebar** with conversation list (always visible by default)
- **Server-side conversations** - everything synced with backend
- **Clean dark/light theme** support
- **Conversation management:**
  - Click conversation to load it
  - Delete conversations with confirmation modal
  - "New Chat" button to start fresh conversation
  - Auto-generated titles from first message

#### 2. Updated API Layer (`aiApi.ts`)
```typescript
// New types
export type AIConversationSummary = {
  id: number
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

// New API functions
getAIConversations()         // List all conversations
getAIConversation(id)        // Get specific conversation
deleteConversation(id)       // Delete conversation
clearAllChats(id?)           // Clear one or all conversations
sendAIMessage(msg, convId)   // Send with optional conversation ID
executeAIAction(..., convId) // Execute requires conversation ID
```

#### 3. Updated React Query Hooks (`useAI.ts`)
```typescript
useAIConversations()              // List conversations
useAIConversation(id?)            // Get specific conversation
useSendAIMessage()                // Send message (accepts conversationId)
useExecuteAIAction()              // Execute action (requires conversationId)
useDeleteConversation()           // Delete conversation
```

#### 4. Key UI Features

**Sidebar (Left Panel):**
- "Новый чат" button at top
- Scrollable list of conversations
- Each shows: icon, title, last updated date
- Menu (⋮) on hover to delete conversation
- Active conversation highlighted

**Main Chat Area:**
- Header shows current conversation title
- Messages with user/AI avatars
- User messages: blue background, right-aligned
- AI messages: gray background, left-aligned
- Action buttons for confirmed actions
- Auto-scroll to bottom on new messages

**Input Area:**
- Textarea with auto-resize
- Enter to send, Shift+Enter for newline
- Send button inside textarea
- Disclaimer text below

**Empty State:**
- Welcome message with icon
- 3 suggestion buttons to get started

---

## How It Works Now

### Starting a New Chat
1. User clicks "Новый чат" button
2. All messages clear, input is empty
3. User types message and sends
4. Backend creates new `AIConversation`
5. Response includes `conversation_id`
6. Frontend updates sidebar with new conversation

### Loading Existing Conversation
1. User clicks conversation in sidebar
2. Frontend fetches `GET /api/v1/ai/conversations/{id}/`
3. Messages load into chat area
4. User can continue conversation

### Deleting Conversation
1. User clicks ⋮ menu on conversation
2. Clicks "Удалить"
3. Confirmation modal appears
4. On confirm: `DELETE /api/v1/ai/conversations/{id}/delete/`
5. If deleted conversation was active, starts new chat

---

## Files Modified

### Backend
- ✅ `backend/ai/models.py` - Added `AIConversation` model
- ✅ `backend/ai/migrations/0002_aiconversation_and_more.py` - Migration
- ✅ `backend/ai/views.py` - Updated all views for conversation support
- ✅ `backend/ai/serializers.py` - New serializers for conversations
- ✅ `backend/ai/urls.py` - Updated URL routing
- ✅ `backend/ai/services.py` - Updated `ask_ai()` to accept conversation

### Frontend
- ✅ `frontend/src/features/ai/api/aiApi.ts` - New API functions and types
- ✅ `frontend/src/features/ai/hooks/useAI.ts` - New React Query hooks
- ✅ `frontend/src/pages/AIPage.tsx` - Complete redesign

---

## Testing Instructions

### 1. Backend Test
```bash
cd C:\Parko\backend
python manage.py runserver
```

Test endpoints with curl or Postman:
```bash
# List conversations
curl http://127.0.0.1:8000/api/v1/ai/conversations/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send message (creates new conversation)
curl -X POST http://127.0.0.1:8000/api/v1/ai/chat/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Какие машины в автопарке?"}'

# Send message to existing conversation
curl -X POST http://127.0.0.1:8000/api/v1/ai/chat/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Сколько топлива потрачено?", "conversation_id": 1}'
```

### 2. Frontend Test
```bash
cd C:\Parko\frontend
npm run dev
```

1. Open http://localhost:5173
2. Login to your account
3. Click "AI Ассистент" in sidebar
4. You should see:
   - Left sidebar with "Новый чат" button
   - Empty chat area with welcome message
5. Type a message and press Enter
6. New conversation should appear in sidebar
7. Send more messages to same conversation
8. Click "Новый чат" to start fresh
9. Click old conversation to load it
10. Try deleting a conversation

### 3. Check Database
```bash
cd C:\Parko\backend
python manage.py shell
```

```python
from ai.models import AIConversation, AIChatMessage

# List all conversations
AIConversation.objects.all().values('id', 'title', 'user__username')

# Count messages per conversation
for conv in AIConversation.objects.all():
    print(f"{conv.title}: {conv.messages.count()} messages")
```

---

## Known Issues / TODOs

### Legacy Messages
- Old messages (before migration) have `conversation = NULL`
- These won't appear in new conversation UI
- **Solution:** They're still in DB, just not associated with a conversation
- Could write data migration to group them if needed

### Conversation Titles
- Titles are auto-generated from first user message (first 100 chars)
- **Future enhancement:** Allow users to rename conversations

### Pagination
- Conversation history loads all messages at once
- **Future enhancement:** Add pagination for very long conversations

### Real-time Updates
- No WebSocket or SSE for real-time streaming
- **Future enhancement:** Could enable streaming endpoint (already exists as dead code)

---

## Benefits of New System

✅ **Proper conversation management** - Like GPT/Gemini  
✅ **Server-side persistence** - No more localStorage issues  
✅ **Multi-device support** - Conversations sync across devices  
✅ **Clean UI** - Fixed white background issue  
✅ **Scalable** - Can add search, tags, folders later  
✅ **Better UX** - Easy to switch between conversations  
✅ **Delete capability** - Remove old conversations  
✅ **Title generation** - Auto-generated from first message  

---

## Migration Path for Users

Users with old localStorage-based sessions:
1. Their old sessions remain in localStorage (will be ignored)
2. When they send first message, new server conversation is created
3. Old messages are preserved in DB (not shown in UI)
4. **Optional:** Could write migration script to import localStorage to server

---

## Next Steps (Future Enhancements)

1. **Rename conversations** - Allow custom titles
2. **Search conversations** - Full-text search in messages
3. **Archive conversations** - Don't delete, just archive
4. **Export conversations** - Download as TXT/PDF
5. **Share conversations** - Share with other users
6. **Streaming responses** - Use SSE for real-time typing effect
7. **Message editing** - Edit user messages
8. **Branch conversations** - Fork at any point
9. **Folders/Categories** - Organize conversations
10. **Starred messages** - Bookmark important messages
