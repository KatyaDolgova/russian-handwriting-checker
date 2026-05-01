from typing import AsyncIterator
from openai import AsyncOpenAI
from src.core.config import settings


class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.ollama_base_url,
            api_key="ollama",
        )

    async def generate(self, messages: list, timeout: float = 180.0) -> str:
        res = await self.client.chat.completions.create(
            model=settings.ollama_model,
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
            timeout=timeout,
        )
        return res.choices[0].message.content

    async def stream(self, messages: list, timeout: float = 180.0) -> AsyncIterator[str]:
        stream = await self.client.chat.completions.create(
            model=settings.ollama_model,
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
            timeout=timeout,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
