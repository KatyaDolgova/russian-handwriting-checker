import re, json

class CheckService:
    def __init__(self, llm, function_repo):
        self.llm = llm
        self.function_repo = function_repo

    async def run_check(self, text: str, function_id: bytes):
        func = await self.function_repo.get(function_id)

        messages = [
            {"role": "system", "content": func.system_prompt},
            {"role": "user", "content": func.user_template.replace("{text}", text)}
        ]

        raw = await self.llm.generate(messages)

        data = self._parse(raw)

        return {
            "corrected_text": data.get("corrected", text),
            "errors": data.get("errors", []),
            "score": float(data.get("score", 75)),
            "comment": data.get("comment", ""),
            "html_highlighted": self._highlight(text, data.get("errors", []))
        }

    def _parse(self, raw):
        match = re.search(r"\{[\s\S]*\}", raw)
        try:
            return json.loads(match.group(0)) if match else {}
        except:
            return {}

    def _highlight(self, text, errors):
        result = text
        shift = 0
        for e in sorted(errors, key=lambda x: x.get("offset", 0)):
            start = e["offset"] + shift
            end = start + e["length"]
            tag = f"<mark>{result[start:end]}</mark>"
            result = result[:start] + tag + result[end:]
            shift += len(tag) - e["length"]
        return result