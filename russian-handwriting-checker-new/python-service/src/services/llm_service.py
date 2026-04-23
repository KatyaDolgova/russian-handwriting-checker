from openai import AsyncOpenAI

class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="http://localhost:11434/v1",
            api_key="ollama"
        )

    async def generate(self, messages):
        res = await self.client.chat.completions.create(
            model="qwen2.5:7b",
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        return res.choices[0].message.content