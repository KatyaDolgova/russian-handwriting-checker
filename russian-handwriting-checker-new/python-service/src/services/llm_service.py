from openai import AsyncOpenAI
from src.core.config import settings


class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.ollama_base_url,
            api_key="ollama",
        )

    async def generate(self, messages):
        res = await self.client.chat.completions.create(
            model=settings.ollama_model,
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
        )
        return res.choices[0].message.content
