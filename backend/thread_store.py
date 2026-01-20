from uuid import uuid4
from datetime import datetime
from openai.types.chat import ChatCompletionMessageParam
from typing import Dict, List, Optional, TypeAlias, TypedDict

# Message structure: holds an OpenAI message object and an optional ID
class Message(TypedDict):
    openai_message: ChatCompletionMessageParam
    id: Optional[str]

ThreadId: TypeAlias = str

class Thread(TypedDict):
    threadId: ThreadId
    title: str
    createdAt: str  # ISO string
    messages: List[Message]

class ThreadStore:
    """
    Manages storage and retrieval of chat threads and messages.
    """

    def __init__(self):
        """Initializes an empty store for threads."""
        self._threads: Dict[ThreadId, Thread] = {}

    def create_thread(self, title: str) -> Thread:
        thread_id = str(uuid4())
        new_thread: Thread = {
            "threadId": thread_id,
            "title": title,
            "createdAt": datetime.now().isoformat(),
            "messages": []
        }
        self._threads[thread_id] = new_thread
        return new_thread

    def get_thread(self, thread_id: ThreadId) -> Optional[Thread]:
        return self._threads.get(thread_id)

    def list_threads(self) -> List[Dict]:
        """Returns a list of threads with metadata only."""
        return [
            {
                "threadId": t["threadId"],
                "title": t["title"],
                "createdAt": t["createdAt"]
            }
            for t in self._threads.values()
        ]

    def delete_thread(self, thread_id: ThreadId):
        if thread_id in self._threads:
            del self._threads[thread_id]

    def update_thread(self, thread_id: ThreadId, title: str) -> Optional[Thread]:
        if thread_id in self._threads:
            self._threads[thread_id]['title'] = title
            return self._threads[thread_id]
        return None

    def get_messages(self, thread_id: ThreadId) -> List[ChatCompletionMessageParam]:
        """
        Retrieves all messages for a given thread ID, extracting the base OpenAI
        message object required for the API call.
        """
        thread = self._threads.get(thread_id)
        if not thread:
            return []
        return [msg['openai_message'] for msg in thread['messages']]
    
    def get_messages_all(self, thread_id: ThreadId) -> List[Message]:
        thread = self._threads.get(thread_id)
        if not thread:
            return []
        return thread['messages']

    def append_message(self, thread_id: ThreadId, message: Message):
        """
        Appends a single message to the specified thread.
        Creates thread if it doesn't exist (fallback backend behavior).
        """
        if thread_id not in self._threads:
             self._threads[thread_id] = {
                "threadId": thread_id,
                "title": "New Chat",
                "createdAt": datetime.now().isoformat(),
                "messages": []
            }
        self._threads[thread_id]['messages'].append(message)

    def update_message(self, thread_id: ThreadId, updated_message: Message):
        if thread_id in self._threads:
            messages = self._threads[thread_id]['messages']
            for i, msg in enumerate(messages):
                if msg.get('id') == updated_message.get('id'):
                    messages[i] = updated_message
                    return

    def append_messages(self, thread_id: ThreadId, messages: List[Message]):
        if thread_id not in self._threads:
             self._threads[thread_id] = {
                "threadId": thread_id,
                "title": "New Chat",
                "createdAt": datetime.now().isoformat(),
                "messages": []
            }
        self._threads[thread_id]['messages'].extend(messages)


thread_store = ThreadStore()
