def highlight_errors(text: str, errors: list) -> str:
    highlighted = text
    shift = 0
    for err in sorted(errors, key=lambda x: x.get("offset", 0)):
        start = err.get("offset", 0) + shift
        end = start + err.get("length", 0)
        if start < len(highlighted):
            tag = f'<span style="color:red; text-decoration:underline; font-weight:bold;">{highlighted[start:end]}</span>'
            highlighted = highlighted[:start] + tag + highlighted[end:]
            shift += len(tag) - err.get("length", 0)
    return highlighted